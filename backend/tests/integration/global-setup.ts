import { execSync } from 'node:child_process';

import pg from 'pg';

import { resolveTestDatabaseUrl } from './test-database';

export default async function globalSetup() {
  const url = resolveTestDatabaseUrl();

  execSync('npx prisma migrate deploy', {
    env: { ...process.env, DIRECT_URL: url, DATABASE_URL: url },
    stdio: 'pipe',
  });

  // Every table references users with ON DELETE CASCADE / TRUNCATE CASCADE
  const client = new pg.Client({ connectionString: url });
  await client.connect();
  await client.query('TRUNCATE TABLE users CASCADE');
  await client.end();
}
