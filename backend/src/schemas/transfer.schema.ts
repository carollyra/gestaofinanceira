import { z } from 'zod';

import {
  dateOnlySchema,
  optionalTextSchema,
  paginationQuerySchema,
  positiveCentsSchema,
} from './common.schema';

const transferFields = z.object({
  fromAccountId: z.uuid('Conta de origem inválida'),
  toAccountId: z.uuid('Conta de destino inválida'),
  amount: positiveCentsSchema,
  date: dateOnlySchema,
  description: z
    .string()
    .trim()
    .min(1, 'Informe uma descrição')
    .max(255, 'Descrição deve ter no máximo 255 caracteres'),
  notes: optionalTextSchema,
});

const differentAccounts = {
  message: 'A conta de destino deve ser diferente da conta de origem',
  path: ['toAccountId'],
};

export const createTransferSchema = transferFields
  .extend({
    description: transferFields.shape.description.default('Transferência'),
    notes: optionalTextSchema.optional(),
  })
  .refine((data) => data.fromAccountId !== data.toAccountId, differentAccounts);

// Accounts are re-validated in the service against the merged (stored + new) values
export const updateTransferSchema = transferFields
  .partial()
  .refine((data) => Object.keys(data).length > 0, 'Informe ao menos um campo para atualizar')
  .refine(
    (data) => !data.fromAccountId || !data.toAccountId || data.fromAccountId !== data.toAccountId,
    differentAccounts,
  );

export const listTransfersQuerySchema = paginationQuerySchema
  .extend({
    startDate: dateOnlySchema.optional(),
    endDate: dateOnlySchema.optional(),
    // Matches transfers where the account is either origin or destination
    accountId: z.uuid('Conta inválida').optional(),
  })
  .refine((data) => !data.startDate || !data.endDate || data.startDate <= data.endDate, {
    message: 'A data inicial deve ser anterior à data final',
    path: ['endDate'],
  });

export type CreateTransferInput = z.infer<typeof createTransferSchema>;
export type UpdateTransferInput = z.infer<typeof updateTransferSchema>;
export type ListTransfersQuery = z.infer<typeof listTransfersQuerySchema>;
