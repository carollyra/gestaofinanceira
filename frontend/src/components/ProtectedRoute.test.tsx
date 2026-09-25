import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router';

import { AuthProvider } from '@/contexts/AuthProvider';
import { useAuth } from '@/hooks/useAuth';
import { apiRequest } from '@/services/api';
import { fakeUser, mockApi } from '@/test/render';

import { ProtectedRoute } from './ProtectedRoute';
import { PublicOnlyRoute } from './PublicOnlyRoute';

function Private() {
  const { user } = useAuth();
  return <p>Área privada de {user?.name}</p>;
}

function renderApp(route: string) {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <AuthProvider>
        <Routes>
          <Route element={<PublicOnlyRoute />}>
            <Route path="/login" element={<p>Tela de login</p>} />
          </Route>
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<Private />} />
          </Route>
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  );
}

describe('route guards', () => {
  it('redirects to login without a session', async () => {
    const fetchMock = mockApi(() => ({ status: 500 }));
    renderApp('/');

    expect(await screen.findByText('Tela de login')).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('restores the session from a stored token after checking it with the API', async () => {
    localStorage.setItem('financas:token', 'valid-token');
    const fetchMock = mockApi(() => ({ status: 200, body: { user: fakeUser } }));
    renderApp('/');

    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(await screen.findByText('Área privada de Ana Souza')).toBeInTheDocument();

    const [url, init] = fetchMock.mock.calls[0]!;
    expect(String(url)).toMatch(/\/auth\/me$/);
    expect((init?.headers as Record<string, string>).Authorization).toBe('Bearer valid-token');
  });

  it('drops an invalid stored token and goes to login', async () => {
    localStorage.setItem('financas:token', 'expired-token');
    mockApi(() => ({ status: 401, body: { message: 'Token inválido ou expirado' } }));
    renderApp('/');

    expect(await screen.findByText('Tela de login')).toBeInTheDocument();
    expect(localStorage.getItem('financas:token')).toBeNull();
  });

  it('sends logged users away from the login page', async () => {
    localStorage.setItem('financas:token', 'valid-token');
    mockApi(() => ({ status: 200, body: { user: fakeUser } }));
    renderApp('/login');

    expect(await screen.findByText('Área privada de Ana Souza')).toBeInTheDocument();
  });

  it('logs out when any request returns 401 during the session', async () => {
    localStorage.setItem('financas:token', 'valid-token');
    let expired = false;
    mockApi(() =>
      expired
        ? { status: 401, body: { message: 'Token inválido ou expirado' } }
        : { status: 200, body: { user: fakeUser } },
    );
    renderApp('/');
    await screen.findByText('Área privada de Ana Souza');

    expired = true;
    await expect(apiRequest('/accounts')).rejects.toThrow('Token inválido ou expirado');

    expect(await screen.findByText('Tela de login')).toBeInTheDocument();
    expect(localStorage.getItem('financas:token')).toBeNull();
  });
});
