import { AnimatePresence, motion } from 'framer-motion';
import { CalendarClock, Minus, Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';

import { CategoryIcon } from '@/components/CategoryIcon';
import { ErrorState } from '@/components/dashboard/states';
import { GoalForm } from '@/components/goals/GoalForm';
import { GoalMovementForm } from '@/components/goals/GoalMovementForm';
import { PageHeader } from '@/components/layout/PageHeader';
import { AnimatedNumber } from '@/components/motion/AnimatedNumber';
import { HoverCard } from '@/components/motion/HoverCard';
import { Skeleton } from '@/components/skeletons';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Modal } from '@/components/ui/Modal';
import { ProgressMeter } from '@/components/ui/ProgressMeter';
import { StatusBadge } from '@/components/ui/StatusBadge';
import {
  useCreateGoal,
  useDeleteGoal,
  useGoalMovement,
  useGoals,
  useUpdateGoal,
} from '@/hooks/useFinanceData';
import { useToast } from '@/hooks/useToast';
import type { Goal } from '@/types/api';
import { cn } from '@/utils/cn';
import { formatDate } from '@/utils/date';
import { formatCurrency, formatPercent } from '@/utils/money';
import { spring, staggerDelay } from '@/utils/motion';
import { goalHint } from '@/utils/goal-hint';
import { GOAL_STATUS } from '@/utils/status-labels';

type Dialog =
  | { kind: 'closed' }
  | { kind: 'create' }
  | { kind: 'edit'; goal: Goal }
  | { kind: 'delete'; goal: Goal }
  | { kind: 'movement'; goal: Goal; movement: 'deposit' | 'withdraw' };

const iconButton =
  'flex size-8 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-100 focus-visible:outline-2 focus-visible:outline-emerald-400';

