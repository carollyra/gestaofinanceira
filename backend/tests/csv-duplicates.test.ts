import { describe, expect, it } from 'vitest';

import { findDuplicates } from '../src/utils/csv/duplicates';
import { parseDateOnly } from '../src/utils/date';

const d = parseDateOnly;
const row = (date: string, amount: number, description: string) => ({
  date: d(date),
  amount,
  type: 'EXPENSE' as const,
  description,
});
const existing = (id: string, date: string, amount: number, description: string) => ({
  id,
  ...row(date, amount, description),
});

describe('findDuplicates', () => {
  it('matches exactly regardless of case, accents and extra spaces', () => {
    const result = findDuplicates(
      [row('2026-09-10', 4_590, '  PADARIA   são josé ')],
      [existing('t1', '2026-09-10', 4_590, 'Padaria Sao Jose')],
    );

    expect(result[0]).toMatchObject({ status: 'EXACT', transactionId: 't1' });
  });

  it('uses each existing transaction only once (two identical coffees, one registered)', () => {
    const result = findDuplicates(
      [row('2026-09-10', 800, 'Café'), row('2026-09-10', 800, 'Café')],
      [existing('t1', '2026-09-10', 800, 'Café')],
    );

    expect(result.map((r) => r?.status ?? null)).toEqual(['EXACT', null]);
  });

  it('flags same amount within 2 days as POSSIBLE', () => {
    const result = findDuplicates(
      [row('2026-09-12', 15_000, 'COMPRA CARTAO 1234 SUPERMERCADO')],
      [existing('t1', '2026-09-10', 15_000, 'Mercado')],
    );

    expect(result[0]).toMatchObject({
      status: 'POSSIBLE',
      transactionId: 't1',
      date: '2026-09-10',
    });
  });

  it('does not match beyond the window, other amounts or other types', () => {
    const result = findDuplicates(
      [
        row('2026-09-13', 15_000, 'Mercado'),
        row('2026-09-10', 15_001, 'Mercado'),
        { ...row('2026-09-10', 15_000, 'Mercado'), type: 'INCOME' as const },
      ],
      [existing('t1', '2026-09-10', 15_000, 'Mercado')],
    );

    expect(result).toEqual([null, null, null]);
  });

  it('resolves exact matches before possible ones', () => {
    // The first row would possibly match t1, but t1 is the exact match of the second row
    const result = findDuplicates(
      [row('2026-09-11', 1_000, 'Outra coisa'), row('2026-09-10', 1_000, 'Cinema')],
      [existing('t1', '2026-09-10', 1_000, 'Cinema')],
    );

    expect(result.map((r) => r?.status ?? null)).toEqual([null, 'EXACT']);
  });

  it('skips invalid rows (null)', () => {
    expect(findDuplicates([null], [existing('t1', '2026-09-10', 1, 'x')])).toEqual([null]);
  });
});
