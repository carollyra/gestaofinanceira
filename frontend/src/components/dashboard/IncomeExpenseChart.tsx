import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

import type { EvolutionPoint } from '@/types/api';
import { chartTheme } from '@/utils/chart-theme';
import { formatCompactCurrency } from '@/utils/money';
import { alternateMonthTicks, formatMonthShort } from '@/utils/month';

import { ChartTooltip } from './ChartTooltip';

const axisTick = { fill: chartTheme.muted, fontSize: 12 };

const INCOME_EXPENSE_SERIES = [
  { key: 'income', name: 'Receitas', color: chartTheme.series1 },
  { key: 'expense', name: 'Despesas', color: chartTheme.series2 },
] as const;

export function IncomeExpenseLegend() {
  return (
    <ul className="flex gap-4 text-sm text-zinc-300" aria-label="Legenda">
      {INCOME_EXPENSE_SERIES.map((series) => (
        <li key={series.key} className="flex items-center gap-2">
          <span
            aria-hidden
            className="size-2.5 rounded-sm"
            style={{ backgroundColor: series.color }}
          />
          {series.name}
        </li>
      ))}
    </ul>
  );
}

export function IncomeExpenseChart({ data }: { data: EvolutionPoint[] }) {
  const totalIncome = data.reduce((sum, point) => sum + point.income, 0);
  const totalExpense = data.reduce((sum, point) => sum + point.expense, 0);

  return (
    <div className="flex flex-col gap-3">
      <IncomeExpenseLegend />
      <div
        role="img"
        aria-label={`Receitas e despesas por mês nos últimos ${data.length} meses. Total de receitas ${formatCompactCurrency(totalIncome)}, total de despesas ${formatCompactCurrency(totalExpense)}.`}
        className="h-64 w-full"
      >
        <ResponsiveContainer>
          {/* barGap 2: the surface gap between the two bars of a month */}
          <BarChart
            data={data}
            margin={{ top: 8, right: 8, bottom: 0, left: 0 }}
            barGap={2}
            barCategoryGap="28%"
          >
            <CartesianGrid vertical={false} stroke={chartTheme.grid} />
            <XAxis
              dataKey="month"
              tickFormatter={formatMonthShort}
              tick={axisTick}
              axisLine={{ stroke: chartTheme.axis }}
              tickLine={false}
              ticks={alternateMonthTicks(data.map((point) => point.month))}
              interval="preserveEnd"
            />
            <YAxis
              tickFormatter={formatCompactCurrency}
              tick={axisTick}
              axisLine={false}
              tickLine={false}
              width={76}
            />
            <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(255, 255, 255, 0.04)' }} />
            {INCOME_EXPENSE_SERIES.map((series) => (
              <Bar
                key={series.key}
                dataKey={series.key}
                name={series.name}
                fill={series.color}
                maxBarSize={24}
                radius={[4, 4, 0, 0]}
                isAnimationActive={false}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
