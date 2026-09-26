import { screen, waitFor, within } from '@testing-library/react';

import { fakeApi } from '@/test/fake-api';
import { renderWithProviders } from '@/test/render';

import { CategoriesPage } from './CategoriesPage';

const categories = [
  {
    id: 'c1',
    name: 'Mercado',
    type: 'EXPENSE',
    color: '#f59e0b',
    icon: 'shopping-cart',
    _count: { transactions: 12 },
  },
  {
    id: 'c2',
    name: 'Alimentação',
    type: 'EXPENSE',
    color: '#f97316',
    icon: 'utensils',
    _count: { transactions: 3 },
  },
  {
    id: 'c3',
    name: 'Salário',
    type: 'INCOME',
    color: '#10b981',
    icon: 'briefcase',
    _count: { transactions: 1 },
  },
];

function setup() {
  return fakeApi(({ url, method, body }) => {
    if (url.pathname.endsWith('/categories') && method === 'GET')
      return { status: 200, body: { data: categories } };
    if (url.pathname.endsWith('/categories') && method === 'POST')
      return { status: 201, body: { id: 'new', _count: { transactions: 0 }, ...(body as object) } };
    if (method === 'PATCH' || method === 'DELETE')
      return {
        status: method === 'DELETE' ? 204 : 200,
        body: method === 'PATCH' ? categories[0] : undefined,
      };
    return undefined;
  });
}

describe('CategoriesPage', () => {
  it('shows expense categories by default and switches to incomes', async () => {
    setup();
    const { user } = renderWithProviders(<CategoriesPage />, { route: '/categorias' });

    expect(await screen.findByText('Mercado')).toBeInTheDocument();
    expect(screen.getByText('12 transações')).toBeInTheDocument();
    expect(screen.queryByText('Salário')).not.toBeInTheDocument();

    await user.click(screen.getByRole('tab', { name: /Receitas/ }));

    expect(screen.getByRole('tab', { name: /Receitas/ })).toHaveAttribute('aria-selected', 'true');
    expect(await screen.findByText('Salário')).toBeInTheDocument();
  });

  it('creates a category of the selected tab with the chosen color and icon', async () => {
    const { requests } = setup();
    const { user } = renderWithProviders(<CategoriesPage />, { route: '/categorias' });
    await screen.findByText('Mercado');
    await user.click(screen.getByRole('tab', { name: /Receitas/ }));

    await user.click(screen.getByRole('button', { name: 'Nova categoria' }));
    const form = within(await screen.findByRole('dialog', { name: 'Nova categoria de receita' }));
    await user.type(form.getByLabelText('Nome'), 'Aluguel recebido');
    await user.click(form.getByLabelText('Ciano'));
    await user.click(form.getByLabelText('Casa'));
    await user.click(form.getByRole('button', { name: 'Criar categoria' }));

    await waitFor(() => expect(requests('POST')).toHaveLength(1));
    expect(requests('POST')[0]!.body).toEqual({
      name: 'Aluguel recebido',
      type: 'INCOME',
      color: '#06b6d4',
      icon: 'house',
    });
  });

  it('never sends the type when editing (it is immutable)', async () => {
    const { requests } = setup();
    const { user } = renderWithProviders(<CategoriesPage />, { route: '/categorias' });

    await user.click(await screen.findByRole('button', { name: 'Editar Mercado' }));
    const form = within(await screen.findByRole('dialog', { name: 'Editar categoria' }));
    expect(form.getByText(/não pode ser alterado/)).toBeInTheDocument();
    await user.clear(form.getByLabelText('Nome'));
    await user.type(form.getByLabelText('Nome'), 'Supermercado');
    await user.click(form.getByRole('button', { name: 'Salvar alterações' }));

    await waitFor(() => expect(requests('PATCH')).toHaveLength(1));
    expect(requests('PATCH')[0]!.body).toEqual({
      name: 'Supermercado',
      color: '#f59e0b',
      icon: 'shopping-cart',
    });
  });

  it('moves the transactions to another category of the same type when deleting', async () => {
    const { requests } = setup();
    const { user } = renderWithProviders(<CategoriesPage />, { route: '/categorias' });

    await user.click(await screen.findByRole('button', { name: 'Excluir Mercado' }));
    const dialog = within(await screen.findByRole('dialog', { name: 'Excluir categoria?' }));
    expect(dialog.getByText(/tem 12 transações/)).toBeInTheDocument();
    // Only other expense categories are offered
    const select = dialog.getByLabelText('Mover transações para');
    expect(within(select).queryByRole('option', { name: 'Salário' })).not.toBeInTheDocument();
    await user.selectOptions(select, 'c2');
    await user.click(dialog.getByRole('button', { name: 'Excluir' }));

    await waitFor(() => expect(requests('DELETE')).toHaveLength(1));
    expect(requests('DELETE')[0]!.url.pathname).toMatch(/\/categories\/c1$/);
    expect(requests('DELETE')[0]!.url.searchParams.get('replaceWith')).toBe('c2');
  });
});
