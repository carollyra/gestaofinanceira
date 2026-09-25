import type { TransactionType } from '../generated/prisma/enums';
import type { CategoryBreakdownQuery, EvolutionQuery } from '../schemas/dashboard.schema';
import { formatDateOnly } from '../utils/date';
import { bigintToNumber } from '../utils/money';
import { addMonths, currentMonth, formatMonth } from '../utils/month';
import { prisma } from '../utils/prisma';

// Date parameters are sent as 'YYYY-MM-DD' strings cast to ::date. Sending JS
// Dates would make PostgreSQL convert them using the session timezone.
//
// All aggregations run in PostgreSQL and read only `transactions`: transfers
// are not income or expense. They are also irrelevant to the total balance,
// since both sides belong to the same user and cancel out.

interface SummaryRow {
  totalBalance: bigint;
  income: bigint;
  expense: bigint;
  previousIncome: bigint;
  previousExpense: bigint;
}

export async function getSummary(userId: string, month = currentMonth()) {
  const previousMonth = addMonths(month, -1);
  const start = formatDateOnly(month);
  const end = formatDateOnly(addMonths(month, 1));
  const previousStart = formatDateOnly(previousMonth);

  const [row] = await prisma.$queryRaw<SummaryRow[]>`
    SELECT
      (SELECT COALESCE(SUM(initial_balance), 0) FROM accounts WHERE user_id = ${userId}::uuid)
        + COALESCE(SUM(CASE WHEN type = 'INCOME' THEN amount ELSE -amount END), 0)
        AS "totalBalance",
      COALESCE(SUM(amount) FILTER (
        WHERE type = 'INCOME' AND date >= ${start}::date AND date < ${end}::date
      ), 0) AS income,
      COALESCE(SUM(amount) FILTER (
        WHERE type = 'EXPENSE' AND date >= ${start}::date AND date < ${end}::date
      ), 0) AS expense,
      COALESCE(SUM(amount) FILTER (
        WHERE type = 'INCOME' AND date >= ${previousStart}::date AND date < ${start}::date
      ), 0) AS "previousIncome",
      COALESCE(SUM(amount) FILTER (
        WHERE type = 'EXPENSE' AND date >= ${previousStart}::date AND date < ${start}::date
      ), 0) AS "previousExpense"
    FROM transactions
    WHERE user_id = ${userId}::uuid
  `;

  const income = bigintToNumber(row?.income);
  const expense = bigintToNumber(row?.expense);
  const previousIncome = bigintToNumber(row?.previousIncome);
  const previousExpense = bigintToNumber(row?.previousExpense);

  return {
    month: formatMonth(month),
    totalBalance: bigintToNumber(row?.totalBalance),
    income,
    expense,
    net: income - expense,
    previousMonth: {
      month: formatMonth(previousMonth),
      income: previousIncome,
      expense: previousExpense,
      net: previousIncome - previousExpense,
    },
  };
}

interface EvolutionRow {
  month: string;
  income: bigint;
  expense: bigint;
  closingBalance: bigint;
}

export async function getMonthlyEvolution(userId: string, query: EvolutionQuery) {
  const lastMonth = query.endMonth ?? currentMonth();
  const start = formatDateOnly(addMonths(lastMonth, -(query.months - 1)));
  const last = formatDateOnly(lastMonth);
  const end = formatDateOnly(addMonths(lastMonth, 1));

  // generate_series keeps months without transactions in the series (as zero).
  // The closing balance is the balance before the window plus a running sum.
  const rows = await prisma.$queryRaw<EvolutionRow[]>`
    WITH months AS (
      SELECT generate_series(${start}::date, ${last}::date, interval '1 month')::date AS month
    ),
    monthly AS (
      SELECT
        date_trunc('month', date)::date AS month,
        SUM(amount) FILTER (WHERE type = 'INCOME') AS income,
        SUM(amount) FILTER (WHERE type = 'EXPENSE') AS expense
      FROM transactions
      WHERE user_id = ${userId}::uuid AND date >= ${start}::date AND date < ${end}::date
      GROUP BY 1
    ),
    opening AS (
      SELECT
        (SELECT COALESCE(SUM(initial_balance), 0) FROM accounts WHERE user_id = ${userId}::uuid)
        + (
          SELECT COALESCE(SUM(CASE WHEN type = 'INCOME' THEN amount ELSE -amount END), 0)
          FROM transactions
          WHERE user_id = ${userId}::uuid AND date < ${start}::date
        ) AS balance
    )
    SELECT
      to_char(m.month, 'YYYY-MM') AS month,
      COALESCE(mo.income, 0)::bigint AS income,
      COALESCE(mo.expense, 0)::bigint AS expense,
      (
        (SELECT balance FROM opening)
        + SUM(COALESCE(mo.income, 0) - COALESCE(mo.expense, 0)) OVER (ORDER BY m.month)
      )::bigint AS "closingBalance"
    FROM months m
    LEFT JOIN monthly mo ON mo.month = m.month
    ORDER BY m.month
  `;

  return rows.map((row) => {
    const income = bigintToNumber(row.income);
    const expense = bigintToNumber(row.expense);

    return {
      month: row.month,
      income,
      expense,
      net: income - expense,
      closingBalance: bigintToNumber(row.closingBalance),
    };
  });
}

interface CategoryRow {
  categoryId: string | null;
  name: string | null;
  color: string | null;
  icon: string | null;
  total: bigint;
  count: number;
  percentage: number;
}

function resolvePeriod(query: CategoryBreakdownQuery) {
  if (query.startDate && query.endDate) {
    // endDate is inclusive for the client; queries use an exclusive upper bound
    const end = new Date(query.endDate);
    end.setUTCDate(end.getUTCDate() + 1);
    return { start: query.startDate, end };
  }

  const month = query.month ?? currentMonth();
  return { start: month, end: addMonths(month, 1) };
}

export async function getCategoryBreakdown(userId: string, query: CategoryBreakdownQuery) {
  const { start, end } = resolvePeriod(query);
  const type: TransactionType = query.type;

  // Uncategorized transactions are grouped under a NULL category id.
  // SUM(SUM(...)) OVER () is the grand total, used for each share.
  const rows = await prisma.$queryRaw<CategoryRow[]>`
    SELECT
      c.id AS "categoryId",
      c.name,
      c.color,
      c.icon,
      SUM(t.amount)::bigint AS total,
      COUNT(*)::int AS count,
      ROUND(SUM(t.amount) * 100.0 / SUM(SUM(t.amount)) OVER (), 2)::float8 AS percentage
    FROM transactions t
    LEFT JOIN categories c ON c.id = t.category_id AND c.user_id = t.user_id
    WHERE t.user_id = ${userId}::uuid
      AND t.type = ${type}::"TransactionType"
      AND t.date >= ${start}::date
      AND t.date < ${end}::date
    GROUP BY c.id
    ORDER BY total DESC, c.name
  `;

  const categories = rows.map((row) => ({
    categoryId: row.categoryId,
    name: row.name ?? 'Sem categoria',
    color: row.color ?? '#64748b',
    icon: row.icon ?? 'circle-help',
    total: bigintToNumber(row.total),
    count: row.count,
    percentage: row.percentage,
  }));

  const lastDay = new Date(end);
  lastDay.setUTCDate(lastDay.getUTCDate() - 1);

  return {
    type,
    startDate: formatDateOnly(start),
    endDate: formatDateOnly(lastDay),
    total: categories.reduce((sum, category) => sum + category.total, 0),
    categories,
  };
}
