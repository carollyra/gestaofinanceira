import { AnimatePresence, motion } from 'framer-motion';
import { Repeat } from 'lucide-react';

import { CategoryIcon } from '@/components/CategoryIcon';
import type { TransactionSortField } from '@/services/transactions.service';
import type { Transaction } from '@/types/api';
import { formatDate } from '@/utils/date';
import { spring, staggerDelay } from '@/utils/motion';

import { SortableHeader } from './SortableHeader';
import { TransactionAmount } from './TransactionAmount';

interface TransactionTableProps {
  transactions: Transaction[];
  sortBy: TransactionSortField;
  sortOrder: 'asc' | 'desc';
  onSort: (field: TransactionSortField, order: 'asc' | 'desc') => void;
}

export function TransactionTable({
  transactions,
  sortBy,
  sortOrder,
  onSort,
}: TransactionTableProps) {
  const sortProps = { sortBy, sortOrder, onSort };

  return (
    <table className="w-full text-sm">
      <caption className="sr-only">Transações</caption>
      <thead className="border-b border-zinc-800 text-left">
        <tr>
          <SortableHeader field="date" label="Data" {...sortProps} />
          <SortableHeader field="description" label="Descrição" defaultOrder="asc" {...sortProps} />
          <th scope="col" className="px-3 py-2.5 font-medium text-zinc-400">
            Categoria
          </th>
          <th scope="col" className="px-3 py-2.5 font-medium text-zinc-400">
            Conta
          </th>
          <SortableHeader field="amount" label="Valor" align="right" {...sortProps} />
        </tr>
      </thead>
      <tbody>
        {/* Rows cascade in; on reorder or removal the others glide to their new place */}
        <AnimatePresence initial={false} mode="popLayout">
          {transactions.map((t, index) => (
            <motion.tr
              key={t.id}
              layout="position"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0, transition: { ...spring, delay: staggerDelay(index) } }}
              exit={{ opacity: 0, transition: spring }}
              transition={spring}
              className="border-b border-zinc-800/60 last:border-0 hover:bg-zinc-800/30"
            >
              <td className="px-3 py-3 whitespace-nowrap text-zinc-400 tabular-nums">
                {formatDate(t.date)}
              </td>
              <td className="max-w-80 px-3 py-3">
                <div className="flex items-center gap-1.5">
                  <span className="truncate text-zinc-100">{t.description}</span>
                  {t.recurringTransactionId && (
                    <Repeat
                      aria-label="Recorrente"
                      role="img"
                      className="size-3.5 shrink-0 text-zinc-500"
                    />
                  )}
                </div>
                {t.notes && <p className="truncate text-xs text-zinc-500">{t.notes}</p>}
              </td>
              <td className="px-3 py-3">
                {t.category ? (
                  <span className="flex items-center gap-2 text-zinc-300">
                    <CategoryIcon
                      icon={t.category.icon}
                      color={t.category.color}
                      className="size-7"
                    />
                    {t.category.name}
                  </span>
                ) : (
                  <span className="text-zinc-500">Sem categoria</span>
                )}
              </td>
              <td className="px-3 py-3 whitespace-nowrap text-zinc-400">{t.account.name}</td>
              <td className="px-3 py-3 text-right">
                <TransactionAmount type={t.type} amount={t.amount} />
              </td>
            </motion.tr>
          ))}
        </AnimatePresence>
      </tbody>
    </table>
  );
}
