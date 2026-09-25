import bcrypt from 'bcrypt';

import type { Prisma } from '../src/generated/prisma/client';
import { generateDueRecurringTransactions } from '../src/services/recurring-generator.service';
import { DEFAULT_CATEGORIES } from '../src/utils/default-categories';
import { prisma } from '../src/utils/prisma';

const DEMO_EMAIL = 'demo@financas.dev';
const DEMO_PASSWORD = 'demo12345';
const MONTHS_OF_HISTORY = 12;

// Deterministic PRNG so every seed run produces the same data
function createRandom(seed: number) {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const random = createRandom(42);
const between = (min: number, max: number) => Math.round(min + random() * (max - min));

// @db.Date columns: always build dates at UTC midnight
const utcDate = (year: number, month: number, day: number) => new Date(Date.UTC(year, month, day));

async function main() {
  // Deleting the user cascades to all of their data, making the seed re-runnable
  await prisma.user.deleteMany({ where: { email: DEMO_EMAIL } });

  const user = await prisma.user.create({
    data: {
      name: 'Usuário Demo',
      email: DEMO_EMAIL,
      passwordHash: await bcrypt.hash(DEMO_PASSWORD, 10),
      categories: { createMany: { data: [...DEFAULT_CATEGORIES] } },
      accounts: {
        createMany: {
          data: [
            { name: 'Carteira', type: 'WALLET', initialBalance: 15_000, color: '#f59e0b' },
            { name: 'Conta corrente', type: 'CHECKING', initialBalance: 250_000, color: '#3b82f6' },
            { name: 'Cartão de crédito', type: 'CREDIT_CARD', initialBalance: 0, color: '#a855f7' },
          ],
        },
      },
    },
    include: { categories: true, accounts: true },
  });

  const category = (name: string) => {
    const found = user.categories.find((c) => c.name === name);
    if (!found) throw new Error(`Category not found: ${name}`);
    return found.id;
  };
  const account = (name: string) => {
    const found = user.accounts.find((a) => a.name === name);
    if (!found) throw new Error(`Account not found: ${name}`);
    return found.id;
  };

  const transactions: Prisma.TransactionCreateManyInput[] = [];
  const transfers: Prisma.TransferCreateManyInput[] = [];
  const today = new Date();
  let previousCardBill = 0;

  for (let offset = MONTHS_OF_HISTORY - 1; offset >= 0; offset--) {
    const year = today.getUTCFullYear();
    const month = today.getUTCMonth() - offset;
    const lastDay = offset === 0 ? today.getUTCDate() : 28;

    const add = (
      day: number,
      type: 'INCOME' | 'EXPENSE',
      amount: number,
      description: string,
      categoryName: string,
      accountName: string,
    ) => {
      if (day > lastDay) return;
      transactions.push({
        userId: user.id,
        type,
        amount,
        description,
        date: utcDate(year, month, day),
        categoryId: category(categoryName),
        accountId: account(accountName),
      });
    };

    const transfer = (
      day: number,
      amount: number,
      description: string,
      fromName: string,
      toName: string,
    ) => {
      if (day > lastDay || amount <= 0) return;
      transfers.push({
        userId: user.id,
        amount,
        description,
        date: utcDate(year, month, day),
        fromAccountId: account(fromName),
        toAccountId: account(toName),
      });
    };

    const cardExpensesBefore = transactions.length;

    if (random() > 0.5) {
      add(
        between(10, 25),
        'INCOME',
        between(80_000, 250_000),
        'Projeto freelance',
        'Freelance',
        'Conta corrente',
      );
    }

    add(
      10,
      'EXPENSE',
      between(15_000, 26_000),
      'Conta de luz',
      'Contas e serviços',
      'Conta corrente',
    );
    add(15, 'EXPENSE', 5_590, 'Streaming', 'Assinaturas', 'Cartão de crédito');

    for (let i = 0; i < 4; i++) {
      add(
        between(1, 28),
        'EXPENSE',
        between(18_000, 45_000),
        'Supermercado',
        'Mercado',
        'Cartão de crédito',
      );
    }
    for (let i = 0; i < 6; i++) {
      add(
        between(1, 28),
        'EXPENSE',
        between(2_500, 9_000),
        'Restaurante',
        'Alimentação',
        'Cartão de crédito',
      );
    }
    for (let i = 0; i < 3; i++) {
      add(
        between(1, 28),
        'EXPENSE',
        between(1_500, 6_000),
        'Transporte por app',
        'Transporte',
        'Carteira',
      );
    }
    if (random() > 0.4) {
      add(
        between(1, 28),
        'EXPENSE',
        between(8_000, 30_000),
        'Cinema e bar',
        'Lazer',
        'Cartão de crédito',
      );
    }
    if (random() > 0.7) {
      add(between(1, 28), 'EXPENSE', between(10_000, 40_000), 'Farmácia', 'Saúde', 'Carteira');
    }

    // Pays last month's credit card bill and withdraws cash for the wallet
    transfer(10, previousCardBill, 'Pagamento da fatura', 'Conta corrente', 'Cartão de crédito');
    transfer(3, 40_000, 'Saque', 'Conta corrente', 'Carteira');

    const cardId = account('Cartão de crédito');
    previousCardBill = transactions
      .slice(cardExpensesBefore)
      .filter((t) => t.accountId === cardId)
      .reduce((sum, t) => sum + t.amount, 0);
  }

  await prisma.transaction.createMany({ data: transactions });
  await prisma.transfer.createMany({ data: transfers });

  // Fixed monthly items come from recurring templates, generated by the same
  // service the API uses
  const historyStart = utcDate(
    today.getUTCFullYear(),
    today.getUTCMonth() - (MONTHS_OF_HISTORY - 1),
    1,
  );
  const recurring = [
    { description: 'Salário', type: 'INCOME', amount: 650_000, day: 5, category: 'Salário' },
    { description: 'Aluguel', type: 'EXPENSE', amount: 180_000, day: 8, category: 'Moradia' },
    {
      description: 'Internet',
      type: 'EXPENSE',
      amount: 11_990,
      day: 12,
      category: 'Contas e serviços',
    },
  ] as const;

  await prisma.recurringTransaction.createMany({
    data: recurring.map((item) => ({
      userId: user.id,
      accountId: account('Conta corrente'),
      categoryId: category(item.category),
      type: item.type,
      amount: item.amount,
      description: item.description,
      frequency: 'MONTHLY',
      day: item.day,
      startDate: historyStart,
    })),
  });

  const generated = await generateDueRecurringTransactions({ userId: user.id });

  console.info(
    `Seed complete: ${user.categories.length} categories, ${user.accounts.length} accounts, ` +
      `${transactions.length + generated.created} transactions ` +
      `(${generated.created} from ${recurring.length} recurring templates), ${transfers.length} transfers`,
  );
  console.info(`Demo login: ${DEMO_EMAIL} / ${DEMO_PASSWORD}`);
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
