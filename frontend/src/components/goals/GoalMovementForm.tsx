import { useState } from 'react';

import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { MoneyInput } from '@/components/ui/MoneyInput';
import { ApiError } from '@/services/api';
import type { Goal } from '@/types/api';
import { formatCurrency } from '@/utils/money';

interface GoalMovementFormProps {
  goal: Goal;
  kind: 'deposit' | 'withdraw';
  onSubmit: (amount: number) => Promise<void>;
  onCancel: () => void;
}

export function GoalMovementForm({ goal, kind, onSubmit, onCancel }: GoalMovementFormProps) {
  const [amount, setAmount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const isWithdraw = kind === 'withdraw';

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (amount <= 0) return setError('Informe um valor maior que zero');
    if (isWithdraw && amount > goal.currentAmount)
      return setError('Valor maior que o guardado na meta');

    setSubmitting(true);
    setError(null);
    try {
      await onSubmit(amount);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erro inesperado. Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={(event) => void submit(event)} noValidate className="flex flex-col gap-4">
      <p className="text-sm text-zinc-400">
        Guardado até agora:{' '}
        <span className="font-medium text-zinc-100">{formatCurrency(goal.currentAmount)}</span> de{' '}
        {formatCurrency(goal.targetAmount)}
      </p>
      {error && <Alert>{error}</Alert>}
      <MoneyInput
        label={isWithdraw ? 'Valor a retirar' : 'Valor a guardar'}
        value={amount}
        onValueChange={setAmount}
      />
      {!isWithdraw && goal.progress.remaining > 0 && (
        <button
          type="button"
          onClick={() => setAmount(goal.progress.remaining)}
          className="w-fit text-sm text-emerald-400 hover:text-emerald-300 focus-visible:outline-2 focus-visible:outline-emerald-400"
        >
          Usar o que falta: {formatCurrency(goal.progress.remaining)}
        </button>
      )}
      <div className="mt-2 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button variant="secondary" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" loading={submitting}>
          {isWithdraw ? 'Retirar' : 'Guardar'}
        </Button>
      </div>
    </form>
  );
}
