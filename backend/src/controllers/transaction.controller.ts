import type { Request, Response } from 'express';

import { idParamSchema } from '../schemas/common.schema';
import {
  createTransactionSchema,
  listTransactionsQuerySchema,
  updateTransactionSchema,
} from '../schemas/transaction.schema';
import * as transactionService from '../services/transaction.service';
import { getAuthUserId } from '../utils/auth-user';

export async function list(req: Request, res: Response) {
  const query = listTransactionsQuerySchema.parse(req.query);

  res.json(await transactionService.listTransactions(getAuthUserId(req), query));
}

export async function show(req: Request, res: Response) {
  const { id } = idParamSchema.parse(req.params);

  res.json(await transactionService.getTransaction(getAuthUserId(req), id));
}

export async function create(req: Request, res: Response) {
  const input = createTransactionSchema.parse(req.body);

  res.status(201).json(await transactionService.createTransaction(getAuthUserId(req), input));
}

export async function update(req: Request, res: Response) {
  const { id } = idParamSchema.parse(req.params);
  const input = updateTransactionSchema.parse(req.body);

  res.json(await transactionService.updateTransaction(getAuthUserId(req), id, input));
}

export async function remove(req: Request, res: Response) {
  const { id } = idParamSchema.parse(req.params);
  await transactionService.deleteTransaction(getAuthUserId(req), id);

  res.status(204).end();
}
