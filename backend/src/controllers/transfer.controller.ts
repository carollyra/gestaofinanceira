import type { Request, Response } from 'express';

import { idParamSchema } from '../schemas/common.schema';
import {
  createTransferSchema,
  listTransfersQuerySchema,
  updateTransferSchema,
} from '../schemas/transfer.schema';
import * as transferService from '../services/transfer.service';
import { getAuthUserId } from '../utils/auth-user';

export async function list(req: Request, res: Response) {
  const query = listTransfersQuerySchema.parse(req.query);

  res.json(await transferService.listTransfers(getAuthUserId(req), query));
}

export async function show(req: Request, res: Response) {
  const { id } = idParamSchema.parse(req.params);

  res.json(await transferService.getTransfer(getAuthUserId(req), id));
}

export async function create(req: Request, res: Response) {
  const input = createTransferSchema.parse(req.body);

  res.status(201).json(await transferService.createTransfer(getAuthUserId(req), input));
}

export async function update(req: Request, res: Response) {
  const { id } = idParamSchema.parse(req.params);
  const input = updateTransferSchema.parse(req.body);

  res.json(await transferService.updateTransfer(getAuthUserId(req), id, input));
}

export async function remove(req: Request, res: Response) {
  const { id } = idParamSchema.parse(req.params);
  await transferService.deleteTransfer(getAuthUserId(req), id);

  res.status(204).end();
}
