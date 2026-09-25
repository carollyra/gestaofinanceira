import type { Request, Response } from 'express';

import { idParamSchema } from '../schemas/common.schema';
import { createGoalSchema, goalMovementSchema, updateGoalSchema } from '../schemas/goal.schema';
import * as goalService from '../services/goal.service';
import { getAuthUserId } from '../utils/auth-user';

export async function list(req: Request, res: Response) {
  res.json(await goalService.listGoals(getAuthUserId(req)));
}

export async function show(req: Request, res: Response) {
  const { id } = idParamSchema.parse(req.params);

  res.json(await goalService.getGoal(getAuthUserId(req), id));
}

export async function create(req: Request, res: Response) {
  const input = createGoalSchema.parse(req.body);

  res.status(201).json(await goalService.createGoal(getAuthUserId(req), input));
}

export async function update(req: Request, res: Response) {
  const { id } = idParamSchema.parse(req.params);
  const input = updateGoalSchema.parse(req.body);

  res.json(await goalService.updateGoal(getAuthUserId(req), id, input));
}

export async function remove(req: Request, res: Response) {
  const { id } = idParamSchema.parse(req.params);
  await goalService.deleteGoal(getAuthUserId(req), id);

  res.status(204).end();
}

export async function deposit(req: Request, res: Response) {
  const { id } = idParamSchema.parse(req.params);
  const { amount } = goalMovementSchema.parse(req.body);

  res.json(await goalService.deposit(getAuthUserId(req), id, amount));
}

export async function withdraw(req: Request, res: Response) {
  const { id } = idParamSchema.parse(req.params);
  const { amount } = goalMovementSchema.parse(req.body);

  res.json(await goalService.withdraw(getAuthUserId(req), id, amount));
}
