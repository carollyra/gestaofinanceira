import { ArrowDownRight, ArrowUpRight } from 'lucide-react';

import type { TransactionType } from '@/types/api';
import { chartTheme } from '@/utils/chart-theme';
import { formatCurrency } from '@/utils/money';

// The amount in large type with sign and the semantic color (income blue,
// expense orange); the type is also written out, so color is not the only cue
export function TypeAmount({ type, amount }: { type: TransactionType; amount: number }) {
  const isIncome = type === 'INCOME';
  const color = isIncome ? chartTheme.income : chartTheme.expense;
  const Icon = isIncome ? ArrowUpRight : ArrowDownRight;

  return (
    <div className="flex flex-col gap-1">
      <span className="flex items-center gap-1 text-sm font-medium" style={{ color }}>
        <Icon aria-hidden className="size-4" />
        {isIncome ? 'Receita' : 'Despesa'}
      </span>
      <p className="text-4xl font-semibold tracking-tight" style={{ color }}>
        {isIncome ? '+' : '−'}
        {formatCurrency(amount)}
      </p>
    </div>
  );
}
