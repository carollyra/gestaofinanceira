import { fakeUser, mockApi } from './render';

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
    const body = init.body ? JSON.parse(String(init.body)) : undefined;
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
          body: init?.body ? JSON.parse(String(init.body)) : undefined,
        })),
  };
}
