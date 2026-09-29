import { FileUp, PenLine, Repeat } from 'lucide-react';
import { Link } from 'react-router';

import type { Transaction } from '@/types/api';
import { ACCOUNT_TYPES } from '@/utils/account-types';
import { formatDateTime, formatLongDate } from '@/utils/date';
import { capitalize } from '@/utils/text';

import { ColorDot, DetailList, DetailRow } from './DetailParts';
import { TypeAmount } from './TypeAmount';

interface TransactionDetailProps {
  transaction: Transaction;
  // URL of the recurrence detail (the link keeps the list filters)
  recurringHref?: { search: string; state: unknown };
}

const EDIT_THRESHOLD_MS = 60_000;

export function TransactionDetail({ transaction: t, recurringHref }: TransactionDetailProps) {
  const isIncome = t.type === 'INCOME';
  const edited =
    new Date(t.updatedAt).getTime() - new Date(t.createdAt).getTime() > EDIT_THRESHOLD_MS;

  return (
    <div className="flex flex-col gap-5">
      <TypeAmount type={t.type} amount={t.amount} />

      <div>
        <h3 className="text-xl font-semibold break-words text-zinc-50">{t.description}</h3>
        {t.notes && (
          <div className="mt-3 rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2.5">
            <p className="text-xs font-medium text-zinc-500">Observações</p>
            <p className="mt-0.5 text-sm whitespace-pre-line text-zinc-200">{t.notes}</p>
          </div>
        )}
      </div>

      <DetailList>
        <DetailRow label="Categoria">
          {t.category ? (
            <span className="inline-flex items-center gap-2">
              <ColorDot color={t.category.color} />
              {t.category.name}
            </span>
          ) : (
            <span className="text-zinc-400">Sem categoria</span>
          )}
        </DetailRow>
        <DetailRow label={isIncome ? 'Entrou em' : 'Saiu de'}>
          <span className="inline-flex items-center gap-2">
            <ColorDot color={t.account.color} />
            {t.account.name}
            {/* The type only adds information when the name does not already say it */}
            {t.account.name !== ACCOUNT_TYPES[t.account.type].label && (
              <span className="text-zinc-500">· {ACCOUNT_TYPES[t.account.type].label}</span>
            )}
          </span>
        </DetailRow>
        <DetailRow label="Data">{capitalize(formatLongDate(t.date))}</DetailRow>
        <DetailRow label="Registrada em">
          {formatDateTime(t.createdAt)}
          {edited && (
            <span className="block text-xs text-zinc-500">
              Editada em {formatDateTime(t.updatedAt)}
            </span>
          )}
        </DetailRow>
        <DetailRow label="Origem">
          {t.source === 'RECURRING' ? (
            <span className="inline-flex flex-col items-start gap-1 sm:items-end">
              <span className="inline-flex items-center gap-1.5">
                <Repeat aria-hidden className="size-4 text-zinc-400" />
                Gerada por uma recorrência
              </span>
              {recurringHref ? (
                <Link
                  to={{ search: recurringHref.search }}
                  state={recurringHref.state}
                  className="text-emerald-400 underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-emerald-400"
                >
                  Ver recorrência
                </Link>
              ) : (
                <span className="text-xs text-zinc-500">A recorrência foi excluída</span>
              )}
            </span>
          ) : t.source === 'IMPORT' ? (
            <span className="inline-flex flex-col items-start sm:items-end">
              <span className="inline-flex items-center gap-1.5">
                <FileUp aria-hidden className="size-4 text-zinc-400" />
                Importada de extrato CSV
              </span>
              {t.importFileName && (
                <span className="text-xs break-all text-zinc-500">{t.importFileName}</span>
              )}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5">
              <PenLine aria-hidden className="size-4 text-zinc-400" />
              Lançada manualmente
            </span>
          )}
        </DetailRow>
      </DetailList>
    </div>
  );
}
