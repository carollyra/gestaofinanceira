import type { Prisma } from '../generated/prisma/client';
import type { ListTransactionsQuery } from '../schemas/transaction.schema';

type TransactionFilters = Omit<ListTransactionsQuery, 'page' | 'pageSize' | 'sortBy' | 'sortOrder'>;

const MAX_SEARCH_TERMS = 5;

// Prisma's `contains` becomes ILIKE '%term%' without escaping the term, so a
// search for "%" or "_" would match every row. Backslash is PostgreSQL's
// default LIKE escape character.
export function escapeLikePattern(term: string) {
  return term.replace(/[\\%_]/g, (char) => `\\${char}`);
}

// Every condition is ANDed with the user id, so filters can only narrow the
// result inside the user's own data, never widen it
export function buildTransactionWhere(
  userId: string,
  filters: Partial<TransactionFilters>,
): Prisma.TransactionWhereInput {
  const and: Prisma.TransactionWhereInput[] = [];

  if (filters.startDate || filters.endDate) {
    and.push({
      date: {
        ...(filters.startDate && { gte: filters.startDate }),
        ...(filters.endDate && { lte: filters.endDate }),
      },
    });
  }

  if (filters.type) {
    and.push({ type: filters.type });
  }

  if (filters.accountId) {
    and.push({ accountId: filters.accountId });
  }

  if (filters.categoryId) {
    and.push({ categoryId: filters.categoryId === 'none' ? null : filters.categoryId });
  }

  if (filters.minAmount !== undefined || filters.maxAmount !== undefined) {
    and.push({
      amount: {
        ...(filters.minAmount !== undefined && { gte: filters.minAmount }),
        ...(filters.maxAmount !== undefined && { lte: filters.maxAmount }),
      },
    });
  }

  if (filters.search) {
    // Each word must appear in the description or in the notes, in any order
    const terms = filters.search.split(/\s+/).filter(Boolean).slice(0, MAX_SEARCH_TERMS);

    for (const rawTerm of terms) {
      const term = escapeLikePattern(rawTerm);
      and.push({
        OR: [
          { description: { contains: term, mode: 'insensitive' } },
          { notes: { contains: term, mode: 'insensitive' } },
        ],
      });
    }
  }

  return { userId, ...(and.length > 0 && { AND: and }) };
}

export function buildTransactionOrderBy(
  sortBy: ListTransactionsQuery['sortBy'],
  sortOrder: ListTransactionsQuery['sortOrder'],
): Prisma.TransactionOrderByWithRelationInput[] {
  // The id (UUIDv7, time ordered) breaks ties so pages never overlap or skip rows
  return [{ [sortBy]: sortOrder }, { id: sortOrder }];
}
