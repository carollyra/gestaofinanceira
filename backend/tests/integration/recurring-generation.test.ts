import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { Prisma } from '../../src/generated/prisma/client';
import { generateDueRecurringTransactions } from '../../src/services/recurring-generator.service';
import { formatDateOnly, parseDateOnly, todayInTimezone } from '../../src/utils/date';
import { env } from '../../src/utils/env';
import { addMonths } from '../../src/utils/month';
import { prisma } from '../../src/utils/prisma';
import { createTestUser, type TestUser } from './helpers';

const d = parseDateOnly;

let user: TestUser;
let account: { id: string };

// Created straight in the database so the test controls "today" for generation
// (the API generates immediately using the real current date)
function createTemplate(overrides: Partial<Prisma.RecurringTransactionUncheckedCreateInput> = {}) {
  return prisma.recurringTransaction.create({
    data: {
      userId: user.id,
      accountId: account.id,
      type: 'EXPENSE',
      amount: 9_990,
      description: 'Academia',
      frequency: 'MONTHLY',
      day: 10,
      startDate: d('2026-01-01'),
      ...overrides,
    },
  });
}

async function occurrenceDates(templateId: string) {
  const rows = await prisma.transaction.findMany({
    where: { recurringTransactionId: templateId },
    orderBy: { date: 'asc' },
    select: { date: true },
  });
  return rows.map((row) => formatDateOnly(row.date));
}

const generate = (templateId: string, today: string) =>
  generateDueRecurringTransactions({ templateId, today: d(today) });

beforeEach(async () => {
  user = await createTestUser();
  account = await user.createAccount();
});

afterEach(() => {
  vi.restoreAllMocks();
});

// Opens several pooled connections up front. Otherwise the first run reuses the
// only warm connection and finishes before the others connect, and the
// "concurrent" runs end up sequential.
async function warmUpConnectionPool(size: number) {
  await Promise.all(Array.from({ length: size }, () => prisma.$executeRaw`SELECT pg_sleep(0.05)`));
}

