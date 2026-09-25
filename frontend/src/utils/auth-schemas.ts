import { z } from 'zod';

import { PASSWORD_MAX_BYTES, PASSWORD_RULES, passwordByteLength } from './password-rules';

const email = z.string().trim().min(1, 'Informe seu e-mail').pipe(z.email('E-mail inválido'));

export const loginSchema = z.object({
  email,
  password: z.string().min(1, 'Informe sua senha'),
});

const strongPassword = PASSWORD_RULES.reduce(
  (schema, rule) => schema.refine(rule.test, rule.message),
  z.string(),
).refine((value) => passwordByteLength(value) <= PASSWORD_MAX_BYTES, 'Senha muito longa');

export const registerSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, 'Nome deve ter no mínimo 2 caracteres')
      .max(100, 'Nome deve ter no máximo 100 caracteres'),
    email,
    password: strongPassword,
    confirmPassword: z.string().min(1, 'Confirme sua senha'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'As senhas não conferem',
    path: ['confirmPassword'],
  });

export type LoginFormValues = z.infer<typeof loginSchema>;
export type RegisterFormValues = z.infer<typeof registerSchema>;
