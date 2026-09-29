import type { Transfer, TransferList } from '@/types/api';

import type { TransferInput } from './accounts.service';
import { apiRequest } from './api';

export const transfersService = {
  list: (page: number, pageSize = 8) =>
    apiRequest<TransferList>(`/transfers?page=${page}&pageSize=${pageSize}`),
  get: (id: string, signal?: AbortSignal) => apiRequest<Transfer>(`/transfers/${id}`, { signal }),
  update: (id: string, changes: Partial<TransferInput>) =>
    apiRequest<Transfer>(`/transfers/${id}`, { method: 'PATCH', body: changes }),
  remove: (id: string) => apiRequest<void>(`/transfers/${id}`, { method: 'DELETE' }),
};
