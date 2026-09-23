import type { ErrorRequestHandler, RequestHandler } from 'express';
import { ZodError, z } from 'zod';

import { AppError } from '../utils/app-error';
import { env } from '../utils/env';

export const notFoundHandler: RequestHandler = (_req, res) => {
  res.status(404).json({ message: 'Resource not found' });
};

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ message: err.message, details: err.details });
    return;
  }

  if (err instanceof ZodError) {
    res
      .status(400)
      .json({ message: 'Validation failed', details: z.flattenError(err).fieldErrors });
    return;
  }

  if (env.NODE_ENV !== 'test') {
    console.error(err);
  }

  res.status(500).json({ message: 'Internal server error' });
};
