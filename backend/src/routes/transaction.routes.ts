import { Router } from 'express';

import * as transactionController from '../controllers/transaction.controller';
import { authenticate } from '../middlewares/authenticate';

export const transactionRoutes = Router();

transactionRoutes.use(authenticate);

transactionRoutes.get('/', transactionController.list);
transactionRoutes.post('/', transactionController.create);
transactionRoutes.get('/:id', transactionController.show);
transactionRoutes.patch('/:id', transactionController.update);
transactionRoutes.delete('/:id', transactionController.remove);
