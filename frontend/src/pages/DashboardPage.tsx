import { motion } from 'framer-motion';
import { ArrowDownCircle, ArrowUpCircle, PiggyBank, Scale } from 'lucide-react';
import { useSearchParams } from 'react-router';

import { BalanceEvolutionChart } from '@/components/dashboard/BalanceEvolutionChart';
import { CategoryBreakdownList } from '@/components/dashboard/CategoryBreakdownList';
import { ChartCard, DataTable } from '@/components/dashboard/ChartCard';
import { IncomeExpenseChart } from '@/components/dashboard/IncomeExpenseChart';
import { MonthPicker } from '@/components/dashboard/MonthPicker';
import { StatCard } from '@/components/dashboard/StatCard';
import { EmptyState, ErrorState } from '@/components/dashboard/states';
import {
  BarChartSkeleton,
  CategoryListSkeleton,
  LineChartSkeleton,
  StatCardSkeleton,
} from '@/components/skeletons';
import { useAuth } from '@/hooks/useAuth';
import {
  useDashboardSummary,
  useExpensesByCategory,
  useMonthlyEvolution,
} from '@/hooks/useDashboard';
import { useDirectionalNudge } from '@/hooks/useDirectionalNudge';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import type { DashboardSummary } from '@/types/api';
import { cn } from '@/utils/cn';
import { formatCurrency, formatPercent } from '@/utils/money';
import { currentMonth, formatMonthLong, formatMonthShort, isValidMonth } from '@/utils/month';

const LOAD_ERROR = 'Não foi possível carregar estes dados.';
const formatSignedCurrency = (cents: number) => formatCurrency(cents, { signed: true });

