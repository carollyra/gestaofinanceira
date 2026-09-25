import { describe, expect, it } from 'vitest';

import { listTransactionsQuerySchema } from '../../src/schemas/transaction.schema';
import {
  buildTransactionOrderBy,
  buildTransactionWhere,
  escapeLikePattern,
} from '../../src/services/transaction-query';

const USER = '01a0d063-b433-77a3-bd86-868f88c12daf';
const ACCOUNT = '01a0d063-ecb0-7149-bfd1-a1cf9760fdcb';

describe('buildTransactionWhere', () => {
  it('scopes to the user even without filters', () => {
    expect(buildTransactionWhere(USER, {})).toEqual({ userId: USER });
  });

  it('keeps userId at the top level, ANDed with every filter', () => {
    const where = buildTransactionWhere(USER, {
      type: 'EXPENSE',
      accountId: ACCOUNT,
      startDate: new Date('2026-09-01T00:00:00Z'),
      endDate: new Date('2026-09-30T00:00:00Z'),
      minAmount: 100,
      maxAmount: 5000,
    });

    expect(where.userId).toBe(USER);
    expect(where.AND).toEqual([
      {
        date: {
          gte: new Date('2026-09-01T00:00:00Z'),
          lte: new Date('2026-09-30T00:00:00Z'),
        },
      },
      { type: 'EXPENSE' },
      { accountId: ACCOUNT },
      { amount: { gte: 100, lte: 5000 } },
    ]);
  });

  it('maps categoryId "none" to uncategorized transactions', () => {
    expect(buildTransactionWhere(USER, { categoryId: 'none' }).AND).toEqual([{ categoryId: null }]);
  });

  it('requires every search word in description or notes', () => {
    const where = buildTransactionWhere(USER, { search: '  mercado   cartão ' });

    expect(where.AND).toEqual([
      {
        OR: [
          { description: { contains: 'mercado', mode: 'insensitive' } },
          { notes: { contains: 'mercado', mode: 'insensitive' } },
        ],
      },
      {
        OR: [
          { description: { contains: 'cartão', mode: 'insensitive' } },
          { notes: { contains: 'cartão', mode: 'insensitive' } },
        ],
      },
    ]);
  });

  it('keeps a zero minAmount', () => {
    expect(buildTransactionWhere(USER, { minAmount: 0 }).AND).toEqual([{ amount: { gte: 0 } }]);
  });
});

describe('escapeLikePattern', () => {
  it('escapes LIKE wildcards and the escape character itself', () => {
    expect(escapeLikePattern('50%')).toBe('50\\%');
    expect(escapeLikePattern('a_b')).toBe('a\\_b');
    expect(escapeLikePattern('c:\\x')).toBe('c:\\\\x');
  });

  it('is applied to search terms', () => {
    expect(buildTransactionWhere(USER, { search: '%' }).AND).toEqual([
      {
        OR: [
          { description: { contains: '\\%', mode: 'insensitive' } },
          { notes: { contains: '\\%', mode: 'insensitive' } },
        ],
      },
    ]);
  });
});

describe('buildTransactionOrderBy', () => {
  it('adds the id as a tiebreaker in the same direction', () => {
    expect(buildTransactionOrderBy('amount', 'asc')).toEqual([{ amount: 'asc' }, { id: 'asc' }]);
  });
});

describe('listTransactionsQuerySchema', () => {
  it('defaults to newest first, 20 per page', () => {
    expect(listTransactionsQuerySchema.parse({})).toMatchObject({
      page: 1,
      pageSize: 20,
      sortBy: 'date',
      sortOrder: 'desc',
    });
  });

  it('treats a blank search as no search', () => {
    expect(listTransactionsQuerySchema.parse({ search: '   ' }).search).toBeUndefined();
  });

  it('rejects unknown sort fields (no arbitrary column ordering)', () => {
    expect(listTransactionsQuerySchema.safeParse({ sortBy: 'userId' }).success).toBe(false);
  });

  it('rejects inverted amount ranges and invalid categories', () => {
    expect(
      listTransactionsQuerySchema.safeParse({ minAmount: '500', maxAmount: '100' }).success,
    ).toBe(false);
    expect(listTransactionsQuerySchema.safeParse({ categoryId: 'abc' }).success).toBe(false);
  });
});
