import type { TransactionType } from '../generated/prisma/enums';
import type { CreateCategoryInput, UpdateCategoryInput } from '../schemas/category.schema';
import { AppError } from '../utils/app-error';
import { prisma } from '../utils/prisma';

const categorySelect = {
  id: true,
  name: true,
  type: true,
  color: true,
  icon: true,
  createdAt: true,
  updatedAt: true,
  _count: { select: { transactions: true } },
} as const;

async function findCategory(userId: string, categoryId: string) {
  const category = await prisma.category.findFirst({
    where: { id: categoryId, userId },
    select: { id: true, type: true },
  });

  if (!category) {
    throw new AppError('Categoria não encontrada', 404);
  }

  return category;
}

async function ensureNameAvailable(
  userId: string,
  type: TransactionType,
  name: string,
  ignoreId?: string,
) {
  const duplicate = await prisma.category.findFirst({
    where: {
      userId,
      type,
      name: { equals: name, mode: 'insensitive' },
      ...(ignoreId && { id: { not: ignoreId } }),
    },
    select: { id: true },
  });

  if (duplicate) {
    throw new AppError('Já existe uma categoria com esse nome', 409);
  }
}

export function listCategories(userId: string, type?: TransactionType) {
  return prisma.category.findMany({
    where: { userId, ...(type && { type }) },
    select: categorySelect,
    orderBy: [{ type: 'asc' }, { name: 'asc' }],
  });
}

export async function getCategory(userId: string, categoryId: string) {
  const category = await prisma.category.findFirst({
    where: { id: categoryId, userId },
    select: categorySelect,
  });

  if (!category) {
    throw new AppError('Categoria não encontrada', 404);
  }

  return category;
}

export async function createCategory(userId: string, input: CreateCategoryInput) {
  await ensureNameAvailable(userId, input.type, input.name);

  return prisma.category.create({
    data: { ...input, userId },
    select: categorySelect,
  });
}

export async function updateCategory(
  userId: string,
  categoryId: string,
  input: UpdateCategoryInput,
) {
  const category = await findCategory(userId, categoryId);

  if (input.name) {
    await ensureNameAvailable(userId, category.type, input.name, categoryId);
  }

  return prisma.category.update({
    where: { id: categoryId, userId },
    data: input,
    select: categorySelect,
  });
}

export async function deleteCategory(userId: string, categoryId: string, replaceWith?: string) {
  const category = await findCategory(userId, categoryId);

  if (replaceWith) {
    if (replaceWith === categoryId) {
      throw new AppError('A categoria substituta deve ser diferente da excluída', 400);
    }

    const replacement = await findCategory(userId, replaceWith);

    if (replacement.type !== category.type) {
      throw new AppError('A categoria substituta deve ser do mesmo tipo', 400);
    }
  }

  const newCategoryId = replaceWith ?? null;

  // Budgets of the deleted category are removed by ON DELETE CASCADE
  await prisma.$transaction([
    prisma.transaction.updateMany({
      where: { userId, categoryId },
      data: { categoryId: newCategoryId },
    }),
    prisma.recurringTransaction.updateMany({
      where: { userId, categoryId },
      data: { categoryId: newCategoryId },
    }),
    prisma.category.delete({ where: { id: categoryId, userId } }),
  ]);
}
