import type { BudgetStatus, GoalStatus } from '@/types/api';

import type { StatusTone } from './chart-theme';

export const BUDGET_STATUS: Record<BudgetStatus, { tone: StatusTone; label: string }> = {
  OK: { tone: 'good', label: 'Dentro do limite' },
  WARNING: { tone: 'warning', label: 'Atenção' },
  EXCEEDED: { tone: 'critical', label: 'Estourado' },
};

export const GOAL_STATUS: Record<GoalStatus, { tone: StatusTone; label: string; icon?: 'clock' }> =
  {
    COMPLETED: { tone: 'good', label: 'Concluída' },
    ON_TRACK: { tone: 'good', label: 'No ritmo' },
    BEHIND: { tone: 'warning', label: 'Atrasada' },
    OVERDUE: { tone: 'critical', label: 'Prazo vencido' },
    NO_DEADLINE: { tone: 'neutral', label: 'Sem prazo', icon: 'clock' },
  };
