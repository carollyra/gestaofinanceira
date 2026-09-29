import { type QueryClient, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { TransferInput } from '@/services/accounts.service';
import { recurringService } from '@/services/recurring.service';
import { transactionsService } from '@/services/transactions.service';
import { transfersService } from '@/services/transfers.service';
import type { Transaction, TransactionList } from '@/types/api';

// A transaction already on screen shows instantly while its full record loads
function findInLists(queryClient: QueryClient, id: string): Transaction | undefined {
  for (const [, list] of queryClient.getQueriesData<TransactionList>({
    queryKey: ['transactions'],
  })) {
    const found = list?.data.find((t) => t.id === id);
    if (found) return found;
  }
  return undefined;
}

export function useTransaction(id: string | null) {
  const queryClient = useQueryClient();
  return useQuery<Transaction>({
    queryKey: ['transaction', id],
    queryFn: ({ signal }) => transactionsService.get(id!, signal),
    enabled: !!id,
    placeholderData: () => (id ? findInLists(queryClient, id) : undefined),
  });
}

export function useRecurring(id: string | null) {
  return useQuery({
    queryKey: ['recurring', id],
    queryFn: ({ signal }) => recurringService.get(id!, signal),
    enabled: !!id,
  });
}

export function useTransfers(page: number) {
  return useQuery({ queryKey: ['transfers', page], queryFn: () => transfersService.list(page) });
}

export function useTransfer(id: string | null) {
  return useQuery({
    queryKey: ['transfer', id],
    queryFn: ({ signal }) => transfersService.get(id!, signal),
    enabled: !!id,
  });
}

// Transfers change balances only (never income/expense totals)
const invalidateTransfers = (queryClient: QueryClient) =>
  Promise.all(
    ['transfers', 'transfer', 'accounts'].map((key) =>
      queryClient.invalidateQueries({ queryKey: [key] }),
    ),
  );

export function useUpdateTransfer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, changes }: { id: string; changes: Partial<TransferInput> }) =>
      transfersService.update(id, changes),
    onSuccess: () => invalidateTransfers(queryClient),
  });
}

export function useDeleteTransfer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => transfersService.remove(id),
    onSuccess: () => invalidateTransfers(queryClient),
  });
}
