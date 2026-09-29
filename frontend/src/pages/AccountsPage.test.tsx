import { screen, waitFor, within } from '@testing-library/react';

import { fakeApi } from '@/test/fake-api';
import { renderWithProviders } from '@/test/render';

import { AccountsPage } from './AccountsPage';

const baseAccounts = [
  {
    id: 'a1',
    name: 'Conta corrente',
    type: 'CHECKING',
    initialBalance: 100_000,
    balance: 350_000,
    color: '#3b82f6',
    archived: false,
  },
  {
    id: 'a2',
    name: 'Carteira',
    type: 'WALLET',
    initialBalance: 0,
    balance: 5_000,
    color: '#f59e0b',
    archived: false,
  },
  {
    id: 'a3',
    name: 'Conta antiga',
    type: 'SAVINGS',
    initialBalance: 0,
    balance: 1_000,
    color: '#64748b',
    archived: true,
  },
];

const baseTransfer = {
  id: 'tr1',
  amount: 40_000,
  date: '2026-09-03',
  description: 'Saque',
  notes: null,
  createdAt: '2026-09-03T12:00:00.000Z',
  updatedAt: '2026-09-03T12:00:00.000Z',
  fromAccount: { id: 'a1', name: 'Conta corrente', color: '#3b82f6', type: 'CHECKING' },
  toAccount: { id: 'a2', name: 'Carteira', color: '#f59e0b', type: 'WALLET' },
};

function setup(options: { deleteConflict?: boolean } = {}) {
  let accounts = baseAccounts.map((a) => ({ ...a }));
  let transfers = [{ ...baseTransfer }];
  return fakeApi(({ url, method, body }) => {
    if (url.pathname.endsWith('/accounts') && method === 'GET')
      return { status: 200, body: { data: accounts } };
    if (url.pathname.endsWith('/accounts') && method === 'POST') {
      const created = {
        id: 'new',
        balance: (body as { initialBalance: number }).initialBalance,
        archived: false,
        ...(body as object),
      };
      accounts = [...accounts, created as (typeof accounts)[number]];
      return { status: 201, body: created };
    }
    if (url.pathname.endsWith('/transfers') && method === 'POST') return { status: 201, body: {} };
    if (url.pathname.endsWith('/transfers') && method === 'GET') {
      return {
        status: 200,
        body: {
          data: transfers,
          meta: { page: 1, pageSize: 8, total: transfers.length, totalPages: 1 },
        },
      };
    }
    if (url.pathname.includes('/transfers/')) {
      const transferId = url.pathname.split('/').pop();
      if (method === 'GET')
        return { status: 200, body: transfers.find((t) => t.id === transferId) };
      if (method === 'PATCH')
        return { status: 200, body: { ...transfers[0], ...(body as object) } };
      if (method === 'DELETE') {
        transfers = transfers.filter((t) => t.id !== transferId);
        return { status: 204 };
      }
    }
    const id = url.pathname.split('/').pop();
    if (method === 'PATCH') {
      accounts = accounts.map((a) => (a.id === id ? { ...a, ...(body as object) } : a));
      return { status: 200, body: accounts.find((a) => a.id === id) };
    }
    if (method === 'DELETE') {
      return options.deleteConflict
        ? {
            status: 409,
            body: {
              message:
                'Esta conta possui movimentações. Arquive-a em vez de excluir para manter o histórico.',
            },
          }
        : { status: 204 };
    }
    return undefined;
  });
}

const normalize = (text: string | null) => (text ?? '').replaceAll(String.fromCharCode(160), ' ');

