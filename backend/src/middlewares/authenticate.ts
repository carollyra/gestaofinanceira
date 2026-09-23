import type { RequestHandler } from 'express';

import { AppError } from '../utils/app-error';
import { verifyToken } from '../utils/jwt';

export const authenticate: RequestHandler = (req, _res, next) => {
  const [scheme, token] = req.headers.authorization?.split(' ') ?? [];

  if (scheme !== 'Bearer' || !token) {
    throw new AppError('Token de autenticação ausente', 401);
  }

  const userId = verifyToken(token);

  if (!userId) {
    throw new AppError('Token inválido ou expirado', 401);
  }

  req.userId = userId;
  next();
};
