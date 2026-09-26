import { AnimatePresence, motion } from 'framer-motion';
import { BarChart3, Table2 } from 'lucide-react';
import { type ReactNode, useId, useState } from 'react';

import { HoverCard } from '@/components/motion/HoverCard';
import { cn } from '@/utils/cn';
import { spring } from '@/utils/motion';

interface ChartCardProps {
  title: string;
  subtitle?: string;
  // Accessible equivalent of the chart: every value is reachable without hovering
  table?: ReactNode;
  // Dims the content while newer data loads, keeping the previous render
  refreshing?: boolean;
  className?: string;
  children: ReactNode;
}

export function ChartCard({
  title,
  subtitle,
  table,
  refreshing,
  className,
  children,
}: ChartCardProps) {
  const [showTable, setShowTable] = useState(false);
  const titleId = useId();
  const view = showTable && table ? 'table' : 'chart';

  return (
    <HoverCard
      aria-labelledby={titleId}
      className={cn('flex flex-col gap-4 rounded-2xl border bg-zinc-900 p-4', className)}
    >
      <header className="flex items-start justify-between gap-2">
        <div>
          <h2 id={titleId} className="font-medium text-zinc-100">
            {title}
          </h2>
          {subtitle && <p className="text-sm text-zinc-400">{subtitle}</p>}
        </div>
        {table && (
          <button
            type="button"
            onClick={() => setShowTable((value) => !value)}
            aria-pressed={showTable}
            aria-label={showTable ? `Ver gráfico: ${title}` : `Ver tabela: ${title}`}
            className="flex size-8 shrink-0 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-100 focus-visible:outline-2 focus-visible:outline-emerald-400"
          >
            {showTable ? (
              <BarChart3 aria-hidden className="size-4" />
            ) : (
              <Table2 aria-hidden className="size-4" />
            )}
          </button>
        )}
      </header>
      {/* Chart and table cross-fade in the same grid cell: the same data, another view */}
      <div className={cn('grid transition-opacity', refreshing && 'opacity-60')}>
        <AnimatePresence initial={false}>
          <motion.div
            key={view}
            className="col-start-1 row-start-1"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={spring}
          >
            {view === 'table' ? table : children}
          </motion.div>
        </AnimatePresence>
      </div>
    </HoverCard>
  );
}

export function DataTable({
  caption,
  headers,
  rows,
}: {
  caption: string;
  headers: string[];
  rows: ReactNode[][];
}) {
  return (
    <div className="max-h-80 overflow-auto">
      <table className="w-full text-sm">
        <caption className="sr-only">{caption}</caption>
        <thead className="sticky top-0 bg-zinc-900 text-left text-zinc-400">
          <tr>
            {headers.map((header, i) => (
              <th
                key={header}
                scope="col"
                className={cn('py-2 font-medium', i > 0 && 'text-right')}
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="text-zinc-200 tabular-nums">
          {rows.map((cells, rowIndex) => (
            <tr key={rowIndex} className="border-t border-zinc-800">
              {cells.map((cell, i) =>
                i === 0 ? (
                  <th key={i} scope="row" className="py-2 text-left font-normal">
                    {cell}
                  </th>
                ) : (
                  <td key={i} className="py-2 text-right">
                    {cell}
                  </td>
                ),
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
