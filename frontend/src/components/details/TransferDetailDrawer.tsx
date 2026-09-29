import { Pencil, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/Button';
import { Drawer } from '@/components/ui/Drawer';
import { useTransfer } from '@/hooks/useDetailQueries';
import { useDetailRoute } from '@/hooks/useDetailRoute';
import { ApiError } from '@/services/api';
import type { Transfer } from '@/types/api';
import { TRANSFER_DETAIL_KEYS } from '@/utils/detail-keys';

import { DetailMessage, DetailSkeleton } from './DetailParts';
import { TransferDetail } from './TransferDetail';

interface TransferDetailDrawerProps {
  onEdit: (transfer: Transfer) => void;
  onDelete: (transfer: Transfer) => void;
  returnFocusTo?: () => HTMLElement | null | undefined;
}

export function TransferDetailDrawer({
  onEdit,
  onDelete,
  returnFocusTo,
}: TransferDetailDrawerProps) {
  const { values, close } = useDetailRoute(TRANSFER_DETAIL_KEYS);
  const transfer = useTransfer(values.transferencia);
  const loaded = transfer.data;

  return (
    <Drawer
      open={!!values.transferencia}
      onClose={close}
      title="Transferência"
      ariaLabel={`Detalhes da transferência${loaded ? `: ${loaded.description}` : ''}`}
      returnFocusTo={returnFocusTo}
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
      {loaded ? (
        <TransferDetail transfer={loaded} />
      ) : transfer.isError ? (
        <DetailMessage>
          {transfer.error instanceof ApiError && transfer.error.status === 404
            ? 'Esta transferência não existe mais.'
            : 'Não foi possível carregar a transferência.'}
        </DetailMessage>
      ) : (
        <DetailSkeleton />
      )}
    </Drawer>
  );
}
