import request from 'supertest';
import { describe, expect, it } from 'vitest';

import { createApp } from '../src/app';

describe('GET /api/health', () => {
  it('returns ok status', async () => {
    const response = await request(createApp()).get('/api/health');

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('ok');
  });

  it('returns 404 for unknown routes', async () => {
    const response = await request(createApp()).get('/api/unknown');

    expect(response.status).toBe(404);
  });
});
