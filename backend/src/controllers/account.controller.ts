import type { Request, Response } from 'express';

import {
  createAccountSchema,
  listAccountsQuerySchema,
  updateAccountSchema,
} from '../schemas/account.schema';
import { idParamSchema } from '../schemas/common.schema';
import * as accountService from '../services/account.service';
import { getAuthUserId } from '../utils/auth-user';

export async function list(req: Request, res: Response) {
  const { includeArchived } = listAccountsQuerySchema.parse(req.query);
  const data = await accountService.listAccounts(getAuthUserId(req), includeArchived);

  res.json({ data });
}

export async function show(req: Request, res: Response) {
  const { id } = idParamSchema.parse(req.params);

  res.json(await accountService.getAccount(getAuthUserId(req), id));
}

export async function create(req: Request, res: Response) {
  const input = createAccountSchema.parse(req.body);

  res.status(201).json(await accountService.createAccount(getAuthUserId(req), input));
}

export async function update(req: Request, res: Response) {
  const { id } = idParamSchema.parse(req.params);
  const input = updateAccountSchema.parse(req.body);

  res.json(await accountService.updateAccount(getAuthUserId(req), id, input));
}

export async function remove(req: Request, res: Response) {
  const { id } = idParamSchema.parse(req.params);
  await accountService.deleteAccount(getAuthUserId(req), id);

  res.status(204).end();
}
