import type { Goal, GoalList } from '@/types/api';

import { apiRequest } from './api';

export interface GoalInput {
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string | null;
  color: string;
  icon: string;
}

export const goalsService = {
  list: () => apiRequest<GoalList>('/goals'),
  create: (input: GoalInput) => apiRequest<Goal>('/goals', { method: 'POST', body: input }),
  update: (id: string, changes: Partial<GoalInput>) =>
    apiRequest<Goal>(`/goals/${id}`, { method: 'PATCH', body: changes }),
  remove: (id: string) => apiRequest<void>(`/goals/${id}`, { method: 'DELETE' }),
  // Atomic on the server: concurrent movements never overwrite each other
  deposit: (id: string, amount: number) =>
    apiRequest<Goal>(`/goals/${id}/deposit`, { method: 'POST', body: { amount } }),
  withdraw: (id: string, amount: number) =>
    apiRequest<Goal>(`/goals/${id}/withdraw`, { method: 'POST', body: { amount } }),
};
