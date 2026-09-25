import { Router } from 'express';

import * as importController from '../controllers/import.controller';
import { authenticate } from '../middlewares/authenticate';
import { csvUpload } from '../middlewares/upload';

export const importRoutes = Router();

importRoutes.use(authenticate);

importRoutes.post('/preview', csvUpload.single('file'), importController.preview);
importRoutes.post('/confirm', importController.confirm);
