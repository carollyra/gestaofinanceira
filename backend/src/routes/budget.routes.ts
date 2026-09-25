import { Router } from 'express';

import * as budgetController from '../controllers/budget.controller';
import { authenticate } from '../middlewares/authenticate';

export const budgetRoutes = Router();

budgetRoutes.use(authenticate);

budgetRoutes.get('/', budgetController.list);
budgetRoutes.post('/', budgetController.create);
budgetRoutes.post('/copy', budgetController.copy);
budgetRoutes.get('/:id', budgetController.show);
budgetRoutes.patch('/:id', budgetController.update);
budgetRoutes.delete('/:id', budgetController.remove);
