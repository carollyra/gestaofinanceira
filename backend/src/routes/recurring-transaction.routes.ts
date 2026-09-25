import { Router } from 'express';

import * as recurringController from '../controllers/recurring-transaction.controller';
import { authenticate } from '../middlewares/authenticate';

export const recurringTransactionRoutes = Router();

recurringTransactionRoutes.use(authenticate);

recurringTransactionRoutes.get('/', recurringController.list);
recurringTransactionRoutes.post('/', recurringController.create);
recurringTransactionRoutes.post('/generate', recurringController.generate);
recurringTransactionRoutes.get('/:id', recurringController.show);
recurringTransactionRoutes.patch('/:id', recurringController.update);
recurringTransactionRoutes.delete('/:id', recurringController.remove);
