import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react';
import type { ReactNode } from 'react';

import { AnimatedNumber } from '@/components/motion/AnimatedNumber';
import { HoverCard } from '@/components/motion/HoverCard';
import { chartTheme } from '@/utils/chart-theme';
import { formatPercent } from '@/utils/money';

interface Delta {
  current: number;
  previous: number;
  // Whether an increase is good news (income) or bad news (expense)
  upIsGood: boolean;
}

interface StatCardProps {
  label: string;
  // Integer cents; animates from the previous value when it changes
  value: number;
  format: (value: number) => string;
  icon: ReactNode;
  delta?: Delta;
  footnote?: string;
}

function DeltaBadge({ current, previous, upIsGood }: Delta) {
  if (previous === 0) {
    return <span className="text-xs text-zinc-500">Sem base no mês anterior</span>;
  }

  const change = ((current - previous) / Math.abs(previous)) * 100;
  const direction = Math.abs(change) < 0.05 ? 'flat' : change > 0 ? 'up' : 'down';
  const good = direction === 'flat' ? null : (direction === 'up') === upIsGood;
  const Icon = direction === 'up' ? ArrowUpRight : direction === 'down' ? ArrowDownRight : Minus;
  const verb = direction === 'up' ? 'Aumento' : direction === 'down' ? 'Queda' : 'Estável';

  return (
    <span className="flex items-center gap-1 text-xs">
      <span
        className="flex items-center gap-0.5 font-medium"
        style={{
          color: good === null ? chartTheme.muted : good ? chartTheme.good : chartTheme.bad,
        }}
      >
        <Icon aria-hidden className="size-3.5" />
        <span className="sr-only">{verb} de</span>
        {formatPercent(Math.abs(change))}
      </span>
      <span className="text-zinc-500">vs. mês anterior</span>
    </span>
  );
}

export function StatCard({ label, value, format, icon, delta, footnote }: StatCardProps) {
  return (
    <HoverCard
      aria-label={label}
      className="flex flex-col gap-2 rounded-2xl border bg-zinc-900 p-4"
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm text-zinc-400">{label}</p>
        <span className="text-zinc-500">{icon}</span>
      </div>
      <AnimatedNumber
        value={value}
        format={format}
        className="text-2xl font-semibold text-zinc-50"
      />
      {delta && <DeltaBadge {...delta} />}
      {footnote && <p className="text-xs text-zinc-500">{footnote}</p>}
    </HoverCard>
  );
}
