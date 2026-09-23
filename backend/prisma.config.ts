import { defineConfig } from 'prisma/config';

// Prisma CLI does not load .env on its own since v7
try {
  process.loadEnvFile();
} catch {
  // No .env file: rely on variables already present in the environment
}

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx prisma/seed.ts',
  },
  datasource: {
    // Migrations need a direct connection; Neon's pooler does not support them
    url: process.env.DIRECT_URL ?? process.env.DATABASE_URL,
  },
});
