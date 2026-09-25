import { Router } from 'express';

import * as transferController from '../controllers/transfer.controller';
import { authenticate } from '../middlewares/authenticate';

export const transferRoutes = Router();

transferRoutes.use(authenticate);

transferRoutes.get('/', transferController.list);
transferRoutes.post('/', transferController.create);
transferRoutes.get('/:id', transferController.show);
transferRoutes.patch('/:id', transferController.update);
transferRoutes.delete('/:id', transferController.remove);
