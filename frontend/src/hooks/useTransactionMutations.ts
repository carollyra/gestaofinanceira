import { type QueryClient, useMutation, useQueryClient } from '@tanstack/react-query';

import { type TransactionInput, transactionsService } from '@/services/transactions.service';
import type { TransactionList } from '@/types/api';

// A transaction changes lists, dashboard numbers, account balances and budgets
function invalidateMoneyData(queryClient: QueryClient) {
  return Promise.all(
    ['transactions', 'dashboard', 'accounts', 'budgets'].map((key) =>
      queryClient.invalidateQueries({ queryKey: [key] }),
    ),
  );
}

export function useCreateTransaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: TransactionInput) => transactionsService.create(input),
    onSuccess: () => invalidateMoneyData(queryClient),
  });
}

export function useUpdateTransaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, changes }: { id: string; changes: Partial<TransactionInput> }) =>
      transactionsService.update(id, changes),
    onSuccess: () => invalidateMoneyData(queryClient),
  });
}

// Optimistic: the row leaves the list right away (and collapses); if the API
// refuses, the cached lists are restored
export function useDeleteTransaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => transactionsService.remove(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['transactions'] });
      const snapshots = queryClient.getQueriesData<TransactionList>({ queryKey: ['transactions'] });
      queryClient.setQueriesData<TransactionList>({ queryKey: ['transactions'] }, (list) =>
        list
          ? {
              ...list,
              data: list.data.filter((t) => t.id !== id),
              meta: { ...list.meta, total: Math.max(0, list.meta.total - 1) },
            }
          : list,
      );
      return { snapshots };
    },
    onError: (_error, _id, context) => {
      context?.snapshots.forEach(([key, data]) => queryClient.setQueryData(key, data));
    },
    onSettled: () => invalidateMoneyData(queryClient),
  });
}
