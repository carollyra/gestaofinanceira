import { z } from 'zod';

import type { TransactionInput } from '@/services/transactions.service';
import type { Transaction } from '@/types/api';

import { isValidDate } from './date';

// Mirrors backend limits (backend/src/utils/money.ts and transaction schema)
export const MAX_AMOUNT_CENTS = 999_999_999;

export const transactionFormSchema = z.object({
  type: z.enum(['INCOME', 'EXPENSE']),
  amount: z
    .number()
    .int()
    .positive('Informe um valor maior que zero')
    .max(MAX_AMOUNT_CENTS, 'Valor acima do limite permitido'),
  date: z.string().refine(isValidDate, 'Informe uma data válida'),
  description: z
    .string()
    .trim()
    .min(1, 'Informe uma descrição')
    .max(255, 'Descrição deve ter no máximo 255 caracteres'),
  accountId: z.string().min(1, 'Escolha uma conta'),
  // '' = no category (native selects cannot hold null)
  categoryId: z.string(),
  notes: z.string().trim().max(1000, 'Observações devem ter no máximo 1000 caracteres'),
});

export type TransactionFormValues = z.infer<typeof transactionFormSchema>;

export function todayLocal(now = new Date()): string {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

export function emptyFormValues(accountId = ''): TransactionFormValues {
  return {
    type: 'EXPENSE',
    amount: 0,
    date: todayLocal(),
    description: '',
    accountId,
    categoryId: '',
    notes: '',
  };
}

export function formValuesFromTransaction(transaction: Transaction): TransactionFormValues {
  return {
    type: transaction.type,
    amount: transaction.amount,
    date: transaction.date,
    description: transaction.description,
    accountId: transaction.account.id,
    categoryId: transaction.category?.id ?? '',
    notes: transaction.notes ?? '',
  };
}

export function toTransactionInput(values: TransactionFormValues): TransactionInput {
  return {
    type: values.type,
    amount: values.amount,
    date: values.date,
    description: values.description.trim(),
    accountId: values.accountId,
    categoryId: values.categoryId || null,
    notes: values.notes.trim() || null,
  };
}

// PATCH sends only what changed. Besides being lighter, this lets the user
// edit an old transaction of an account archived since then: the account is
// not re-validated unless it is the field being changed.
export function changedFields(
  original: Transaction,
  values: TransactionFormValues,
): Partial<TransactionInput> {
  const before = toTransactionInput(formValuesFromTransaction(original));
  const after = toTransactionInput(values);

  return Object.fromEntries(
    (Object.keys(after) as (keyof TransactionInput)[])
      .filter((key) => after[key] !== before[key])
      .map((key) => [key, after[key]]),
  ) as Partial<TransactionInput>;
}
