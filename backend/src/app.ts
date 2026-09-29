import cors from 'cors';
import express from 'express';
import helmet from 'helmet';

import './utils/zod-error-map';

import { errorHandler, notFoundHandler } from './middlewares/error-handler';
import { routes } from './routes';
import { createOriginMatcher, resolveCorsOrigins } from './utils/cors-origins';
import { env } from './utils/env';

export function createApp() {
  const app = express();

  app.disable('x-powered-by');
  if (env.NODE_ENV === 'production') {
    // Behind a single reverse proxy (Render, Railway...): needed for correct client IPs
    app.set('trust proxy', 1);
  }
  app.use(helmet());
  // Requests without an Origin header (health checks, curl, server-to-server)
  // are not subject to CORS; browsers from other origins get no CORS headers
  const isAllowedOrigin = createOriginMatcher(resolveCorsOrigins(env.CORS_ORIGIN, env.NODE_ENV));
  app.use(
    cors({
      origin: (origin, callback) => callback(null, !origin || isAllowedOrigin(origin)),
      // Browsers may cache the preflight answer for 10 minutes
      maxAge: 600,
    }),
  );
  app.use(express.json({ limit: '1mb' }));

  app.use('/api', routes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
