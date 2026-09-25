import { beforeAll, describe, expect, it } from 'vitest';

import { createTestUser, type TestUser } from './helpers';

describe('account balances', () => {
  it('is initial + incomes - expenses + transfers in - transfers out', async () => {
    const user = await createTestUser();
    const checking = await user.createAccount({ initialBalance: 100_000 });
    const wallet = await user.createAccount({ type: 'WALLET', initialBalance: 5_000 });

    // Several rows on each side: a naive JOIN of transactions and transfers
    // would multiply them and inflate the sums
    for (const amount of [300_000, 20_000, 1_500]) {
      await user.createTransaction({
        accountId: checking.id,
        type: 'INCOME',
        amount,
        date: '2026-03-05',
      });
    }
    for (const amount of [45_050, 9_990]) {
      await user.createTransaction({
        accountId: checking.id,
        type: 'EXPENSE',
        amount,
        date: '2026-03-10',
      });
    }
    await user.createTransaction({
      accountId: wallet.id,
      type: 'EXPENSE',
      amount: 2_500,
      date: '2026-03-11',
    });
    for (const amount of [20_000, 7_000]) {
      await user.createTransfer({
        fromAccountId: checking.id,
        toAccountId: wallet.id,
        amount,
        date: '2026-03-12',
      });
    }
    await user.createTransfer({
      fromAccountId: wallet.id,
      toAccountId: checking.id,
      amount: 1_000,
      date: '2026-03-13',
    });

    const balances = Object.fromEntries(
      (await user.get('/api/accounts')).body.data.map((a: { id: string; balance: number }) => [
        a.id,
        a.balance,
      ]),
    );

    // 100_000 + 321_500 - 55_040 - 27_000 + 1_000
    expect(balances[checking.id]).toBe(340_460);
    // 5_000 - 2_500 + 27_000 - 1_000
    expect(balances[wallet.id]).toBe(28_500);

    const detail = await user.get(`/api/accounts/${checking.id}`);
    expect(detail.body.balance).toBe(340_460);
  });

  it('sums beyond the 32-bit integer range without overflow (bigint aggregation)', async () => {
    const user = await createTestUser();
    const account = await user.createAccount({ initialBalance: 999_999_999 });

    for (let i = 0; i < 3; i++) {
      await user.createTransaction({
        accountId: account.id,
        type: 'INCOME',
        amount: 999_999_999,
        date: '2026-03-01',
      });
    }

    const response = await user.get(`/api/accounts/${account.id}`);
    // 3_999_999_996 > 2_147_483_647 (max INTEGER)
    expect(response.body.balance).toBe(3_999_999_996);

    const summary = await user.get('/api/dashboard/summary?month=2026-03');
    expect(summary.body).toMatchObject({ totalBalance: 3_999_999_996, income: 2_999_999_997 });
  });

  it('keeps the balance of archived accounts, listed only on request', async () => {
    const user = await createTestUser();
    const account = await user.createAccount({ initialBalance: 12_345 });
    await user.patch(`/api/accounts/${account.id}`, { archived: true });

    expect((await user.get('/api/accounts')).body.data).toHaveLength(0);

    const all = await user.get('/api/accounts?includeArchived=true');
    expect(all.body.data).toEqual([
      expect.objectContaining({ id: account.id, archived: true, balance: 12_345 }),
    ]);
  });
});

