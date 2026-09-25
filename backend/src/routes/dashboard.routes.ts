import { Router } from 'express';

import * as dashboardController from '../controllers/dashboard.controller';
import { authenticate } from '../middlewares/authenticate';

export const dashboardRoutes = Router();

dashboardRoutes.use(authenticate);

dashboardRoutes.get('/summary', dashboardController.summary);
dashboardRoutes.get('/monthly-evolution', dashboardController.monthlyEvolution);
dashboardRoutes.get('/by-category', dashboardController.categoryBreakdown);
