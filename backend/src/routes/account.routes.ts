import { Router } from 'express';

import * as accountController from '../controllers/account.controller';
import { authenticate } from '../middlewares/authenticate';

export const accountRoutes = Router();

accountRoutes.use(authenticate);

accountRoutes.get('/', accountController.list);
accountRoutes.post('/', accountController.create);
accountRoutes.get('/:id', accountController.show);
accountRoutes.patch('/:id', accountController.update);
accountRoutes.delete('/:id', accountController.remove);
