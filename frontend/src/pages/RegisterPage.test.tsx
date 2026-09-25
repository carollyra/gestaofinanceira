import { screen } from '@testing-library/react';

import { fakeUser, mockApi, renderWithProviders } from '@/test/render';

import { RegisterPage } from './RegisterPage';

async function fillForm(
  user: ReturnType<typeof renderWithProviders>['user'],
  password = 'senha123',
) {
  await user.type(screen.getByLabelText('Nome'), 'Ana Souza');
  await user.type(screen.getByLabelText('E-mail'), 'ana@example.com');
  await user.type(screen.getByLabelText('Senha'), password);
  await user.type(screen.getByLabelText('Confirmar senha'), password);
}

describe('RegisterPage', () => {
  it('validates on the client before calling the API', async () => {
    const fetchMock = mockApi(() => ({ status: 500 }));
    const { user } = renderWithProviders(<RegisterPage />, { route: '/cadastro' });

    await fillForm(user, 'somenteletras');
    await user.click(screen.getByRole('button', { name: 'Criar conta' }));

    expect(await screen.findByText('Senha deve conter pelo menos um número')).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('updates the requirements checklist while typing', async () => {
    mockApi(() => ({ status: 500 }));
    const { user } = renderWithProviders(<RegisterPage />, { route: '/cadastro' });

    await user.type(screen.getByLabelText('Senha'), 'abc');
    expect(screen.getByText('Pelo menos uma letra').closest('li')).toHaveAttribute(
      'data-met',
      'true',
    );
    expect(screen.getByText('Pelo menos um número').closest('li')).toHaveAttribute(
      'data-met',
      'false',
    );
  });

  it('shows the server error on the e-mail field (409)', async () => {
    mockApi(() => ({ status: 409, body: { message: 'E-mail já cadastrado' } }));
    const { user } = renderWithProviders(<RegisterPage />, { route: '/cadastro' });

    await fillForm(user);
    await user.click(screen.getByRole('button', { name: 'Criar conta' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('E-mail já cadastrado');
  });

  it('maps API field errors (400 details) to the inputs', async () => {
    mockApi(() => ({
      status: 400,
      body: { message: 'Dados inválidos', details: { email: ['E-mail inválido'] } },
    }));
    const { user } = renderWithProviders(<RegisterPage />, { route: '/cadastro' });

    await fillForm(user);
    await user.click(screen.getByRole('button', { name: 'Criar conta' }));

    expect(await screen.findByLabelText('E-mail')).toHaveAccessibleDescription('E-mail inválido');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('creates the account, stores the token and goes to the app', async () => {
    const fetchMock = mockApi(() => ({
      status: 201,
      body: { user: fakeUser, token: 'jwt-token' },
    }));
    const { user } = renderWithProviders(<RegisterPage />, { route: '/cadastro' });

    await fillForm(user);
    await user.click(screen.getByRole('button', { name: 'Criar conta' }));

    expect(await screen.findByTestId('location')).toHaveTextContent(/^\/$/);
    expect(localStorage.getItem('financas:token')).toBe('jwt-token');

    const [url, init] = fetchMock.mock.calls[0]!;
    expect(String(url)).toMatch(/\/auth\/register$/);
    // confirmPassword is only a client-side check
    expect(JSON.parse(String(init?.body))).toEqual({
      name: 'Ana Souza',
      email: 'ana@example.com',
      password: 'senha123',
    });
  });
});
