import { useState } from 'react';

import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { MoneyInput } from '@/components/ui/MoneyInput';
import { Select } from '@/components/ui/Select';
import { ApiError } from '@/services/api';
import type { Budget, Category } from '@/types/api';

interface BudgetFormProps {
  budget?: Budget;
  // Expense categories still without a budget this month
  categories: Category[];
  onSubmit: (values: { categoryId: string; amount: number }) => Promise<void>;
  onCancel: () => void;
}

export function BudgetForm({ budget, categories, onSubmit, onCancel }: BudgetFormProps) {
  const [categoryId, setCategoryId] = useState(budget?.category.id ?? categories[0]?.id ?? '');
  const [amount, setAmount] = useState(budget?.amount ?? 0);
  const [errors, setErrors] = useState<{ categoryId?: string; amount?: string; form?: string }>({});
  const [submitting, setSubmitting] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const nextErrors = {
      categoryId: categoryId ? undefined : 'Escolha uma categoria',
      amount: amount > 0 ? undefined : 'Informe um limite maior que zero',
    };
    setErrors(nextErrors);
    if (nextErrors.categoryId || nextErrors.amount) return;

    setSubmitting(true);
    try {
      await onSubmit({ categoryId, amount });
    } catch (error) {
      setErrors({
        form: error instanceof ApiError ? error.message : 'Erro inesperado. Tente novamente.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={(event) => void submit(event)} noValidate className="flex flex-col gap-4">
      {errors.form && <Alert>{errors.form}</Alert>}
      {budget ? (
        <p className="text-sm text-zinc-300">
          Categoria: <span className="font-medium text-zinc-100">{budget.category.name}</span>
        </p>
      ) : categories.length === 0 ? (
        <Alert>Todas as categorias de despesa já têm orçamento neste mês.</Alert>
      ) : (
        <Select
          label="Categoria"
          value={categoryId}
          error={errors.categoryId}
          onChange={(event) => setCategoryId(event.target.value)}
        >
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>
      )}
      <MoneyInput
        label="Limite do mês"
        value={amount}
        onValueChange={setAmount}
        error={errors.amount}
      />
      <div className="mt-2 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button variant="secondary" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" loading={submitting} disabled={!budget && categories.length === 0}>
          {budget ? 'Salvar limite' : 'Criar orçamento'}
        </Button>
      </div>
    </form>
  );
}
