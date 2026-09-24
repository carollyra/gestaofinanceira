import { Prisma } from '../generated/prisma/client';
import type { AccountType } from '../generated/prisma/enums';
import type { CreateAccountInput, UpdateAccountInput } from '../schemas/account.schema';
import { AppError } from '../utils/app-error';
import { bigintToNumber } from '../utils/money';
import { prisma } from '../utils/prisma';

interface AccountRow {
  id: string;
  name: string;
  type: AccountType;
  initialBalance: number;
  color: string;
  archived: boolean;
  createdAt: Date;
  updatedAt: Date;
  balance: bigint;
}

interface BalanceFilters {
  accountId?: string;
  includeArchived?: boolean;
}

// Current balance = initial balance + incomes - expenses, computed in a single query
async function queryAccountsWithBalance(userId: string, filters: BalanceFilters = {}) {
  const accountFilter = filters.accountId
    ? Prisma.sql`AND a.id = ${filters.accountId}::uuid`
    : Prisma.empty;
  const archivedFilter = filters.includeArchived
    ? Prisma.empty
    : Prisma.sql`AND a.archived = false`;

  const rows = await prisma.$queryRaw<AccountRow[]>`
    SELECT
      a.id,
      a.name,
      a.type,
      a.initial_balance AS "initialBalance",
      a.color,
      a.archived,
      a.created_at AS "createdAt",
      a.updated_at AS "updatedAt",
      a.initial_balance + COALESCE(
        SUM(CASE WHEN t.type = 'INCOME' THEN t.amount ELSE -t.amount END),
        0
      ) AS balance
    FROM accounts a
    LEFT JOIN transactions t ON t.account_id = a.id AND t.user_id = a.user_id
    WHERE a.user_id = ${userId}::uuid
      ${accountFilter}
      ${archivedFilter}
    GROUP BY a.id
    ORDER BY a.archived, a.created_at
  `;

  return rows.map((row) => ({ ...row, balance: bigintToNumber(row.balance) }));
}

async function ensureAccountExists(userId: string, accountId: string) {
  const account = await prisma.account.findFirst({
    where: { id: accountId, userId },
    select: { id: true },
  });

  if (!account) {
    throw new AppError('Conta não encontrada', 404);
  }
}

async function ensureNameAvailable(userId: string, name: string, ignoreId?: string) {
  const duplicate = await prisma.account.findFirst({
    where: {
      userId,
      name: { equals: name, mode: 'insensitive' },
      ...(ignoreId && { id: { not: ignoreId } }),
    },
    select: { id: true },
  });

  if (duplicate) {
    throw new AppError('Já existe uma conta com esse nome', 409);
  }
}

export function listAccounts(userId: string, includeArchived = false) {
  return queryAccountsWithBalance(userId, { includeArchived });
}

export async function getAccount(userId: string, accountId: string) {
  const [account] = await queryAccountsWithBalance(userId, { accountId, includeArchived: true });

  if (!account) {
    throw new AppError('Conta não encontrada', 404);
  }

  return account;
}

export async function createAccount(userId: string, input: CreateAccountInput) {
  await ensureNameAvailable(userId, input.name);

  const account = await prisma.account.create({
    data: { ...input, userId },
    select: { id: true },
  });

  return getAccount(userId, account.id);
}

export async function updateAccount(userId: string, accountId: string, input: UpdateAccountInput) {
  await ensureAccountExists(userId, accountId);

  if (input.name) {
    await ensureNameAvailable(userId, input.name, accountId);
  }

  await prisma.account.update({
    where: { id: accountId, userId },
    data: input,
  });

  return getAccount(userId, accountId);
}

export async function deleteAccount(userId: string, accountId: string) {
  const account = await prisma.account.findFirst({
    where: { id: accountId, userId },
    select: { _count: { select: { transactions: true, recurringTransactions: true } } },
  });

  if (!account) {
    throw new AppError('Conta não encontrada', 404);
  }

  if (account._count.transactions > 0 || account._count.recurringTransactions > 0) {
    throw new AppError(
      'Esta conta possui transações. Arquive-a em vez de excluir para manter o histórico.',
      409,
    );
  }

  await prisma.account.delete({ where: { id: accountId, userId } });
}
