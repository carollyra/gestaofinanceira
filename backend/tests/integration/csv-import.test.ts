import { beforeEach, describe, expect, it } from 'vitest';

import { createTestUser, type TestUser } from './helpers';

let user: TestUser;
let account: { id: string };

interface PreviewRow {
  rowNumber: number;
  status: string;
  date: string;
  description: string;
  amount: number;
  type: 'INCOME' | 'EXPENSE';
  category: { id: string; name: string; source: string } | null;
  duplicate: { status: string } | null;
}

function preview(content: string | Buffer, fields: Record<string, string> = {}) {
  let req = user
    .post('/api/imports/preview')
    .attach('file', Buffer.isBuffer(content) ? content : Buffer.from(content, 'utf8'), {
      filename: 'extrato.csv',
      contentType: 'text/csv',
    })
    .field('accountId', account.id);
  for (const [key, value] of Object.entries(fields)) req = req.field(key, value);
  return req;
}

// Confirms the valid rows exactly as the preview suggested
function toConfirmBody(rows: PreviewRow[]) {
  return {
    accountId: account.id,
    rows: rows
      .filter((row) => row.status === 'VALID')
      .map((row) => ({
        date: row.date,
        description: row.description,
        amount: row.amount,
        type: row.type,
        categoryId: row.category?.id ?? null,
      })),
  };
}

const STATEMENT = [
  'Extrato - Conta 12345-6',
  '',
  'Data;Histórico;Valor (R$);Saldo (R$)',
  '28/02/2026;SALDO ANTERIOR;;1.000,00',
  '05/03/2026;Salário;6.500,00;7.500,00',
  '10/03/2026;ENEL CONTA DE LUZ;-218,99;7.281,01',
  '15/03/2026;UBER *TRIP;-32,50;7.248,51',
  '19/03/2026;Café;-8,00;7.240,51',
  '19/03/2026;Café;-8,00;7.232,51',
  '31/03/2026;Linha quebrada;abc;0',
].join('\n');

beforeEach(async () => {
  user = await createTestUser();
  account = await user.createAccount();
});

describe('CSV import', () => {
  it('previews a Windows-1252 statement with duplicates and category suggestions', async () => {
    // Already registered by hand: exact match (same description) and a possible
    // match (same amount, same day, different description)
    await user.createTransaction({
      accountId: account.id,
      type: 'INCOME',
      amount: 650_000,
      date: '2026-03-05',
      description: 'SALÁRIO',
      categoryId: await user.category('Salário'),
    });
    await user.createTransaction({
      accountId: account.id,
      type: 'EXPENSE',
      amount: 21_899,
      date: '2026-03-10',
      description: 'Conta de luz',
    });

    const response = await preview(Buffer.from(STATEMENT, 'latin1'));

    expect(response.status).toBe(200);
    expect(response.body.detected).toMatchObject({ encoding: 'windows-1252', delimiter: ';' });
    expect(response.body.summary).toMatchObject({
      total: 7,
      valid: 5,
      invalid: 1,
      ignored: 1,
      duplicates: 1,
      possibleDuplicates: 1,
    });

    const rows = response.body.rows as PreviewRow[];
    const byLine = Object.fromEntries(rows.map((row) => [row.rowNumber, row]));

    expect(byLine[4]).toMatchObject({ status: 'IGNORED' });
    expect(byLine[5]).toMatchObject({
      amount: 650_000,
      type: 'INCOME',
      duplicate: { status: 'EXACT' },
    });
    expect(byLine[5]!.category).toMatchObject({ name: 'Salário', source: 'HISTORY' });
    expect(byLine[6]).toMatchObject({ duplicate: { status: 'POSSIBLE' } });
    expect(byLine[7]!.category).toMatchObject({ name: 'Transporte', source: 'KEYWORD' });
    expect([byLine[8]!.duplicate, byLine[9]!.duplicate]).toEqual([null, null]);
    expect(byLine[10]).toMatchObject({ status: 'INVALID' });
  });

  it('imports once: repeated and concurrent confirmations skip exact duplicates', async () => {
    const response = await preview(STATEMENT);
    const body = toConfirmBody(response.body.rows);
    expect(body.rows).toHaveLength(5);

    const results = await Promise.all(
      Array.from({ length: 5 }, async () => (await user.post('/api/imports/confirm', body)).body),
    );

    expect(results.reduce((sum, r) => sum + r.created, 0)).toBe(5);
    expect(results.filter((r) => r.created === 5)).toHaveLength(1);

    const again = await user.post('/api/imports/confirm', body);
    expect(again.body).toEqual({ created: 0, skipped: 5 });

    const list = await user.get(`/api/transactions?accountId=${account.id}&pageSize=100`);
    expect(list.body.meta.total).toBe(5);
    // Both identical coffees were imported: the file itself had two
    expect(
      list.body.data.filter((t: { description: string }) => t.description === 'Café'),
    ).toHaveLength(2);
  });

  it('imports duplicates on purpose when skipDuplicates is false', async () => {
    const body = toConfirmBody((await preview(STATEMENT)).body.rows);
    await user.post('/api/imports/confirm', body);

    const forced = await user.post('/api/imports/confirm', {
      ...body,
      rows: body.rows.slice(0, 1),
      skipDuplicates: false,
    });

    expect(forced.body).toEqual({ created: 1, skipped: 0 });
  });

  it('updates balances and dashboards like any other transaction', async () => {
    await user.post('/api/imports/confirm', toConfirmBody((await preview(STATEMENT)).body.rows));

    const detail = await user.get(`/api/accounts/${account.id}`);
    // 650_000 - 21_899 - 3_250 - 800 - 800
    expect(detail.body.balance).toBe(623_251);

    const summary = await user.get('/api/dashboard/summary?month=2026-03');
    expect(summary.body).toMatchObject({ income: 650_000, expense: 26_749 });
  });

  it('inverts signs for credit card statements', async () => {
    const response = await preview(
      'date,title,amount\n2026-03-03,Mercado,150.00\n2026-03-04,Estorno,-20.00',
      {
        invertSign: 'true',
      },
    );

    expect(response.body.rows.map((r: PreviewRow) => r.type)).toEqual(['EXPENSE', 'INCOME']);
  });

  it('rejects categories of another type on confirmation', async () => {
    const response = await user.post('/api/imports/confirm', {
      accountId: account.id,
      rows: [
        {
          date: '2026-03-01',
          description: 'x',
          amount: 100,
          type: 'EXPENSE',
          categoryId: await user.category('Salário'),
        },
      ],
    });

    expect(response.status).toBe(400);
  });
});
