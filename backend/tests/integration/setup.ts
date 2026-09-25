import { afterAll } from 'vitest';

import { resolveTestDatabaseUrl } from './test-database';

// Runs before each test file is imported, so the app reads these values
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = resolveTestDatabaseUrl();
process.env.JWT_SECRET ??= 'test-secret-with-at-least-thirty-two-characters';
// Cheaper hashes: many users are registered during the tests
process.env.BCRYPT_SALT_ROUNDS = '4';
process.env.RECURRING_JOB_INTERVAL_MINUTES = '0';

afterAll(async () => {
  const { prisma } = await import('../../src/utils/prisma');
  await prisma.$disconnect();
});
