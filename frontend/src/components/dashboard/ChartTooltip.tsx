import { formatCurrency } from '@/utils/money';
import { formatMonthTitle } from '@/utils/month';

interface TooltipItem {
  name?: string | number;
  value?: number | string | (number | string)[];
  color?: string;
  dataKey?: string | number;
}

interface ChartTooltipProps {
  active?: boolean;
  label?: string | number;
  payload?: readonly TooltipItem[];
}

// Values lead (strong), series names follow; each row keyed by a short line
// in the series color, not a filled box
export function ChartTooltip({ active, label, payload }: ChartTooltipProps) {
  if (!active || !payload?.length) return null;

  return (
    <div className="min-w-44 rounded-lg border border-zinc-700 bg-zinc-950/95 px-3 py-2 text-sm shadow-xl">
      <p className="mb-1.5 text-xs text-zinc-400">{formatMonthTitle(String(label))}</p>
      <ul className="flex flex-col gap-1">
        {payload.map((item) => (
          <li key={String(item.dataKey)} className="flex items-center gap-2">
            <span
              aria-hidden
              className="h-0.5 w-3 rounded-full"
              style={{ backgroundColor: item.color }}
            />
            <span className="font-semibold text-zinc-50 tabular-nums">
              {formatCurrency(Number(item.value))}
            </span>
            <span className="text-zinc-400">{item.name}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