describe('AccountsPage', () => {
  it('lists active accounts with balances and hides archived ones until asked', async () => {
    setup();
    const { user } = renderWithProviders(<AccountsPage />, { route: '/contas' });

    expect(await screen.findByRole('region', { name: 'Conta corrente' })).toHaveTextContent(
      'Conta corrente',
    );
    expect(
      normalize(screen.getByText('Saldo total das contas ativas').parentElement!.textContent),
    ).toContain('R$ 3.550,00');
    expect(screen.queryByRole('region', { name: 'Conta antiga' })).not.toBeInTheDocument();

    await user.click(screen.getByLabelText('Mostrar arquivadas (1)'));

    expect(await screen.findByRole('region', { name: 'Conta antiga' })).toHaveTextContent(
      'Arquivada',
    );
  });

  it('creates an account with a negative initial balance in integer cents', async () => {
    const { requests } = setup();
    const { user } = renderWithProviders(<AccountsPage />, { route: '/contas' });
    await screen.findByRole('region', { name: 'Carteira' });

    await user.click(screen.getByRole('button', { name: 'Nova conta' }));
    const form = within(await screen.findByRole('dialog', { name: 'Nova conta' }));
    await user.type(form.getByLabelText('Nome'), 'Cartão Roxo');
    await user.selectOptions(form.getByLabelText('Tipo'), 'CREDIT_CARD');
    await user.type(form.getByLabelText('Saldo inicial'), '123456');
    await user.click(form.getByLabelText(/Saldo inicial negativo/));
    await user.click(form.getByLabelText('Roxo'));
    await user.click(form.getByRole('button', { name: 'Criar conta' }));

    await waitFor(() => expect(requests('POST', '/accounts')).toHaveLength(1));
    expect(requests('POST', '/accounts')[0]!.body).toEqual({
      name: 'Cartão Roxo',
      type: 'CREDIT_CARD',
      initialBalance: -123_456,
      color: '#a855f7',
    });
    expect(await screen.findByText('Conta criada')).toBeInTheDocument();
  });

  it('archives an account', async () => {
    const { requests } = setup();
    const { user } = renderWithProviders(<AccountsPage />, { route: '/contas' });

    await user.click(await screen.findByRole('button', { name: 'Arquivar Carteira' }));

    await waitFor(() => expect(requests('PATCH')[0]?.body).toEqual({ archived: true }));
    expect(await screen.findByText('Carteira foi arquivada')).toBeInTheDocument();
  });

  it('explains why an account with movements cannot be deleted', async () => {
    setup({ deleteConflict: true });
    const { user } = renderWithProviders(<AccountsPage />, { route: '/contas' });

    await user.click(await screen.findByRole('button', { name: 'Excluir Carteira' }));
    await user.click(
      within(await screen.findByRole('dialog')).getByRole('button', { name: 'Excluir' }),
    );

    expect(await screen.findByText(/Arquive-a em vez de excluir/)).toBeInTheDocument();
  });

  it('transfers between two active accounts', async () => {
    const { requests } = setup();
    const { user } = renderWithProviders(<AccountsPage />, { route: '/contas' });
    await screen.findByRole('region', { name: 'Carteira' });

    await user.click(screen.getByRole('button', { name: 'Transferir' }));
    const form = within(await screen.findByRole('dialog', { name: 'Transferir entre contas' }));
    // Archived accounts are not offered
    expect(
      within(form.getByLabelText('De')).queryByRole('option', { name: 'Conta antiga' }),
    ).not.toBeInTheDocument();
    await user.type(form.getByLabelText('Valor'), '40000');
    await user.click(form.getByRole('button', { name: 'Transferir' }));

    await waitFor(() => expect(requests('POST', '/transfers')).toHaveLength(1));
    expect(requests('POST', '/transfers')[0]!.body).toMatchObject({
      fromAccountId: 'a1',
      toAccountId: 'a2',
      amount: 40_000,
      description: 'Transferência',
    });
  });

  it('opens a transfer in a drawer kept in the URL, and edits only what changed', async () => {
    const { requests } = setup();
    const { user } = renderWithProviders(<AccountsPage />, { route: '/contas' });

    await user.click(await screen.findByRole('button', { name: /Ver transferência: Saque/ }));

    const drawer = await screen.findByRole('dialog', { name: 'Detalhes da transferência: Saque' });
    expect(screen.getByTestId('location')).toHaveTextContent('/contas?transferencia=tr1');
    expect(normalize(drawer.textContent)).toContain('R$ 400,00');
    expect(drawer).toHaveTextContent('De Conta corrente');
    expect(drawer).toHaveTextContent('Para Carteira');
    expect(drawer).toHaveTextContent('Quinta-feira, 3 de setembro de 2026');

    await user.click(within(drawer).getByRole('button', { name: 'Editar' }));
    const form = within(await screen.findByRole('dialog', { name: 'Editar transferência' }));
    await user.clear(form.getByLabelText('Descrição'));
    await user.type(form.getByLabelText('Descrição'), 'Saque no caixa');
    await user.click(form.getByRole('button', { name: 'Salvar alterações' }));

    await waitFor(() => expect(requests('PATCH', '/transfers/')).toHaveLength(1));
    expect(requests('PATCH', '/transfers/')[0]!.body).toEqual({ description: 'Saque no caixa' });
  });

  it('deletes a transfer from its drawer and closes it', async () => {
    const { requests } = setup();
    const { user } = renderWithProviders(<AccountsPage />, { route: '/contas?transferencia=tr1' });

    const drawer = await screen.findByRole('dialog', { name: 'Detalhes da transferência: Saque' });
    await user.click(within(drawer).getByRole('button', { name: 'Excluir' }));
    await user.click(
      within(await screen.findByRole('dialog', { name: 'Excluir transferência?' })).getByRole(
        'button',
        { name: 'Excluir' },
      ),
    );

    await waitFor(() => expect(requests('DELETE', '/transfers/')).toHaveLength(1));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(screen.getByTestId('location')).toHaveTextContent(/^\/contas$/);
    expect(await screen.findByText('Nenhuma transferência ainda.')).toBeInTheDocument();
  });
});
