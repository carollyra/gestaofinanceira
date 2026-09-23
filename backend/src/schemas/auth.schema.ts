import { z } from 'zod';

const email = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email('E-mail inválido').max(255, 'E-mail muito longo'));

export const registerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Nome deve ter no mínimo 2 caracteres')
    .max(100, 'Nome deve ter no máximo 100 caracteres'),
  email,
  password: z
    .string()
    .min(8, 'Senha deve ter no mínimo 8 caracteres')
    // bcrypt silently ignores everything after 72 bytes
    .refine((value) => Buffer.byteLength(value, 'utf8') <= 72, 'Senha muito longa'),
});

export const loginSchema = z.object({
  email,
  password: z.string().min(1, 'Informe a senha'),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
