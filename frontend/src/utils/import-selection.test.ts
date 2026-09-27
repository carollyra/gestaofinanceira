import type { ImportPreviewRow } from '@/types/api';

import {
  buildConfirmRows,
  defaultSelection,
  filterRows,
  shouldSkipDuplicates,
} from './import-selection';

function row(rowNumber: number, overrides: Partial<ImportPreviewRow> = {}): ImportPreviewRow {
  return {
    rowNumber,
    status: 'VALID',
    errors: [],
    date: '2026-09-10',
    description: `Linha ${rowNumber}`,
    amount: 1_000,
    type: 'EXPENSE',
    notes: null,
    category: null,
    duplicate: null,
    ...overrides,
  };
}

const exact = {
  status: 'EXACT' as const,
  transactionId: 't1',
  date: '2026-09-10',
  description: 'x',
};
const possible = {
  status: 'POSSIBLE' as const,
  transactionId: 't2',
  date: '2026-09-09',
  description: 'y',
};

const rows = [
  row(2, {
    category: {
      id: 'cat-food',
      name: 'Alimentação',
      color: '#000000',
      icon: 'x',
      source: 'KEYWORD',
    },
  }),
  row(3, { duplicate: exact }),
  row(4, { duplicate: possible }),
  row(5, { status: 'INVALID', errors: ['Data inválida'], date: null }),
  row(6, { status: 'IGNORED', errors: ['Linha de saldo ignorada'] }),
  row(7, { type: 'INCOME', amount: 50_000 }),
];

describe('import selection', () => {
  it('pre-selects valid rows that are not duplicates', () => {
    expect([...defaultSelection(rows)]).toEqual([2, 7]);
  });

  it('builds confirm rows from the selection, with suggested or overridden categories', () => {
    const confirmRows = buildConfirmRows(rows, new Set([2, 5, 7]), { 7: 'cat-salary' });

    expect(confirmRows).toEqual([
      {
        date: '2026-09-10',
        description: 'Linha 2',
        amount: 1_000,
        type: 'EXPENSE',
        categoryId: 'cat-food',
        notes: null,
      },
      {
        date: '2026-09-10',
        description: 'Linha 7',
        amount: 50_000,
        type: 'INCOME',
        categoryId: 'cat-salary',
        notes: null,
      },
    ]);
  });

  it('lets the user clear a suggested category', () => {
    expect(buildConfirmRows(rows, new Set([2]), { 2: '' })[0]!.categoryId).toBeNull();
  });

  it('only turns off duplicate skipping when an exact duplicate was chosen on purpose', () => {
    expect(shouldSkipDuplicates(rows, new Set([2, 4]))).toBe(true);
    expect(shouldSkipDuplicates(rows, new Set([2, 3]))).toBe(false);
  });

  it('filters rows by review tab', () => {
    const selected = new Set([2, 7]);
    expect(filterRows(rows, 'selected', selected).map((r) => r.rowNumber)).toEqual([2, 7]);
    expect(filterRows(rows, 'duplicates', selected).map((r) => r.rowNumber)).toEqual([3, 4]);
    expect(filterRows(rows, 'errors', selected).map((r) => r.rowNumber)).toEqual([5, 6]);
  });
});
