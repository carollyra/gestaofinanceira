import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3333),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  DATABASE_URL: z.url(),
  DIRECT_URL: z.url().optional(),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must have at least 32 characters'),
  JWT_EXPIRES_IN: z.string().default('1d'),
  BCRYPT_SALT_ROUNDS: z.coerce.number().int().min(4).max(15).default(10),
});

export type Env = z.infer<typeof envSchema>;

function loadEnv(): Env {
  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    console.error('Invalid environment variables:', z.flattenError(parsed.error).fieldErrors);
    throw new Error('Invalid environment variables');
  }

  return parsed.data;
}

export const env = loadEnv();
