import type { Goal } from '@/types/api';

import { formatDate } from './date';
import { formatCurrency } from './money';

// One line telling what the numbers mean for the person
export function goalHint(goal: Goal): string {
  const { progress, deadline } = goal;
  if (progress.completed) return 'Meta atingida!';
  if (progress.status === 'OVERDUE')
    return `Prazo venceu em ${formatDate(deadline!)} · faltam ${formatCurrency(progress.remaining)}`;
  if (progress.monthlyNeeded !== null && deadline) {
    return `Guarde ${formatCurrency(progress.monthlyNeeded)} por mês até ${formatDate(deadline)}`;
  }
  return `Faltam ${formatCurrency(progress.remaining)}`;
}
