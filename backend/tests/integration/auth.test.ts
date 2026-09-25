import request from 'supertest';
import { describe, expect, it } from 'vitest';

import { app, createTestUser } from './helpers';

describe('auth flow', () => {
  it('signs up with the default categories and logs in', async () => {
    const user = await createTestUser();

    const categories = await user.get('/api/categories');
    expect(categories.body.data).toHaveLength(19);

    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: user.email, password: 'senha12345' });
    expect(login.status).toBe(200);

    const me = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${login.body.token}`);
    expect(me.body.user).toMatchObject({ id: user.id, email: user.email });
    expect(me.body.user).not.toHaveProperty('passwordHash');
  });

  it('normalizes the e-mail and rejects duplicates regardless of case', async () => {
    const user = await createTestUser();

    const duplicate = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Outra', email: `  ${user.email.toUpperCase()} `, password: 'senha12345' });

    expect(duplicate.status).toBe(409);
  });

  it('gives the same answer for a wrong password and an unknown e-mail', async () => {
    const user = await createTestUser();

    const wrongPassword = await request(app)
      .post('/api/auth/login')
      .send({ email: user.email, password: 'errada123' });
    const unknownEmail = await request(app)
      .post('/api/auth/login')
      .send({ email: `x${user.email}`, password: 'errada123' });

    expect(wrongPassword.status).toBe(401);
    expect(unknownEmail.status).toBe(401);
    expect(wrongPassword.body).toEqual(unknownEmail.body);
  });
});
