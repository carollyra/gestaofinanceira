import { describe, expect, it } from 'vitest';

import { createGoalSchema, updateGoalSchema } from '../src/schemas/goal.schema';
import { parseDateOnly } from '../src/utils/date';
import { calculateGoalProgress, monthsUntil } from '../src/utils/goal-progress';

const d = parseDateOnly;
const today = d('2026-09-25');

describe('monthsUntil', () => {
  it('counts whole months of deposits until the deadline', () => {
    expect(monthsUntil(today, d('2026-12-31'))).toBe(3);
    expect(monthsUntil(today, d('2026-12-25'))).toBe(3);
    expect(monthsUntil(today, d('2026-12-24'))).toBe(2);
    expect(monthsUntil(today, d('2027-09-25'))).toBe(12);
  });

  it('is at least 1 for a deadline later this month or next', () => {
    expect(monthsUntil(today, d('2026-09-30'))).toBe(1);
    expect(monthsUntil(today, d('2026-10-10'))).toBe(1);
  });
});

describe('calculateGoalProgress', () => {
  const goal = {
    targetAmount: 1_200_000,
    currentAmount: 300_000,
    deadline: d('2027-09-25'),
    startDate: d('2025-09-25'),
  };

  it('computes percentage, remaining and a monthly amount rounded up', () => {
    const progress = calculateGoalProgress({ ...goal, targetAmount: 1_000_000 }, today);

    expect(progress.percentage).toBe(30);
    expect(progress.remaining).toBe(700_000);
    // 700_000 / 12 = 58_333.33 -> 58_334, so 12 deposits reach the target
    expect(progress.monthlyNeeded).toBe(58_334);
    expect(progress.monthlyNeeded! * 12).toBeGreaterThanOrEqual(700_000);
  });

  it('is BEHIND when below the linear plan and ON_TRACK at or above it', () => {
    // Halfway through a 2-year plan: 600_000 expected today
    expect(calculateGoalProgress(goal, today)).toMatchObject({
      status: 'BEHIND',
      expectedAmount: 600_000,
      daysLeft: 365,
    });
    expect(calculateGoalProgress({ ...goal, currentAmount: 600_000 }, today).status).toBe(
      'ON_TRACK',
    );
  });

  it('is COMPLETED when the target is reached, allowing more than 100%', () => {
    const progress = calculateGoalProgress({ ...goal, currentAmount: 1_500_000 }, today);

    expect(progress).toMatchObject({
      status: 'COMPLETED',
      completed: true,
      remaining: 0,
      percentage: 125,
      monthlyNeeded: 0,
    });
  });

  it('is OVERDUE after the deadline and NO_DEADLINE without one', () => {
    expect(calculateGoalProgress({ ...goal, deadline: d('2026-09-01') }, today)).toMatchObject({
      status: 'OVERDUE',
      daysLeft: -24,
    });
    expect(calculateGoalProgress({ ...goal, deadline: null }, today)).toMatchObject({
      status: 'NO_DEADLINE',
      monthlyNeeded: null,
    });
  });

  it('treats a goal created and due today as a one-day plan', () => {
    const progress = calculateGoalProgress(
      { targetAmount: 100, currentAmount: 0, deadline: today, startDate: today },
      today,
    );

    expect(progress).toMatchObject({ status: 'ON_TRACK', daysLeft: 0, monthlyNeeded: 100 });
  });
});

describe('goal schemas', () => {
  it('defaults the saved amount to zero', () => {
    expect(createGoalSchema.parse({ name: 'Viagem', targetAmount: 500_000 }).currentAmount).toBe(0);
  });

  it('rejects negative saved amounts and zero targets', () => {
    expect(createGoalSchema.safeParse({ name: 'X', targetAmount: 0 }).success).toBe(false);
    expect(updateGoalSchema.safeParse({ currentAmount: -1 }).success).toBe(false);
  });

  it('does not inject defaults on update', () => {
    expect(updateGoalSchema.parse({ name: 'Nova' })).toEqual({ name: 'Nova' });
  });
});
