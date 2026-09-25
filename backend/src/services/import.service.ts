import type { Prisma } from '../generated/prisma/client';
import type { ConfirmImportInput, PreviewImportInput } from '../schemas/import.schema';
import { AppError } from '../utils/app-error';
import { decodeCsvBuffer } from '../utils/csv/decode';
import {
  type DuplicateCandidate,
  type ExistingTransaction,
  findDuplicates,
} from '../utils/csv/duplicates';
import { CsvFormatError, parseStatementCsv } from '../utils/csv/statement-parser';
import { addDays, formatDateOnly } from '../utils/date';
import { prisma } from '../utils/prisma';
import { createCategorizer } from './categorizer';
import { assertActiveAccount } from './ownership';

type Db = Prisma.TransactionClient | typeof prisma;

// Transactions of the account around the imported period, to compare against
async function loadExistingTransactions(
  db: Db,
  userId: string,
  accountId: string,
  candidates: DuplicateCandidate[],
): Promise<ExistingTransaction[]> {
  if (candidates.length === 0) return [];

  const times = candidates.map((c) => c.date.getTime());

  return db.transaction.findMany({
    where: {
      userId,
      accountId,
      date: {
        gte: addDays(new Date(Math.min(...times)), -2),
        lte: addDays(new Date(Math.max(...times)), 2),
      },
    },
    select: { id: true, date: true, amount: true, type: true, description: true },
    orderBy: [{ date: 'asc' }, { id: 'asc' }],
  });
}

export async function previewImport(userId: string, file: Buffer, input: PreviewImportInput) {
  await assertActiveAccount(userId, input.accountId);

  const { content, encoding } = decodeCsvBuffer(file);

  let parsed;
  try {
    parsed = parseStatementCsv(content, { mapping: input.mapping, invertSign: input.invertSign });
  } catch (error) {
    if (error instanceof CsvFormatError) throw new AppError(error.message, 400);
    throw error;
  }

  const candidates = parsed.rows.map((row): DuplicateCandidate | null =>
    row.status === 'VALID'
      ? { date: row.date!, amount: row.amount!, type: row.type!, description: row.description }
      : null,
  );

  const [existing, suggest, categories] = await Promise.all([
    loadExistingTransactions(
      prisma,
      userId,
      input.accountId,
      candidates.filter((c) => c !== null),
    ),
    createCategorizer(userId),
    prisma.category.findMany({
      where: { userId },
      select: { id: true, name: true, color: true, icon: true },
    }),
  ]);

  const duplicates = findDuplicates(candidates, existing);
  const categoryById = new Map(categories.map((c) => [c.id, c]));

  const rows = parsed.rows.map((row, i) => {
    const suggestion =
      row.status === 'VALID' ? suggest(row.description, row.type!, row.categoryName) : null;
    const category = suggestion && categoryById.get(suggestion.categoryId);

    return {
      rowNumber: row.rowNumber,
      status: row.status,
      errors: row.errors,
      date: row.date && formatDateOnly(row.date),
      description: row.description,
      amount: row.amount,
      type: row.type,
      notes: row.notes,
      category: category ? { ...category, source: suggestion.source } : null,
      duplicate: duplicates[i] ?? null,
    };
  });

  const valid = rows.filter((row) => row.status === 'VALID');
  const sumOf = (type: 'INCOME' | 'EXPENSE') =>
    valid.filter((row) => row.type === type).reduce((sum, row) => sum + (row.amount ?? 0), 0);

  return {
    detected: {
      encoding,
      delimiter: parsed.delimiter,
      headers: parsed.headers,
      mapping: parsed.mapping,
    },
    summary: {
      total: rows.length,
      valid: valid.length,
      invalid: rows.filter((row) => row.status === 'INVALID').length,
      ignored: rows.filter((row) => row.status === 'IGNORED').length,
      duplicates: valid.filter((row) => row.duplicate?.status === 'EXACT').length,
      possibleDuplicates: valid.filter((row) => row.duplicate?.status === 'POSSIBLE').length,
      categorized: valid.filter((row) => row.category).length,
      income: sumOf('INCOME'),
      expense: sumOf('EXPENSE'),
    },
    rows,
  };
}

export async function confirmImport(userId: string, input: ConfirmImportInput) {
  await assertActiveAccount(userId, input.accountId);

  // The preview is never trusted: categories are re-validated here
  const categories = await prisma.category.findMany({
    where: { userId },
    select: { id: true, type: true },
  });
  const categoryType = new Map(categories.map((c) => [c.id, c.type]));

  input.rows.forEach((row, i) => {
    if (!row.categoryId) return;
    const type = categoryType.get(row.categoryId);
    if (!type) {
      throw new AppError(`Linha ${i + 1}: categoria não encontrada`, 400);
    }
    if (type !== row.type) {
      throw new AppError(`Linha ${i + 1}: a categoria não corresponde ao tipo da transação`, 400);
    }
  });

  return prisma.$transaction(async (tx) => {
    // Serializes imports into the same account: a concurrent or repeated
    // confirmation waits here, then sees the rows inserted by the first one
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${input.accountId}))`;

    let rows = input.rows;

    if (input.skipDuplicates) {
      const existing = await loadExistingTransactions(tx, userId, input.accountId, rows);
      const duplicates = findDuplicates(rows, existing);
      rows = rows.filter((_, i) => duplicates[i]?.status !== 'EXACT');
    }

    const { count } = await tx.transaction.createMany({
      data: rows.map((row) => ({
        userId,
        accountId: input.accountId,
        categoryId: row.categoryId ?? null,
        type: row.type,
        amount: row.amount,
        date: row.date,
        description: row.description,
        notes: row.notes ?? null,
      })),
    });

    return { created: count, skipped: input.rows.length - count };
  });
}
