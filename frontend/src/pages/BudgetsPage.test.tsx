import { screen, waitFor, within } from '@testing-library/react';

import { fakeApi } from '@/test/fake-api';
import { renderWithProviders } from '@/test/render';

import { BudgetsPage } from './BudgetsPage';

const categories = [
  {
    id: 'c1',
    name: 'Mercado',
    type: 'EXPENSE',
    color: '#f59e0b',
    icon: 'shopping-cart',
    _count: { transactions: 0 },
  },
  {
    id: 'c2',
    name: 'Lazer',
    type: 'EXPENSE',
    color: '#ec4899',
    icon: 'gamepad-2',
    _count: { transactions: 0 },
  },
  {
    id: 'c3',
    name: 'Salário',
    type: 'INCOME',
    color: '#10b981',
    icon: 'briefcase',
    _count: { transactions: 0 },
  },
];

const budgetList = {
  month: '2026-03',
  data: [
    {
      id: 'b1',
      month: '2026-03',
      amount: 60_000,
      spent: 50_000,
      remaining: 10_000,
      percentage: 83.33,
      status: 'WARNING',
      category: categories[0],
    },
  ],
  summary: {
    totalLimit: 60_000,
    totalSpent: 50_000,
    remaining: 10_000,
    percentage: 83.33,
    status: 'WARNING',
    unbudgetedSpent: 160_000,
  },
};

function setup() {
  return fakeApi(({ url, method }) => {
    if (url.pathname.endsWith('/categories')) return { status: 200, body: { data: categories } };
    if (url.pathname.endsWith('/budgets/copy'))
      return { status: 201, body: { created: 4, skipped: 1 } };
    if (url.pathname.endsWith('/budgets') && method === 'GET')
      return { status: 200, body: budgetList };
    if (url.pathname.endsWith('/budgets') && method === 'POST')
      return { status: 201, body: budgetList.data[0] };
    return undefined;
  });
}

const normalize = (text: string | null) => (text ?? '').replaceAll(String.fromCharCode(160), ' ');

describe('BudgetsPage', () => {
  it('shows consumption with status as icon + label, and the month from the URL', async () => {
    const { requests } = setup();
    renderWithProviders(<BudgetsPage />, { route: '/orcamentos?mes=2026-03' });

    const card = await screen.findByRole('region', { name: 'Mercado' });
    expect(within(card).getByText('Atenção')).toBeInTheDocument();
    expect(normalize(card.textContent)).toContain('R$ 500,00 de R$ 600,00');
    expect(normalize(card.textContent)).toContain('Restam R$ 100,00');
    expect(within(card).getByRole('meter', { name: 'Consumo de Mercado' })).toHaveAttribute(
      'aria-valuenow',
      '83',
    );

    expect(normalize(screen.getByRole('region', { name: 'Resumo do mês' }).textContent)).toContain(
      'Fora dos orçamentos: R$ 1.600,00',
    );
    expect(requests('GET', '/budgets')[0]!.url.searchParams.get('month')).toBe('2026-03');
  });

  it('only offers expense categories still without a budget this month', async () => {
    const { requests } = setup();
    const { user } = renderWithProviders(<BudgetsPage />, { route: '/orcamentos?mes=2026-03' });
    await screen.findByRole('region', { name: 'Mercado' });

    await user.click(screen.getByRole('button', { name: 'Novo orçamento' }));
    const form = within(await screen.findByRole('dialog', { name: 'Novo orçamento' }));
    const options = within(form.getByLabelText('Categoria'))
      .getAllByRole('option')
      .map((o) => o.textContent);
    expect(options).toEqual(['Lazer']);

    await user.type(form.getByLabelText('Limite do mês'), '25000');
    await user.click(form.getByRole('button', { name: 'Criar orçamento' }));

    await waitFor(() => expect(requests('POST', '/budgets')).toHaveLength(1));
    expect(requests('POST', '/budgets')[0]!.body).toEqual({
      categoryId: 'c2',
      amount: 25_000,
      month: '2026-03',
    });
  });

  it('copies the previous month budgets', async () => {
    const { requests } = setup();
    const { user } = renderWithProviders(<BudgetsPage />, { route: '/orcamentos?mes=2026-03' });
    await screen.findByRole('region', { name: 'Mercado' });

    await user.click(screen.getByRole('button', { name: 'Copiar do mês anterior' }));

    await waitFor(() => expect(requests('POST', '/budgets/copy')).toHaveLength(1));
    expect(requests('POST', '/budgets/copy')[0]!.body).toEqual({
      fromMonth: '2026-02',
      toMonth: '2026-03',
    });
    expect(await screen.findByText('4 orçamentos copiados (1 já existiam)')).toBeInTheDocument();
  });
});
