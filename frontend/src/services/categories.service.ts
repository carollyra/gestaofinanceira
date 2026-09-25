import type { Category } from '@/types/api';

import { apiRequest } from './api';

export const categoriesService = {
  list: () => apiRequest<{ data: Category[] }>('/categories').then((r) => r.data),
};
