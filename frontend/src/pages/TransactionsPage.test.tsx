import { screen, waitFor, within } from '@testing-library/react';

import { fakeUser, mockApi, renderWithProviders } from '@/test/render';

import { TransactionsPage } from './TransactionsPage';

const categories = [
  {
    id: 'cat-salary',
    name: 'Salário',
    type: 'INCOME',
    color: '#10b981',
    icon: 'briefcase',
    _count: { transactions: 1 },
  },
  {
    id: 'cat-food',
    name: 'Alimentação',
    type: 'EXPENSE',
    color: '#f97316',
    icon: 'utensils',
    _count: { transactions: 1 },
  },
];
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
];

function transaction(i: number) {
  return {
    id: `t${i}`,
    type: i === 0 ? 'INCOME' : 'EXPENSE',
    amount: 1_000 * (i + 1),
    date: `2026-09-${String(20 - i).padStart(2, '0')}`,
    description: i === 0 ? 'Salário' : `Compra ${i}`,
    notes: null,
    recurringTransactionId: null,
    account: accounts[0],
    category: i === 0 ? categories[0] : categories[1],
  };
}

function setup(options: { total?: number; empty?: boolean } = {}) {
  localStorage.setItem('financas:token', 'token');
  const total = options.empty ? 0 : (options.total ?? 3);

  const fetchMock = mockApi((url) => {
    const { pathname, searchParams } = new URL(url);
    if (pathname.endsWith('/auth/me')) return { status: 200, body: { user: fakeUser } };
    if (pathname.endsWith('/accounts')) return { status: 200, body: { data: accounts } };
    if (pathname.endsWith('/categories')) return { status: 200, body: { data: categories } };
    if (pathname.endsWith('/transactions')) {
      const page = Number(searchParams.get('page'));
      const pageSize = Number(searchParams.get('pageSize'));
      const count = Math.max(0, Math.min(pageSize, total - (page - 1) * pageSize));
      return {
        status: 200,
        body: {
          data: Array.from({ length: count }, (_, i) => transaction(i)),
          meta: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
          summary: { income: 1_000, expense: 5_000, balance: -4_000 },
        },
      };
    }
    return { status: 404 };
  });

  const transactionUrls = () =>
    fetchMock.mock.calls
      .map(([url]) => new URL(String(url)))
      .filter((url) => url.pathname.endsWith('/transactions'));

  return { fetchMock, lastQuery: () => transactionUrls().at(-1)!.searchParams, transactionUrls };
}

