import request from 'supertest';
import { describe, expect, it } from 'vitest';

import { createApp } from '../src/app';
import { signToken } from '../src/utils/jwt';

const app = createApp();

describe('authenticate middleware (GET /api/auth/me)', () => {
  it('returns 401 without Authorization header', async () => {
    const response = await request(app).get('/api/auth/me');

    expect(response.status).toBe(401);
    expect(response.body.message).toBe('Token de autenticação ausente');
  });

  it('returns 401 with a non-Bearer scheme', async () => {
    const response = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Basic ${signToken('user-1')}`);

    expect(response.status).toBe(401);
  });

  it('returns 401 with an invalid token', async () => {
    const response = await request(app).get('/api/auth/me').set('Authorization', 'Bearer invalid');

    expect(response.status).toBe(401);
    expect(response.body.message).toBe('Token inválido ou expirado');
  });
});

describe('auth input validation', () => {
  it('rejects sign up with invalid fields', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({ name: 'A', email: 'not-an-email', password: '123' });

    expect(response.status).toBe(400);
    expect(Object.keys(response.body.details)).toEqual(
      expect.arrayContaining(['name', 'email', 'password']),
    );
  });

  it('rejects passwords longer than 72 bytes', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      // Meets every other rule: 'á' takes 2 bytes, so 40 of them + a digit = 81 bytes
      .send({ name: 'Ana', email: 'ana@example.com', password: `${'á'.repeat(40)}1` });

    expect(response.status).toBe(400);
    expect(response.body.details.password).toEqual(['Senha muito longa']);
  });

  it('rejects login without password', async () => {
    const response = await request(app).post('/api/auth/login').send({ email: 'ana@example.com' });

    expect(response.status).toBe(400);
    expect(response.body.details.password).toEqual(['Campo obrigatório']);
  });

  it('returns 400 for malformed JSON', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .set('Content-Type', 'application/json')
      .send('{"email":');

    expect(response.status).toBe(400);
    expect(response.body.message).toBe('JSON inválido');
  });
});
