import { screen, waitFor, within } from '@testing-library/react';

import { TransactionsPage } from '@/pages/TransactionsPage';
import { fakeUser, mockApi, renderWithProviders } from '@/test/render';
import type { Transaction } from '@/types/api';

const accounts = [
  {
    id: 'acc-1',
    name: 'Conta corrente',
    type: 'CHECKING',
    initialBalance: 0,
    balance: 0,
    color: '#3b82f6',
    archived: false,
  },
  {
    id: 'acc-old',
    name: 'Conta antiga',
    type: 'CHECKING',
    initialBalance: 0,
    balance: 0,
    color: '#3b82f6',
    archived: true,
  },
];
const categories = [
  {
    id: 'cat-salary',
    name: 'Salário',
    type: 'INCOME',
    color: '#10b981',
    icon: 'briefcase',
    _count: { transactions: 0 },
  },
  {
    id: 'cat-food',
    name: 'Alimentação',
    type: 'EXPENSE',
    color: '#f97316',
    icon: 'utensils',
    _count: { transactions: 0 },
  },
];

function makeTransaction(overrides: Partial<Transaction> = {}): Transaction {
  return {
    id: 't1',
    type: 'EXPENSE',
    amount: 4_590,
    date: '2026-09-10',
    description: 'Restaurante',
    notes: null,
    recurringTransactionId: null,
    account: { id: 'acc-1', name: 'Conta corrente', color: '#3b82f6', type: 'CHECKING' },
    category: { id: 'cat-food', name: 'Alimentação', color: '#f97316', icon: 'utensils' },
    ...overrides,
  };
}

// In-memory API: mutations change what the next list request returns
function fakeBackend(
  initial: Transaction[],
  options: { failDelete?: boolean; createError?: unknown } = {},
) {
  localStorage.setItem('financas:token', 'token');
  let rows = [...initial];
  const fetchMock = mockApi((url, init) => {
    const { pathname } = new URL(url);
    const method = init.method ?? 'GET';
    const body = init.body ? JSON.parse(String(init.body)) : undefined;

    if (pathname.endsWith('/auth/me')) return { status: 200, body: { user: fakeUser } };
    if (pathname.endsWith('/accounts')) return { status: 200, body: { data: accounts } };
    if (pathname.endsWith('/categories')) return { status: 200, body: { data: categories } };
    if (pathname.endsWith('/transactions') && method === 'GET') {
      return {
        status: 200,
        body: {
          data: rows,
          meta: { page: 1, pageSize: 20, total: rows.length, totalPages: 1 },
          summary: { income: 0, expense: 0, balance: 0 },
        },
      };
    }
    if (pathname.endsWith('/transactions') && method === 'POST') {
      if (options.createError) return { status: 400, body: options.createError };
      const created = makeTransaction({ id: `new-${rows.length}`, ...body, category: null });
      rows = [created, ...rows];
      return { status: 201, body: created };
    }
    const id = pathname.split('/').pop()!;
    if (method === 'PATCH') {
      rows = rows.map((r) => (r.id === id ? { ...r, ...body } : r));
      return { status: 200, body: rows.find((r) => r.id === id) };
    }
    if (method === 'DELETE') {
      if (options.failDelete) return { status: 500, body: { message: 'Erro' } };
      rows = rows.filter((r) => r.id !== id);
      return { status: 204 };
    }
    return { status: 404 };
  });

  const calls = (method: string) =>
    fetchMock.mock.calls
      .filter(([, init]) => (init?.method ?? 'GET') === method)
      .map(([url, init]) => ({
        url: String(url),
        body: init?.body ? JSON.parse(String(init.body)) : undefined,
      }));

  return { calls };
}

const renderPage = () =>
  renderWithProviders(<TransactionsPage />, { route: '/transacoes?periodo=tudo' });