describe('recurring generation', () => {
  it('creates every occurrence due up to today, as regular transactions', async () => {
    const template = await createTemplate();

    const result = await generate(template.id, '2026-04-15');

    expect(result.created).toBe(4);
    expect(await occurrenceDates(template.id)).toEqual([
      '2026-01-10',
      '2026-02-10',
      '2026-03-10',
      '2026-04-10',
    ]);

    const list = await user.get(`/api/transactions?search=Academia`);
    expect(list.body.meta.total).toBe(4);
    expect(list.body.data[0]).toMatchObject({
      amount: 9_990,
      type: 'EXPENSE',
      recurringTransactionId: template.id,
    });
  });

  it('does not duplicate when run again', async () => {
    const template = await createTemplate();

    await generate(template.id, '2026-04-15');
    const second = await generate(template.id, '2026-04-15');
    const third = await generate(template.id, '2026-04-20');

    expect([second.created, third.created]).toEqual([0, 0]);
    expect(await occurrenceDates(template.id)).toHaveLength(4);
  });

  it('only adds new occurrences as time passes', async () => {
    const template = await createTemplate();
    await generate(template.id, '2026-04-15');

    expect((await generate(template.id, '2026-05-09')).created).toBe(0);
    expect((await generate(template.id, '2026-05-10')).created).toBe(1);
    expect(await occurrenceDates(template.id)).toEqual([
      '2026-01-10',
      '2026-02-10',
      '2026-03-10',
      '2026-04-10',
      '2026-05-10',
    ]);
  });

  it('does not duplicate under 10 concurrent runs', async () => {
    const template = await createTemplate();
    await warmUpConnectionPool(10);

    const results = await Promise.all(
      Array.from({ length: 10 }, () => generate(template.id, '2026-04-15')),
    );

    expect(results.reduce((sum, r) => sum + r.created, 0)).toBe(4);
    expect(await occurrenceDates(template.id)).toEqual([
      '2026-01-10',
      '2026-02-10',
      '2026-03-10',
      '2026-04-10',
    ]);
  });

  it('a stale run (read the template before another run advanced it) generates nothing', async () => {
    const template = await createTemplate();
    // Snapshot as a slow run would have read it: last_run_date still null
    const stale = await prisma.recurringTransaction.findUniqueOrThrow({
      where: { id: template.id },
    });

    await generate(template.id, '2026-04-15');

    // The user deletes February; the stale run would bring it back if it
    // trusted its snapshot, since the unique index no longer blocks that date
    await prisma.transaction.deleteMany({
      where: { recurringTransactionId: template.id, date: d('2026-02-10') },
    });

    vi.spyOn(prisma.recurringTransaction, 'findMany').mockResolvedValueOnce([stale]);
    const result = await generate(template.id, '2026-04-15');

    expect(result).toEqual({ templates: 1, created: 0 });
    expect(await occurrenceDates(template.id)).toEqual(['2026-01-10', '2026-03-10', '2026-04-10']);
  });

  it('never recreates an occurrence the user deleted', async () => {
    const template = await createTemplate();
    await generate(template.id, '2026-04-15');

    const february = await prisma.transaction.findFirstOrThrow({
      where: { recurringTransactionId: template.id, date: d('2026-02-10') },
    });
    expect((await user.delete(`/api/transactions/${february.id}`)).status).toBe(204);

    await generate(template.id, '2026-04-30');

    expect(await occurrenceDates(template.id)).toEqual(['2026-01-10', '2026-03-10', '2026-04-10']);
  });

  it('clamps day 31 to the last day of shorter months', async () => {
    const template = await createTemplate({ day: 31 });

    await generate(template.id, '2026-04-30');

    expect(await occurrenceDates(template.id)).toEqual([
      '2026-01-31',
      '2026-02-28',
      '2026-03-31',
      '2026-04-30',
    ]);
  });

  it('respects the end date, paused templates and archived accounts', async () => {
    const ended = await createTemplate({ endDate: d('2026-02-15') });
    const paused = await createTemplate({ active: false });
    const archivedAccount = await user.createAccount();
    const onArchived = await createTemplate({ accountId: archivedAccount.id });
    await user.patch(`/api/accounts/${archivedAccount.id}`, { archived: true });

    await Promise.all([ended, paused, onArchived].map((t) => generate(t.id, '2026-06-30')));

    expect(await occurrenceDates(ended.id)).toEqual(['2026-01-10', '2026-02-10']);
    expect(await occurrenceDates(paused.id)).toEqual([]);
    expect(await occurrenceDates(onArchived.id)).toEqual([]);
  });

  it('has a database-level unique index on (template, date)', async () => {
    const template = await createTemplate();
    await generate(template.id, '2026-01-31');

    await expect(
      prisma.transaction.create({
        data: {
          userId: user.id,
          accountId: account.id,
          recurringTransactionId: template.id,
          type: 'EXPENSE',
          amount: 1,
          description: 'Duplicada',
          date: d('2026-01-10'),
        },
      }),
    ).rejects.toMatchObject({ code: 'P2002' });
  });

  it('generates occurrences already due when created through the API, and /generate is idempotent', async () => {
    const today = todayInTimezone(env.APP_TIMEZONE);
    const twoMonthsAgo = addMonths(
      new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1)),
      -2,
    );

    const created = await user.create<{
      id: string;
      nextOccurrence: string;
      _count: { transactions: number };
    }>('/api/recurring-transactions', {
      accountId: account.id,
      type: 'EXPENSE',
      amount: 5_000,
      description: 'Plano de celular',
      frequency: 'MONTHLY',
      day: 1,
      startDate: formatDateOnly(twoMonthsAgo),
    });

    // Day 1 of the month before last, of last month and of this month
    expect(created._count.transactions).toBe(3);
    expect(created.nextOccurrence).toBe(formatDateOnly(addMonths(twoMonthsAgo, 3)));

    for (let i = 0; i < 2; i++) {
      const response = await user.post('/api/recurring-transactions/generate');
      expect(response.body).toEqual({ created: 0 });
    }
  });
});
