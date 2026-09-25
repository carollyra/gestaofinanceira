import { screen, within } from '@testing-library/react';

import { fakeUser, mockApi, renderWithProviders } from '@/test/render';

import { DashboardPage } from './DashboardPage';

// Intl puts a non-breaking space after "R$"
const NBSP = String.fromCharCode(160);

const normalize = (value: string | null) => (value ?? '').replaceAll(NBSP, ' ');

const summary = (month: string) => ({
  month,
  totalBalance: 803_000,
  income: 345_000,
  expense: 210_000,
  net: 135_000,
  previousMonth: { month: '2026-02', income: 300_000, expense: 12_000, net: 288_000 },
});

const evolution = [
  { month: '2026-02', income: 300_000, expense: 12_000, net: 288_000, closingBalance: 668_000 },
  { month: '2026-03', income: 345_000, expense: 210_000, net: 135_000, closingBalance: 803_000 },
];

const categories = [
  ['Moradia', 150_000, 71.43],
  ['Mercado', 50_000, 23.81],
  ['Sem categoria', 10_000, 4.76],
].map(([name, total, percentage]) => ({
  categoryId: name === 'Sem categoria' ? null : String(name),
  name,
  color: '#8b5cf6',
  icon: 'x',
  total,
  count: 1,
  percentage,
}));

function mockDashboardApi(overrides: { byCategory?: unknown; failSummary?: boolean } = {}) {
  localStorage.setItem('financas:token', 'token');
  return mockApi((url) => {
    if (url.endsWith('/auth/me')) return { status: 200, body: { user: fakeUser } };
    const month =
      new URL(url).searchParams.get('month') ?? new URL(url).searchParams.get('endMonth');
    if (url.includes('/dashboard/summary')) {
      return overrides.failSummary
        ? { status: 500, body: { message: 'Erro' } }
        : { status: 200, body: summary(month!) };
    }
    if (url.includes('/dashboard/monthly-evolution'))
      return { status: 200, body: { data: evolution } };
    if (url.includes('/dashboard/by-category')) {
      return {
        status: 200,
        body: overrides.byCategory ?? {
          type: 'EXPENSE',
          startDate: '',
          endDate: '',
          total: 210_000,
          categories,
        },
      };
    }
    return { status: 404 };
  });
}

describe('DashboardPage', () => {
  it('shows the summary cards with deltas against the previous month', async () => {
    mockDashboardApi();
    renderWithProviders(<DashboardPage />, { route: '/?mes=2026-03' });

    const cards = within(await screen.findByRole('region', { name: 'Resumo do mês' }));

    expect(
      normalize(cards.getByText('Saldo total').closest('div')!.parentElement!.textContent),
    ).toContain('R$ 8.030,00');
    expect(normalize((await cards.findByText('R$ 3.450,00')).textContent)).toBe('R$ 3.450,00');
    // Income +15% (good), expense +1650% (bad): direction is spoken, not only colored
    expect(cards.getByText('Receitas do mês').closest('div')!.parentElement).toHaveTextContent(
      'Aumento de15%',
    );
    expect(cards.getByText('Despesas do mês').closest('div')!.parentElement).toHaveTextContent(
      'Aumento de1.650%',
    );
    expect(cards.getByText('39,1% das receitas guardados')).toBeInTheDocument();
  });

  it('requests every block for the month in the URL and navigates months', async () => {
    const fetchMock = mockDashboardApi();
    const { user } = renderWithProviders(<DashboardPage />, { route: '/?mes=2026-03' });

    await screen.findByRole('region', { name: 'Resumo do mês' });
    const urls = () => fetchMock.mock.calls.map(([url]) => String(url));
    expect(urls()).toEqual(
      expect.arrayContaining([
        expect.stringContaining('/dashboard/summary?month=2026-03'),
        expect.stringContaining('/dashboard/monthly-evolution?endMonth=2026-03'),
        expect.stringContaining('/dashboard/by-category?month=2026-03'),
      ]),
    );

    await user.click(screen.getByRole('button', { name: 'Mês anterior' }));

    // Month picker (title case) and the category card subtitle both follow the filter
    expect(await screen.findByText('Fevereiro de 2026')).toBeInTheDocument();
    expect(screen.getByText('fevereiro de 2026')).toBeInTheDocument();
    expect(screen.getByTestId('location')).toHaveTextContent('/?mes=2026-02');
    expect(urls()).toEqual(
      expect.arrayContaining([expect.stringContaining('/dashboard/summary?month=2026-02')]),
    );
  });

  it('lists expenses by category with values and shares', async () => {
    mockDashboardApi();
    renderWithProviders(<DashboardPage />, { route: '/?mes=2026-03' });

    const card = within(await screen.findByRole('region', { name: 'Despesas por categoria' }));
    const rows = await card.findAllByRole('listitem');

    expect(rows.map((row) => normalize(row.textContent))).toEqual([
      'MoradiaR$ 1.500,00 · 71,4%',
      'MercadoR$ 500,00 · 23,8%',
      'Sem categoriaR$ 100,00 · 4,8%',
    ]);
  });

  it('offers a table view for every chart', async () => {
    mockDashboardApi();
    const { user } = renderWithProviders(<DashboardPage />, { route: '/?mes=2026-03' });

    await user.click(
      await screen.findByRole('button', { name: 'Ver tabela: Receitas x despesas' }),
    );

    const table = screen.getByRole('table', { name: 'Receitas e despesas por mês' });
    const cells = within(table)
      .getAllByRole('row')
      .map((row) => normalize(row.textContent));
    expect(cells).toEqual([
      'MêsReceitasDespesasResultado',
      'fev/26R$ 3.000,00R$ 120,00+R$ 2.880,00',
      'mar/26R$ 3.450,00R$ 2.100,00+R$ 1.350,00',
    ]);

    expect(
      screen.getByRole('button', { name: 'Ver gráfico: Receitas x despesas' }),
    ).toHaveAttribute('aria-pressed', 'true');
    expect(
      screen.getByRole('button', { name: 'Ver tabela: Evolução do saldo' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Ver tabela: Despesas por categoria' }),
    ).toBeInTheDocument();
  });

  it('shows an empty state for a month without expenses', async () => {
    mockDashboardApi({
      byCategory: { type: 'EXPENSE', startDate: '', endDate: '', total: 0, categories: [] },
    });
    renderWithProviders(<DashboardPage />, { route: '/?mes=2026-03' });

    expect(await screen.findByText('Nenhuma despesa neste mês.')).toBeInTheDocument();
  });

  it('shows an error with retry when a block fails', async () => {
    mockDashboardApi({ failSummary: true });
    renderWithProviders(<DashboardPage />, { route: '/?mes=2026-03' });

    const region = within(await screen.findByRole('region', { name: 'Resumo do mês' }));
    expect(await region.findByRole('alert')).toHaveTextContent(
      'Não foi possível carregar estes dados.',
    );
    expect(region.getByRole('button', { name: 'Tentar novamente' })).toBeInTheDocument();
  });
});
