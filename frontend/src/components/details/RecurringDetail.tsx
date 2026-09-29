import { StatusBadge } from '@/components/ui/StatusBadge';
import type { RecurringTransaction } from '@/types/api';
import { formatLongDate } from '@/utils/date';
import { capitalize } from '@/utils/text';
import { describeRecurrence } from '@/utils/recurrence-text';

import { ColorDot, DetailList, DetailRow } from './DetailParts';
import { TypeAmount } from './TypeAmount';

export function RecurringDetail({ recurring: r }: { recurring: RecurringTransaction }) {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-start justify-between gap-3">
        <TypeAmount type={r.type} amount={r.amount} />
        {r.active ? (
          <StatusBadge tone="good" label="Ativa" />
        ) : (
          <StatusBadge tone="neutral" label="Pausada" />
        )}
      </div>

      <div>
        <h3 className="text-xl font-semibold break-words text-zinc-50">{r.description}</h3>
        <p className="mt-1 text-sm text-zinc-400">{describeRecurrence(r)}</p>
      </div>

      <DetailList>
        <DetailRow label="Próxima ocorrência">
          {r.nextOccurrence
            ? capitalize(formatLongDate(r.nextOccurrence))
            : r.active
              ? 'Nenhuma: a recorrência terminou'
              : 'Pausada'}
        </DetailRow>
        <DetailRow label="Começou em">{capitalize(formatLongDate(r.startDate))}</DetailRow>
        <DetailRow label="Termina em">
          {r.endDate ? capitalize(formatLongDate(r.endDate)) : 'Sem data final'}
        </DetailRow>
        <DetailRow label="Conta">
          <span className="inline-flex items-center gap-2">
            <ColorDot color={r.account.color} />
            {r.account.name}
          </span>
        </DetailRow>
        <DetailRow label="Categoria">
          {r.category ? (
            <span className="inline-flex items-center gap-2">
              <ColorDot color={r.category.color} />
              {r.category.name}
            </span>
          ) : (
            <span className="text-zinc-400">Sem categoria</span>
          )}
        </DetailRow>
        <DetailRow label="Lançamentos gerados">{r._count.transactions}</DetailRow>
      </DetailList>
    </div>
  );
}
