import type { RecurringTransaction } from '@/types/api';

import { apiRequest } from './api';

export const recurringService = {
  get: (id: string, signal?: AbortSignal) =>
    apiRequest<RecurringTransaction>(`/recurring-transactions/${id}`, { signal }),
};
