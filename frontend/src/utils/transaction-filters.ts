import type { TransactionQuery, TransactionSortField } from '@/services/transactions.service';
import type { TransactionType } from '@/types/api';

import { isValidDate, monthRange } from './date';
import { currentMonth, isValidMonth } from './month';

export type PeriodMode = 'month' | 'custom' | 'all';

export interface TransactionFilters {
  period: PeriodMode;
  month: string;
  from: string;
  to: string;
  type: TransactionType | '';
  accountId: string;
  // A category id, "none" for uncategorized, or '' for any
  categoryId: string;
  search: string;
  sortBy: TransactionSortField;
  sortOrder: 'asc' | 'desc';
  page: number;
  pageSize: number;
}

export const PAGE_SIZES = [20, 50, 100] as const;

// URL keys and values are in Portuguese: they are visible to the user
const TYPE_TO_URL: Record<TransactionType, string> = { INCOME: 'receita', EXPENSE: 'despesa' };
const SORT_TO_URL: Record<TransactionSortField, string> = {
  date: 'data',
  amount: 'valor',
  description: 'descricao',
};
const UNCATEGORIZED_URL = 'sem-categoria';

const invert = <T extends string>(record: Record<T, string>) =>
  Object.fromEntries(Object.entries(record).map(([k, v]) => [v, k])) as Record<string, T>;
const URL_TO_TYPE = invert(TYPE_TO_URL);
const URL_TO_SORT = invert(SORT_TO_URL);

export function defaultFilters(today = new Date()): TransactionFilters {
  return {
    period: 'month',
    month: currentMonth(today),
    from: '',
    to: '',
    type: '',
    accountId: '',
    categoryId: '',
    search: '',
    sortBy: 'date',
    sortOrder: 'desc',
    page: 1,
    pageSize: 20,
  };
}

// Invalid or unknown values fall back to defaults instead of breaking the page
export function parseFilters(params: URLSearchParams, today = new Date()): TransactionFilters {
  const defaults = defaultFilters(today);
  const from = params.get('de');
  const to = params.get('ate');
  const hasCustomRange = isValidDate(from) || isValidDate(to);
  const [sortField, sortDirection] = (params.get('ordem') ?? '').split('-');
  const page = Number(params.get('pagina'));
  const pageSize = Number(params.get('por-pagina'));
  const category = params.get('categoria') ?? '';
  const month = params.get('mes');

  return {
    period: params.get('periodo') === 'tudo' ? 'all' : hasCustomRange ? 'custom' : 'month',
    month: isValidMonth(month) ? month : defaults.month,
    from: isValidDate(from) ? from : '',
    to: isValidDate(to) ? to : '',
    type: URL_TO_TYPE[params.get('tipo') ?? ''] ?? '',
    accountId: params.get('conta') ?? '',
    categoryId: category === UNCATEGORIZED_URL ? 'none' : category,
    search: params.get('busca') ?? '',
    sortBy: URL_TO_SORT[sortField ?? ''] ?? defaults.sortBy,
    sortOrder:
      sortDirection === 'asc' || sortDirection === 'desc' ? sortDirection : defaults.sortOrder,
    page: Number.isInteger(page) && page > 0 ? page : 1,
    pageSize: (PAGE_SIZES as readonly number[]).includes(pageSize) ? pageSize : defaults.pageSize,
  };
}

// Only non-default values go to the URL, keeping it short
export function filtersToSearchParams(
  filters: TransactionFilters,
  today = new Date(),
): URLSearchParams {
  const defaults = defaultFilters(today);
  const params = new URLSearchParams();

  if (filters.period === 'all') params.set('periodo', 'tudo');
  if (filters.period === 'month' && filters.month !== defaults.month)
    params.set('mes', filters.month);
  if (filters.period === 'custom') {
    if (filters.from) params.set('de', filters.from);
    if (filters.to) params.set('ate', filters.to);
  }
  if (filters.type) params.set('tipo', TYPE_TO_URL[filters.type]);
  if (filters.accountId) params.set('conta', filters.accountId);
  if (filters.categoryId)
    params.set('categoria', filters.categoryId === 'none' ? UNCATEGORIZED_URL : filters.categoryId);
  if (filters.search.trim()) params.set('busca', filters.search.trim());
  if (filters.sortBy !== defaults.sortBy || filters.sortOrder !== defaults.sortOrder) {
    params.set('ordem', `${SORT_TO_URL[filters.sortBy]}-${filters.sortOrder}`);
  }
  if (filters.page > 1) params.set('pagina', String(filters.page));
  if (filters.pageSize !== defaults.pageSize) params.set('por-pagina', String(filters.pageSize));

  return params;
}

export function filtersToQuery(filters: TransactionFilters): TransactionQuery {
  let period: { startDate?: string; endDate?: string } = {};
  if (filters.period === 'month') period = monthRange(filters.month);
  if (filters.period === 'custom') {
    // A reversed range is swapped instead of failing
    const [start, end] =
      filters.from && filters.to && filters.from > filters.to
        ? [filters.to, filters.from]
        : [filters.from, filters.to];
    period = { startDate: start || undefined, endDate: end || undefined };
  }

  return {
    page: filters.page,
    pageSize: filters.pageSize,
    ...period,
    type: filters.type || undefined,
    accountId: filters.accountId || undefined,
    categoryId: filters.categoryId || undefined,
    search: filters.search.trim() || undefined,
    sortBy: filters.sortBy,
    sortOrder: filters.sortOrder,
  };
}

// Filters beyond period and sorting that narrow the list
export function countActiveFilters(filters: TransactionFilters) {
  return [filters.type, filters.accountId, filters.categoryId, filters.search.trim()].filter(
    Boolean,
  ).length;
}
