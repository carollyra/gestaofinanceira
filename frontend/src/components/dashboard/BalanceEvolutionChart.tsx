import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { useMediaQuery } from '@/hooks/useMediaQuery';
import type { EvolutionPoint } from '@/types/api';
import { chartTheme } from '@/utils/chart-theme';
import { formatCompactCurrency, formatCurrency } from '@/utils/money';
import { alternateMonthTicks, formatMonthLong, formatMonthShort } from '@/utils/month';

import { ChartTooltip } from './ChartTooltip';

const axisTick = { fill: chartTheme.muted, fontSize: 12 };

// Direct label on the last point only (selective labeling)
function EndLabel(props: {
  x?: number;
  y?: number;
  index?: number;
  value?: number;
  count: number;
}) {
  const { x, y, index, value, count } = props;
  if (index !== count - 1 || x === undefined || y === undefined || value === undefined) return null;

  return (
    <text
      x={x}
      y={y - 12}
      textAnchor="end"
      fill={chartTheme.textSecondary}
      fontSize={12}
      fontWeight={500}
    >
      {formatCompactCurrency(value)}
    </text>
  );
}

export function BalanceEvolutionChart({ data }: { data: EvolutionPoint[] }) {
  // Phones fit fewer month labels: one every 3 months keeps the spacing even
  const tickStep = useMediaQuery('(min-width: 640px)') ? 2 : 3;
  const first = data[0];
  const last = data[data.length - 1];
  const description =
    first && last
      ? `Saldo total de ${formatCurrency(first.closingBalance)} em ${formatMonthLong(first.month)} ` +
        `para ${formatCurrency(last.closingBalance)} em ${formatMonthLong(last.month)}.`
      : 'Sem dados';

  return (
    <div role="img" aria-label={description} className="h-64 w-full">
      <ResponsiveContainer>
        <AreaChart data={data} margin={{ top: 24, right: 8, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="balance-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={chartTheme.series1} stopOpacity={0.16} />
              <stop offset="100%" stopColor={chartTheme.series1} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke={chartTheme.grid} />
          <XAxis
            dataKey="month"
            tickFormatter={formatMonthShort}
            tick={axisTick}
            axisLine={{ stroke: chartTheme.axis }}
            tickLine={false}
            ticks={alternateMonthTicks(
              data.map((point) => point.month),
              tickStep,
            )}
            interval="preserveEnd"
          />
          <YAxis
            tickFormatter={formatCompactCurrency}
            tick={axisTick}
            axisLine={false}
            tickLine={false}
            width={76}
            className="tabular-nums"
          />
          <Tooltip
            content={<ChartTooltip />}
            cursor={{ stroke: chartTheme.muted, strokeWidth: 1 }}
          />
          <Area
            type="monotone"
            dataKey="closingBalance"
            name="Saldo"
            stroke={chartTheme.series1}
            strokeWidth={2}
            fill="url(#balance-fill)"
            dot={false}
            activeDot={{ r: 5, stroke: chartTheme.surface, strokeWidth: 2 }}
            label={<EndLabel count={data.length} />}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
