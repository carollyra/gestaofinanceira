import jwt, { type SignOptions } from 'jsonwebtoken';

import { env } from './env';

const ALGORITHM = 'HS256';

interface TokenPayload {
  sub: string;
}

export function signToken(userId: string) {
  return jwt.sign({}, env.JWT_SECRET, {
    subject: userId,
    algorithm: ALGORITHM,
    expiresIn: env.JWT_EXPIRES_IN as SignOptions['expiresIn'],
  });
}

// Returns the user id, or null when the token is invalid or expired
export function verifyToken(token: string): string | null {
  try {
    const payload = jwt.verify(token, env.JWT_SECRET, { algorithms: [ALGORITHM] });

    if (typeof payload === 'string' || typeof payload.sub !== 'string') {
      return null;
    }

    return (payload as TokenPayload).sub;
  } catch {
    return null;
  }
}
