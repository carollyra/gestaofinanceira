import { AnimatePresence, motion } from 'framer-motion';
import { Copy, Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useSearchParams } from 'react-router';

import { BudgetForm } from '@/components/budgets/BudgetForm';
import { CategoryIcon } from '@/components/CategoryIcon';
import { MonthPicker } from '@/components/dashboard/MonthPicker';
import { ErrorState } from '@/components/dashboard/states';
import { PageHeader } from '@/components/layout/PageHeader';
import { HoverCard } from '@/components/motion/HoverCard';
import { Skeleton } from '@/components/skeletons';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Modal } from '@/components/ui/Modal';
import { ProgressMeter } from '@/components/ui/ProgressMeter';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { useDirectionalNudge } from '@/hooks/useDirectionalNudge';
import {
  useBudgets,
  useCopyBudgets,
  useCreateBudget,
  useDeleteBudget,
  useUpdateBudget,
} from '@/hooks/useFinanceData';
import { useCategories } from '@/hooks/useLookups';
import { useToast } from '@/hooks/useToast';
import { ApiError } from '@/services/api';
import type { Budget } from '@/types/api';
import { statusTheme } from '@/utils/chart-theme';
import { cn } from '@/utils/cn';
import { formatCurrency, formatPercent } from '@/utils/money';
import { addMonths, currentMonth, formatMonthLong, isValidMonth } from '@/utils/month';
import { spring, staggerDelay } from '@/utils/motion';
import { BUDGET_STATUS } from '@/utils/status-labels';

type Dialog =
  | { kind: 'closed' }
  | { kind: 'create' }
  | { kind: 'edit'; budget: Budget }
  | { kind: 'delete'; budget: Budget };

const iconButton =
  'flex size-8 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-100 focus-visible:outline-2 focus-visible:outline-emerald-400';

function remainingText(budget: { remaining: number }) {
  return budget.remaining >= 0
    ? `Restam ${formatCurrency(budget.remaining)}`
    : `${formatCurrency(-budget.remaining)} acima do limite`;
}

