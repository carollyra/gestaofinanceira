import { ArrowDown, ArrowLeftRight } from 'lucide-react';

import type { Transfer } from '@/types/api';
import { formatDateTime, formatLongDate } from '@/utils/date';
import { formatCurrency } from '@/utils/money';
import { capitalize } from '@/utils/text';

import { ColorDot, DetailList, DetailRow } from './DetailParts';

// A transfer is neither income nor expense: neutral color, no sign
export function TransferDetail({ transfer: t }: { transfer: Transfer }) {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-1">
        <span className="flex items-center gap-1 text-sm font-medium text-zinc-400">
          <ArrowLeftRight aria-hidden className="size-4" />
          Transferência entre contas
        </span>
        <p className="text-4xl font-semibold tracking-tight text-zinc-50">
          {formatCurrency(t.amount)}
        </p>
      </div>

      <div className="flex flex-col items-start gap-1 rounded-xl border border-zinc-800 bg-zinc-950 p-3 text-sm">
        <span className="inline-flex items-center gap-2 text-zinc-100">
          <ColorDot color={t.fromAccount.color} />
          <span className="text-zinc-500">De</span> {t.fromAccount.name}
        </span>
        <ArrowDown aria-hidden className="ml-0.5 size-3.5 text-zinc-600" />
        <span className="inline-flex items-center gap-2 text-zinc-100">
          <ColorDot color={t.toAccount.color} />
          <span className="text-zinc-500">Para</span> {t.toAccount.name}
        </span>
      </div>

      <div>
        <h3 className="text-xl font-semibold break-words text-zinc-50">{t.description}</h3>
        {t.notes && <p className="mt-1 text-sm whitespace-pre-line text-zinc-300">{t.notes}</p>}
      </div>

      <DetailList>
        <DetailRow label="Data">{capitalize(formatLongDate(t.date))}</DetailRow>
        <DetailRow label="Registrada em">{formatDateTime(t.createdAt)}</DetailRow>
        <DetailRow label="Efeito">
          <span className="text-zinc-300">Muda os saldos, não conta como receita nem despesa</span>
        </DetailRow>
      </DetailList>
    </div>
  );
}
