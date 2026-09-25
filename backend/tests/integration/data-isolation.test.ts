import { beforeAll, describe, expect, it } from 'vitest';

import { prisma } from '../../src/utils/prisma';
import { createTestUser, type TestUser } from './helpers';

// Owner creates one resource of every kind; the intruder, another logged user,
// tries to read, change, delete and reference each of them.
let owner: TestUser;
let intruder: TestUser;
const ids: Record<string, string> = {};

async function ownerSnapshot() {
  const urls = [
    '/api/accounts?includeArchived=true',
    '/api/categories',
    '/api/transactions',
    '/api/transfers',
    '/api/recurring-transactions',
    '/api/budgets?month=2026-03',
    '/api/goals',
    '/api/dashboard/summary?month=2026-03',
  ];
  return Promise.all(urls.map(async (url) => (await owner.get(url)).body));
}

beforeAll(async () => {
  [owner, intruder] = await Promise.all([createTestUser('Dona'), createTestUser('Intrusa')]);

  const account = await owner.createAccount({ initialBalance: 50_000 });
  const secondAccount = await owner.createAccount();
  const category = await owner.create('/api/categories', {
    name: 'Categoria privada',
    type: 'EXPENSE',
    color: '#123456',
    icon: 'lock',
  });

  ids.account = account.id;
  ids.secondAccount = secondAccount.id;
  ids.category = category.id;
  ids.transaction = (
    await owner.createTransaction({
      accountId: account.id,
      categoryId: category.id,
      type: 'EXPENSE',
      amount: 1_000,
      date: '2026-03-10',
    })
  ).id;
  ids.transfer = (
    await owner.createTransfer({
      fromAccountId: account.id,
      toAccountId: secondAccount.id,
      amount: 500,
      date: '2026-03-11',
    })
  ).id;
  ids.recurring = (
    await owner.create('/api/recurring-transactions', {
      accountId: account.id,
      type: 'EXPENSE',
      amount: 300,
      description: 'Assinatura',
      frequency: 'MONTHLY',
      startDate: '2030-01-01',
    })
  ).id;
  ids.budget = (
    await owner.create('/api/budgets', {
      categoryId: category.id,
      amount: 10_000,
      month: '2026-03',
    })
  ).id;
  ids.goal = (
    await owner.create('/api/goals', {
      name: 'Meta privada',
      targetAmount: 100_000,
      currentAmount: 1_000,
    })
  ).id;
});

