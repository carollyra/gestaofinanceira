import { useQuery } from '@tanstack/react-query';

import { accountsService } from '@/services/accounts.service';
import { categoriesService } from '@/services/categories.service';

// Accounts and categories change rarely and feed filters and forms across pages

export function useAccounts(includeArchived = false) {
  return useQuery({
    queryKey: ['accounts', { includeArchived }],
    queryFn: () => accountsService.list(includeArchived),
    staleTime: 5 * 60_000,
  });
}

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: categoriesService.list,
    staleTime: 5 * 60_000,
  });
}
