import { Router } from 'express';

import * as authController from '../controllers/auth.controller';
import { authenticate } from '../middlewares/authenticate';
import { authRateLimit } from '../middlewares/rate-limit';

export const authRoutes = Router();

authRoutes.post('/register', authRateLimit, authController.register);
authRoutes.post('/login', authRateLimit, authController.login);
authRoutes.get('/me', authenticate, authController.me);
