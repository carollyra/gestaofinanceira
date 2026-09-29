const DEV_ORIGINS = ['http://localhost:5173', 'http://127.0.0.1:5173'];

// Origin form only: scheme + host (+ port), no path. "*" matches one or more
// characters of a subdomain label, e.g. https://financas-*.vercel.app for
// Vercel preview deployments.
const ORIGIN_PATTERN = /^https?:\/\/[a-z0-9*.-]+(:\d+)?$/;

// CORS_ORIGIN="https://app.example.com, https://financas-*.vercel.app"
// Without it, development falls back to the local Vite server; production
// refuses to start, so a missing value never silently blocks the frontend.
export function resolveCorsOrigins(value: string | undefined, nodeEnv: string): string[] {
  const origins = (value ?? '')
    .split(',')
    .map((origin) => origin.trim().toLowerCase().replace(/\/+$/, ''))
    .filter(Boolean);

  if (origins.length === 0) {
    if (nodeEnv === 'production') {
      throw new Error(
        'CORS_ORIGIN is required in production (comma-separated list of allowed origins)',
      );
    }
    return DEV_ORIGINS;
  }

  const invalid = origins.filter((origin) => !ORIGIN_PATTERN.test(origin));
  if (invalid.length > 0) {
    throw new Error(
      `Invalid CORS_ORIGIN entries: ${invalid.join(', ')}. Use scheme and host only, e.g. https://app.vercel.app`,
    );
  }

  return origins;
}

function toMatcher(origin: string): (candidate: string) => boolean {
  if (!origin.includes('*')) return (candidate) => candidate === origin;

  const pattern = origin
    .split('*')
    .map((part) => part.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&'))
    .join('[a-z0-9-]+');
  const regex = new RegExp(`^${pattern}$`);
  return (candidate) => regex.test(candidate);
}

export function createOriginMatcher(origins: string[]) {
  const matchers = origins.map(toMatcher);
  return (origin: string) => {
    const normalized = origin.toLowerCase();
    return matchers.some((matches) => matches(normalized));
  };
}
