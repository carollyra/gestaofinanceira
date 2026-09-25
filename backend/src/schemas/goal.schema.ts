import { z } from 'zod';

import { MAX_AMOUNT_CENTS } from '../utils/money';
import { dateOnlySchema, hexColorSchema, iconSchema, positiveCentsSchema } from './common.schema';

const nonNegativeCentsSchema = z
  .number('Informe um valor em centavos')
  .int('Valor deve estar em centavos (inteiro)')
  .nonnegative('Valor não pode ser negativo')
  .max(MAX_AMOUNT_CENTS, 'Valor acima do limite permitido');

const goalFields = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Informe o nome da meta')
    .max(100, 'Nome deve ter no máximo 100 caracteres'),
  targetAmount: positiveCentsSchema,
  currentAmount: nonNegativeCentsSchema,
  deadline: dateOnlySchema.nullable(),
  color: hexColorSchema,
  icon: iconSchema,
});

export const createGoalSchema = goalFields.extend({
  currentAmount: nonNegativeCentsSchema.default(0),
  deadline: goalFields.shape.deadline.optional(),
  color: hexColorSchema.optional(),
  icon: iconSchema.optional(),
});

export const updateGoalSchema = goalFields
  .partial()
  .refine((data) => Object.keys(data).length > 0, 'Informe ao menos um campo para atualizar');

export const goalMovementSchema = z.object({
  amount: positiveCentsSchema,
});

export type CreateGoalInput = z.infer<typeof createGoalSchema>;
export type UpdateGoalInput = z.infer<typeof updateGoalSchema>;
