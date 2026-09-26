import { motion } from 'framer-motion';

import type { CategoryShare, TransactionType } from '@/types/api';
import { rankColor } from '@/utils/chart-theme';
import { foldCategories } from '@/utils/fold-categories';
import { formatCurrency, formatPercent } from '@/utils/money';
import { spring } from '@/utils/motion';

interface CategoryBreakdownListProps {
  categories: CategoryShare[];
  // Picks the semantic hue: orange for expenses, blue for incomes
  type: TransactionType;
}

// Ranked list in the semantic color of the type, one intensity per rank
// (largest = full color). Dot and bar share the exact same color; name, value
// and percentage stay visible, so color is never the only channel.
export function CategoryBreakdownList({ categories, type }: CategoryBreakdownListProps) {
  const rows = foldCategories(categories);
  const max = Math.max(...rows.map((row) => row.total), 1);

  return (
    <ul className="flex flex-col gap-3">
      {rows.map((row, rank) => {
        const color = rankColor(type, rank);

        return (
          <li key={row.categoryId ?? 'uncategorized'} className="flex flex-col gap-1.5">
            <div className="flex items-baseline justify-between gap-3 text-sm">
              <span className="flex min-w-0 items-center gap-2 text-zinc-200">
                <span
                  aria-hidden
                  data-testid="rank-dot"
                  className="size-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: color }}
                />
                <span className="truncate">{row.name}</span>
              </span>
              <span className="shrink-0 text-zinc-300 tabular-nums">
                {formatCurrency(row.total)}{' '}
                <span className="text-zinc-500">· {formatPercent(row.percentage)}</span>
              </span>
            </div>
            <div aria-hidden className="h-2 rounded-full bg-zinc-800">
              {/* Fills from the left, 40ms apart; a new month animates from the old width */}
              <motion.div
                data-testid="rank-bar"
                className="h-2 rounded-full"
                style={{ backgroundColor: color }}
                initial={{ width: 0 }}
                animate={{ width: `${(row.total / max) * 100}%` }}
                transition={{ ...spring, delay: rank * 0.04 }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
