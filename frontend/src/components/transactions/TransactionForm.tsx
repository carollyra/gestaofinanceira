import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowDownRight, ArrowUpRight, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';

import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { MoneyInput } from '@/components/ui/MoneyInput';
import { Select } from '@/components/ui/Select';
import { TextField } from '@/components/ui/TextField';
import type { Account, Category } from '@/types/api';
import { chartTheme } from '@/utils/chart-theme';
import { cn } from '@/utils/cn';
import { applyApiErrors } from '@/utils/form-errors';
import { type TransactionFormValues, transactionFormSchema } from '@/utils/transaction-form';

const FIELDS = [
  'type',
  'amount',
  'date',
  'description',
  'accountId',
  'categoryId',
  'notes',
] as const;

interface TransactionFormProps {
  initialValues: TransactionFormValues;
  accounts: Account[];
  categories: Category[];
  submitLabel: string;
  onSubmit: (values: TransactionFormValues) => Promise<void>;
  onCancel: () => void;
  onDelete?: () => void;
}

export function TransactionForm({
  initialValues,
  accounts,
  categories,
  submitLabel,
  onSubmit,
  onCancel,
  onDelete,
}: TransactionFormProps) {
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    control,
    handleSubmit,
    setValue,
    setError,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionFormSchema),
    defaultValues: initialValues,
  });

  const type = useWatch({ control, name: 'type' });
  const typeCategories = categories.filter((c) => c.type === type);

  const changeType = (next: TransactionFormValues['type']) => {
    setValue('type', next, { shouldDirty: true });
    // A category of the other type is not allowed (the API would refuse it)
    const category = categories.find((c) => c.id === getValues('categoryId'));
    if (category && category.type !== next) setValue('categoryId', '', { shouldDirty: true });
  };

  const submit = handleSubmit(async (values) => {
    setFormError(null);
    try {
      await onSubmit(values);
    } catch (error) {
      setFormError(applyApiErrors(error, setError, FIELDS));
    }
  });

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-4">
      {formError && <Alert>{formError}</Alert>}

      <fieldset>
        <legend className="sr-only">Tipo</legend>
        <div className="grid grid-cols-2 gap-1 rounded-xl border border-zinc-800 bg-zinc-950 p-1">
          {(
            [
              ['EXPENSE', 'Despesa', ArrowDownRight, chartTheme.expense],
              ['INCOME', 'Receita', ArrowUpRight, chartTheme.income],
            ] as const
          ).map(([value, label, Icon, color]) => (
            <label
              key={value}
              className={cn(
                'flex cursor-pointer items-center justify-center gap-2 rounded-lg py-2 text-sm font-medium transition-colors',
                'has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-emerald-400',
                type === value ? 'bg-zinc-800 text-zinc-50' : 'text-zinc-400 hover:text-zinc-100',
              )}
            >
              <input
                type="radio"
                name="transaction-type"
                value={value}
                checked={type === value}
                onChange={() => changeType(value)}
                className="sr-only"
              />
              <Icon aria-hidden className="size-4" style={{ color }} />
              {label}
            </label>
          ))}
        </div>
      </fieldset>

      <Controller
        control={control}
        name="amount"
        render={({ field }) => (
          <MoneyInput
            ref={field.ref}
            label="Valor"
            value={field.value}
            onValueChange={field.onChange}
            onBlur={field.onBlur}
            error={errors.amount?.message}
          />
        )}
      />

      <TextField
        label="Descrição"
        autoComplete="off"
        error={errors.description?.message}
        {...register('description')}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <TextField
          label="Data"
          type="date"
          className="[color-scheme:dark]"
          error={errors.date?.message}
          {...register('date')}
        />
        <Select label="Conta" error={errors.accountId?.message} {...register('accountId')}>
          <option value="" disabled>
            Escolha uma conta
          </option>
          {accounts.map((account) => (
            <option key={account.id} value={account.id} disabled={account.archived}>
              {account.name}
              {account.archived ? ' (arquivada)' : ''}
            </option>
          ))}
        </Select>
      </div>

      <Select label="Categoria" error={errors.categoryId?.message} {...register('categoryId')}>
        <option value="">Sem categoria</option>
        {typeCategories.map((category) => (
          <option key={category.id} value={category.id}>
            {category.name}
          </option>
        ))}
      </Select>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="transaction-notes" className="text-sm font-medium text-zinc-200">
          Observações <span className="font-normal text-zinc-500">(opcional)</span>
        </label>
        <textarea
          id="transaction-notes"
          rows={2}
          aria-invalid={errors.notes ? true : undefined}
          className="w-full resize-none rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-base text-zinc-100 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/30 sm:text-sm"
          {...register('notes')}
        />
        {errors.notes && <p className="text-sm text-red-400">{errors.notes.message}</p>}
      </div>

      <div className="mt-2 flex flex-col-reverse gap-2 sm:flex-row sm:items-center">
        {onDelete && (
          <Button
            variant="ghost"
            onClick={onDelete}
            className="text-red-400 hover:text-red-300 sm:mr-auto"
          >
            <Trash2 aria-hidden className="size-4" />
            Excluir
          </Button>
        )}
        <Button variant="secondary" onClick={onCancel} className={cn(!onDelete && 'sm:ml-auto')}>
          Cancelar
        </Button>
        <Button type="submit" loading={isSubmitting}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
