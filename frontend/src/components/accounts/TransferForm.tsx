import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowDown } from 'lucide-react';
import { useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { z } from 'zod';

import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { MoneyInput } from '@/components/ui/MoneyInput';
import { Select } from '@/components/ui/Select';
import { TextField } from '@/components/ui/TextField';
import type { TransferInput } from '@/services/accounts.service';
import type { Account } from '@/types/api';
import { isValidDate } from '@/utils/date';
import { applyApiErrors } from '@/utils/form-errors';
import { formatCurrency } from '@/utils/money';
import { todayLocal } from '@/utils/transaction-form';

const schema = z
  .object({
    fromAccountId: z.string().min(1, 'Escolha a conta de origem'),
    toAccountId: z.string().min(1, 'Escolha a conta de destino'),
    amount: z.number().int().positive('Informe um valor maior que zero').max(999_999_999),
    date: z.string().refine(isValidDate, 'Informe uma data válida'),
    description: z.string().trim().min(1, 'Informe uma descrição').max(255),
  })
  .refine((v) => v.fromAccountId !== v.toAccountId, {
    message: 'A conta de destino deve ser diferente da origem',
    path: ['toAccountId'],
  });

type Values = z.infer<typeof schema>;

interface TransferFormProps {
  accounts: Account[];
  onSubmit: (input: TransferInput) => Promise<void>;
  onCancel: () => void;
}

// Moves money between two own accounts: not an income nor an expense, so it
// changes balances but never the dashboard totals
export function TransferForm({ accounts, onSubmit, onCancel }: TransferFormProps) {
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      fromAccountId: accounts[0]?.id ?? '',
      toAccountId: accounts[1]?.id ?? '',
      amount: 0,
      date: todayLocal(),
      description: 'Transferência',
    },
  });
  const fromAccountId = useWatch({ control, name: 'fromAccountId' });
  const from = accounts.find((a) => a.id === fromAccountId);

  const submit = handleSubmit(async (values) => {
    setFormError(null);
    try {
      await onSubmit({ ...values, description: values.description.trim() });
    } catch (error) {
      setFormError(
        applyApiErrors(error, setError, [
          'fromAccountId',
          'toAccountId',
          'amount',
          'date',
          'description',
        ]),
      );
    }
  });

  const accountOptions = accounts.map((a) => (
    <option key={a.id} value={a.id}>
      {a.name}
    </option>
  ));

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-4">
      {formError && <Alert>{formError}</Alert>}
      <div className="flex flex-col gap-2">
        <Select label="De" error={errors.fromAccountId?.message} {...register('fromAccountId')}>
          {accountOptions}
        </Select>
        {from && (
          <p className="text-xs text-zinc-500">Saldo atual: {formatCurrency(from.balance)}</p>
        )}
        <ArrowDown aria-hidden className="mx-auto size-4 text-zinc-500" />
        <Select label="Para" error={errors.toAccountId?.message} {...register('toAccountId')}>
          {accountOptions}
        </Select>
      </div>
      <Controller
        control={control}
        name="amount"
        render={({ field }) => (
          <MoneyInput
            ref={field.ref}
            label="Valor"
            value={field.value}
            onValueChange={field.onChange}
            error={errors.amount?.message}
          />
        )}
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <TextField
          label="Data"
          type="date"
          className="[color-scheme:dark]"
          error={errors.date?.message}
          {...register('date')}
        />
        <TextField
          label="Descrição"
          error={errors.description?.message}
          {...register('description')}
        />
      </div>
      <div className="mt-2 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button variant="secondary" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" loading={isSubmitting}>
          Transferir
        </Button>
      </div>
    </form>
  );
}