export function BudgetsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const monthParam = searchParams.get('mes');
  const month = isValidMonth(monthParam) ? monthParam : currentMonth();
  const [dialog, setDialog] = useState<Dialog>({ kind: 'closed' });

  const budgets = useBudgets(month);
  const categories = useCategories();
  const createBudget = useCreateBudget();
  const updateBudget = useUpdateBudget();
  const deleteBudget = useDeleteBudget();
  const copyBudgets = useCopyBudgets();
  const toast = useToast();
  const nudge = useDirectionalNudge(month);

  const close = () => setDialog({ kind: 'closed' });
  const changeMonth = (next: string) =>
    setSearchParams(next === currentMonth() ? {} : { mes: next }, { replace: true });
  const data = budgets.data;
  const budgeted = new Set(data?.data.map((b) => b.category.id));
  const availableCategories = (categories.data ?? []).filter(
    (c) => c.type === 'EXPENSE' && !budgeted.has(c.id),
  );
  const previousMonth = addMonths(month, -1);

  const copyFromPrevious = async () => {
    try {
      const { created, skipped } = await copyBudgets.mutateAsync({
        fromMonth: previousMonth,
        toMonth: month,
      });
      toast(
        created === 0
          ? 'Todos os orçamentos do mês anterior já existem neste mês'
          : `${created} ${created === 1 ? 'orçamento copiado' : 'orçamentos copiados'}${skipped ? ` (${skipped} já existiam)` : ''}`,
      );
    } catch (error) {
      toast(
        error instanceof ApiError ? error.message : 'Não foi possível copiar os orçamentos',
        'error',
      );
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Orçamentos"
        subtitle="Limites de gasto por categoria"
        actions={
          <>
            <MonthPicker month={month} onChange={changeMonth} />
            <Button
              variant="secondary"
              onClick={() => void copyFromPrevious()}
              loading={copyBudgets.isPending}
            >
              <Copy aria-hidden className="size-4" />
              Copiar do mês anterior
            </Button>
            <Button onClick={() => setDialog({ kind: 'create' })}>
              <Plus aria-hidden className="size-4" />
              Novo orçamento
            </Button>
          </>
        }
      />

      <motion.div
        animate={nudge}
        className={cn(
          'flex flex-col gap-4 transition-opacity',
          budgets.isPlaceholderData && 'opacity-60',
        )}
      >
        {budgets.isPending ? (
          <>
            <Skeleton className="h-32 rounded-2xl" />
            {Array.from({ length: 4 }, (_, i) => (
              <Skeleton key={i} className="h-24 rounded-2xl" />
            ))}
          </>
        ) : budgets.isError ? (
          <ErrorState
            message="Não foi possível carregar os orçamentos."
            onRetry={() => void budgets.refetch()}
          />
        ) : !data || data.data.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-12 text-center">
            <p className="text-sm text-zinc-400">Nenhum orçamento em {formatMonthLong(month)}.</p>
            <p className="text-sm text-zinc-500">
              Crie um limite por categoria ou copie os do mês anterior.
            </p>
          </div>
        ) : (
          <>
            <section
              aria-label="Resumo do mês"
              className="flex flex-col gap-3 rounded-2xl border border-zinc-800 bg-zinc-900 p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm text-zinc-400">Gasto nas categorias com orçamento</p>
                  <p className="text-2xl font-semibold text-zinc-50">
                    {formatCurrency(data.summary.totalSpent)}{' '}
                    <span className="text-base font-normal text-zinc-500">
                      de {formatCurrency(data.summary.totalLimit)}
                    </span>
                  </p>
                </div>
                <StatusBadge {...BUDGET_STATUS[data.summary.status]} />
              </div>
              <ProgressMeter
                percentage={data.summary.percentage}
                color={statusTheme[BUDGET_STATUS[data.summary.status].tone].fill}
                label="Consumo total dos orçamentos"
              />
              <div className="flex flex-wrap justify-between gap-2 text-sm">
                <span className="text-zinc-300">
                  {formatPercent(data.summary.percentage)} · {remainingText(data.summary)}
                </span>
                <span className="text-zinc-500">
                  Fora dos orçamentos: {formatCurrency(data.summary.unbudgetedSpent)}
                </span>
              </div>
            </section>

            <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <AnimatePresence initial={false} mode="popLayout">
                {data.data.map((budget, index) => {
                  const status = BUDGET_STATUS[budget.status];
                  return (
                    <motion.li
                      key={budget.id}
                      layout
                      initial={{ opacity: 0, y: 8 }}
                      animate={{
                        opacity: 1,
                        y: 0,
                        transition: { ...spring, delay: staggerDelay(index, 0.04) },
                      }}
                      exit={{ opacity: 0, scale: 0.97 }}
                      transition={spring}
                    >
                      <HoverCard
                        aria-label={budget.category.name}
                        className="flex flex-col gap-3 rounded-2xl border bg-zinc-900 p-4"
                      >
                        <div className="flex items-center gap-3">
                          <CategoryIcon icon={budget.category.icon} color={budget.category.color} />
                          <p className="min-w-0 flex-1 truncate font-medium text-zinc-100">
                            {budget.category.name}
                          </p>
                          <StatusBadge {...status} />
                        </div>
                        <ProgressMeter
                          percentage={budget.percentage}
                          color={statusTheme[status.tone].fill}
                          label={`Consumo de ${budget.category.name}`}
                        />
                        <div className="flex items-end justify-between gap-2">
                          <div className="text-sm">
                            <p className="text-zinc-200 tabular-nums">
                              {formatCurrency(budget.spent)}{' '}
                              <span className="text-zinc-500">
                                de {formatCurrency(budget.amount)}
                              </span>
                            </p>
                            <p className="text-zinc-500">
                              {formatPercent(budget.percentage)} · {remainingText(budget)}
                            </p>
                          </div>
                          <div className="flex gap-1">
                            <button
                              type="button"
                              className={iconButton}
                              aria-label={`Editar orçamento de ${budget.category.name}`}
                              onClick={() => setDialog({ kind: 'edit', budget })}
                            >
                              <Pencil aria-hidden className="size-4" />
                            </button>
                            <button
                              type="button"
                              className={cn(iconButton, 'hover:bg-red-500/10 hover:text-red-400')}
                              aria-label={`Excluir orçamento de ${budget.category.name}`}
                              onClick={() => setDialog({ kind: 'delete', budget })}
                            >
                              <Trash2 aria-hidden className="size-4" />
                            </button>
                          </div>
                        </div>
                      </HoverCard>
                    </motion.li>
                  );
                })}
              </AnimatePresence>
            </ul>
          </>
        )}
      </motion.div>

      <Modal
        open={dialog.kind === 'create' || dialog.kind === 'edit'}
        onClose={close}
        title={dialog.kind === 'edit' ? 'Editar orçamento' : 'Novo orçamento'}
        description={formatMonthLong(month)}
      >
        <BudgetForm
          key={dialog.kind === 'edit' ? dialog.budget.id : 'new'}
          budget={dialog.kind === 'edit' ? dialog.budget : undefined}
          categories={availableCategories}
          onCancel={close}
          onSubmit={async ({ categoryId, amount }) => {
            if (dialog.kind === 'edit') {
              await updateBudget.mutateAsync({ id: dialog.budget.id, amount });
              toast('Orçamento atualizado');
            } else {
              await createBudget.mutateAsync({ categoryId, amount, month });
              toast('Orçamento criado');
            }
            close();
          }}
        />
      </Modal>

      <ConfirmDialog
        open={dialog.kind === 'delete'}
        title="Excluir orçamento?"
        description="As transações da categoria não são afetadas."
        confirmLabel="Excluir"
        loading={deleteBudget.isPending}
        onClose={close}
        onConfirm={async () => {
          if (dialog.kind !== 'delete') return;
          try {
            await deleteBudget.mutateAsync(dialog.budget.id);
            toast('Orçamento excluído');
          } catch {
            toast('Não foi possível excluir o orçamento', 'error');
          }
          close();
        }}
      >
        {dialog.kind === 'delete' && (
          <p className="text-sm text-zinc-300">{dialog.budget.category.name}</p>
        )}
      </ConfirmDialog>
    </div>
  );
}
