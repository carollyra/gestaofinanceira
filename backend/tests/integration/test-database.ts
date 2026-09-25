// Resolves the integration test database, refusing anything that could be real data
export function resolveTestDatabaseUrl(): string {
  try {
    process.loadEnvFile();
  } catch {
    // No .env file: variables must come from the environment (e.g. CI)
  }

  const url = process.env.DATABASE_URL_TEST;

  if (!url) {
    throw new Error(
      'DATABASE_URL_TEST is not set. Integration tests need a separate, disposable database ' +
        '(see backend/.env.example). Run only unit tests with: npm run test:unit',
    );
  }

  const databaseName = new URL(url).pathname.slice(1);

  if (
    url === process.env.DATABASE_URL ||
    url === process.env.DIRECT_URL ||
    !/test/i.test(databaseName)
  ) {
    throw new Error(
      `Refusing to run integration tests against "${databaseName}": ` +
        'DATABASE_URL_TEST must point to a separate database whose name contains "test".',
    );
  }

  return url;
}
