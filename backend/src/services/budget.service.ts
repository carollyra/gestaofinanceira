import { Prisma } from '../generated/prisma/client';
import type {
  CopyBudgetsInput,
  CreateBudgetInput,
  UpdateBudgetInput,
} from '../schemas/budget.schema';
import { AppError } from '../utils/app-error';
import { getBudgetStatus } from '../utils/budget-status';
import { formatDateOnly } from '../utils/date';
import { bigintToNumber } from '../utils/money';
import { addMonths, currentMonth, formatMonth } from '../utils/month';
import { prisma } from '../utils/prisma';

interface BudgetRow {
  id: string;
  amount: number;
  month: Date;
  categoryId: string;
  categoryName: string;
  categoryColor: string;
  categoryIcon: string;
  spent: bigint;
  percentage: number;
}

// Spending is summed per budget with a LATERAL subquery over the budget's own
// category and month, served by the (user_id, category_id) index
async function queryBudgets(userId: string, filter: { month?: Date; budgetId?: string }) {
  const monthFilter = filter.month
    ? Prisma.sql`AND b.month = ${formatDateOnly(filter.month)}::date`
    : Prisma.empty;
  const idFilter = filter.budgetId ? Prisma.sql`AND b.id = ${filter.budgetId}::uuid` : Prisma.empty;

  const rows = await prisma.$queryRaw<BudgetRow[]>`
    SELECT
      b.id,
      b.amount,
      b.month,
      c.id AS "categoryId",
      c.name AS "categoryName",
      c.color AS "categoryColor",
      c.icon AS "categoryIcon",
      s.spent,
      ROUND(s.spent * 100.0 / b.amount, 2)::float8 AS percentage
    FROM budgets b
    JOIN categories c ON c.id = b.category_id AND c.user_id = b.user_id
    CROSS JOIN LATERAL (
      SELECT COALESCE(SUM(t.amount), 0)::bigint AS spent
      FROM transactions t
      WHERE t.user_id = b.user_id
        AND t.category_id = b.category_id
        AND t.type = 'EXPENSE'
        AND t.date >= b.month
        AND t.date < (b.month + interval '1 month')::date
    ) s
    WHERE b.user_id = ${userId}::uuid
      ${monthFilter}
      ${idFilter}
    ORDER BY percentage DESC, c.name
  `;

  return rows.map((row) => {
    const spent = bigintToNumber(row.spent);

    return {
      id: row.id,
      month: formatMonth(row.month),
      amount: row.amount,
      spent,
      remaining: row.amount - spent,
      percentage: row.percentage,
      status: getBudgetStatus(spent, row.amount),
      category: {
        id: row.categoryId,
        name: row.categoryName,
        color: row.categoryColor,
        icon: row.categoryIcon,
      },
    };
  });
}

interface MonthTotalsRow {
  totalLimit: bigint;
  totalSpent: bigint;
  unbudgetedSpent: bigint;
}

async function queryMonthTotals(userId: string, month: Date) {
  const start = formatDateOnly(month);
  const end = formatDateOnly(addMonths(month, 1));

  const [row] = await prisma.$queryRaw<MonthTotalsRow[]>`
    WITH budgeted AS (
      SELECT category_id, amount
      FROM budgets
      WHERE user_id = ${userId}::uuid AND month = ${start}::date
    )
    SELECT
      (SELECT COALESCE(SUM(amount), 0) FROM budgeted)::bigint AS "totalLimit",
      COALESCE(SUM(t.amount) FILTER (
        WHERE t.category_id IN (SELECT category_id FROM budgeted)
      ), 0)::bigint AS "totalSpent",
      COALESCE(SUM(t.amount) FILTER (
        WHERE t.category_id IS NULL OR t.category_id NOT IN (SELECT category_id FROM budgeted)
      ), 0)::bigint AS "unbudgetedSpent"
    FROM transactions t
    WHERE t.user_id = ${userId}::uuid
      AND t.type = 'EXPENSE'
      AND t.date >= ${start}::date
      AND t.date < ${end}::date
  `;

  const totalLimit = bigintToNumber(row?.totalLimit);
  const totalSpent = bigintToNumber(row?.totalSpent);

  return {
    totalLimit,
    totalSpent,
    remaining: totalLimit - totalSpent,
    percentage: totalLimit > 0 ? Math.round((totalSpent * 10_000) / totalLimit) / 100 : 0,
    status: totalLimit > 0 ? getBudgetStatus(totalSpent, totalLimit) : 'OK',
    // Expenses in categories without a budget this month (including uncategorized)
    unbudgetedSpent: bigintToNumber(row?.unbudgetedSpent),
  };
}

async function assertExpenseCategory(userId: string, categoryId: string) {
  const category = await prisma.category.findFirst({
    where: { id: categoryId, userId },
    select: { type: true },
  });

  if (!category) {
    throw new AppError('Categoria não encontrada', 404);
  }
  if (category.type !== 'EXPENSE') {
    throw new AppError('Orçamentos só podem ser definidos para categorias de despesa', 400);
  }
}

export async function listBudgets(userId: string, month = currentMonth()) {
  const [data, summary] = await Promise.all([
    queryBudgets(userId, { month }),
    queryMonthTotals(userId, month),
  ]);

  return { month: formatMonth(month), data, summary };
}

export async function getBudget(userId: string, budgetId: string) {
  const [budget] = await queryBudgets(userId, { budgetId });

  if (!budget) {
    throw new AppError('Orçamento não encontrado', 404);
  }

  return budget;
}

export async function createBudget(userId: string, input: CreateBudgetInput) {
  await assertExpenseCategory(userId, input.categoryId);

  const existing = await prisma.budget.findFirst({
    where: { userId, categoryId: input.categoryId, month: input.month },
    select: { id: true },
  });

  if (existing) {
    throw new AppError('Já existe um orçamento para essa categoria neste mês', 409);
  }

  const { id } = await prisma.budget.create({
    data: { ...input, userId },
    select: { id: true },
  });

  return getBudget(userId, id);
}

export async function updateBudget(userId: string, budgetId: string, input: UpdateBudgetInput) {
  const { count } = await prisma.budget.updateMany({
    where: { id: budgetId, userId },
    data: input,
  });

  if (count === 0) {
    throw new AppError('Orçamento não encontrado', 404);
  }

  return getBudget(userId, budgetId);
}

export async function deleteBudget(userId: string, budgetId: string) {
  const { count } = await prisma.budget.deleteMany({ where: { id: budgetId, userId } });

  if (count === 0) {
    throw new AppError('Orçamento não encontrado', 404);
  }
}

// Repeats a month's budgets in another month; categories that already have a
// budget in the target month are kept as they are
export async function copyBudgets(userId: string, input: CopyBudgetsInput) {
  const source = await prisma.budget.findMany({
    where: { userId, month: input.fromMonth },
    select: { categoryId: true, amount: true },
  });

  if (source.length === 0) {
    throw new AppError('Não há orçamentos no mês de origem', 404);
  }

  const { count } = await prisma.budget.createMany({
    data: source.map((budget) => ({ ...budget, userId, month: input.toMonth })),
    skipDuplicates: true,
  });

  return { created: count, skipped: source.length - count };
}