describe('transaction create / edit / delete', () => {
  it('creates a transaction converting the typed amount to integer cents', async () => {
    const { calls } = fakeBackend([]);
    const { user } = renderPage();
    await screen.findByText('Nenhuma transação neste período.');

    await user.click(screen.getByRole('button', { name: 'Nova transação' }));
    const dialog = await screen.findByRole('dialog', { name: 'Nova transação' });
    const form = within(dialog);

    await user.type(form.getByLabelText('Valor'), '1250');
    expect(form.getByLabelText('Valor')).toHaveValue(
      'R$ 12,50'.replace(' ', String.fromCharCode(160)),
    );
    await user.type(form.getByLabelText('Descrição'), 'Padaria');
    await user.selectOptions(form.getByLabelText('Categoria'), 'cat-food');
    await user.click(form.getByRole('button', { name: 'Adicionar' }));

    await waitFor(() => expect(calls('POST')).toHaveLength(1));
    expect(calls('POST')[0]!.body).toMatchObject({
      type: 'EXPENSE',
      amount: 1_250,
      description: 'Padaria',
      accountId: 'acc-1',
      categoryId: 'cat-food',
      notes: null,
    });
    expect(calls('POST')[0]!.body.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(await screen.findByText('Transação adicionada')).toBeInTheDocument();
    expect(await screen.findByRole('button', { name: 'Padaria' })).toBeInTheDocument();
  });

  it('validates before sending and keeps only categories of the chosen type', async () => {
    const { calls } = fakeBackend([]);
    const { user } = renderPage();
    await screen.findByText('Nenhuma transação neste período.');
    await user.click(screen.getByRole('button', { name: 'Nova transação' }));
    const form = within(await screen.findByRole('dialog'));

    await user.selectOptions(form.getByLabelText('Categoria'), 'cat-food');
    await user.click(form.getByRole('button', { name: 'Adicionar' }));

    expect(await form.findByText('Informe um valor maior que zero')).toBeInTheDocument();
    expect(form.getByText('Informe uma descrição')).toBeInTheDocument();
    expect(calls('POST')).toHaveLength(0);

    // Switching to income drops the expense category and lists income categories
    await user.click(form.getByLabelText('Receita'));
    expect(form.getByLabelText('Categoria')).toHaveValue('');
    expect(
      within(form.getByLabelText('Categoria')).getByRole('option', { name: 'Salário' }),
    ).toBeInTheDocument();
    expect(
      within(form.getByLabelText('Categoria')).queryByRole('option', { name: 'Alimentação' }),
    ).not.toBeInTheDocument();
  });

  it('shows API field errors on the matching inputs', async () => {
    fakeBackend([], {
      createError: {
        message: 'Dados inválidos',
        details: { description: ['Descrição muito longa'] },
      },
    });
    const { user } = renderPage();
    await screen.findByText('Nenhuma transação neste período.');
    await user.click(screen.getByRole('button', { name: 'Nova transação' }));
    const form = within(await screen.findByRole('dialog'));

    await user.type(form.getByLabelText('Valor'), '100');
    await user.type(form.getByLabelText('Descrição'), 'X');
    await user.click(form.getByRole('button', { name: 'Adicionar' }));

    expect(await form.findByLabelText('Descrição')).toHaveAccessibleDescription(
      'Descrição muito longa',
    );
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('edits with the current values and sends only what changed', async () => {
    const { calls } = fakeBackend([
      makeTransaction({
        account: { ...makeTransaction().account, id: 'acc-old', name: 'Conta antiga' },
      }),
    ]);
    const { user } = renderPage();

    await user.click(await screen.findByRole('button', { name: 'Editar Restaurante' }));
    const form = within(await screen.findByRole('dialog', { name: 'Editar transação' }));

    expect(form.getByLabelText('Descrição')).toHaveValue('Restaurante');
    expect(form.getByLabelText('Conta')).toHaveValue('acc-old'); // archived account kept while editing
    expect(form.getByLabelText('Categoria')).toHaveValue('cat-food');

    await user.clear(form.getByLabelText('Descrição'));
    await user.type(form.getByLabelText('Descrição'), 'Jantar');
    await user.click(form.getByRole('button', { name: 'Salvar alterações' }));

    await waitFor(() => expect(calls('PATCH')).toHaveLength(1));
    expect(calls('PATCH')[0]!.url).toMatch(/\/transactions\/t1$/);
    expect(calls('PATCH')[0]!.body).toEqual({ description: 'Jantar' });
    expect(await screen.findByRole('button', { name: 'Jantar' })).toBeInTheDocument();
  });

  it('deletes after confirmation, removing the row right away', async () => {
    const { calls } = fakeBackend([
      makeTransaction(),
      makeTransaction({ id: 't2', description: 'Cinema' }),
    ]);
    const { user } = renderPage();

    await user.click(await screen.findByRole('button', { name: 'Excluir Restaurante' }));
    const dialog = await screen.findByRole('dialog', { name: 'Excluir transação?' });
    expect(dialog).toHaveTextContent('Restaurante');

    await user.click(within(dialog).getByRole('button', { name: 'Excluir' }));

    await waitFor(() =>
      expect(screen.queryByRole('button', { name: 'Restaurante' })).not.toBeInTheDocument(),
    );
    expect(screen.getByRole('button', { name: 'Cinema' })).toBeInTheDocument();
    expect(calls('DELETE')[0]!.url).toMatch(/\/transactions\/t1$/);
    expect(await screen.findByText('Transação excluída')).toBeInTheDocument();
    // The row that opened the dialog is gone: focus lands on the list, not on <body>
    await waitFor(() =>
      expect(screen.getByRole('region', { name: 'Lista de transações' })).toHaveFocus(),
    );
  });

  it('brings the row back if the deletion fails', async () => {
    fakeBackend([makeTransaction()], { failDelete: true });
    const { user } = renderPage();

    await user.click(await screen.findByRole('button', { name: 'Excluir Restaurante' }));
    await user.click(
      within(await screen.findByRole('dialog')).getByRole('button', { name: 'Excluir' }),
    );

    expect(
      await screen.findByText('Não foi possível excluir a transação. Ela foi mantida.'),
    ).toBeInTheDocument();
    expect(await screen.findByRole('button', { name: 'Restaurante' })).toBeInTheDocument();
  });

  it('explains that deleting a recurring occurrence keeps the next ones', async () => {
    fakeBackend([makeTransaction({ recurringTransactionId: 'rec-1' })]);
    const { user } = renderPage();

    await user.click(await screen.findByRole('button', { name: 'Editar Restaurante' }));
    await user.click(
      within(await screen.findByRole('dialog')).getByRole('button', { name: 'Excluir' }),
    );

    const dialog = await screen.findByRole('dialog', { name: 'Excluir transação?' });
    expect(dialog).toHaveTextContent('Gerada por uma recorrência');
  });
});
