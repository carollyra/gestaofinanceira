import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { type TransactionQuery, transactionsService } from '@/services/transactions.service';

export function useTransactions(query: TransactionQuery) {
  return useQuery({
    queryKey: ['transactions', query],
    queryFn: ({ signal }) => transactionsService.list(query, signal),
    placeholderData: keepPreviousData,
  });
}
