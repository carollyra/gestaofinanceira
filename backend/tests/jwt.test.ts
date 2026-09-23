import jwt from 'jsonwebtoken';
import { describe, expect, it } from 'vitest';

import { signToken, verifyToken } from '../src/utils/jwt';

describe('jwt utils', () => {
  it('signs a token that resolves back to the user id', () => {
    const token = signToken('user-123');

    expect(verifyToken(token)).toBe('user-123');
  });

  it('rejects a token signed with another secret', () => {
    const token = jwt.sign({}, 'another-secret-with-at-least-thirty-two-chars', {
      subject: 'user-123',
    });

    expect(verifyToken(token)).toBeNull();
  });

  it('rejects an expired token', () => {
    const token = jwt.sign({}, process.env.JWT_SECRET!, { subject: 'user-123', expiresIn: -10 });

    expect(verifyToken(token)).toBeNull();
  });

  it('rejects unsigned tokens (alg: none)', () => {
    const token = jwt.sign({}, '', { subject: 'user-123', algorithm: 'none' });

    expect(verifyToken(token)).toBeNull();
  });

  it('rejects garbage', () => {
    expect(verifyToken('not-a-jwt')).toBeNull();
  });
});
