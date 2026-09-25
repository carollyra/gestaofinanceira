import { ArrowDownRight, ArrowUpRight } from 'lucide-react';

import type { TransactionType } from '@/types/api';
import { chartTheme } from '@/utils/chart-theme';
import { formatCurrency } from '@/utils/money';

// Sign and label carry the type; the colored arrow (income blue, expense
// orange, same semantics as the charts) only reinforces it
export function TransactionAmount({ type, amount }: { type: TransactionType; amount: number }) {
  const isIncome = type === 'INCOME';
  const Icon = isIncome ? ArrowUpRight : ArrowDownRight;

  return (
    <span className="inline-flex items-center justify-end gap-1 font-medium whitespace-nowrap text-zinc-100 tabular-nums">
      <Icon
        aria-hidden
        className="size-4"
        style={{ color: isIncome ? chartTheme.income : chartTheme.expense }}
      />
      <span className="sr-only">{isIncome ? 'Receita de' : 'Despesa de'}</span>
      {isIncome ? '+' : '−'}
      {formatCurrency(amount)}
    </span>
  );
}
