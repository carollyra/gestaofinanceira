import type {
  CategoryBreakdown,
  DashboardSummary,
  EvolutionPoint,
  TransactionType,
} from '@/types/api';

import { apiRequest } from './api';

export const dashboardService = {
  summary: (month: string) => apiRequest<DashboardSummary>(`/dashboard/summary?month=${month}`),
  evolution: (endMonth: string, months = 12) =>
    apiRequest<{ data: EvolutionPoint[] }>(
      `/dashboard/monthly-evolution?endMonth=${endMonth}&months=${months}`,
    ).then((response) => response.data),
  byCategory: (month: string, type: TransactionType = 'EXPENSE') =>
    apiRequest<CategoryBreakdown>(`/dashboard/by-category?month=${month}&type=${type}`),
};
