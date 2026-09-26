import type { Transaction, TransactionList, TransactionType } from '@/types/api';

import { apiRequest } from './api';

export type TransactionSortField = 'date' | 'amount' | 'description';

export interface TransactionQuery {
  page: number;
  pageSize: number;
  startDate?: string;
  endDate?: string;
  type?: TransactionType;
  accountId?: string;
  // A category id, or "none" for uncategorized
  categoryId?: string;
  search?: string;
  sortBy: TransactionSortField;
  sortOrder: 'asc' | 'desc';
}

export function toSearchParams(query: TransactionQuery): URLSearchParams {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== '') params.set(key, String(value));
  }
  return params;
}

export interface TransactionInput {
  type: TransactionType;
  // Integer cents
  amount: number;
  // YYYY-MM-DD
  date: string;
  description: string;
  accountId: string;
  categoryId: string | null;
  notes: string | null;
}

export const transactionsService = {
  list: (query: TransactionQuery, signal?: AbortSignal) =>
    apiRequest<TransactionList>(`/transactions?${toSearchParams(query)}`, { signal }),
  create: (input: TransactionInput) =>
    apiRequest<Transaction>('/transactions', { method: 'POST', body: input }),
  update: (id: string, changes: Partial<TransactionInput>) =>
    apiRequest<Transaction>(`/transactions/${id}`, { method: 'PATCH', body: changes }),
  remove: (id: string) => apiRequest<void>(`/transactions/${id}`, { method: 'DELETE' }),
};
