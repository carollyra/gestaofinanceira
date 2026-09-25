import { Router } from 'express';

import { accountRoutes } from './account.routes';
import { authRoutes } from './auth.routes';
import { budgetRoutes } from './budget.routes';
import { categoryRoutes } from './category.routes';
import { dashboardRoutes } from './dashboard.routes';
import { goalRoutes } from './goal.routes';
import { recurringTransactionRoutes } from './recurring-transaction.routes';
import { transactionRoutes } from './transaction.routes';
import { transferRoutes } from './transfer.routes';

export const routes = Router();

routes.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

routes.use('/auth', authRoutes);
routes.use('/accounts', accountRoutes);
routes.use('/categories', categoryRoutes);
routes.use('/transactions', transactionRoutes);
routes.use('/recurring-transactions', recurringTransactionRoutes);
routes.use('/budgets', budgetRoutes);
routes.use('/goals', goalRoutes);
routes.use('/dashboard', dashboardRoutes);
routes.use('/transfers', transferRoutes);
