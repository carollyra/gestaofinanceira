import type { Request, Response } from 'express';

import {
  copyBudgetsSchema,
  createBudgetSchema,
  listBudgetsQuerySchema,
  updateBudgetSchema,
} from '../schemas/budget.schema';
import { idParamSchema } from '../schemas/common.schema';
import * as budgetService from '../services/budget.service';
import { getAuthUserId } from '../utils/auth-user';

export async function list(req: Request, res: Response) {
  const { month } = listBudgetsQuerySchema.parse(req.query);

  res.json(await budgetService.listBudgets(getAuthUserId(req), month));
}

export async function show(req: Request, res: Response) {
  const { id } = idParamSchema.parse(req.params);

  res.json(await budgetService.getBudget(getAuthUserId(req), id));
}

export async function create(req: Request, res: Response) {
  const input = createBudgetSchema.parse(req.body);

  res.status(201).json(await budgetService.createBudget(getAuthUserId(req), input));
}

export async function update(req: Request, res: Response) {
  const { id } = idParamSchema.parse(req.params);
  const input = updateBudgetSchema.parse(req.body);

  res.json(await budgetService.updateBudget(getAuthUserId(req), id, input));
}

export async function remove(req: Request, res: Response) {
  const { id } = idParamSchema.parse(req.params);
  await budgetService.deleteBudget(getAuthUserId(req), id);

  res.status(204).end();
}

export async function copy(req: Request, res: Response) {
  const input = copyBudgetsSchema.parse(req.body);

  res.status(201).json(await budgetService.copyBudgets(getAuthUserId(req), input));
}
