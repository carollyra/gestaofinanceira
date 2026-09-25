import type { Account } from '@/types/api';

import { apiRequest } from './api';

export const accountsService = {
  list: (includeArchived = false) =>
    apiRequest<{ data: Account[] }>(`/accounts?includeArchived=${includeArchived}`).then(
      (r) => r.data,
    ),
};
