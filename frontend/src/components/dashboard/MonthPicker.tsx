import { ChevronLeft, ChevronRight } from 'lucide-react';

import { addMonths, formatMonthTitle } from '@/utils/month';

interface MonthPickerProps {
  month: string;
  onChange: (month: string) => void;
}

export function MonthPicker({ month, onChange }: MonthPickerProps) {
  const buttonClass =
    'flex size-9 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-100 focus-visible:outline-2 focus-visible:outline-emerald-400';

  return (
    <div className="flex items-center gap-1 rounded-xl border border-zinc-800 bg-zinc-900 p-1">
      <button
        type="button"
        className={buttonClass}
        onClick={() => onChange(addMonths(month, -1))}
        aria-label="Mês anterior"
      >
        <ChevronLeft aria-hidden className="size-4" />
      </button>
      <span aria-live="polite" className="min-w-36 text-center text-sm font-medium text-zinc-100">
        {formatMonthTitle(month)}
      </span>
      <button
        type="button"
        className={buttonClass}
        onClick={() => onChange(addMonths(month, 1))}
        aria-label="Próximo mês"
      >
        <ChevronRight aria-hidden className="size-4" />
      </button>
    </div>
  );
}
