import { z } from 'zod';

import { RecurrenceFrequency, TransactionType } from '../generated/prisma/enums';
import {
  dateOnlySchema,
  optionalTextSchema,
  paginationQuerySchema,
  positiveCentsSchema,
} from './common.schema';

const recurringFields = z.object({
  accountId: z.uuid('Conta inválida'),
  categoryId: z.uuid('Categoria inválida').nullable(),
  type: z.enum(TransactionType, 'Tipo deve ser INCOME ou EXPENSE'),
  amount: positiveCentsSchema,
  description: z
    .string()
    .trim()
    .min(1, 'Informe uma descrição')
    .max(255, 'Descrição deve ter no máximo 255 caracteres'),
  notes: optionalTextSchema,
  frequency: z.enum(RecurrenceFrequency, 'Frequência deve ser WEEKLY, MONTHLY ou YEARLY'),
  // Range depends on the frequency; checked in the service against the final state
  day: z.number('Informe o dia').int('Dia inválido').min(0, 'Dia inválido').max(31, 'Dia inválido'),
  startDate: dateOnlySchema,
  endDate: dateOnlySchema.nullable(),
  active: z.boolean(),
});

export const createRecurringSchema = recurringFields.omit({ active: true }).extend({
  categoryId: recurringFields.shape.categoryId.optional(),
  notes: optionalTextSchema.optional(),
  // Defaults to the start date's weekday (WEEKLY) or day of month
  day: recurringFields.shape.day.optional(),
  endDate: recurringFields.shape.endDate.optional(),
});

export const updateRecurringSchema = recurringFields
  .partial()
  .refine((data) => Object.keys(data).length > 0, 'Informe ao menos um campo para atualizar');

export const listRecurringQuerySchema = paginationQuerySchema.extend({
  active: z.stringbool().optional(),
  type: z.enum(TransactionType, 'Tipo deve ser INCOME ou EXPENSE').optional(),
});

export type CreateRecurringInput = z.infer<typeof createRecurringSchema>;
export type UpdateRecurringInput = z.infer<typeof updateRecurringSchema>;
export type ListRecurringQuery = z.infer<typeof listRecurringQuerySchema>;
