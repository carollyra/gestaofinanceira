import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactElement } from 'react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router';

import { AuthProvider } from '@/contexts/AuthProvider';

// Shows the current path so tests can assert redirects
function LocationProbe() {
  const location = useLocation();
  return <div data-testid="location">{location.pathname}</div>;
}

interface Options {
  route?: string;
  state?: unknown;
  path?: string;
}

export function renderWithProviders(
  ui: ReactElement,
  { route = '/', state, path = '*' }: Options = {},
) {
  return {
    user: userEvent.setup(),
    ...render(
      <MemoryRouter initialEntries={[{ pathname: route, state }]}>
        <AuthProvider>
          <Routes>
            <Route path={path} element={ui} />
          </Routes>
          <LocationProbe />
        </AuthProvider>
      </MemoryRouter>,
    ),
  };
}

type Handler = (url: string, init: RequestInit) => { status: number; body?: unknown };

// Replaces fetch with a fake API; returns the mock to inspect calls
export function mockApi(handler: Handler) {
  const fetchMock = vi.fn(async (input: RequestInfo | URL, init: RequestInit = {}) => {
    const { status, body } = handler(String(input), init);
    return new Response(body === undefined ? null : JSON.stringify(body), {
      status,
      headers: { 'Content-Type': 'application/json' },
    });
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

export const fakeUser = {
  id: '01a0d063-b433-77a3-bd86-868f88c12daf',
  name: 'Ana Souza',
  email: 'ana@example.com',
  createdAt: '2026-09-25T00:00:00.000Z',
};
