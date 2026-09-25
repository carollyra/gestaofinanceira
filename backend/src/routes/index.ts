import { Router } from 'express';

import { accountRoutes } from './account.routes';
import { authRoutes } from './auth.routes';
import { categoryRoutes } from './category.routes';
import { transferRoutes } from './transfer.routes';

export const routes = Router();

routes.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

routes.use('/auth', authRoutes);
routes.use('/accounts', accountRoutes);
routes.use('/categories', categoryRoutes);
routes.use('/transfers', transferRoutes);
