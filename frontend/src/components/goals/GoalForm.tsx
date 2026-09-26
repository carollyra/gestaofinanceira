import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { z } from 'zod';

import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { ColorPicker } from '@/components/ui/ColorPicker';
import { IconPicker } from '@/components/ui/IconPicker';
import { MoneyInput } from '@/components/ui/MoneyInput';
import { TextField } from '@/components/ui/TextField';
import type { GoalInput } from '@/services/goals.service';
import type { Goal } from '@/types/api';
import { isValidDate } from '@/utils/date';
import { applyApiErrors } from '@/utils/form-errors';
import { todayLocal } from '@/utils/transaction-form';

const schema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Informe o nome da meta')
    .max(100, 'Nome deve ter no máximo 100 caracteres'),
  targetAmount: z
    .number()
    .int()
    .positive('Informe o valor da meta')
    .max(999_999_999, 'Valor acima do limite'),
  currentAmount: z.number().int().min(0).max(999_999_999, 'Valor acima do limite'),
  // '' = no deadline
  deadline: z
    .string()
    .refine((value) => value === '' || isValidDate(value), 'Informe uma data válida'),
  color: z.string(),
  icon: z.string(),
});

type Values = z.infer<typeof schema>;

interface GoalFormProps {
  goal?: Goal;
  onSubmit: (input: GoalInput) => Promise<void>;
  onCancel: () => void;
}

export function GoalForm({ goal, onSubmit, onCancel }: GoalFormProps) {
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
      name: goal?.name ?? '',
      targetAmount: goal?.targetAmount ?? 0,
      currentAmount: goal?.currentAmount ?? 0,
      deadline: goal?.deadline ?? '',
      color: goal?.color ?? '#10b981',
      icon: goal?.icon ?? 'target',
    },
  });
  const color = useWatch({ control, name: 'color' });

  const submit = handleSubmit(async (values) => {
    setFormError(null);
    try {
      await onSubmit({ ...values, name: values.name.trim(), deadline: values.deadline || null });
    } catch (error) {
      setFormError(
        applyApiErrors(error, setError, ['name', 'targetAmount', 'currentAmount', 'deadline']),
      );
    }
  });

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-4">
      {formError && <Alert>{formError}</Alert>}
      <TextField
        label="Nome"
        placeholder="Ex.: Viagem de férias"
        autoComplete="off"
        error={errors.name?.message}
        {...register('name')}
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Controller
          control={control}
          name="targetAmount"
          render={({ field }) => (
            <MoneyInput
              ref={field.ref}
              label="Valor da meta"
              value={field.value}
              onValueChange={field.onChange}
              error={errors.targetAmount?.message}
            />
          )}
        />
        <Controller
          control={control}
          name="currentAmount"
          render={({ field }) => (
            <MoneyInput
              label="Já guardado"
              value={field.value}
              onValueChange={field.onChange}
              error={errors.currentAmount?.message}
            />
          )}
        />
      </div>
      <TextField
        label="Prazo (opcional)"
        type="date"
        min={todayLocal()}
        className="[color-scheme:dark]"
        error={errors.deadline?.message}
        {...register('deadline')}
      />
      <Controller
        control={control}
        name="color"
        render={({ field }) => <ColorPicker value={field.value} onChange={field.onChange} />}
      />
      <Controller
        control={control}
        name="icon"
        render={({ field }) => (
          <IconPicker value={field.value} onChange={field.onChange} color={color} />
        )}
      />
      <div className="mt-2 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button variant="secondary" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" loading={isSubmitting}>
          {goal ? 'Salvar alterações' : 'Criar meta'}
        </Button>
      </div>
    </form>
  );
}