export function DashboardPage() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const monthParam = searchParams.get('mes');
  const month = isValidMonth(monthParam) ? monthParam : currentMonth();

  const summary = useDashboardSummary(month);
  const evolution = useMonthlyEvolution(month);
  const byCategory = useExpensesByCategory(month);
  const nudge = useDirectionalNudge(month);

  // The month lives in the URL: shareable, and survives reloads and back/forward
  const changeMonth = (next: string) =>
    setSearchParams(next === currentMonth() ? {} : { mes: next }, { replace: true });

  const evolutionData = evolution.data ?? [];
  const hasMovement = evolutionData.some((point) => point.income > 0 || point.expense > 0);
  // 24 bars do not fit a phone: narrow screens show the last 6 months (the table keeps all 12)
  const isWide = useMediaQuery('(min-width: 640px)');
  const barMonths = isWide ? 12 : 6;
  const barData = evolutionData.slice(-barMonths);
  const firstName = user?.name.split(' ')[0];

  return (
    <div className="flex flex-col gap-6">
      {/* Filters sit in one row above everything they scope */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm text-zinc-400">Olá, {firstName}</p>
          <h1 className="text-2xl font-semibold text-zinc-50">Visão geral</h1>
        </div>
        <MonthPicker month={month} onChange={changeMonth} />
      </div>

      {/* Everything scoped by the month arrives from the side of the navigation */}
      <motion.div animate={nudge} className="flex flex-col gap-6">
        <section
          aria-label="Resumo do mês"
          className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4"
        >
          {summary.isPending ? (
            Array.from({ length: 4 }, (_, i) => <StatCardSkeleton key={i} />)
          ) : summary.isError ? (
            <div className="col-span-full rounded-2xl border border-zinc-800 bg-zinc-900">
              <ErrorState message={LOAD_ERROR} onRetry={() => void summary.refetch()} />
            </div>
          ) : (
            <SummaryCards data={summary.data} refreshing={summary.isPlaceholderData} />
          )}
        </section>

        <div className="grid grid-cols-1 gap-3 lg:grid-cols-5">
          <ChartCard
            title="Evolução do saldo"
            subtitle="Saldo total no fim de cada mês, últimos 12 meses"
            className="lg:col-span-3"
            refreshing={evolution.isPlaceholderData}
            table={
              evolution.data && (
                <DataTable
                  caption="Saldo total no fim de cada mês"
                  headers={['Mês', 'Saldo']}
                  rows={evolutionData.map((p) => [
                    formatMonthShort(p.month),
                    formatCurrency(p.closingBalance),
                  ])}
                />
              )
            }
          >
            {evolution.isPending ? (
              <LineChartSkeleton />
            ) : evolution.isError ? (
              <ErrorState message={LOAD_ERROR} onRetry={() => void evolution.refetch()} />
            ) : (
              <BalanceEvolutionChart data={evolutionData} />
            )}
          </ChartCard>

          <ChartCard
            title="Despesas por categoria"
            subtitle={formatMonthLong(month)}
            className="lg:col-span-2"
            refreshing={byCategory.isPlaceholderData}
            table={
              byCategory.data &&
              byCategory.data.categories.length > 0 && (
                <DataTable
                  caption={`Despesas por categoria em ${formatMonthLong(month)}`}
                  headers={['Categoria', 'Valor', '%', 'Qtd.']}
                  rows={byCategory.data.categories.map((c) => [
                    c.name,
                    formatCurrency(c.total),
                    formatPercent(c.percentage),
                    c.count,
                  ])}
                />
              )
            }
          >
            {byCategory.isPending ? (
              <CategoryListSkeleton />
            ) : byCategory.isError ? (
              <ErrorState message={LOAD_ERROR} onRetry={() => void byCategory.refetch()} />
            ) : byCategory.data.categories.length === 0 ? (
              <EmptyState message="Nenhuma despesa neste mês." />
            ) : (
              <CategoryBreakdownList categories={byCategory.data.categories} type="EXPENSE" />
            )}
          </ChartCard>

          <ChartCard
            title="Receitas x despesas"
            subtitle={`Por mês, últimos ${barMonths} meses`}
            className="lg:col-span-5"
            refreshing={evolution.isPlaceholderData}
            table={
              evolution.data && (
                <DataTable
                  caption="Receitas e despesas por mês"
                  headers={['Mês', 'Receitas', 'Despesas', 'Resultado']}
                  rows={evolutionData.map((p) => [
                    formatMonthShort(p.month),
                    formatCurrency(p.income),
                    formatCurrency(p.expense),
                    formatCurrency(p.net, { signed: true }),
                  ])}
                />
              )
            }
          >
            {evolution.isPending ? (
              <BarChartSkeleton bars={barMonths} />
            ) : evolution.isError ? (
              <ErrorState message={LOAD_ERROR} onRetry={() => void evolution.refetch()} />
            ) : hasMovement ? (
              <IncomeExpenseChart data={barData} />
            ) : (
              <EmptyState message="Nenhuma receita ou despesa nos últimos 12 meses." />
            )}
          </ChartCard>
        </div>
      </motion.div>
    </div>
  );
}

function SummaryCards({ data, refreshing }: { data: DashboardSummary; refreshing: boolean }) {
  const savingsRate = data.income > 0 ? (data.net / data.income) * 100 : null;

  return (
    <div className={cn('contents', refreshing && '[&>*]:opacity-60')}>
      <StatCard
        label="Saldo total"
        value={data.totalBalance}
        format={formatCurrency}
        icon={<Scale aria-hidden className="size-4" />}
        footnote="Soma de todas as contas"
      />
      <StatCard
        label="Receitas do mês"
        value={data.income}
        format={formatCurrency}
        icon={<ArrowUpCircle aria-hidden className="size-4" />}
        delta={{ current: data.income, previous: data.previousMonth.income, upIsGood: true }}
      />
      <StatCard
        label="Despesas do mês"
        value={data.expense}
        format={formatCurrency}
        icon={<ArrowDownCircle aria-hidden className="size-4" />}
        delta={{ current: data.expense, previous: data.previousMonth.expense, upIsGood: false }}
      />
      <StatCard
        label="Resultado do mês"
        value={data.net}
        format={formatSignedCurrency}
        icon={<PiggyBank aria-hidden className="size-4" />}
        footnote={
          savingsRate === null
            ? 'Sem receitas no mês'
            : `${formatPercent(savingsRate)} das receitas guardados`
        }
      />
    </div>
  );
}
