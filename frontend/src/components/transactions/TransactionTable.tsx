import { AnimatePresence, motion } from 'framer-motion';
import { Pencil, Repeat, Trash2 } from 'lucide-react';

import { CategoryIcon } from '@/components/CategoryIcon';
import type { TransactionSortField } from '@/services/transactions.service';
import type { Transaction } from '@/types/api';
import { formatDate } from '@/utils/date';
import { spring, staggerDelay } from '@/utils/motion';

import { SortableHeader } from './SortableHeader';
import { TransactionAmount } from './TransactionAmount';

interface TransactionTableProps {
  transactions: Transaction[];
  onEdit: (transaction: Transaction) => void;
  onDelete: (transaction: Transaction) => void;
  sortBy: TransactionSortField;
  sortOrder: 'asc' | 'desc';
  onSort: (field: TransactionSortField, order: 'asc' | 'desc') => void;
}

const actionButton =
  'flex size-8 items-center justify-center rounded-lg text-zinc-400 focus-visible:outline-2 focus-visible:outline-emerald-400';

export function TransactionTable({
  transactions,
  onEdit,
  onDelete,
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
          <th scope="col" className="w-20 px-3 py-2.5">
            <span className="sr-only">Ações</span>
          </th>
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
              className="group border-b border-zinc-800/60 last:border-0 hover:bg-zinc-800/30"
            >
              <td className="px-3 py-3 whitespace-nowrap text-zinc-400 tabular-nums">
                {formatDate(t.date)}
              </td>
              <td className="max-w-80 px-3 py-3">
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => onEdit(t)}
                    className="truncate rounded text-left text-zinc-100 hover:underline focus-visible:outline-2 focus-visible:outline-emerald-400"
                  >
                    {t.description}
                  </button>
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
              <td className="px-3 py-3">
                {/* Shown on row hover or keyboard focus on desktop; always reachable */}
                <div className="flex justify-end gap-1 transition-opacity md:opacity-0 md:group-focus-within:opacity-100 md:group-hover:opacity-100">
                  <button
                    type="button"
                    onClick={() => onEdit(t)}
                    aria-label={`Editar ${t.description}`}
                    className={`${actionButton} hover:bg-zinc-800 hover:text-zinc-100`}
                  >
                    <Pencil aria-hidden className="size-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(t)}
                    aria-label={`Excluir ${t.description}`}
                    className={`${actionButton} hover:bg-red-500/10 hover:text-red-400`}
                  >
                    <Trash2 aria-hidden className="size-4" />
                  </button>
                </div>
              </td>
            </motion.tr>
          ))}
        </AnimatePresence>
      </tbody>
    </table>
  );
}
