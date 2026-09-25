import { z } from 'zod';

import { TransactionType } from '../generated/prisma/enums';
import { dateOnlySchema, monthSchema } from './common.schema';

export const summaryQuerySchema = z.object({
  month: monthSchema.optional(),
});

export const evolutionQuerySchema = z.object({
  // Last month of the series (inclusive); defaults to the current month
  endMonth: monthSchema.optional(),
  months: z.coerce
    .number()
    .int()
    .min(1, 'Informe ao menos 1 mês')
    .max(36, 'Máximo de 36 meses')
    .default(12),
});

// Either a month or a custom period; defaults to the current month
export const categoryBreakdownQuerySchema = z
  .object({
    type: z.enum(TransactionType, 'Tipo deve ser INCOME ou EXPENSE').default('EXPENSE'),
    month: monthSchema.optional(),
    startDate: dateOnlySchema.optional(),
    endDate: dateOnlySchema.optional(),
  })
  .refine((data) => !data.month || (!data.startDate && !data.endDate), {
    message: 'Use mês ou período, não os dois',
    path: ['month'],
  })
  .refine((data) => !data.startDate === !data.endDate, {
    message: 'Informe data inicial e final',
    path: ['endDate'],
  })
  .refine((data) => !data.startDate || !data.endDate || data.startDate <= data.endDate, {
    message: 'A data inicial deve ser anterior à data final',
    path: ['endDate'],
  });

export type EvolutionQuery = z.infer<typeof evolutionQuerySchema>;
export type CategoryBreakdownQuery = z.infer<typeof categoryBreakdownQuerySchema>;
