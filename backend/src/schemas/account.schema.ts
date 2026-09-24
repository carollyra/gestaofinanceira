import { z } from 'zod';

import { AccountType } from '../generated/prisma/enums';
import { hexColorSchema, signedCentsSchema } from './common.schema';

const accountFields = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Informe o nome da conta')
    .max(60, 'Nome deve ter no máximo 60 caracteres'),
  type: z.enum(AccountType, 'Tipo de conta inválido'),
  // May be negative (e.g. a credit card that starts with an open bill)
  initialBalance: signedCentsSchema,
  color: hexColorSchema,
});

export const createAccountSchema = accountFields.extend({
  initialBalance: signedCentsSchema.default(0),
  color: hexColorSchema.optional(),
});

// Built from the fields without defaults: a PATCH must not reset omitted fields
export const updateAccountSchema = accountFields
  .partial()
  .extend({ archived: z.boolean().optional() })
  .refine((data) => Object.keys(data).length > 0, 'Informe ao menos um campo para atualizar');

export const listAccountsQuerySchema = z.object({
  includeArchived: z.stringbool().default(false),
});

export type CreateAccountInput = z.infer<typeof createAccountSchema>;
export type UpdateAccountInput = z.infer<typeof updateAccountSchema>;
