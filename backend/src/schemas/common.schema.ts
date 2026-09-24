import { z } from 'zod';

import { MAX_AMOUNT_CENTS } from '../utils/money';

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
