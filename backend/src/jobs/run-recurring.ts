// One-off run, e.g. from an external cron: npm run jobs:recurring
import { generateDueRecurringTransactions } from '../services/recurring-generator.service';
import { prisma } from '../utils/prisma';

try {
  const result = await generateDueRecurringTransactions();
  console.info(
    `[recurring] ${result.created} transactions created from ${result.templates} templates`,
  );
} finally {
  await prisma.$disconnect();
}
