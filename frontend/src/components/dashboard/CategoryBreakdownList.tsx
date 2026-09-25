import type { CategoryShare } from '@/types/api';
import { chartTheme } from '@/utils/chart-theme';
import { foldCategories } from '@/utils/fold-categories';
import { formatCurrency, formatPercent } from '@/utils/money';

// Horizontal bars in a single hue (magnitude); the category's own color is its
// identity, shown as a dot beside the name, never on the bar or the text
export function CategoryBreakdownList({ categories }: { categories: CategoryShare[] }) {
  const rows = foldCategories(categories);
  const max = Math.max(...rows.map((row) => row.total), 1);

  return (
    <ul className="flex flex-col gap-3">
      {rows.map((row) => (
        <li key={row.categoryId ?? 'uncategorized'} className="flex flex-col gap-1.5">
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="flex min-w-0 items-center gap-2 text-zinc-200">
              <span
                aria-hidden
                className="size-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: row.color }}
              />
              <span className="truncate">{row.name}</span>
            </span>
            <span className="shrink-0 text-zinc-300 tabular-nums">
              {formatCurrency(row.total)}{' '}
              <span className="text-zinc-500">· {formatPercent(row.percentage)}</span>
            </span>
          </div>
          <div aria-hidden className="h-2 rounded-full bg-zinc-800">
            <div
              className="h-2 rounded-full"
              style={{ width: `${(row.total / max) * 100}%`, backgroundColor: chartTheme.series1 }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}
