import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';

import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { ColorPicker } from '@/components/ui/ColorPicker';
import { MoneyInput } from '@/components/ui/MoneyInput';
import { Select } from '@/components/ui/Select';
import { TextField } from '@/components/ui/TextField';
import type { AccountInput } from '@/services/accounts.service';
import type { Account, AccountType } from '@/types/api';
import { ACCOUNT_TYPES } from '@/utils/account-types';
import { applyApiErrors } from '@/utils/form-errors';

const schema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Informe o nome da conta')
    .max(60, 'Nome deve ter no máximo 60 caracteres'),
  type: z.enum(Object.keys(ACCOUNT_TYPES) as [AccountType, ...AccountType[]]),
  // The money field is always positive; the sign comes from the checkbox
  initialAmount: z.number().int().min(0).max(999_999_999, 'Valor acima do limite permitido'),
  negative: z.boolean(),
  color: z.string(),
});

type Values = z.infer<typeof schema>;

interface AccountFormProps {
  account?: Account;
  onSubmit: (input: AccountInput) => Promise<void>;
  onCancel: () => void;
}

export function AccountForm({ account, onSubmit, onCancel }: AccountFormProps) {
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
      name: account?.name ?? '',
      type: account?.type ?? 'CHECKING',
      initialAmount: Math.abs(account?.initialBalance ?? 0),
      negative: (account?.initialBalance ?? 0) < 0,
      color: account?.color ?? '#3b82f6',
    },
  });

  const submit = handleSubmit(async ({ name, type, initialAmount, negative, color }) => {
    setFormError(null);
    try {
      await onSubmit({
        name: name.trim(),
        type,
        color,
        initialBalance: negative ? -initialAmount : initialAmount,
      });
    } catch (error) {
      setFormError(applyApiErrors(error, setError, ['name', 'type']));
    }
  });

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-4">
      {formError && <Alert>{formError}</Alert>}
      <TextField
        label="Nome"
        autoComplete="off"
        error={errors.name?.message}
        {...register('name')}
      />
      <Select label="Tipo" {...register('type')}>
        {Object.entries(ACCOUNT_TYPES).map(([value, { label }]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </Select>
      <div className="flex flex-col gap-2">
        <Controller
          control={control}
          name="initialAmount"
          render={({ field }) => (
            <MoneyInput
              ref={field.ref}
              label="Saldo inicial"
              value={field.value}
              onValueChange={field.onChange}
              error={errors.initialAmount?.message}
            />
          )}
        />
        <label className="flex items-center gap-2 text-sm text-zinc-300">
          <input type="checkbox" className="size-4 accent-emerald-500" {...register('negative')} />
          Saldo inicial negativo (ex.: fatura de cartão em aberto)
        </label>
      </div>
      <Controller
        control={control}
        name="color"
        render={({ field }) => <ColorPicker value={field.value} onChange={field.onChange} />}
      />
      <div className="mt-2 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button variant="secondary" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" loading={isSubmitting}>
          {account ? 'Salvar alterações' : 'Criar conta'}
        </Button>
      </div>
    </form>
  );
}
