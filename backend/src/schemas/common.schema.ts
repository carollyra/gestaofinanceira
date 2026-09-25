import { z } from 'zod';

import { formatDateOnly, parseDateOnly } from '../utils/date';
import { MAX_AMOUNT_CENTS } from '../utils/money';
import { parseMonth } from '../utils/month';

export const idParamSchema = z.object({
  id: z.uuid('Identificador inválido'),
});

export const hexColorSchema = z
  .string()
  .regex(/^#[0-9a-fA-F]{6}$/, 'Cor deve estar no formato hexadecimal (#RRGGBB)')
  .transform((value) => value.toLowerCase());

export const iconSchema = z
  .string()
  .trim()
  .regex(/^[a-z0-9-]{1,40}$/, 'Ícone inválido');

// Money always travels as integer cents
export const positiveCentsSchema = z
  .number('Informe um valor em centavos')
  .int('Valor deve estar em centavos (inteiro)')
  .positive('Valor deve ser maior que zero')
  .max(MAX_AMOUNT_CENTS, 'Valor acima do limite permitido');

export const signedCentsSchema = z
  .number('Informe um valor em centavos')
  .int('Valor deve estar em centavos (inteiro)')
  .min(-MAX_AMOUNT_CENTS, 'Valor abaixo do limite permitido')
  .max(MAX_AMOUNT_CENTS, 'Valor acima do limite permitido');

// Calendar date in YYYY-MM-DD, converted to a Date at UTC midnight
export const dateOnlySchema = z
  .string('Informe uma data')
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Data deve estar no formato AAAA-MM-DD')
  .refine((value) => {
    const date = parseDateOnly(value);
    // Rejects impossible dates such as 2026-02-30, which Date would roll over
    return !Number.isNaN(date.getTime()) && formatDateOnly(date) === value;
  }, 'Data inválida')
  .transform(parseDateOnly);

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1, 'Página deve ser maior que zero').default(1),
  pageSize: z.coerce
    .number()
    .int()
    .min(1, 'Tamanho da página deve ser maior que zero')
    .max(100, 'Tamanho da página deve ser no máximo 100')
    .default(20),
});

export const optionalTextSchema = z
  .string()
  .trim()
  .max(1000, 'Deve ter no máximo 1000 caracteres')
  .transform((value) => (value === '' ? null : value))
  .nullable();

// Reference month in YYYY-MM, converted to a Date at UTC midnight on the 1st
export const monthSchema = z
  .string()
  .regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'Mês deve estar no formato AAAA-MM')
  .transform(parseMonth);
