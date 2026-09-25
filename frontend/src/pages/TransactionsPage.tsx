import { SearchX } from 'lucide-react';

import { ErrorState, Skeleton } from '@/components/dashboard/states';
import { TransactionCards } from '@/components/transactions/TransactionCards';
import { TransactionFilters } from '@/components/transactions/TransactionFilters';
import { TransactionTable } from '@/components/transactions/TransactionTable';
import { Pagination } from '@/components/ui/Pagination';
import { Select } from '@/components/ui/Select';
import { useAccounts, useCategories } from '@/hooks/useLookups';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { useTransactionFilters } from '@/hooks/useTransactionFilters';
import { useTransactions } from '@/hooks/useTransactions';
import type { TransactionSortField } from '@/services/transactions.service';
import { cn } from '@/utils/cn';
import { formatCurrency } from '@/utils/money';
import { countActiveFilters, filtersToQuery, PAGE_SIZES } from '@/utils/transaction-filters';

const MOBILE_SORT_OPTIONS: [string, string][] = [
  ['date-desc', 'Mais recentes'],
  ['date-asc', 'Mais antigas'],
  ['amount-desc', 'Maior valor'],
  ['amount-asc', 'Menor valor'],
  ['description-asc', 'Descrição (A-Z)'],
];

export function TransactionsPage() {
  const { filters, updateFilters, clearFilters } = useTransactionFilters();
  const transactions = useTransactions(filtersToQuery(filters));
  const accounts = useAccounts(true);
  const categories = useCategories();
  const isWide = useMediaQuery('(min-width: 768px)');

  const onSort = (sortBy: TransactionSortField, sortOrder: 'asc' | 'desc') =>
    updateFilters({ sortBy, sortOrder });
  const data = transactions.data;
  const firstItem = data ? (data.meta.page - 1) * data.meta.pageSize + 1 : 0;
  const lastItem = data ? Math.min(data.meta.page * data.meta.pageSize, data.meta.total) : 0;

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-50">Transações</h1>
        <p className="text-sm text-zinc-400">Receitas e despesas de todas as contas</p>
      </div>

      <TransactionFilters
        filters={filters}
        accounts={accounts.data ?? []}
        categories={categories.data ?? []}
        onChange={updateFilters}
        onClear={clearFilters}
      />

      {data && (
        <section aria-label="Totais do filtro" className="grid grid-cols-3 gap-2 text-sm">
          {(
            [
              ['Receitas', formatCurrency(data.summary.income)],
              ['Despesas', formatCurrency(data.summary.expense)],
              ['Saldo', formatCurrency(data.summary.balance)],
            ] as const
          ).map(([label, value]) => (
            <div key={label} className="rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2">
              <p className="text-xs text-zinc-500">{label}</p>
              <p className="truncate font-medium text-zinc-100 tabular-nums">{value}</p>
            </div>
          ))}
        </section>
      )}

      <section
        aria-label="Lista de transações"
        aria-busy={transactions.isFetching}
        className="flex flex-col gap-3"
      >
        <div className="flex items-center justify-between gap-3">
          <p aria-live="polite" className="text-sm text-zinc-400">
            {data && data.meta.total > 0
              ? `Mostrando ${firstItem}–${lastItem} de ${data.meta.total} ${data.meta.total === 1 ? 'transação' : 'transações'}`
              : ''}
          </p>
          {!isWide && (
            <div className="w-44">
              <Select
                label="Ordenar"
                hideLabel
                value={`${filters.sortBy}-${filters.sortOrder}`}
                onChange={(event) => {
                  const [sortBy, sortOrder] = event.target.value.split('-') as [
                    TransactionSortField,
                    'asc' | 'desc',
                  ];
                  onSort(sortBy, sortOrder);
                }}
              >
                {MOBILE_SORT_OPTIONS.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Select>
            </div>
          )}
        </div>

        {transactions.isPending ? (
          <div className="flex flex-col gap-2">
            {Array.from({ length: 6 }, (_, i) => (
              <Skeleton key={i} className="h-14" />
            ))}
          </div>
        ) : transactions.isError ? (
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900">
            <ErrorState
              message="Não foi possível carregar as transações."
              onRetry={() => void transactions.refetch()}
            />
          </div>
        ) : !data || data.data.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-zinc-800 bg-zinc-900 py-12 text-center">
            <SearchX aria-hidden className="size-6 text-zinc-500" />
            <p className="text-sm text-zinc-400">
              {countActiveFilters(filters) > 0
                ? 'Nenhuma transação encontrada com esses filtros.'
                : 'Nenhuma transação neste período.'}
            </p>
            {countActiveFilters(filters) > 0 && (
              <button
                type="button"
                onClick={clearFilters}
                className="rounded-lg px-3 py-1.5 text-sm text-emerald-400 hover:bg-zinc-800 focus-visible:outline-2 focus-visible:outline-emerald-400"
              >
                Limpar filtros
              </button>
            )}
          </div>
        ) : (
          // Previous page stays on screen, dimmed, while the next one loads
          <div className={cn('transition-opacity', transactions.isPlaceholderData && 'opacity-60')}>
            {isWide ? (
              <div className="overflow-x-auto rounded-2xl border border-zinc-800 bg-zinc-900">
                <TransactionTable
                  transactions={data.data}
                  sortBy={filters.sortBy}
                  sortOrder={filters.sortOrder}
                  onSort={onSort}
                />
              </div>
            ) : (
              <TransactionCards transactions={data.data} />
            )}
          </div>
        )}

        {data && data.meta.total > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="w-40">
              <Select
                label="Itens por página"
                hideLabel
                value={filters.pageSize}
                onChange={(event) => updateFilters({ pageSize: Number(event.target.value) })}
              >
                {PAGE_SIZES.map((size) => (
                  <option key={size} value={size}>
                    {size} por página
                  </option>
                ))}
              </Select>
            </div>
            <Pagination
              page={data.meta.page}
              totalPages={data.meta.totalPages}
              onPageChange={(page) => {
                updateFilters({ page });
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            />
          </div>
        )}
      </section>
    </div>
  );
}
