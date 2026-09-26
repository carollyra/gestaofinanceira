import { AnimatePresence, LayoutGroup, motion } from 'framer-motion';
import { Repeat } from 'lucide-react';

import { CategoryIcon } from '@/components/CategoryIcon';
import type { Transaction } from '@/types/api';
import { formatWeekdayDate } from '@/utils/date';
import { spring, staggerDelay } from '@/utils/motion';

import { TransactionAmount } from './TransactionAmount';

interface TransactionCardsProps {
  transactions: Transaction[];
  // Tapping a card opens it for editing (delete lives in the edit dialog)
  onEdit: (transaction: Transaction) => void;
}

// Mobile layout: transactions grouped under a heading per day
export function TransactionCards({ transactions, onEdit }: TransactionCardsProps) {
  const groups = new Map<string, Transaction[]>();
  for (const t of transactions) groups.set(t.date, [...(groups.get(t.date) ?? []), t]);
  const position = new Map(transactions.map((t, i) => [t.id, i]));

  return (
    <LayoutGroup>
      <div className="flex flex-col gap-4">
        <AnimatePresence initial={false} mode="popLayout">
          {[...groups].map(([date, items]) => (
            <motion.section
              key={date}
              layout="position"
              aria-label={formatWeekdayDate(date)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={spring}
            >
              <h3 className="mb-1.5 px-1 text-xs font-medium text-zinc-500">
                {formatWeekdayDate(date)}
              </h3>
              <ul className="divide-y divide-zinc-800/60 overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900">
                <AnimatePresence initial={false}>
                  {items.map((t) => (
                    // Enters in cascade; when removed it collapses and the next items move up
                    <motion.li
                      key={t.id}
                      layout="position"
                      initial={{ opacity: 0, y: 6 }}
                      animate={{
                        opacity: 1,
                        y: 0,
                        height: 'auto',
                        transition: { ...spring, delay: staggerDelay(position.get(t.id) ?? 0) },
                      }}
                      exit={{ opacity: 0, height: 0, transition: spring }}
                      transition={spring}
                      className="overflow-hidden"
                    >
                      <button
                        type="button"
                        onClick={() => onEdit(t)}
                        aria-label={`Editar ${t.description}`}
                        className="flex w-full items-center gap-3 px-3 py-3 text-left transition-colors hover:bg-zinc-800/40 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-emerald-400"
                      >
                        {t.category ? (
                          <CategoryIcon icon={t.category.icon} color={t.category.color} />
                        ) : (
                          <CategoryIcon icon="circle-ellipsis" color="#71717a" />
                        )}
                        <span className="min-w-0 flex-1">
                          <span className="flex items-center gap-1.5 text-sm text-zinc-100">
                            <span className="truncate">{t.description}</span>
                            {t.recurringTransactionId && (
                              <Repeat
                                aria-label="Recorrente"
                                role="img"
                                className="size-3.5 shrink-0 text-zinc-500"
                              />
                            )}
                          </span>
                          <span className="block truncate text-xs text-zinc-500">
                            {t.category?.name ?? 'Sem categoria'} · {t.account.name}
                          </span>
                        </span>
                        <TransactionAmount type={t.type} amount={t.amount} />
                      </button>
                    </motion.li>
                  ))}
                </AnimatePresence>
              </ul>
            </motion.section>
          ))}
        </AnimatePresence>
      </div>
    </LayoutGroup>
  );
}
