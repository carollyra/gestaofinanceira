import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { dashboardService } from '@/services/dashboard.service';

// keepPreviousData: switching months keeps the previous render on screen
// (dimmed) instead of flashing skeletons

export function useDashboardSummary(month: string) {
  return useQuery({
    queryKey: ['dashboard', 'summary', month],
    queryFn: () => dashboardService.summary(month),
    placeholderData: keepPreviousData,
  });
}

export function useMonthlyEvolution(endMonth: string) {
  return useQuery({
    queryKey: ['dashboard', 'evolution', endMonth],
    queryFn: () => dashboardService.evolution(endMonth),
    placeholderData: keepPreviousData,
  });
}

export function useExpensesByCategory(month: string) {
  return useQuery({
    queryKey: ['dashboard', 'by-category', month, 'EXPENSE'],
    queryFn: () => dashboardService.byCategory(month, 'EXPENSE'),
    placeholderData: keepPreviousData,
  });
}
