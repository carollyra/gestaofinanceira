import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { z } from 'zod';

import { CategoryIcon } from '@/components/CategoryIcon';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { ColorPicker } from '@/components/ui/ColorPicker';
import { IconPicker } from '@/components/ui/IconPicker';
import { TextField } from '@/components/ui/TextField';
import type { CategoryInput } from '@/services/categories.service';
import type { Category, TransactionType } from '@/types/api';
import { applyApiErrors } from '@/utils/form-errors';

const schema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Informe o nome da categoria')
    .max(60, 'Nome deve ter no máximo 60 caracteres'),
  color: z.string(),
  icon: z.string(),
});

type Values = z.infer<typeof schema>;

interface CategoryFormProps {
  category?: Category;
  type: TransactionType;
  onSubmit: (input: CategoryInput) => Promise<void>;
  onCancel: () => void;
}

export function CategoryForm({ category, type, onSubmit, onCancel }: CategoryFormProps) {
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
      name: category?.name ?? '',
      color: category?.color ?? (type === 'INCOME' ? '#10b981' : '#f97316'),
      icon: category?.icon ?? 'circle-ellipsis',
    },
  });
  const [name, color, icon] = useWatch({ control, name: ['name', 'color', 'icon'] });

  const submit = handleSubmit(async (values) => {
    setFormError(null);
    try {
      await onSubmit({ ...values, name: values.name.trim(), type });
    } catch (error) {
      setFormError(applyApiErrors(error, setError, ['name', 'color', 'icon']));
    }
  });

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-4">
      {formError && <Alert>{formError}</Alert>}
      <div
        className="flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-950 p-3"
        aria-hidden
      >
        <CategoryIcon icon={icon} color={color} className="size-10" />
        <span className="text-zinc-100">{name.trim() || 'Nova categoria'}</span>
        <span className="ml-auto text-xs text-zinc-500">
          {type === 'INCOME' ? 'Receita' : 'Despesa'}
        </span>
      </div>
      <TextField
        label="Nome"
        autoComplete="off"
        error={errors.name?.message}
        {...register('name')}
      />
      {category && (
        <p className="text-xs text-zinc-500">
          O tipo ({type === 'INCOME' ? 'receita' : 'despesa'}) não pode ser alterado: as transações
          e os orçamentos desta categoria dependem dele.
        </p>
      )}
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
          {category ? 'Salvar alterações' : 'Criar categoria'}
        </Button>
      </div>
    </form>
  );
}
