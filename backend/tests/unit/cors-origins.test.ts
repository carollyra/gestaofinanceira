import express from 'express';
import request from 'supertest';
import cors from 'cors';
import { describe, expect, it } from 'vitest';

import { createOriginMatcher, resolveCorsOrigins } from '../../src/utils/cors-origins';

describe('resolveCorsOrigins', () => {
  it('splits comma-separated origins, trimming spaces and trailing slashes', () => {
    expect(
      resolveCorsOrigins(' https://financas.vercel.app/ ,https://Financas.com.br', 'production'),
    ).toEqual(['https://financas.vercel.app', 'https://financas.com.br']);
  });

  it('falls back to the local Vite server outside production', () => {
    expect(resolveCorsOrigins(undefined, 'development')).toEqual([
      'http://localhost:5173',
      'http://127.0.0.1:5173',
    ]);
    expect(resolveCorsOrigins('  ', 'test')).toContain('http://localhost:5173');
  });

  it('refuses to start in production without CORS_ORIGIN', () => {
    expect(() => resolveCorsOrigins(undefined, 'production')).toThrow(
      'CORS_ORIGIN is required in production',
    );
  });

  it('rejects entries that are not origins', () => {
    expect(() => resolveCorsOrigins('https://app.vercel.app/login', 'production')).toThrow(
      'Invalid CORS_ORIGIN',
    );
    expect(() => resolveCorsOrigins('app.vercel.app', 'production')).toThrow('Invalid CORS_ORIGIN');
  });
});

describe('createOriginMatcher', () => {
  const allowed = createOriginMatcher(
    resolveCorsOrigins(
      'https://financas.vercel.app,https://financas-*-carol.vercel.app',
      'production',
    ),
  );

  it('matches exact origins, case-insensitively', () => {
    expect(allowed('https://financas.vercel.app')).toBe(true);
    expect(allowed('https://FINANCAS.vercel.app')).toBe(true);
    expect(allowed('http://financas.vercel.app')).toBe(false);
    expect(allowed('https://financas.vercel.app.evil.com')).toBe(false);
  });

  it('matches preview deployments with the wildcard, and nothing broader', () => {
    expect(allowed('https://financas-git-feature-x-carol.vercel.app')).toBe(true);
    expect(allowed('https://financas-abc123-carol.vercel.app')).toBe(true);
    expect(allowed('https://evil.com/?financas--carol.vercel.app')).toBe(false);
    expect(allowed('https://financas-x.y-carol.vercel.app')).toBe(false);
  });
});

describe('CORS headers with the matcher', () => {
  const allowed = createOriginMatcher(['https://financas.vercel.app']);
  const app = express()
    .use(cors({ origin: (origin, cb) => cb(null, !origin || allowed(origin)) }))
    .get('/ping', (_req, res) => {
      res.json({ ok: true });
    });

  it('answers allowed origins with the CORS header', async () => {
    const response = await request(app).get('/ping').set('Origin', 'https://financas.vercel.app');
    expect(response.headers['access-control-allow-origin']).toBe('https://financas.vercel.app');
  });

  it('sends no CORS header to other origins (the browser blocks the response)', async () => {
    const response = await request(app).get('/ping').set('Origin', 'https://evil.example');
    expect(response.headers['access-control-allow-origin']).toBeUndefined();
  });
});
