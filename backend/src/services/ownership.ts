import type { TransactionType } from '../generated/prisma/enums';
import { AppError } from '../utils/app-error';
import { prisma } from '../utils/prisma';

// Checks shared by transactions, recurring transactions and transfers.
// Ownership is also enforced by composite foreign keys; these checks exist to
// return clear 404/400 errors instead of a constraint violation.

export async function assertActiveAccount(userId: string, accountId: string) {
  const account = await prisma.account.findFirst({
    where: { id: accountId, userId },
    select: { archived: true },
  });

  if (!account) {
    throw new AppError('Conta não encontrada', 404);
  }
  if (account.archived) {
    throw new AppError('Não é possível movimentar uma conta arquivada', 400);
  }
}

export async function assertCategoryMatchesType(
  userId: string,
  categoryId: string,
  type: TransactionType,
) {
  const category = await prisma.category.findFirst({
    where: { id: categoryId, userId },
    select: { type: true },
  });

  if (!category) {
    throw new AppError('Categoria não encontrada', 404);
  }
  if (category.type !== type) {
    throw new AppError(
      type === 'INCOME'
        ? 'Uma receita precisa de uma categoria de receita'
        : 'Uma despesa precisa de uma categoria de despesa',
      400,
    );
  }
}
