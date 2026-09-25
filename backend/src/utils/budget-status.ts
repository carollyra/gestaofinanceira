export type BudgetStatus = 'OK' | 'WARNING' | 'EXCEEDED';

// Share of the limit from which a budget is flagged as close to the limit
export const BUDGET_WARNING_PERCENT = 80;

// Compared in integer cents: the rounded percentage could hide 1 cent over the limit
export function getBudgetStatus(spent: number, limit: number): BudgetStatus {
  if (spent > limit) return 'EXCEEDED';
  if (spent * 100 >= limit * BUDGET_WARNING_PERCENT) return 'WARNING';
  return 'OK';
}
