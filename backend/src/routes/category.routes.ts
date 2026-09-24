import { Router } from 'express';

import * as categoryController from '../controllers/category.controller';
import { authenticate } from '../middlewares/authenticate';

export const categoryRoutes = Router();

categoryRoutes.use(authenticate);

categoryRoutes.get('/', categoryController.list);
categoryRoutes.post('/', categoryController.create);
categoryRoutes.get('/:id', categoryController.show);
categoryRoutes.patch('/:id', categoryController.update);
categoryRoutes.delete('/:id', categoryController.remove);