describe('data isolation between users', () => {
  it('returns 404 for every read, update and delete of another user resource', async () => {
    const before = await ownerSnapshot();

    const resources: [string, string, Record<string, unknown>][] = [
      ['accounts', ids.account!, { name: 'Hack' }],
      ['categories', ids.category!, { name: 'Hack' }],
      ['transactions', ids.transaction!, { amount: 1 }],
      ['transfers', ids.transfer!, { amount: 1 }],
      ['recurring-transactions', ids.recurring!, { amount: 1 }],
      ['budgets', ids.budget!, { amount: 1 }],
      ['goals', ids.goal!, { name: 'Hack' }],
    ];

    for (const [path, id, body] of resources) {
      const url = `/api/${path}/${id}`;
      expect((await intruder.get(url)).status, `GET ${url}`).toBe(404);
      expect((await intruder.patch(url, body)).status, `PATCH ${url}`).toBe(404);
      expect((await intruder.delete(url)).status, `DELETE ${url}`).toBe(404);
    }

    for (const action of ['deposit', 'withdraw']) {
      const response = await intruder.post(`/api/goals/${ids.goal}/${action}`, { amount: 1 });
      expect(response.status, action).toBe(404);
    }

    expect(await ownerSnapshot()).toEqual(before);
  });

  it('never lists another user data', async () => {
    const lists = [
      '/api/accounts?includeArchived=true',
      '/api/transactions',
      '/api/transfers',
      '/api/recurring-transactions',
      '/api/budgets?month=2026-03',
      '/api/goals',
    ];

    for (const url of lists) {
      expect((await intruder.get(url)).body.data, url).toEqual([]);
    }

    // The intruder has their own default categories, none from the owner
    const categories = (await intruder.get('/api/categories')).body.data as { id: string }[];
    expect(categories.map((c) => c.id)).not.toContain(ids.category);

    // Filtering by the owner's ids does not widen the scope
    const filtered = await intruder.get(
      `/api/transactions?accountId=${ids.account}&categoryId=${ids.category}`,
    );
    expect(filtered.body.meta.total).toBe(0);
    const transfers = await intruder.get(`/api/transfers?accountId=${ids.account}`);
    expect(transfers.body.meta.total).toBe(0);
  });

  it('shows empty dashboards to the intruder', async () => {
    const summary = await intruder.get('/api/dashboard/summary?month=2026-03');
    expect(summary.body).toMatchObject({ totalBalance: 0, income: 0, expense: 0 });

    const byCategory = await intruder.get('/api/dashboard/by-category?month=2026-03');
    expect(byCategory.body.categories).toEqual([]);

    const evolution = await intruder.get(
      '/api/dashboard/monthly-evolution?endMonth=2026-03&months=3',
    );
    expect(
      evolution.body.data.every(
        (m: { income: number; expense: number }) => m.income === 0 && m.expense === 0,
      ),
    ).toBe(true);
  });

  it('cannot reference another user account or category when creating data', async () => {
    const own = await intruder.createAccount();
    const ownCategory = await intruder.category('Mercado');

    const attempts: [string, Record<string, unknown>][] = [
      [
        '/api/transactions',
        {
          accountId: ids.account,
          type: 'EXPENSE',
          amount: 1,
          date: '2026-03-01',
          description: 'x',
        },
      ],
      [
        '/api/transactions',
        {
          accountId: own.id,
          categoryId: ids.category,
          type: 'EXPENSE',
          amount: 1,
          date: '2026-03-01',
          description: 'x',
        },
      ],
      [
        '/api/transfers',
        { fromAccountId: ids.account, toAccountId: own.id, amount: 1, date: '2026-03-01' },
      ],
      [
        '/api/transfers',
        { fromAccountId: own.id, toAccountId: ids.account, amount: 1, date: '2026-03-01' },
      ],
      [
        '/api/recurring-transactions',
        {
          accountId: ids.account,
          type: 'EXPENSE',
          amount: 1,
          description: 'x',
          frequency: 'MONTHLY',
          startDate: '2030-01-01',
        },
      ],
      ['/api/budgets', { categoryId: ids.category, amount: 1, month: '2026-03' }],
      [
        '/api/imports/confirm',
        {
          accountId: ids.account,
          rows: [{ date: '2026-03-01', description: 'x', amount: 1, type: 'EXPENSE' }],
        },
      ],
      [
        '/api/imports/confirm',
        {
          accountId: own.id,
          rows: [
            {
              date: '2026-03-01',
              description: 'x',
              amount: 1,
              type: 'EXPENSE',
              categoryId: ids.category,
            },
          ],
        },
      ],
    ];

    for (const [url, body] of attempts) {
      const response = await intruder.post(url, body);
      expect([400, 404], `${url} ${JSON.stringify(body)} -> ${response.status}`).toContain(
        response.status,
      );
    }

    // Moving own transactions into the owner's category on delete
    const ownExtra = await intruder.create('/api/categories', {
      name: 'Extra',
      type: 'EXPENSE',
      color: '#000000',
      icon: 'x',
    });
    const replace = await intruder.delete(
      `/api/categories/${ownExtra.id}?replaceWith=${ids.category}`,
    );
    expect(replace.status).toBe(404);

    // Updating own transaction to point at the owner's account
    const tx = await intruder.createTransaction({
      accountId: own.id,
      categoryId: ownCategory,
      type: 'EXPENSE',
      amount: 1,
      date: '2026-03-01',
    });
    expect(
      (await intruder.patch(`/api/transactions/${tx.id}`, { accountId: ids.account })).status,
    ).toBe(404);

    const csv = Buffer.from('Data;Descrição;Valor\n01/03/2026;x;-1,00\n');
    const preview = await intruder
      .post('/api/imports/preview')
      .attach('file', csv, { filename: 'x.csv', contentType: 'text/csv' })
      .field('accountId', ids.account!);
    expect(preview.status).toBe(404);

    // Nothing was written into the owner's account
    expect(await prisma.transaction.count({ where: { accountId: ids.account } })).toBe(1);
  });

  it('is also enforced by the database, even bypassing the API', async () => {
    // Composite foreign keys (account_id, user_id) reject cross-user references
    await expect(
      prisma.transaction.create({
        data: {
          userId: intruder.id,
          accountId: ids.account!,
          type: 'EXPENSE',
          amount: 1,
          description: 'x',
          date: new Date(),
        },
      }),
    ).rejects.toThrow();

    await expect(
      prisma.budget.create({
        data: {
          userId: intruder.id,
          categoryId: ids.category!,
          amount: 1,
          month: new Date('2026-03-01T00:00:00Z'),
        },
      }),
    ).rejects.toThrow();

    await expect(
      prisma.transfer.create({
        data: {
          userId: intruder.id,
          fromAccountId: ids.account!,
          toAccountId: ids.secondAccount!,
          amount: 1,
          description: 'x',
          date: new Date(),
        },
      }),
    ).rejects.toThrow();
  });

  it('rejects requests without a valid token on every protected route', async () => {
    const { default: request } = await import('supertest');
    const { app } = await import('./helpers');
    const routes = [
      '/api/accounts',
      '/api/categories',
      '/api/transactions',
      '/api/transfers',
      '/api/recurring-transactions',
      '/api/budgets',
      '/api/goals',
      '/api/dashboard/summary',
      '/api/auth/me',
    ];

    for (const url of routes) {
      expect((await request(app).get(url)).status, url).toBe(401);
      expect(
        (await request(app).get(url).set('Authorization', 'Bearer forged.token.here')).status,
        url,
      ).toBe(401);
    }
  });
});
