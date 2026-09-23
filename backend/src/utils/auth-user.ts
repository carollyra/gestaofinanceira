import type { Request } from 'express';

import { AppError } from './app-error';

// For handlers mounted behind `authenticate`
export function getAuthUserId(req: Request): string {
  if (!req.userId) {
    throw new AppError('Não autenticado', 401);
  }

  return req.userId;
}
