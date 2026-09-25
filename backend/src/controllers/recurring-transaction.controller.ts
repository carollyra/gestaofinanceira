import type { Request, Response } from 'express';

import { idParamSchema } from '../schemas/common.schema';
import {
  createRecurringSchema,
  listRecurringQuerySchema,
  updateRecurringSchema,
} from '../schemas/recurring-transaction.schema';
import { generateDueRecurringTransactions } from '../services/recurring-generator.service';
import * as recurringService from '../services/recurring-transaction.service';
import { getAuthUserId } from '../utils/auth-user';

export async function list(req: Request, res: Response) {
  const query = listRecurringQuerySchema.parse(req.query);

  res.json(await recurringService.listRecurring(getAuthUserId(req), query));
}

export async function show(req: Request, res: Response) {
  const { id } = idParamSchema.parse(req.params);

  res.json(await recurringService.getRecurring(getAuthUserId(req), id));
}

export async function create(req: Request, res: Response) {
  const input = createRecurringSchema.parse(req.body);

  res.status(201).json(await recurringService.createRecurring(getAuthUserId(req), input));
}

export async function update(req: Request, res: Response) {
  const { id } = idParamSchema.parse(req.params);
  const input = updateRecurringSchema.parse(req.body);

  res.json(await recurringService.updateRecurring(getAuthUserId(req), id, input));
}

export async function remove(req: Request, res: Response) {
  const { id } = idParamSchema.parse(req.params);
  await recurringService.deleteRecurring(getAuthUserId(req), id);

  res.status(204).end();
}

// Generates the due occurrences of the logged user's templates (safe to call repeatedly)
export async function generate(req: Request, res: Response) {
  const { created } = await generateDueRecurringTransactions({ userId: getAuthUserId(req) });

  res.json({ created });
}