describe('dashboard aggregations', () => {
  let user: TestUser;
  let checking: { id: string };
  let wallet: { id: string };

  // Fixed dataset (initial balances: 110_000)
  //   2025-11  income  50_000 (before the evolution window)
  //   2025-12  income 300_000 | expense  80_000 (Mercado)
  //   2026-01  nothing
  //   2026-02  income 300_000 | expense  12_000 (Alimentação)
  //   2026-03  income 345_000 | expense 210_000 (Moradia 150_000, Mercado 50_000, uncategorized 10_000)
  //   transfers: 2026-02 (5_000) and 2026-03 (50_000), which must never count as income/expense
  beforeAll(async () => {
    user = await createTestUser();
    checking = await user.createAccount({ initialBalance: 100_000 });
    wallet = await user.createAccount({ type: 'WALLET', initialBalance: 10_000 });

    const salary = await user.category('Salário');
    const freelance = await user.category('Freelance');
    const groceries = await user.category('Mercado');
    const food = await user.category('Alimentação');
    const housing = await user.category('Moradia');

    const rows = [
      [checking, 'INCOME', 50_000, '2025-11-20', salary],
      [checking, 'INCOME', 300_000, '2025-12-05', salary],
      [checking, 'EXPENSE', 80_000, '2025-12-15', groceries],
      [checking, 'INCOME', 300_000, '2026-02-05', salary],
      [wallet, 'EXPENSE', 12_000, '2026-02-20', food],
      [checking, 'INCOME', 300_000, '2026-03-05', salary],
      [checking, 'INCOME', 45_000, '2026-03-06', freelance],
      [checking, 'EXPENSE', 150_000, '2026-03-10', housing],
      [wallet, 'EXPENSE', 30_000, '2026-03-10', groceries],
      [wallet, 'EXPENSE', 20_000, '2026-03-11', groceries],
      [checking, 'EXPENSE', 10_000, '2026-03-15', null],
    ] as const;

    for (const [account, type, amount, date, categoryId] of rows) {
      await user.createTransaction({ accountId: account.id, type, amount, date, categoryId });
    }

    await user.createTransfer({
      fromAccountId: checking.id,
      toAccountId: wallet.id,
      amount: 5_000,
      date: '2026-02-01',
    });
    await user.createTransfer({
      fromAccountId: checking.id,
      toAccountId: wallet.id,
      amount: 50_000,
      date: '2026-03-12',
    });
  });

  it('summarizes the month, the previous month and the total balance', async () => {
    const response = await user.get('/api/dashboard/summary?month=2026-03');

    expect(response.body).toEqual({
      month: '2026-03',
      // 110_000 + 995_000 - 302_000
      totalBalance: 803_000,
      income: 345_000,
      expense: 210_000,
      net: 135_000,
      previousMonth: { month: '2026-02', income: 300_000, expense: 12_000, net: 288_000 },
    });
  });

  it('total balance equals the sum of the account balances', async () => {
    const accounts = await user.get('/api/accounts?includeArchived=true');
    const sum = accounts.body.data.reduce(
      (total: number, a: { balance: number }) => total + a.balance,
      0,
    );

    expect(sum).toBe(803_000);
  });

  it('builds the monthly evolution with empty months and a running closing balance', async () => {
    const response = await user.get('/api/dashboard/monthly-evolution?endMonth=2026-03&months=4');

    expect(response.body.data).toEqual([
      // opening balance before the window: 110_000 + 50_000
      { month: '2025-12', income: 300_000, expense: 80_000, net: 220_000, closingBalance: 380_000 },
      { month: '2026-01', income: 0, expense: 0, net: 0, closingBalance: 380_000 },
      { month: '2026-02', income: 300_000, expense: 12_000, net: 288_000, closingBalance: 668_000 },
      {
        month: '2026-03',
        income: 345_000,
        expense: 210_000,
        net: 135_000,
        closingBalance: 803_000,
      },
    ]);
  });

  it('breaks expenses down by category, including uncategorized', async () => {
    const response = await user.get('/api/dashboard/by-category?month=2026-03');

    expect(response.body).toMatchObject({
      type: 'EXPENSE',
      startDate: '2026-03-01',
      endDate: '2026-03-31',
      total: 210_000,
    });
    expect(
      response.body.categories.map(
        (c: { name: string; total: number; count: number; percentage: number }) => [
          c.name,
          c.total,
          c.count,
          c.percentage,
        ],
      ),
    ).toEqual([
      ['Moradia', 150_000, 1, 71.43],
      ['Mercado', 50_000, 2, 23.81],
      ['Sem categoria', 10_000, 1, 4.76],
    ]);
  });

  it('breaks incomes down by category', async () => {
    const response = await user.get('/api/dashboard/by-category?month=2026-03&type=INCOME');

    expect(
      response.body.categories.map((c: { name: string; total: number }) => [c.name, c.total]),
    ).toEqual([
      ['Salário', 300_000],
      ['Freelance', 45_000],
    ]);
  });

  it('treats the custom period end date as inclusive', async () => {
    const response = await user.get(
      '/api/dashboard/by-category?startDate=2026-03-01&endDate=2026-03-10',
    );

    // Includes both 2026-03-10 expenses, excludes 2026-03-11 and 2026-03-15
    expect(response.body.total).toBe(180_000);
  });

  it('returns totals of the whole filtered set in the transaction list, not only the page', async () => {
    const response = await user.get(
      '/api/transactions?type=EXPENSE&startDate=2026-03-01&endDate=2026-03-31&pageSize=1',
    );

    expect(response.body.data).toHaveLength(1);
    expect(response.body.meta).toMatchObject({ total: 4, totalPages: 4 });
    expect(response.body.summary).toEqual({ income: 0, expense: 210_000, balance: -210_000 });
  });

  it('computes budget consumption only from that category and month', async () => {
    const created = await user.create<{ id: string }>('/api/budgets', {
      categoryId: await user.category('Mercado'),
      amount: 60_000,
      month: '2026-03',
    });

    const budget = await user.get(`/api/budgets/${created.id}`);
    // December's 80_000 in the same category is not counted
    expect(budget.body).toMatchObject({
      spent: 50_000,
      remaining: 10_000,
      percentage: 83.33,
      status: 'WARNING',
    });

    const list = await user.get('/api/budgets?month=2026-03');
    expect(list.body.summary).toMatchObject({
      totalLimit: 60_000,
      totalSpent: 50_000,
      // Moradia 150_000 + uncategorized 10_000
      unbudgetedSpent: 160_000,
    });
  });

  it('never counts transfers as income or expense', async () => {
    const endpoints = [
      '/api/dashboard/summary?month=2026-03',
      '/api/dashboard/monthly-evolution?endMonth=2026-03&months=4',
      '/api/dashboard/by-category?month=2026-03',
      '/api/budgets?month=2026-03',
    ];
    const snapshot = async () =>
      Promise.all(endpoints.map(async (url) => (await user.get(url)).body));

    const before = await snapshot();
    const transfer = await user.createTransfer({
      fromAccountId: checking.id,
      toAccountId: wallet.id,
      amount: 99_999,
      date: '2026-03-20',
    });
    const after = await snapshot();
    await user.delete(`/api/transfers/${transfer.id}`);

    expect(after).toEqual(before);
  });
});
