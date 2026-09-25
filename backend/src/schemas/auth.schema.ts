import { z } from 'zod';

const email = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email('E-mail inválido').max(255, 'E-mail muito longo'));

// Mirrored on the frontend for instant feedback; the server remains the source of truth
export const PASSWORD_MIN_LENGTH = 8;

const passwordSchema = z
  .string()
  .min(PASSWORD_MIN_LENGTH, `Senha deve ter no mínimo ${PASSWORD_MIN_LENGTH} caracteres`)
  // \p{L} accepts accented letters (á, ç...), not only A-Z
  .regex(/\p{L}/u, 'Senha deve conter pelo menos uma letra')
  .regex(/\d/, 'Senha deve conter pelo menos um número')
  // bcrypt silently ignores everything after 72 bytes
  .refine((value) => Buffer.byteLength(value, 'utf8') <= 72, 'Senha muito longa');

export const registerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Nome deve ter no mínimo 2 caracteres')
    .max(100, 'Nome deve ter no máximo 100 caracteres'),
  email,
  password: passwordSchema,
});

// Login does not apply the strength rules: they may change after an account is created
export const loginSchema = z.object({
  email,
  password: z.string().min(1, 'Informe a senha'),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
