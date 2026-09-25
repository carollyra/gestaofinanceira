import { randomUUID } from 'node:crypto';

import request from 'supertest';
import { expect } from 'vitest';

import { createApp } from '../../src/app';

export const app = createApp();

type Body = Record<string, unknown>;

// A registered user with an authenticated HTTP client and small factories.
// Every test creates its own users, so test files can run in parallel.
export class TestUser {
  private categoryIds?: Map<string, string>;

  constructor(
    readonly id: string,
    readonly email: string,
    readonly token: string,
  ) {}

  get(url: string) {
    return request(app).get(url).set('Authorization', `Bearer ${this.token}`);
  }

  post(url: string, body?: Body) {
    return request(app).post(url).set('Authorization', `Bearer ${this.token}`).send(body);
  }

  patch(url: string, body: Body) {
    return request(app).patch(url).set('Authorization', `Bearer ${this.token}`).send(body);
  }

  delete(url: string) {
    return request(app).delete(url).set('Authorization', `Bearer ${this.token}`);
  }

  // Posts and asserts the expected status, returning the response body
  async create<T = { id: string }>(url: string, body: Body): Promise<T> {
    const response = await this.post(url, body);
    expect(response.status, JSON.stringify(response.body)).toBe(201);
    return response.body as T;
  }

  createAccount(body: Body = {}) {
    return this.create('/api/accounts', {
      name: `Conta ${randomUUID().slice(0, 8)}`,
      type: 'CHECKING',
      ...body,
    });
  }

  createTransaction(body: Body) {
    return this.create('/api/transactions', { description: 'Transação', ...body });
  }

  createTransfer(body: Body) {
    return this.create('/api/transfers', body);
  }

  // Id of one of the default categories created on sign up
  async category(name: string): Promise<string> {
    if (!this.categoryIds) {
      const response = await this.get('/api/categories');
      this.categoryIds = new Map(
        (response.body.data as { id: string; name: string }[]).map((c) => [c.name, c.id]),
      );
    }

    const id = this.categoryIds.get(name);
    if (!id) throw new Error(`Default category not found: ${name}`);
    return id;
  }
}

export async function createTestUser(name = 'Pessoa Teste'): Promise<TestUser> {
  const email = `user.${randomUUID()}@test.dev`;
  const response = await request(app)
    .post('/api/auth/register')
    .send({ name, email, password: 'senha12345' });

  expect(response.status, JSON.stringify(response.body)).toBe(201);

  return new TestUser(response.body.user.id, email, response.body.token);
}
