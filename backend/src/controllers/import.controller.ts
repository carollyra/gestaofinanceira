import type { Request, Response } from 'express';

import { confirmImportSchema, previewImportSchema } from '../schemas/import.schema';
import * as importService from '../services/import.service';
import { AppError } from '../utils/app-error';
import { getAuthUserId } from '../utils/auth-user';

export async function preview(req: Request, res: Response) {
  if (!req.file) {
    throw new AppError('Envie um arquivo CSV no campo "file"', 400);
  }

  const input = previewImportSchema.parse(req.body);

  res.json(await importService.previewImport(getAuthUserId(req), req.file.buffer, input));
}

export async function confirm(req: Request, res: Response) {
  const input = confirmImportSchema.parse(req.body);

  res.status(201).json(await importService.confirmImport(getAuthUserId(req), input));
}
