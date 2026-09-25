import { z } from 'zod';

import { TransactionType } from '../generated/prisma/enums';
import {
  dateOnlySchema,
  optionalTextSchema,
  paginationQuerySchema,
  positiveCentsSchema,
} from './common.schema';

const transactionFields = z.object({
  accountId: z.uuid('Conta inválida'),
  categoryId: z.uuid('Categoria inválida').nullable(),
  type: z.enum(TransactionType, 'Tipo deve ser INCOME ou EXPENSE'),
  amount: positiveCentsSchema,
  date: dateOnlySchema,
  description: z
    .string()
    .trim()
    .min(1, 'Informe uma descrição')
    .max(255, 'Descrição deve ter no máximo 255 caracteres'),
  notes: optionalTextSchema,
});

export const createTransactionSchema = transactionFields.extend({
  categoryId: transactionFields.shape.categoryId.optional(),
  notes: optionalTextSchema.optional(),
});

export const updateTransactionSchema = transactionFields
  .partial()
  .refine((data) => Object.keys(data).length > 0, 'Informe ao menos um campo para atualizar');

export const TRANSACTION_SORT_FIELDS = ['date', 'amount', 'description', 'createdAt'] as const;

export const listTransactionsQuerySchema = paginationQuerySchema
  .extend({
    startDate: dateOnlySchema.optional(),
    endDate: dateOnlySchema.optional(),
    type: z.enum(TransactionType, 'Tipo deve ser INCOME ou EXPENSE').optional(),
    accountId: z.uuid('Conta inválida').optional(),
    // A category id, or "none" for uncategorized transactions
    categoryId: z.union([z.uuid(), z.literal('none')], 'Categoria inválida').optional(),
    search: z
      .string()
      .trim()
      .max(100, 'Busca deve ter no máximo 100 caracteres')
      .optional()
      .transform((value) => value || undefined),
    minAmount: z.coerce.number().int().nonnegative().optional(),
    maxAmount: z.coerce.number().int().nonnegative().optional(),
    sortBy: z.enum(TRANSACTION_SORT_FIELDS, 'Campo de ordenação inválido').default('date'),
    sortOrder: z.enum(['asc', 'desc'], 'Ordem deve ser asc ou desc').default('desc'),
  })
  .refine((data) => !data.startDate || !data.endDate || data.startDate <= data.endDate, {
    message: 'A data inicial deve ser anterior à data final',
    path: ['endDate'],
  })
  .refine(
    (data) =>
      data.minAmount === undefined ||
      data.maxAmount === undefined ||
      data.minAmount <= data.maxAmount,
    { message: 'O valor mínimo deve ser menor que o máximo', path: ['maxAmount'] },
  );

export type CreateTransactionInput = z.infer<typeof createTransactionSchema>;
export type UpdateTransactionInput = z.infer<typeof updateTransactionSchema>;
export type ListTransactionsQuery = z.infer<typeof listTransactionsQuerySchema>;