describe('TransactionsPage', () => {
  it('lists the transactions of the current month with totals of the filter', async () => {
    const { lastQuery } = setup();
    renderWithProviders(<TransactionsPage />, { route: '/transacoes?mes=2026-09' });

    const table = await screen.findByRole('table', { name: 'Transações' });
    expect(within(table).getAllByRole('row')).toHaveLength(4); // header + 3
    // Description and category cells of the first row
    expect(within(table).getAllByText('Salário')).toHaveLength(2);
    expect(screen.getByText('Mostrando 1–3 de 3 transações')).toBeInTheDocument();

    expect(Object.fromEntries(lastQuery())).toMatchObject({
      startDate: '2026-09-01',
      endDate: '2026-09-30',
      page: '1',
      pageSize: '20',
      sortBy: 'date',
      sortOrder: 'desc',
    });
  });

  it('searches after the user stops typing, with a single request', async () => {
    const { lastQuery, transactionUrls } = setup();
    const { user } = renderWithProviders(<TransactionsPage />, {
      route: '/transacoes?mes=2026-09',
    });
    await screen.findByRole('table', { name: 'Transações' });
    const before = transactionUrls().length;

    await user.type(screen.getByLabelText('Buscar transações'), 'mercado');

    await waitFor(() => expect(lastQuery().get('search')).toBe('mercado'));
    expect(
      transactionUrls()
        .slice(before)
        .filter((url) => url.searchParams.has('search')),
    ).toHaveLength(1);
    expect(screen.getByTestId('location')).toHaveTextContent('busca=mercado');
  });

  it('filters by type, keeps it in the URL and goes back to page 1', async () => {
    const { lastQuery } = setup({ total: 45 });
    const { user } = renderWithProviders(<TransactionsPage />, {
      route: '/transacoes?mes=2026-09&pagina=2',
    });
    await screen.findByRole('table', { name: 'Transações' });
    expect(lastQuery().get('page')).toBe('2');

    await user.selectOptions(screen.getByLabelText('Tipo'), 'EXPENSE');

    await waitFor(() => expect(lastQuery().get('type')).toBe('EXPENSE'));
    expect(lastQuery().get('page')).toBe('1');
    expect(screen.getByTestId('location')).toHaveTextContent('tipo=despesa');
    expect(screen.getByTestId('location')).not.toHaveTextContent('pagina');
    // Only expense categories remain in the category filter
    const categorySelect = screen.getByLabelText('Categoria');
    expect(
      within(categorySelect).queryByRole('option', { name: 'Salário' }),
    ).not.toBeInTheDocument();
    expect(within(categorySelect).getByRole('option', { name: 'Alimentação' })).toBeInTheDocument();
  });

  it('filters uncategorized transactions', async () => {
    const { lastQuery } = setup();
    const { user } = renderWithProviders(<TransactionsPage />, {
      route: '/transacoes?mes=2026-09',
    });
    await screen.findByRole('table', { name: 'Transações' });

    await user.selectOptions(screen.getByLabelText('Categoria'), 'none');

    await waitFor(() => expect(lastQuery().get('categoryId')).toBe('none'));
  });

  it('sorts by clicking the column headers', async () => {
    const { lastQuery } = setup();
    const { user } = renderWithProviders(<TransactionsPage />, {
      route: '/transacoes?mes=2026-09',
    });
    await screen.findByRole('table', { name: 'Transações' });

    const valueHeader = screen.getByRole('columnheader', { name: /Valor/ });
    expect(valueHeader).toHaveAttribute('aria-sort', 'none');

    await user.click(within(valueHeader).getByRole('button'));
    await waitFor(() => expect(lastQuery().get('sortBy')).toBe('amount'));
    expect(lastQuery().get('sortOrder')).toBe('desc');
    expect(screen.getByRole('columnheader', { name: /Valor/ })).toHaveAttribute(
      'aria-sort',
      'descending',
    );

    await user.click(
      within(screen.getByRole('columnheader', { name: /Valor/ })).getByRole('button'),
    );
    await waitFor(() => expect(lastQuery().get('sortOrder')).toBe('asc'));
  });

  it('paginates', async () => {
    const { lastQuery } = setup({ total: 45 });
    const { user } = renderWithProviders(<TransactionsPage />, {
      route: '/transacoes?mes=2026-09',
    });
    await screen.findByText('Mostrando 1–20 de 45 transações');
    window.scrollTo = vi.fn();

    await user.click(screen.getByRole('button', { name: 'Próxima página' }));

    await waitFor(() => expect(lastQuery().get('page')).toBe('2'));
    expect(await screen.findByText('Mostrando 21–40 de 45 transações')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Página 2' })).toHaveAttribute(
      'aria-current',
      'page',
    );
  });

  it('offers to clear filters when nothing matches', async () => {
    setup({ empty: true });
    const { user } = renderWithProviders(<TransactionsPage />, {
      route: '/transacoes?mes=2026-03&busca=xyz&tipo=receita', // past month: not the default, stays in the URL
    });

    expect(
      await screen.findByText('Nenhuma transação encontrada com esses filtros.'),
    ).toBeInTheDocument();

    await user.click(screen.getAllByRole('button', { name: /Limpar filtros/ }).at(-1)!);

    await waitFor(() =>
      expect(screen.getByTestId('location')).toHaveTextContent(/^\/transacoes\?mes=2026-03$/),
    );
    expect(screen.getByLabelText('Buscar transações')).toHaveValue('');
  });

  it('on phones, folds the filters behind a button and shows cards grouped by day', async () => {
    vi.stubGlobal('matchMedia', (query: string) => ({
      matches: false,
      media: query,
      addEventListener: () => {},
      removeEventListener: () => {},
    }));
    setup();
    const { user } = renderWithProviders(<TransactionsPage />, {
      route: '/transacoes?mes=2026-09&tipo=despesa',
    });

    expect(
      await screen.findByRole('region', { name: 'Domingo, 20 de setembro' }),
    ).toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Tipo')).not.toBeInTheDocument();

    const toggle = screen.getByRole('button', { name: /Filtros/ });
    expect(toggle).toHaveTextContent('1'); // one active filter (type)
    expect(toggle).toHaveAttribute('aria-expanded', 'false');

    await user.click(toggle);

    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByLabelText('Tipo')).toHaveValue('EXPENSE');
  });
});
