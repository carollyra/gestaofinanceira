import { rateLimit } from 'express-rate-limit';

import { env } from '../utils/env';

// Brute-force protection for login and sign up
export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  skip: () => env.NODE_ENV === 'test',
  message: { message: 'Muitas tentativas. Tente novamente em alguns minutos.' },
});
