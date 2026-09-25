import { screen } from '@testing-library/react';

import { fakeUser, mockApi, renderWithProviders } from '@/test/render';

import { LoginPage } from './LoginPage';

describe('LoginPage', () => {
  it('shows the API message on invalid credentials', async () => {
    mockApi(() => ({ status: 401, body: { message: 'E-mail ou senha inválidos' } }));
    const { user } = renderWithProviders(<LoginPage />, { route: '/login' });

    await user.type(screen.getByLabelText('E-mail'), 'ana@example.com');
    await user.type(screen.getByLabelText('Senha'), 'errada123');
    await user.click(screen.getByRole('button', { name: 'Entrar' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('E-mail ou senha inválidos');
    expect(localStorage.getItem('financas:token')).toBeNull();
  });

  it('requires both fields', async () => {
    const fetchMock = mockApi(() => ({ status: 500 }));
    const { user } = renderWithProviders(<LoginPage />, { route: '/login' });

    await user.click(screen.getByRole('button', { name: 'Entrar' }));

    expect(await screen.findByText('Informe seu e-mail')).toBeInTheDocument();
    expect(screen.getByText('Informe sua senha')).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('returns to the page the user tried to open before logging in', async () => {
    mockApi(() => ({ status: 200, body: { user: fakeUser, token: 'jwt-token' } }));
    const { user } = renderWithProviders(<LoginPage />, {
      route: '/login',
      state: { from: { pathname: '/transacoes', search: '?page=2' } },
    });

    await user.type(screen.getByLabelText('E-mail'), 'ana@example.com');
    await user.type(screen.getByLabelText('Senha'), 'senha123');
    await user.click(screen.getByRole('button', { name: 'Entrar' }));

    expect(await screen.findByTestId('location')).toHaveTextContent('/transacoes');
  });

  it('explains connection failures', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));
    const { user } = renderWithProviders(<LoginPage />, { route: '/login' });

    await user.type(screen.getByLabelText('E-mail'), 'ana@example.com');
    await user.type(screen.getByLabelText('Senha'), 'senha123');
    await user.click(screen.getByRole('button', { name: 'Entrar' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Não foi possível conectar ao servidor',
    );
  });
});