export function GoalsPage() {
  const [dialog, setDialog] = useState<Dialog>({ kind: 'closed' });
  const goals = useGoals();
  const createGoal = useCreateGoal();
  const updateGoal = useUpdateGoal();
  const deleteGoal = useDeleteGoal();
  const movement = useGoalMovement();
  const toast = useToast();
  const close = () => setDialog({ kind: 'closed' });
  const data = goals.data;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Metas"
        subtitle="Objetivos de economia"
        actions={
          <Button onClick={() => setDialog({ kind: 'create' })}>
            <Plus aria-hidden className="size-4" />
            Nova meta
          </Button>
        }
      />

      {goals.isPending ? (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {Array.from({ length: 3 }, (_, i) => (
            <Skeleton key={i} className="h-44 rounded-2xl" />
          ))}
        </div>
      ) : goals.isError ? (
        <ErrorState
          message="Não foi possível carregar as metas."
          onRetry={() => void goals.refetch()}
        />
      ) : !data || data.data.length === 0 ? (
        <p className="rounded-2xl border border-zinc-800 bg-zinc-900 py-12 text-center text-sm text-zinc-400">
          Nenhuma meta ainda. Que tal começar por uma reserva de emergência?
        </p>
      ) : (
        <>
          <section
            aria-label="Resumo das metas"
            className="flex flex-col gap-3 rounded-2xl border border-zinc-800 bg-zinc-900 p-4"
          >
            <div className="flex flex-wrap items-end justify-between gap-2">
              <div>
                <p className="text-sm text-zinc-400">Total guardado</p>
                <p className="text-2xl font-semibold text-zinc-50">
                  <AnimatedNumber value={data.summary.totalSaved} format={formatCurrency} />{' '}
                  <span className="text-base font-normal text-zinc-500">
                    de {formatCurrency(data.summary.totalTarget)}
                  </span>
                </p>
              </div>
              <p className="text-sm text-zinc-400">
                {data.summary.completed} de {data.summary.count}{' '}
                {data.summary.count === 1 ? 'meta concluída' : 'metas concluídas'}
              </p>
            </div>
            <ProgressMeter
              percentage={data.summary.percentage}
              color="#10b981"
              label="Progresso total das metas"
            />
          </section>

          <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <AnimatePresence initial={false} mode="popLayout">
              {data.data.map((goal, index) => {
                const status = GOAL_STATUS[goal.progress.status];
                return (
                  <motion.li
                    key={goal.id}
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
                      aria-label={goal.name}
                      className="flex h-full flex-col gap-3 rounded-2xl border bg-zinc-900 p-4"
                    >
                      <div className="flex items-center gap-3">
                        <CategoryIcon icon={goal.icon} color={goal.color} className="size-10" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-medium text-zinc-100">{goal.name}</p>
                          {goal.deadline && (
                            <p className="flex items-center gap-1 text-xs text-zinc-500">
                              <CalendarClock aria-hidden className="size-3.5" />
                              {formatDate(goal.deadline)}
                              {goal.progress.daysLeft !== null &&
                                goal.progress.daysLeft >= 0 &&
                                ` · faltam ${goal.progress.daysLeft} dias`}
                            </p>
                          )}
                        </div>
                        <StatusBadge {...status} />
                      </div>
                      <div>
                        <p className="text-zinc-100 tabular-nums">
                          <AnimatedNumber
                            value={goal.currentAmount}
                            format={formatCurrency}
                            className="text-lg font-semibold"
                          />{' '}
                          <span className="text-sm text-zinc-500">
                            de {formatCurrency(goal.targetAmount)}
                          </span>
                        </p>
                      </div>
                      <ProgressMeter
                        percentage={goal.progress.percentage}
                        color={goal.color}
                        label={`Progresso de ${goal.name}`}
                      />
                      <p className="text-sm text-zinc-400">
                        {formatPercent(goal.progress.percentage)} · {goalHint(goal)}
                      </p>
                      <div className="mt-auto flex items-center gap-2 border-t border-zinc-800 pt-3">
                        <Button
                          className="h-9 flex-1"
                          onClick={() => setDialog({ kind: 'movement', goal, movement: 'deposit' })}
                        >
                          <Plus aria-hidden className="size-4" />
                          Guardar
                        </Button>
                        <Button
                          variant="secondary"
                          className="h-9 flex-1"
                          disabled={goal.currentAmount === 0}
                          onClick={() =>
                            setDialog({ kind: 'movement', goal, movement: 'withdraw' })
                          }
                        >
                          <Minus aria-hidden className="size-4" />
                          Retirar
                        </Button>
                        <button
                          type="button"
                          className={iconButton}
                          aria-label={`Editar ${goal.name}`}
                          onClick={() => setDialog({ kind: 'edit', goal })}
                        >
                          <Pencil aria-hidden className="size-4" />
                        </button>
                        <button
                          type="button"
                          className={cn(iconButton, 'hover:bg-red-500/10 hover:text-red-400')}
                          aria-label={`Excluir ${goal.name}`}
                          onClick={() => setDialog({ kind: 'delete', goal })}
                        >
                          <Trash2 aria-hidden className="size-4" />
                        </button>
                      </div>
                    </HoverCard>
                  </motion.li>
                );
              })}
            </AnimatePresence>
          </ul>
        </>
      )}

      <Modal
        open={dialog.kind === 'create' || dialog.kind === 'edit'}
        onClose={close}
        title={dialog.kind === 'edit' ? 'Editar meta' : 'Nova meta'}
      >
        <GoalForm
          key={dialog.kind === 'edit' ? dialog.goal.id : 'new'}
          goal={dialog.kind === 'edit' ? dialog.goal : undefined}
          onCancel={close}
          onSubmit={async (input) => {
            if (dialog.kind === 'edit') {
              await updateGoal.mutateAsync({ id: dialog.goal.id, changes: input });
              toast('Meta atualizada');
            } else {
              await createGoal.mutateAsync(input);
              toast('Meta criada');
            }
            close();
          }}
        />
      </Modal>

      <Modal
        open={dialog.kind === 'movement'}
        onClose={close}
        title={
          dialog.kind === 'movement'
            ? `${dialog.movement === 'deposit' ? 'Guardar em' : 'Retirar de'} ${dialog.goal.name}`
            : ''
        }
      >
        {dialog.kind === 'movement' && (
          <GoalMovementForm
            goal={dialog.goal}
            kind={dialog.movement}
            onCancel={close}
            onSubmit={async (amount) => {
              const updated = await movement.mutateAsync({
                id: dialog.goal.id,
                amount,
                kind: dialog.movement,
              });
              toast(
                updated.progress.completed && !dialog.goal.progress.completed
                  ? `Parabéns! Você atingiu a meta ${updated.name}`
                  : dialog.movement === 'deposit'
                    ? `${formatCurrency(amount)} guardados`
                    : `${formatCurrency(amount)} retirados`,
              );
              close();
            }}
          />
        )}
      </Modal>

      <ConfirmDialog
        open={dialog.kind === 'delete'}
        title="Excluir meta?"
        description="O valor guardado registrado na meta será perdido."
        confirmLabel="Excluir"
        loading={deleteGoal.isPending}
        onClose={close}
        onConfirm={async () => {
          if (dialog.kind !== 'delete') return;
          try {
            await deleteGoal.mutateAsync(dialog.goal.id);
            toast('Meta excluída');
          } catch {
            toast('Não foi possível excluir a meta', 'error');
          }
          close();
        }}
      >
        {dialog.kind === 'delete' && <p className="text-sm text-zinc-300">{dialog.goal.name}</p>}
      </ConfirmDialog>
    </div>
  );
}
