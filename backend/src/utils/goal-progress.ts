export type GoalStatus = 'COMPLETED' | 'ON_TRACK' | 'BEHIND' | 'OVERDUE' | 'NO_DEADLINE';

export interface GoalProgressInput {
  targetAmount: number;
  currentAmount: number;
  deadline: Date | null;
  // Calendar date the goal was created (user timezone)
  startDate: Date;
}

export interface GoalProgress {
  // May exceed 100 when more than the target was saved
  percentage: number;
  remaining: number;
  completed: boolean;
  status: GoalStatus;
  daysLeft: number | null;
  // Monthly deposit that reaches the target by the deadline (rounded up)
  monthlyNeeded: number | null;
  // Where the savings should be today, following a linear plan to the deadline
  expectedAmount: number | null;
}

const DAY_MS = 86_400_000;

function daysBetween(from: Date, to: Date) {
  return Math.round((to.getTime() - from.getTime()) / DAY_MS);
}

// Whole months until the deadline, counting monthly deposits on today's day of
// month. Never less than 1 while the deadline has not passed.
export function monthsUntil(today: Date, deadline: Date) {
  let months =
    (deadline.getUTCFullYear() - today.getUTCFullYear()) * 12 +
    (deadline.getUTCMonth() - today.getUTCMonth());

  if (deadline.getUTCDate() < today.getUTCDate()) months -= 1;

  return Math.max(months, 1);
}

export function calculateGoalProgress(goal: GoalProgressInput, today: Date): GoalProgress {
  const { targetAmount, currentAmount, deadline } = goal;

  const base = {
    percentage: Math.round((currentAmount * 10_000) / targetAmount) / 100,
    remaining: Math.max(targetAmount - currentAmount, 0),
    completed: currentAmount >= targetAmount,
  };

  if (base.completed) {
    return { ...base, status: 'COMPLETED', daysLeft: null, monthlyNeeded: 0, expectedAmount: null };
  }

  if (!deadline) {
    return {
      ...base,
      status: 'NO_DEADLINE',
      daysLeft: null,
      monthlyNeeded: null,
      expectedAmount: null,
    };
  }

  const daysLeft = daysBetween(today, deadline);

  if (daysLeft < 0) {
    return {
      ...base,
      status: 'OVERDUE',
      daysLeft,
      monthlyNeeded: base.remaining,
      expectedAmount: targetAmount,
    };
  }

  const totalDays = Math.max(daysBetween(goal.startDate, deadline), 1);
  const elapsedDays = Math.min(Math.max(daysBetween(goal.startDate, today), 0), totalDays);
  const expectedAmount = Math.round((targetAmount * elapsedDays) / totalDays);

  return {
    ...base,
    status: currentAmount >= expectedAmount ? 'ON_TRACK' : 'BEHIND',
    daysLeft,
    monthlyNeeded: Math.ceil(base.remaining / monthsUntil(today, deadline)),
    expectedAmount,
  };
}
