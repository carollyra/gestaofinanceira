import { Check } from 'lucide-react';

import { cn } from '@/utils/cn';

const STEPS = ['Arquivo', 'Revisão', 'Concluído'] as const;

export function ImportStepper({ current }: { current: 0 | 1 | 2 }) {
  return (
    <ol aria-label="Etapas da importação" className="flex items-center gap-2 text-sm">
      {STEPS.map((label, index) => {
        const done = index < current;
        const active = index === current;
        return (
          <li
            key={label}
            aria-current={active ? 'step' : undefined}
            className="flex items-center gap-2"
          >
            <span
              className={cn(
                'flex size-6 items-center justify-center rounded-full text-xs font-medium',
                done && 'bg-emerald-500 text-zinc-950',
                active && 'bg-zinc-100 text-zinc-950',
                !done && !active && 'bg-zinc-800 text-zinc-400',
              )}
            >
              {done ? <Check aria-hidden className="size-3.5" /> : index + 1}
            </span>
            <span className={cn(active ? 'text-zinc-100' : 'text-zinc-500')}>
              {label}
              {done && <span className="sr-only"> (concluída)</span>}
            </span>
            {index < STEPS.length - 1 && (
              <span aria-hidden className="h-px w-6 bg-zinc-700 sm:w-10" />
            )}
          </li>
        );
      })}
    </ol>
  );
}
