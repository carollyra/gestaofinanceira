import type { Goal } from '../generated/prisma/client';
import type { CreateGoalInput, UpdateGoalInput } from '../schemas/goal.schema';
import { AppError } from '../utils/app-error';
import { formatDateOnly, todayInTimezone } from '../utils/date';
import { env } from '../utils/env';
import { calculateGoalProgress } from '../utils/goal-progress';
import { MAX_AMOUNT_CENTS } from '../utils/money';
import { prisma } from '../utils/prisma';

function serialize(goal: Goal, today = todayInTimezone(env.APP_TIMEZONE)) {
  const progress = calculateGoalProgress(
    {
      targetAmount: goal.targetAmount,
      currentAmount: goal.currentAmount,
      deadline: goal.deadline,
      startDate: todayInTimezone(env.APP_TIMEZONE, goal.createdAt),
    },
    today,
  );

  return {
    id: goal.id,
    name: goal.name,
    targetAmount: goal.targetAmount,
    currentAmount: goal.currentAmount,
    deadline: goal.deadline && formatDateOnly(goal.deadline),
    color: goal.color,
    icon: goal.icon,
    createdAt: goal.createdAt,
    updatedAt: goal.updatedAt,
    progress,
  };
}

function assertFutureDeadline(deadline: Date | null | undefined) {
  if (deadline && deadline < todayInTimezone(env.APP_TIMEZONE)) {
    throw new AppError('O prazo deve ser hoje ou uma data futura', 400);
  }
}

async function findGoalOrThrow(userId: string, goalId: string) {
  const goal = await prisma.goal.findFirst({ where: { id: goalId, userId } });

  if (!goal) {
    throw new AppError('Meta não encontrada', 404);
  }

  return goal;
}

export async function listGoals(userId: string) {
  const [goals, totals] = await Promise.all([
    prisma.goal.findMany({
      where: { userId },
      orderBy: [{ deadline: { sort: 'asc', nulls: 'last' } }, { createdAt: 'asc' }],
    }),
    prisma.goal.aggregate({
      where: { userId },
      _sum: { targetAmount: true, currentAmount: true },
      _count: true,
    }),
  ]);

  const today = todayInTimezone(env.APP_TIMEZONE);
  const data = goals.map((goal) => serialize(goal, today));
  // Completed goals go to the end, keeping the deadline order inside each group
  data.sort((a, b) => Number(a.progress.completed) - Number(b.progress.completed));

  const totalTarget = totals._sum.targetAmount ?? 0;
  const totalSaved = totals._sum.currentAmount ?? 0;

  return {
    data,
    summary: {
      count: totals._count,
      completed: data.filter((goal) => goal.progress.completed).length,
      totalTarget,
      totalSaved,
      percentage: totalTarget > 0 ? Math.round((totalSaved * 10_000) / totalTarget) / 100 : 0,
    },
  };
}

export async function getGoal(userId: string, goalId: string) {
  return serialize(await findGoalOrThrow(userId, goalId));
}

export async function createGoal(userId: string, input: CreateGoalInput) {
  assertFutureDeadline(input.deadline);

  const goal = await prisma.goal.create({ data: { ...input, userId } });

  return serialize(goal);
}

export async function updateGoal(userId: string, goalId: string, input: UpdateGoalInput) {
  await findGoalOrThrow(userId, goalId);
  assertFutureDeadline(input.deadline);

  const goal = await prisma.goal.update({ where: { id: goalId, userId }, data: input });

  return serialize(goal);
}

export async function deleteGoal(userId: string, goalId: string) {
  const { count } = await prisma.goal.deleteMany({ where: { id: goalId, userId } });

  if (count === 0) {
    throw new AppError('Meta não encontrada', 404);
  }
}

// Deposits and withdrawals are single atomic UPDATEs (current = current ± x)
// guarded in the WHERE clause, so concurrent requests never overwrite each
// other and a withdrawal can never leave the goal negative.
export async function deposit(userId: string, goalId: string, amount: number) {
  const { count } = await prisma.goal.updateMany({
    where: { id: goalId, userId, currentAmount: { lte: MAX_AMOUNT_CENTS - amount } },
    data: { currentAmount: { increment: amount } },
  });

  if (count === 0) {
    await findGoalOrThrow(userId, goalId);
    throw new AppError('O valor guardado ultrapassaria o limite permitido', 400);
  }

  return getGoal(userId, goalId);
}

export async function withdraw(userId: string, goalId: string, amount: number) {
  const { count } = await prisma.goal.updateMany({
    where: { id: goalId, userId, currentAmount: { gte: amount } },
    data: { currentAmount: { decrement: amount } },
  });

  if (count === 0) {
    await findGoalOrThrow(userId, goalId);
    throw new AppError('Valor maior que o saldo guardado na meta', 400);
  }

  return getGoal(userId, goalId);
}
