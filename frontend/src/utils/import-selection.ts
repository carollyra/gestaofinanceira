import type { ConfirmRow } from '@/services/imports.service';
import type { ImportPreviewRow } from '@/types/api';

export const MAX_CSV_BYTES = 2 * 1024 * 1024;

export function isSelectable(row: ImportPreviewRow): boolean {
  return row.status === 'VALID';
}

// Valid rows start selected, except duplicates: exact ones are almost surely
// already registered, possible ones need a human look
export function defaultSelection(rows: ImportPreviewRow[]): Set<number> {
  return new Set(
    rows.filter((row) => isSelectable(row) && !row.duplicate).map((row) => row.rowNumber),
  );
}

export type CategoryOverrides = Record<number, string>;

// Category chosen by the user, or the suggestion; '' means no category
export function categoryFor(row: ImportPreviewRow, overrides: CategoryOverrides): string {
  return overrides[row.rowNumber] ?? row.category?.id ?? '';
}

export function buildConfirmRows(
  rows: ImportPreviewRow[],
  selected: Set<number>,
  overrides: CategoryOverrides,
): ConfirmRow[] {
  return rows
    .filter((row) => isSelectable(row) && selected.has(row.rowNumber))
    .map((row) => ({
      date: row.date!,
      description: row.description,
      amount: row.amount!,
      type: row.type!,
      categoryId: categoryFor(row, overrides) || null,
      notes: row.notes,
    }));
}

// The server skips exact duplicates by default (it also protects against a
// double submit). If the user deliberately selected one, it must go through.
export function shouldSkipDuplicates(rows: ImportPreviewRow[], selected: Set<number>): boolean {
  return !rows.some((row) => selected.has(row.rowNumber) && row.duplicate?.status === 'EXACT');
}

export type ReviewFilter = 'all' | 'selected' | 'duplicates' | 'errors';

export function filterRows(
  rows: ImportPreviewRow[],
  filter: ReviewFilter,
  selected: Set<number>,
): ImportPreviewRow[] {
  switch (filter) {
    case 'selected':
      return rows.filter((row) => selected.has(row.rowNumber));
    case 'duplicates':
      return rows.filter((row) => row.duplicate);
    case 'errors':
      return rows.filter((row) => row.status !== 'VALID');
    default:
      return rows;
  }
}
