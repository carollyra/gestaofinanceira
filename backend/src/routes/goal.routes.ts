import { Router } from 'express';

import * as goalController from '../controllers/goal.controller';
import { authenticate } from '../middlewares/authenticate';

export const goalRoutes = Router();

goalRoutes.use(authenticate);

goalRoutes.get('/', goalController.list);
goalRoutes.post('/', goalController.create);
goalRoutes.get('/:id', goalController.show);
goalRoutes.patch('/:id', goalController.update);
goalRoutes.delete('/:id', goalController.remove);
goalRoutes.post('/:id/deposit', goalController.deposit);
goalRoutes.post('/:id/withdraw', goalController.withdraw);
