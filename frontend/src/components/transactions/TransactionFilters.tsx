import { Search, SlidersHorizontal, X } from 'lucide-react';
import { useEffect, useState } from 'react';

import { MonthPicker } from '@/components/dashboard/MonthPicker';
import { Select } from '@/components/ui/Select';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import type { Account, Category } from '@/types/api';
import { cn } from '@/utils/cn';
import {
  countActiveFilters,
  type PeriodMode,
  type TransactionFilters as Filters,
} from '@/utils/transaction-filters';

interface TransactionFiltersProps {
  filters: Filters;
  accounts: Account[];
  categories: Category[];
  onChange: (changes: Partial<Filters>) => void;
  onClear: () => void;
}

const PERIOD_OPTIONS: [PeriodMode, string][] = [
  ['month', 'Mês'],
  ['custom', 'Personalizado'],
  ['all', 'Tudo'],
];

const fieldClass =
  'h-10 w-full rounded-lg border border-zinc-700 bg-zinc-900 text-base text-zinc-100 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/30 sm:text-sm';

export function TransactionFilters({
  filters,
  accounts,
  categories,
  onChange,
  onClear,
}: TransactionFiltersProps) {
  // The input answers instantly; the URL (and the request) follows after a pause
  const [search, setSearch] = useState(filters.search);
  const debouncedSearch = useDebouncedValue(search, 350);

  useEffect(() => {
    if (debouncedSearch.trim() !== filters.search.trim()) onChange({ search: debouncedSearch });
    // Only the debounced value should trigger this
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  // Back/forward or "clear filters" change the URL: bring the input along
  const [lastUrlSearch, setLastUrlSearch] = useState(filters.search);
  if (filters.search !== lastUrlSearch) {
    setLastUrlSearch(filters.search);
    if (filters.search.trim() !== search.trim()) setSearch(filters.search);
  }

  // Phones: search stays visible, the other filters fold behind a button
  const isWide = useMediaQuery('(min-width: 1024px)');
  const [expanded, setExpanded] = useState(false);
  const showFilters = isWide || expanded;

  const visibleCategories = filters.type
    ? categories.filter((c) => c.type === filters.type)
    : categories;
  const incomeCategories = visibleCategories.filter((c) => c.type === 'INCOME');
  const expenseCategories = visibleCategories.filter((c) => c.type === 'EXPENSE');
  const activeCount = countActiveFilters(filters);

  const changeType = (type: Filters['type']) => {
    // A category of the other type would make the list always empty
    const category = categories.find((c) => c.id === filters.categoryId);
    onChange({ type, ...(type && category && category.type !== type ? { categoryId: '' } : {}) });
  };

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-3">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="flex gap-2 lg:flex-1">
          <div className="relative flex-1">
            <label htmlFor="transaction-search" className="sr-only">
              Buscar transações
            </label>
            <Search
              aria-hidden
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-zinc-500"
            />
            <input
              id="transaction-search"
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar transações"
              className={cn(fieldClass, 'pr-3 pl-9 placeholder:text-zinc-500')}
            />
          </div>
          {!isWide && (
            <button
              type="button"
              onClick={() => setExpanded((value) => !value)}
              aria-expanded={expanded}
              aria-controls="transaction-filters-panel"
              className={cn(
                'flex h-10 shrink-0 items-center gap-2 rounded-lg border px-3 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-emerald-400',
                expanded || activeCount > 0
                  ? 'border-emerald-400/40 text-zinc-100'
                  : 'border-zinc-700 text-zinc-300',
              )}
            >
              <SlidersHorizontal aria-hidden className="size-4" />
              Filtros
              {activeCount > 0 && (
                <span className="rounded-full bg-emerald-500 px-1.5 text-xs font-medium text-zinc-950">
                  {activeCount}
                </span>
              )}
            </button>
          )}
        </div>

        <div
          role="radiogroup"
          aria-label="Período"
          className="flex rounded-lg border border-zinc-800 bg-zinc-900 p-1"
        >
          {PERIOD_OPTIONS.map(([value, label]) => (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={filters.period === value}
              onClick={() => onChange({ period: value })}
              className={cn(
                'flex-1 rounded-md px-3 py-1.5 text-sm whitespace-nowrap transition-colors focus-visible:outline-2 focus-visible:outline-emerald-400',
                filters.period === value
                  ? 'bg-zinc-800 text-zinc-50'
                  : 'text-zinc-400 hover:text-zinc-100',
              )}
            >
              {label}
            </button>
          ))}
        </div>

        {filters.period === 'month' && (
          <MonthPicker month={filters.month} onChange={(month) => onChange({ month })} />
        )}
        {filters.period === 'custom' && (
          <div className="flex items-center gap-2">
            <label className="sr-only" htmlFor="filter-from">
              Data inicial
            </label>
            <input
              id="filter-from"
              type="date"
              value={filters.from}
              onChange={(event) => onChange({ from: event.target.value })}
              className={cn(fieldClass, 'px-3 [color-scheme:dark]')}
            />
            <span className="text-sm text-zinc-500">até</span>
            <label className="sr-only" htmlFor="filter-to">
              Data final
            </label>
            <input
              id="filter-to"
              type="date"
              value={filters.to}
              onChange={(event) => onChange({ to: event.target.value })}
              className={cn(fieldClass, 'px-3 [color-scheme:dark]')}
            />
          </div>
        )}
      </div>

      {showFilters && (
        <div
          id="transaction-filters-panel"
          className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:grid-cols-[1fr_1fr_1fr_auto] lg:items-end"
        >
          <Select
            label="Tipo"
            value={filters.type}
            onChange={(event) => changeType(event.target.value as Filters['type'])}
          >
            <option value="">Receitas e despesas</option>
            <option value="INCOME">Receitas</option>
            <option value="EXPENSE">Despesas</option>
          </Select>

          <Select
            label="Conta"
            value={filters.accountId}
            onChange={(event) => onChange({ accountId: event.target.value })}
          >
            <option value="">Todas as contas</option>
            {accounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.name}
                {account.archived ? ' (arquivada)' : ''}
              </option>
            ))}
          </Select>

          <Select
            label="Categoria"
            value={filters.categoryId}
            onChange={(event) => onChange({ categoryId: event.target.value })}
          >
            <option value="">Todas as categorias</option>
            <option value="none">Sem categoria</option>
            {incomeCategories.length > 0 && (
              <optgroup label="Receitas">
                {incomeCategories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </optgroup>
            )}
            {expenseCategories.length > 0 && (
              <optgroup label="Despesas">
                {expenseCategories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </optgroup>
            )}
          </Select>

          <button
            type="button"
            onClick={onClear}
            disabled={activeCount === 0}
            className="flex h-10 items-center justify-center gap-1.5 rounded-lg px-3 text-sm text-zinc-300 transition-colors hover:bg-zinc-800 focus-visible:outline-2 focus-visible:outline-emerald-400 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <X aria-hidden className="size-4" />
            Limpar filtros{activeCount > 0 ? ` (${activeCount})` : ''}
          </button>
        </div>
      )}
    </div>
  );
}
