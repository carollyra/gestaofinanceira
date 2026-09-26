import type { Category, TransactionType } from '@/types/api';

import { apiRequest } from './api';

export interface CategoryInput {
  name: string;
  type: TransactionType;
  color: string;
  icon: string;
}

export const categoriesService = {
  list: () => apiRequest<{ data: Category[] }>('/categories').then((r) => r.data),
  create: (input: CategoryInput) =>
    apiRequest<Category>('/categories', { method: 'POST', body: input }),
  // The type cannot change after creation (it would break transactions and budgets)
  update: (id: string, changes: Partial<Omit<CategoryInput, 'type'>>) =>
    apiRequest<Category>(`/categories/${id}`, { method: 'PATCH', body: changes }),
  // Transactions move to `replaceWith`, or become uncategorized without it
  remove: (id: string, replaceWith?: string) =>
    apiRequest<void>(`/categories/${id}${replaceWith ? `?replaceWith=${replaceWith}` : ''}`, {
      method: 'DELETE',
    }),
};
