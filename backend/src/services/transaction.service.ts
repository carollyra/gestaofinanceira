import type { Prisma } from '../generated/prisma/client';
import type { TransactionType } from '../generated/prisma/enums';
import type {
  CreateTransactionInput,
  ListTransactionsQuery,
  UpdateTransactionInput,
} from '../schemas/transaction.schema';
import { AppError } from '../utils/app-error';
import { formatDateOnly } from '../utils/date';
import { buildPaginationMeta, toSkipTake } from '../utils/pagination';
import { prisma } from '../utils/prisma';
import { assertActiveAccount, assertCategoryMatchesType } from './ownership';
import { buildTransactionOrderBy, buildTransactionWhere } from './transaction-query';

const transactionSelect = {
  id: true,
  type: true,
  amount: true,
  date: true,
  description: true,
  notes: true,
  recurringTransactionId: true,
  createdAt: true,
  updatedAt: true,
  account: { select: { id: true, name: true, color: true, type: true } },
  category: { select: { id: true, name: true, color: true, icon: true } },
} satisfies Prisma.TransactionSelect;

type TransactionRecord = Prisma.TransactionGetPayload<{ select: typeof transactionSelect }>;

function serialize(transaction: TransactionRecord) {
  return { ...transaction, date: formatDateOnly(transaction.date) };
}

export async function listTransactions(userId: string, query: ListTransactionsQuery) {
  const where = buildTransactionWhere(userId, query);

  const [total, transactions, totalsByType] = await prisma.$transaction([
    prisma.transaction.count({ where }),
    prisma.transaction.findMany({
      where,
      select: transactionSelect,
      orderBy: buildTransactionOrderBy(query.sortBy, query.sortOrder),
      ...toSkipTake(query),
    }),
    // Totals of the whole filtered set (not only the current page)
    prisma.transaction.groupBy({
      by: ['type'],
      where,
      orderBy: { type: 'asc' },
      _sum: { amount: true },
    }),
  ]);

  const sumOf = (type: TransactionType) =>
    totalsByType.find((row) => row.type === type)?._sum?.amount ?? 0;
  const income = sumOf('INCOME');
  const expense = sumOf('EXPENSE');

  return {
    data: transactions.map(serialize),
    meta: buildPaginationMeta(total, query),
    summary: { income, expense, balance: income - expense },
  };
}

export async function getTransaction(userId: string, transactionId: string) {
  const transaction = await prisma.transaction.findFirst({
    where: { id: transactionId, userId },
    select: transactionSelect,
  });

  if (!transaction) {
    throw new AppError('Transação não encontrada', 404);
  }

  return serialize(transaction);
}

export async function createTransaction(userId: string, input: CreateTransactionInput) {
  await assertActiveAccount(userId, input.accountId);

  if (input.categoryId) {
    await assertCategoryMatchesType(userId, input.categoryId, input.type);
  }

  const transaction = await prisma.transaction.create({
    data: { ...input, userId },
    select: transactionSelect,
  });

  return serialize(transaction);
}

export async function updateTransaction(
  userId: string,
  transactionId: string,
  input: UpdateTransactionInput,
) {
  const current = await prisma.transaction.findFirst({
    where: { id: transactionId, userId },
    select: { type: true, categoryId: true },
  });

  if (!current) {
    throw new AppError('Transação não encontrada', 404);
  }

  if (input.accountId) {
    await assertActiveAccount(userId, input.accountId);
  }

  // Validates the final state: changing only the type must still match the stored category
  const type = input.type ?? current.type;
  const categoryId = input.categoryId === undefined ? current.categoryId : input.categoryId;

  if (categoryId && (input.categoryId !== undefined || input.type !== undefined)) {
    await assertCategoryMatchesType(userId, categoryId, type);
  }

  const transaction = await prisma.transaction.update({
    where: { id: transactionId, userId },
    data: input,
    select: transactionSelect,
  });

  return serialize(transaction);
}

export async function deleteTransaction(userId: string, transactionId: string) {
  const { count } = await prisma.transaction.deleteMany({ where: { id: transactionId, userId } });

  if (count === 0) {
    throw new AppError('Transação não encontrada', 404);
  }
}
