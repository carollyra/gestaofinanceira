import type { Prisma } from '../generated/prisma/client';
import type {
  CreateTransferInput,
  ListTransfersQuery,
  UpdateTransferInput,
} from '../schemas/transfer.schema';
import { AppError } from '../utils/app-error';
import { formatDateOnly } from '../utils/date';
import { buildPaginationMeta, toSkipTake } from '../utils/pagination';
import { prisma } from '../utils/prisma';

const accountSummarySelect = { id: true, name: true, color: true, type: true } as const;

const transferSelect = {
  id: true,
  amount: true,
  date: true,
  description: true,
  notes: true,
  createdAt: true,
  updatedAt: true,
  fromAccount: { select: accountSummarySelect },
  toAccount: { select: accountSummarySelect },
} satisfies Prisma.TransferSelect;

type TransferRecord = Prisma.TransferGetPayload<{ select: typeof transferSelect }>;

function serialize(transfer: TransferRecord) {
  return { ...transfer, date: formatDateOnly(transfer.date) };
}

// Both accounts must belong to the user; archived accounts cannot receive new movements
async function validateAccounts(userId: string, accountIds: string[]) {
  const accounts = await prisma.account.findMany({
    where: { userId, id: { in: accountIds } },
    select: { id: true, archived: true },
  });

  for (const id of accountIds) {
    const account = accounts.find((a) => a.id === id);

    if (!account) {
      throw new AppError('Conta não encontrada', 404);
    }
    if (account.archived) {
      throw new AppError('Não é possível movimentar uma conta arquivada', 400);
    }
  }
}

export async function listTransfers(userId: string, query: ListTransfersQuery) {
  const where: Prisma.TransferWhereInput = {
    userId,
    ...((query.startDate || query.endDate) && {
      date: {
        ...(query.startDate && { gte: query.startDate }),
        ...(query.endDate && { lte: query.endDate }),
      },
    }),
    ...(query.accountId && {
      OR: [{ fromAccountId: query.accountId }, { toAccountId: query.accountId }],
    }),
  };

  const [total, transfers] = await prisma.$transaction([
    prisma.transfer.count({ where }),
    prisma.transfer.findMany({
      where,
      select: transferSelect,
      orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
      ...toSkipTake(query),
    }),
  ]);

  return { data: transfers.map(serialize), meta: buildPaginationMeta(total, query) };
}

export async function getTransfer(userId: string, transferId: string) {
  const transfer = await prisma.transfer.findFirst({
    where: { id: transferId, userId },
    select: transferSelect,
  });

  if (!transfer) {
    throw new AppError('Transferência não encontrada', 404);
  }

  return serialize(transfer);
}

export async function createTransfer(userId: string, input: CreateTransferInput) {
  await validateAccounts(userId, [input.fromAccountId, input.toAccountId]);

  const transfer = await prisma.transfer.create({
    data: { ...input, userId },
    select: transferSelect,
  });

  return serialize(transfer);
}

export async function updateTransfer(
  userId: string,
  transferId: string,
  input: UpdateTransferInput,
) {
  const current = await prisma.transfer.findFirst({
    where: { id: transferId, userId },
    select: { fromAccountId: true, toAccountId: true },
  });

  if (!current) {
    throw new AppError('Transferência não encontrada', 404);
  }

  const fromAccountId = input.fromAccountId ?? current.fromAccountId;
  const toAccountId = input.toAccountId ?? current.toAccountId;

  if (fromAccountId === toAccountId) {
    throw new AppError('A conta de destino deve ser diferente da conta de origem', 400);
  }

  // Only accounts being changed are checked: editing the amount of an old
  // transfer from a since-archived account is still allowed
  const changedAccounts = [input.fromAccountId, input.toAccountId].filter(
    (id): id is string => id !== undefined,
  );
  if (changedAccounts.length > 0) {
    await validateAccounts(userId, changedAccounts);
  }

  const transfer = await prisma.transfer.update({
    where: { id: transferId, userId },
    data: input,
    select: transferSelect,
  });

  return serialize(transfer);
}

export async function deleteTransfer(userId: string, transferId: string) {
  const { count } = await prisma.transfer.deleteMany({ where: { id: transferId, userId } });

  if (count === 0) {
    throw new AppError('Transferência não encontrada', 404);
  }
}
