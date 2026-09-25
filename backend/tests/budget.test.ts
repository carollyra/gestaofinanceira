import { describe, expect, it } from 'vitest';

import {
  copyBudgetsSchema,
  createBudgetSchema,
  updateBudgetSchema,
} from '../src/schemas/budget.schema';
import { getBudgetStatus } from '../src/utils/budget-status';

describe('getBudgetStatus', () => {
  it('is OK below 80% of the limit', () => {
    expect(getBudgetStatus(0, 100_000)).toBe('OK');
    expect(getBudgetStatus(79_999, 100_000)).toBe('OK');
  });

  it('is WARNING from 80% up to exactly the limit', () => {
    expect(getBudgetStatus(80_000, 100_000)).toBe('WARNING');
    expect(getBudgetStatus(100_000, 100_000)).toBe('WARNING');
  });

  it('is EXCEEDED one cent over the limit, even when the rounded percentage is 100%', () => {
    // 100_001 / 100_000 = 100.001% -> rounds to 100.00%
    expect(getBudgetStatus(100_001, 100_000)).toBe('EXCEEDED');
  });
});

describe('budget schemas', () => {
  const categoryId = '01a0d063-b433-77a3-bd86-868f88c12daf';

  it('converts the month to its first day', () => {
    const result = createBudgetSchema.parse({ categoryId, amount: 50_000, month: '2026-09' });

    expect(result.month.toISOString()).toBe('2026-09-01T00:00:00.000Z');
  });

  it('requires a positive integer limit', () => {
    for (const amount of [0, -1, 10.5]) {
      expect(createBudgetSchema.safeParse({ categoryId, amount, month: '2026-09' }).success).toBe(
        false,
      );
    }
  });

  it('only allows changing the amount', () => {
    expect(updateBudgetSchema.parse({ amount: 100, month: '2026-10', categoryId })).toEqual({
      amount: 100,
    });
  });

  it('rejects copying a month onto itself', () => {
    expect(copyBudgetsSchema.safeParse({ fromMonth: '2026-09', toMonth: '2026-09' }).success).toBe(
      false,
    );
  });
});
