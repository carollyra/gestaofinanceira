import cors from 'cors';
import express from 'express';
import helmet from 'helmet';

import './utils/zod-error-map';

import { errorHandler, notFoundHandler } from './middlewares/error-handler';
import { routes } from './routes';
import { env } from './utils/env';

export function createApp() {
  const app = express();

  app.disable('x-powered-by');
  if (env.NODE_ENV === 'production') {
    // Behind a single reverse proxy (Render, Railway...): needed for correct client IPs
    app.set('trust proxy', 1);
  }
  app.use(helmet());
  app.use(cors({ origin: env.CORS_ORIGIN.split(',').map((origin) => origin.trim()) }));
  app.use(express.json({ limit: '1mb' }));

  app.use('/api', routes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
