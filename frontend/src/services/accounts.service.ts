import type { Account, AccountType } from '@/types/api';

import { apiRequest } from './api';

export interface AccountInput {
  name: string;
  type: AccountType;
  // Integer cents; may be negative (e.g. a credit card with an open bill)
  initialBalance: number;
  color: string;
}

export interface TransferInput {
  fromAccountId: string;
  toAccountId: string;
  amount: number;
  date: string;
  description: string;
}

export const accountsService = {
  list: (includeArchived = false) =>
    apiRequest<{ data: Account[] }>(`/accounts?includeArchived=${includeArchived}`).then(
      (r) => r.data,
    ),
  create: (input: AccountInput) =>
    apiRequest<Account>('/accounts', { method: 'POST', body: input }),
  update: (id: string, changes: Partial<AccountInput> & { archived?: boolean }) =>
    apiRequest<Account>(`/accounts/${id}`, { method: 'PATCH', body: changes }),
  remove: (id: string) => apiRequest<void>(`/accounts/${id}`, { method: 'DELETE' }),
  transfer: (input: TransferInput) =>
    apiRequest<unknown>('/transfers', { method: 'POST', body: input }),
};
