import { Repeat } from 'lucide-react';

import { CategoryIcon } from '@/components/CategoryIcon';
import type { Transaction } from '@/types/api';
import { formatWeekdayDate } from '@/utils/date';

import { TransactionAmount } from './TransactionAmount';

// Mobile layout: transactions grouped under a heading per day
export function TransactionCards({ transactions }: { transactions: Transaction[] }) {
  const groups = new Map<string, Transaction[]>();
  for (const t of transactions) groups.set(t.date, [...(groups.get(t.date) ?? []), t]);

  return (
    <div className="flex flex-col gap-4">
      {[...groups].map(([date, items]) => (
        <section key={date} aria-label={formatWeekdayDate(date)}>
          <h3 className="mb-1.5 px-1 text-xs font-medium text-zinc-500">
            {formatWeekdayDate(date)}
          </h3>
          <ul className="divide-y divide-zinc-800/60 rounded-xl border border-zinc-800 bg-zinc-900">
            {items.map((t) => (
              <li key={t.id} className="flex items-center gap-3 px-3 py-3">
                {t.category ? (
                  <CategoryIcon icon={t.category.icon} color={t.category.color} />
                ) : (
                  <CategoryIcon icon="circle-ellipsis" color="#71717a" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-1.5 text-sm text-zinc-100">
                    <span className="truncate">{t.description}</span>
                    {t.recurringTransactionId && (
                      <Repeat
                        aria-label="Recorrente"
                        role="img"
                        className="size-3.5 shrink-0 text-zinc-500"
                      />
                    )}
                  </p>
                  <p className="truncate text-xs text-zinc-500">
                    {t.category?.name ?? 'Sem categoria'} · {t.account.name}
                  </p>
                </div>
                <TransactionAmount type={t.type} amount={t.amount} />
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
