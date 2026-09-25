import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router';

import {
  defaultFilters,
  filtersToSearchParams,
  parseFilters,
  type TransactionFilters,
} from '@/utils/transaction-filters';

// Filters live in the URL: shareable, and kept on reload and back/forward
export function useTransactionFilters() {
  const [searchParams, setSearchParams] = useSearchParams();
  const filters = useMemo(() => parseFilters(searchParams), [searchParams]);

  // Any change other than the page itself goes back to page 1
  const updateFilters = useCallback(
    (changes: Partial<TransactionFilters>) => {
      setSearchParams(
        (current) => {
          const next = { ...parseFilters(current), ...changes };
          if (!('page' in changes)) next.page = 1;
          return filtersToSearchParams(next);
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  const clearFilters = useCallback(() => {
    const { period, month, from, to } = parseFilters(searchParams);
    setSearchParams(filtersToSearchParams({ ...defaultFilters(), period, month, from, to }), {
      replace: true,
    });
  }, [searchParams, setSearchParams]);

  return { filters, updateFilters, clearFilters };
}
