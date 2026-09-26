import type { Budget, BudgetList } from '@/types/api';

import { apiRequest } from './api';

export const budgetsService = {
  list: (month: string) => apiRequest<BudgetList>(`/budgets?month=${month}`),
  create: (input: { categoryId: string; amount: number; month: string }) =>
    apiRequest<Budget>('/budgets', { method: 'POST', body: input }),
  update: (id: string, amount: number) =>
    apiRequest<Budget>(`/budgets/${id}`, { method: 'PATCH', body: { amount } }),
  remove: (id: string) => apiRequest<void>(`/budgets/${id}`, { method: 'DELETE' }),
  copy: (fromMonth: string, toMonth: string) =>
    apiRequest<{ created: number; skipped: number }>('/budgets/copy', {
      method: 'POST',
      body: { fromMonth, toMonth },
    }),
};
