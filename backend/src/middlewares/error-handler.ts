import type { ErrorRequestHandler, RequestHandler } from 'express';
import { MulterError } from 'multer';
import { ZodError, z } from 'zod';

import { Prisma } from '../generated/prisma/client';
import { AppError } from '../utils/app-error';
import { env } from '../utils/env';

export const notFoundHandler: RequestHandler = (_req, res) => {
  res.status(404).json({ message: 'Recurso não encontrado' });
};

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ message: err.message, details: err.details });
    return;
  }

  if (err instanceof ZodError) {
    res.status(400).json({ message: 'Dados inválidos', details: z.flattenError(err).fieldErrors });
    return;
  }

  if (err instanceof MulterError) {
    res.status(err.code === 'LIMIT_FILE_SIZE' ? 413 : 400).json({
      message:
        err.code === 'LIMIT_FILE_SIZE'
          ? 'Arquivo muito grande (máximo de 2 MB)'
          : 'Upload inválido',
    });
    return;
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    // Unique constraint violated (e.g. a concurrent request created the same row)
    if (err.code === 'P2002') {
      res.status(409).json({ message: 'Registro já existe' });
      return;
    }
    // Record to update/delete not found
    if (err.code === 'P2025') {
      res.status(404).json({ message: 'Recurso não encontrado' });
      return;
    }
  }

  // Malformed JSON body
  if (err instanceof SyntaxError && 'status' in err && err.status === 400) {
    res.status(400).json({ message: 'JSON inválido' });
    return;
  }

  if (env.NODE_ENV !== 'test') {
    console.error(err);
  }

  res.status(500).json({ message: 'Erro interno do servidor' });
};
