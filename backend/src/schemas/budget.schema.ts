import { z } from 'zod';

import { monthSchema, positiveCentsSchema } from './common.schema';

export const createBudgetSchema = z.object({
  categoryId: z.uuid('Categoria inválida'),
  // Spending limit for the month, in cents
  amount: positiveCentsSchema,
  month: monthSchema,
});

// Category and month identify the budget; to change them, delete and create another
export const updateBudgetSchema = z.object({
  amount: positiveCentsSchema,
});

export const listBudgetsQuerySchema = z.object({
  month: monthSchema.optional(),
});

export const copyBudgetsSchema = z
  .object({
    fromMonth: monthSchema,
    toMonth: monthSchema,
  })
  .refine((data) => data.fromMonth.getTime() !== data.toMonth.getTime(), {
    message: 'O mês de destino deve ser diferente do mês de origem',
    path: ['toMonth'],
  });

export type CreateBudgetInput = z.infer<typeof createBudgetSchema>;
export type UpdateBudgetInput = z.infer<typeof updateBudgetSchema>;
export type CopyBudgetsInput = z.infer<typeof copyBudgetsSchema>;
