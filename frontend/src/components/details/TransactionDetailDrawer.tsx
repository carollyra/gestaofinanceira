import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, Pencil, Trash2 } from 'lucide-react';
import { useSearchParams } from 'react-router';

import { Button } from '@/components/ui/Button';
import { Drawer } from '@/components/ui/Drawer';
import { useRecurring, useTransaction } from '@/hooks/useDetailQueries';
import { useDetailRoute } from '@/hooks/useDetailRoute';
import { ApiError } from '@/services/api';
import type { Transaction } from '@/types/api';
import { TRANSACTION_DETAIL_KEYS } from '@/utils/detail-keys';
import { spring } from '@/utils/motion';

import { DetailMessage, DetailSkeleton } from './DetailParts';
import { RecurringDetail } from './RecurringDetail';
import { TransactionDetail } from './TransactionDetail';

interface TransactionDetailDrawerProps {
  onEdit: (transaction: Transaction) => void;
  onDelete: (transaction: Transaction) => void;
  returnFocusTo?: () => HTMLElement | null | undefined;
}

const notFound = (error: unknown) => error instanceof ApiError && error.status === 404;

// Transaction detail driven by the URL (?transacao=<id>), with the recurrence
// that generated it one level deeper (?recorrencia=<id>)
export function TransactionDetailDrawer({
  onEdit,
  onDelete,
  returnFocusTo,
}: TransactionDetailDrawerProps) {
  const { values, close, back, depth } = useDetailRoute(TRANSACTION_DETAIL_KEYS);
  const transactionId = values.transacao;
  const recurringId = values.recorrencia;
  const transaction = useTransaction(transactionId);
  const recurring = useRecurring(recurringId);

  const view = recurringId ? 'recurring' : 'transaction';
  const loaded = view === 'transaction' ? transaction.data : undefined;

  const [searchParams] = useSearchParams();
  // Built from the router's URL, so the link keeps the list filters
  const recurringHref = loaded?.recurringTransactionId
    ? (() => {
        const params = new URLSearchParams(searchParams);
        params.set('recorrencia', loaded.recurringTransactionId);
        return { search: `?${params}`, state: { detailDepth: depth + 1 } };
      })()
    : undefined;

  return (
    <Drawer
      open={!!transactionId || !!recurringId}
      onClose={close}
      title={view === 'recurring' ? 'Recorrência' : 'Transação'}
      ariaLabel={
        view === 'recurring'
          ? `Detalhes da recorrência${recurring.data ? `: ${recurring.data.description}` : ''}`
          : `Detalhes da transação${transaction.data ? `: ${transaction.data.description}` : ''}`
      }
      returnFocusTo={returnFocusTo}
      headerStart={
        view === 'recurring' && transactionId ? (
          <button
            type="button"
            onClick={() => back('recorrencia')}
            aria-label="Voltar para a transação"
            className="flex size-9 items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100 focus-visible:outline-2 focus-visible:outline-emerald-400"
          >
            <ArrowLeft aria-hidden className="size-4" />
          </button>
        ) : undefined
      }
      footer={
        loaded && (
          <div className="flex gap-2">
            <Button variant="secondary" className="flex-1" onClick={() => onEdit(loaded)}>
              <Pencil aria-hidden className="size-4" />
              Editar
            </Button>
            <Button
              variant="ghost"
              className="flex-1 text-red-400 hover:text-red-300"
              onClick={() => onDelete(loaded)}
            >
              <Trash2 aria-hidden className="size-4" />
              Excluir
            </Button>
          </div>
        )
      }
    >
      {/* Moving between the transaction and its recurrence: slide in the direction of depth */}
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.div
          key={view}
          initial={{ opacity: 0, x: view === 'recurring' ? 24 : -24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: view === 'recurring' ? -24 : 24 }}
          transition={spring}
        >
          {view === 'recurring' ? (
            recurring.data ? (
              <RecurringDetail recurring={recurring.data} />
            ) : recurring.isError ? (
              <DetailMessage>
                {notFound(recurring.error)
                  ? 'Esta recorrência não existe mais.'
                  : 'Não foi possível carregar a recorrência.'}
              </DetailMessage>
            ) : (
              <DetailSkeleton />
            )
          ) : transaction.data ? (
            <TransactionDetail transaction={transaction.data} recurringHref={recurringHref} />
          ) : transaction.isError ? (
            <DetailMessage>
              {notFound(transaction.error)
                ? 'Esta transação não existe mais ou não está disponível.'
                : 'Não foi possível carregar a transação.'}
            </DetailMessage>
          ) : (
            <DetailSkeleton />
          )}
        </motion.div>
      </AnimatePresence>
    </Drawer>
  );
}
