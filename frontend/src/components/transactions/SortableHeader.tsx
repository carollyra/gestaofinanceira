import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';

import type { TransactionSortField } from '@/services/transactions.service';
import { cn } from '@/utils/cn';

interface SortableHeaderProps {
  field: TransactionSortField;
  label: string;
  sortBy: TransactionSortField;
  sortOrder: 'asc' | 'desc';
  onSort: (field: TransactionSortField, order: 'asc' | 'desc') => void;
  align?: 'left' | 'right';
  // Direction used the first time the column is chosen
  defaultOrder?: 'asc' | 'desc';
}

export function SortableHeader({
  field,
  label,
  sortBy,
  sortOrder,
  onSort,
  align = 'left',
  defaultOrder = 'desc',
}: SortableHeaderProps) {
  const active = sortBy === field;
  const Icon = !active ? ArrowUpDown : sortOrder === 'asc' ? ArrowUp : ArrowDown;
  const nextOrder = active ? (sortOrder === 'asc' ? 'desc' : 'asc') : defaultOrder;

  return (
    <th
      scope="col"
      aria-sort={active ? (sortOrder === 'asc' ? 'ascending' : 'descending') : 'none'}
      className={cn('px-3 py-2.5 font-medium', align === 'right' && 'text-right')}
    >
      <button
        type="button"
        onClick={() => onSort(field, nextOrder)}
        className={cn(
          'inline-flex items-center gap-1 rounded transition-colors hover:text-zinc-100 focus-visible:outline-2 focus-visible:outline-emerald-400',
          active ? 'text-zinc-100' : 'text-zinc-400',
        )}
      >
        {label}
        <Icon aria-hidden className={cn('size-3.5', !active && 'opacity-50')} />
      </button>
    </th>
  );
}
