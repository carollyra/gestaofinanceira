import { z } from 'zod';

import { TransactionType } from '../generated/prisma/enums';
import { hexColorSchema, iconSchema } from './common.schema';

export const createCategorySchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Informe o nome da categoria')
    .max(60, 'Nome deve ter no máximo 60 caracteres'),
  type: z.enum(TransactionType, 'Tipo deve ser INCOME ou EXPENSE'),
  color: hexColorSchema,
  icon: iconSchema,
});

// `type` is immutable: changing it would break existing transactions and budgets
export const updateCategorySchema = createCategorySchema
  .omit({ type: true })
  .partial()
  .refine((data) => Object.keys(data).length > 0, 'Informe ao menos um campo para atualizar');

export const listCategoriesQuerySchema = z.object({
  type: z.enum(TransactionType, 'Tipo deve ser INCOME ou EXPENSE').optional(),
});

export const deleteCategoryQuerySchema = z.object({
  // Moves transactions and recurring transactions to this category before deleting.
  // Without it, they become uncategorized.
  replaceWith: z.uuid('Categoria substituta inválida').optional(),
});

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
