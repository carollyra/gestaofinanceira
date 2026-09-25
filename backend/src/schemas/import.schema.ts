import { z } from 'zod';

import { TransactionType } from '../generated/prisma/enums';
import { MAX_IMPORT_ROWS } from '../utils/csv/statement-parser';
import { dateOnlySchema, optionalTextSchema, positiveCentsSchema } from './common.schema';

const columnName = z.string().trim().min(1).max(100);

// Multipart fields arrive as strings
export const previewImportSchema = z.object({
  accountId: z.uuid('Conta inválida'),
  invertSign: z.stringbool().default(false),
  // Optional manual column mapping, as JSON: {"date":"Data","description":"Histórico",...}
  mapping: z
    .string()
    .optional()
    .transform((value, ctx) => {
      if (!value) return undefined;
      try {
        return JSON.parse(value) as unknown;
      } catch {
        ctx.addIssue({ code: 'custom', message: 'Mapeamento de colunas inválido' });
        return z.NEVER;
      }
    })
    .pipe(
      z
        .object({
          date: columnName,
          description: columnName,
          amount: columnName.optional(),
          credit: columnName.optional(),
          debit: columnName.optional(),
          type: columnName.optional(),
          category: columnName.optional(),
          notes: columnName.optional(),
        })
        .refine((m) => m.amount || m.credit || m.debit, 'Informe a coluna de valor')
        .optional(),
    ),
});

export const confirmImportSchema = z.object({
  accountId: z.uuid('Conta inválida'),
  // Exact duplicates are skipped by default; also protects against double submits
  skipDuplicates: z.boolean().default(true),
  rows: z
    .array(
      z.object({
        date: dateOnlySchema,
        description: z.string().trim().min(1, 'Informe uma descrição').max(255),
        amount: positiveCentsSchema,
        type: z.enum(TransactionType, 'Tipo deve ser INCOME ou EXPENSE'),
        categoryId: z.uuid('Categoria inválida').nullable().optional(),
        notes: optionalTextSchema.optional(),
      }),
    )
    .min(1, 'Selecione ao menos uma transação')
    .max(MAX_IMPORT_ROWS, `Máximo de ${MAX_IMPORT_ROWS} transações por importação`),
});

export type PreviewImportInput = z.infer<typeof previewImportSchema>;
export type ConfirmImportInput = z.infer<typeof confirmImportSchema>;
