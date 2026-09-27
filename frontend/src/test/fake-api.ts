import { fakeUser, mockApi } from './render';

// JSON bodies are parsed; multipart uploads stay as FormData
function parseBody(body: BodyInit | null | undefined): unknown {
  if (!body) return undefined;
  if (body instanceof FormData) return body;
  return JSON.parse(String(body));
}

type Route = (ctx: {
  url: URL;
  method: string;
  body: unknown;
}) => { status: number; body?: unknown } | undefined;

// Small router over mockApi: first matching handler wins; /auth/me is built in.
// Returns a helper to inspect the requests sent with a given method.
export function fakeApi(...routes: Route[]) {
  localStorage.setItem('financas:token', 'token');
  const fetchMock = mockApi((rawUrl, init) => {
    const url = new URL(rawUrl);
    const method = init.method ?? 'GET';
    const body = parseBody(init.body);
    if (url.pathname.endsWith('/auth/me')) return { status: 200, body: { user: fakeUser } };
    for (const route of routes) {
      const response = route({ url, method, body });
      if (response) return response;
    }
    return { status: 404, body: { message: 'Não encontrado' } };
  });

  return {
    requests: (method: string, pathIncludes = '') =>
      fetchMock.mock.calls
        .filter(
          ([u, init]) => (init?.method ?? 'GET') === method && String(u).includes(pathIncludes),
        )
        .map(([u, init]) => ({
          url: new URL(String(u)),
          body: parseBody(init?.body),
        })),
  };
}
