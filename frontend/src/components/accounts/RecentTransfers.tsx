import { ArrowRight } from 'lucide-react';
import { useState } from 'react';

import { ErrorState } from '@/components/dashboard/states';
import { Skeleton } from '@/components/skeletons';
import { Pagination } from '@/components/ui/Pagination';
import { useTransfers } from '@/hooks/useDetailQueries';
import type { Transfer } from '@/types/api';
import { formatDate } from '@/utils/date';
import { formatCurrency } from '@/utils/money';

interface RecentTransfersProps {
  onOpen: (transfer: Transfer) => void;
}

export function RecentTransfers({ onOpen }: RecentTransfersProps) {
  const [page, setPage] = useState(1);
  const transfers = useTransfers(page);

  return (
    <section aria-labelledby="recent-transfers-title" className="flex flex-col gap-3">
      <h2 id="recent-transfers-title" className="text-lg font-semibold text-zinc-100">
        Transferências recentes
      </h2>
      {transfers.isPending ? (
        <Skeleton className="h-40 rounded-2xl" />
      ) : transfers.isError ? (
        <ErrorState
          message="Não foi possível carregar as transferências."
          onRetry={() => void transfers.refetch()}
        />
      ) : transfers.data.data.length === 0 ? (
        <p className="rounded-2xl border border-zinc-800 bg-zinc-900 py-8 text-center text-sm text-zinc-400">
          Nenhuma transferência ainda.
        </p>
      ) : (
        <>
          <ul className="divide-y divide-zinc-800/60 rounded-2xl border border-zinc-800 bg-zinc-900">
            {transfers.data.data.map((t) => (
              <li key={t.id} data-transfer-id={t.id}>
                <button
                  type="button"
                  data-detail-trigger
                  aria-haspopup="dialog"
                  onClick={() => onOpen(t)}
                  aria-label={`Ver transferência: ${t.description}, ${formatCurrency(t.amount)} de ${t.fromAccount.name} para ${t.toAccount.name}`}
                  className="flex w-full items-center gap-3 px-3 py-3 text-left transition-colors hover:bg-zinc-800/40 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-emerald-400"
                >
                  <span className="w-12 shrink-0 text-xs text-zinc-500 tabular-nums">
                    {formatDate(t.date).slice(0, 5)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm text-zinc-100">{t.description}</span>
                    <span className="flex items-center gap-1 truncate text-xs text-zinc-500">
                      {t.fromAccount.name}
                      <ArrowRight aria-hidden className="size-3 shrink-0" />
                      {t.toAccount.name}
                    </span>
                  </span>
                  <span className="text-sm font-medium text-zinc-100 tabular-nums">
                    {formatCurrency(t.amount)}
                  </span>
                </button>
              </li>
            ))}
          </ul>
          <Pagination
            page={transfers.data.meta.page}
            totalPages={transfers.data.meta.totalPages}
            onPageChange={setPage}
          />
        </>
      )}
    </section>
  );
}
