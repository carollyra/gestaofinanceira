import type { TransactionType } from '../../generated/prisma/enums';
import { formatDateOnly } from '../date';
import { normalizeText } from '../text';

export interface DuplicateCandidate {
  date: Date;
  amount: number;
  type: TransactionType;
  description: string;
}

export interface ExistingTransaction extends DuplicateCandidate {
  id: string;
}

export interface DuplicateMatch {
  status: 'EXACT' | 'POSSIBLE';
  transactionId: string;
  date: string;
  description: string;
}

// Window for POSSIBLE matches: the same purchase often posts a day or two
// later on the bank statement than the date typed by the user
const POSSIBLE_WINDOW_DAYS = 2;
const DAY_MS = 86_400_000;

const exactKey = (t: DuplicateCandidate) =>
  `${formatDateOnly(t.date)}|${t.type}|${t.amount}|${normalizeText(t.description)}`;

// Each existing transaction can match at most one imported row. So a file with
// two identical coffees on the same day, against one already registered,
// yields one duplicate and one new transaction.
export function findDuplicates(
  rows: (DuplicateCandidate | null)[],
  existing: ExistingTransaction[],
): (DuplicateMatch | null)[] {
  const available = new Set(existing.map((t) => t.id));
  const byExactKey = new Map<string, ExistingTransaction[]>();

  for (const transaction of existing) {
    const key = exactKey(transaction);
    byExactKey.set(key, [...(byExactKey.get(key) ?? []), transaction]);
  }

  const toMatch = (status: DuplicateMatch['status'], t: ExistingTransaction): DuplicateMatch => {
    available.delete(t.id);
    return {
      status,
      transactionId: t.id,
      date: formatDateOnly(t.date),
      description: t.description,
    };
  };

  // Exact matches first, so they are not consumed by a looser match
  const result: (DuplicateMatch | null)[] = rows.map((row) => {
    if (!row) return null;
    const match = byExactKey.get(exactKey(row))?.find((t) => available.has(t.id));
    return match ? toMatch('EXACT', match) : null;
  });

  return result.map((match, i) => {
    const row = rows[i];
    if (match || !row) return match;

    const possible = existing.find(
      (t) =>
        available.has(t.id) &&
        t.type === row.type &&
        t.amount === row.amount &&
        Math.abs(t.date.getTime() - row.date.getTime()) <= POSSIBLE_WINDOW_DAYS * DAY_MS,
    );

    return possible ? toMatch('POSSIBLE', possible) : null;
  });
}
