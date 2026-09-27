import { CircleCheck } from 'lucide-react';
import { Link } from 'react-router';

import { Button } from '@/components/ui/Button';

interface ImportResultProps {
  created: number;
  skipped: number;
  accountId: string;
  onRestart: () => void;
}

export function ImportResult({ created, skipped, accountId, onRestart }: ImportResultProps) {
  return (
    <div className="flex flex-col items-center gap-4 rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-12 text-center">
      <CircleCheck aria-hidden className="size-10 text-emerald-400" />
      <div>
        <h2 className="text-xl font-semibold text-zinc-50">
          {created} {created === 1 ? 'transação importada' : 'transações importadas'}
        </h2>
        {skipped > 0 && (
          <p className="mt-1 text-sm text-zinc-400">
            {skipped}{' '}
            {skipped === 1
              ? 'foi ignorada porque já estava registrada'
              : 'foram ignoradas porque já estavam registradas'}
            .
          </p>
        )}
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        <Link
          to={`/transacoes?periodo=tudo&conta=${accountId}`}
          className="inline-flex h-11 items-center rounded-lg bg-emerald-500 px-4 text-sm font-medium text-zinc-950 hover:bg-emerald-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400"
        >
          Ver transações
        </Link>
        <Button variant="secondary" onClick={onRestart}>
          Importar outro arquivo
        </Button>
      </div>
    </div>
  );
}
