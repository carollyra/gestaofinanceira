import type { Prisma } from '../generated/prisma/client';
import type {
  CreateRecurringInput,
  ListRecurringQuery,
  UpdateRecurringInput,
} from '../schemas/recurring-transaction.schema';
import { AppError } from '../utils/app-error';
import { addDays, formatDateOnly, todayInTimezone } from '../utils/date';
import { env } from '../utils/env';
import { buildPaginationMeta, toSkipTake } from '../utils/pagination';
import { prisma } from '../utils/prisma';
import {
  defaultDayFor,
  getNextOccurrence,
  isValidDay,
  type RecurrenceRule,
} from '../utils/recurrence';
import { assertActiveAccount, assertCategoryMatchesType } from './ownership';
import { generateDueRecurringTransactions } from './recurring-generator.service';

const recurringSelect = {
  id: true,
  type: true,
  amount: true,
  description: true,
  notes: true,
  frequency: true,
  day: true,
  startDate: true,
  endDate: true,
  lastRunDate: true,
  active: true,
  createdAt: true,
  updatedAt: true,
  account: { select: { id: true, name: true, color: true, type: true } },
  category: { select: { id: true, name: true, color: true, icon: true } },
  _count: { select: { transactions: true } },
} satisfies Prisma.RecurringTransactionSelect;

type RecurringRecord = Prisma.RecurringTransactionGetPayload<{ select: typeof recurringSelect }>;

function serialize(recurring: RecurringRecord) {
  const today = todayInTimezone(env.APP_TIMEZONE);
  const afterLastRun = recurring.lastRunDate ? addDays(recurring.lastRunDate, 1) : null;
  const from = afterLastRun && afterLastRun > today ? afterLastRun : today;
  const nextOccurrence = recurring.active ? getNextOccurrence(recurring, from) : null;

  return {
    ...recurring,
    startDate: formatDateOnly(recurring.startDate),
    endDate: recurring.endDate && formatDateOnly(recurring.endDate),
    lastRunDate: recurring.lastRunDate && formatDateOnly(recurring.lastRunDate),
    nextOccurrence: nextOccurrence && formatDateOnly(nextOccurrence),
  };
}

function assertValidSchedule(rule: RecurrenceRule) {
  if (!isValidDay(rule.frequency, rule.day)) {
    throw new AppError(
      rule.frequency === 'WEEKLY'
        ? 'Para recorrência semanal, o dia deve ser de 0 (domingo) a 6 (sábado)'
        : 'O dia do mês deve ser de 1 a 31',
      400,
    );
  }
  if (rule.endDate && rule.endDate < rule.startDate) {
    throw new AppError('A data final deve ser posterior à data inicial', 400);
  }
}

async function findRecurringOrThrow(userId: string, recurringId: string) {
  const recurring = await prisma.recurringTransaction.findFirst({
    where: { id: recurringId, userId },
  });

  if (!recurring) {
    throw new AppError('Transação recorrente não encontrada', 404);
  }

  return recurring;
}

export async function listRecurring(userId: string, query: ListRecurringQuery) {
  const where: Prisma.RecurringTransactionWhereInput = {
    userId,
    ...(query.active !== undefined && { active: query.active }),
    ...(query.type && { type: query.type }),
  };

  const [total, items] = await prisma.$transaction([
    prisma.recurringTransaction.count({ where }),
    prisma.recurringTransaction.findMany({
      where,
      select: recurringSelect,
      orderBy: [{ active: 'desc' }, { description: 'asc' }, { id: 'asc' }],
      ...toSkipTake(query),
    }),
  ]);

  return { data: items.map(serialize), meta: buildPaginationMeta(total, query) };
}

export async function getRecurring(userId: string, recurringId: string) {
  const recurring = await prisma.recurringTransaction.findFirst({
    where: { id: recurringId, userId },
    select: recurringSelect,
  });

  if (!recurring) {
    throw new AppError('Transação recorrente não encontrada', 404);
  }

  return serialize(recurring);
}

export async function createRecurring(userId: string, input: CreateRecurringInput) {
  const rule: RecurrenceRule = {
    frequency: input.frequency,
    day: input.day ?? defaultDayFor(input.frequency, input.startDate),
    startDate: input.startDate,
    endDate: input.endDate ?? null,
  };

  assertValidSchedule(rule);
  await assertActiveAccount(userId, input.accountId);
  if (input.categoryId) {
    await assertCategoryMatchesType(userId, input.categoryId, input.type);
  }

  const { id } = await prisma.recurringTransaction.create({
    data: { ...input, ...rule, userId },
    select: { id: true },
  });

  // Occurrences already due (start date in the past or today) are created now
  await generateDueRecurringTransactions({ templateId: id });

  return getRecurring(userId, id);
}

export async function updateRecurring(
  userId: string,
  recurringId: string,
  input: UpdateRecurringInput,
) {
  const current = await findRecurringOrThrow(userId, recurringId);

  const rule: RecurrenceRule = {
    frequency: input.frequency ?? current.frequency,
    day: input.day ?? current.day,
    startDate: input.startDate ?? current.startDate,
    endDate: input.endDate === undefined ? current.endDate : input.endDate,
  };
  assertValidSchedule(rule);

  if (input.accountId) {
    await assertActiveAccount(userId, input.accountId);
  }

  const type = input.type ?? current.type;
  const categoryId = input.categoryId === undefined ? current.categoryId : input.categoryId;
  if (categoryId && (input.categoryId !== undefined || input.type !== undefined)) {
    await assertCategoryMatchesType(userId, categoryId, type);
  }

  const data: Prisma.RecurringTransactionUncheckedUpdateInput = { ...input };

  // Resuming a paused template skips the paused period instead of backfilling it
  if (input.active === true && !current.active) {
    const yesterday = addDays(todayInTimezone(env.APP_TIMEZONE), -1);
    if (!current.lastRunDate || current.lastRunDate < yesterday) {
      data.lastRunDate = yesterday;
    }
  }

  await prisma.recurringTransaction.update({ where: { id: recurringId, userId }, data });

  // Changes to the template apply to future occurrences; generated ones are kept
  await generateDueRecurringTransactions({ templateId: recurringId });

  return getRecurring(userId, recurringId);
}

export async function deleteRecurring(userId: string, recurringId: string) {
  // Generated transactions are kept (ON DELETE SET NULL on the link)
  const { count } = await prisma.recurringTransaction.deleteMany({
    where: { id: recurringId, userId },
  });

  if (count === 0) {
    throw new AppError('Transação recorrente não encontrada', 404);
  }
}
