import { screen, waitFor, within } from '@testing-library/react';
import { useNavigate } from 'react-router';

import { TransactionsPage } from '@/pages/TransactionsPage';
import { fakeApi } from '@/test/fake-api';
import { renderWithProviders } from '@/test/render';
import type { Transaction } from '@/types/api';

const account = {
  id: 'acc-1',
  name: 'Conta corrente',
  color: '#3b82f6',
  type: 'CHECKING' as const,
};

function tx(id: string, overrides: Partial<Transaction> = {}): Transaction {
  return {
    id,
    type: 'EXPENSE',
    amount: 4_590,
    date: '2026-09-25',
    description: `Transação ${id}`,
    notes: null,
    recurringTransactionId: null,
    source: 'MANUAL',
    importFileName: null,
    createdAt: '2026-09-25T17:32:00.000Z',
    updatedAt: '2026-09-25T17:32:00.000Z',
    account,
    category: { id: 'cat-food', name: 'Alimentação', color: '#f97316', icon: 'utensils' },
    ...overrides,
  };
}

const list = [
  tx('t1', { description: 'Restaurante', notes: 'Aniversário da Ana' }),
  tx('t2', {
    description: 'Salário',
    type: 'INCOME',
    amount: 650_000,
    source: 'RECURRING',
    recurringTransactionId: 'rec-1',
    category: null,
  }),
  tx('t3', { description: 'UBER *TRIP', source: 'IMPORT', importFileName: 'extrato-setembro.csv' }),
];
// Not on the current page of the list: only reachable by its link
const elsewhere = tx('t9', { description: 'Compra antiga', date: '2025-01-10' });

const recurring = {
  id: 'rec-1',
  type: 'INCOME',
  amount: 650_000,
  description: 'Salário',
  notes: null,
  frequency: 'MONTHLY',
  day: 5,
  startDate: '2025-10-01',
  endDate: null,
  lastRunDate: '2026-09-29',
  nextOccurrence: '2026-10-05',
  active: true,
  account,
  category: null,
  _count: { transactions: 12 },
};

function setup() {
  let rows = [...list];
  return fakeApi(({ url, method }) => {
    const { pathname } = url;
    if (pathname.endsWith('/accounts'))
      return {
        status: 200,
        body: { data: [{ ...account, initialBalance: 0, balance: 0, archived: false }] },
      };
    if (pathname.endsWith('/categories')) return { status: 200, body: { data: [] } };
    if (pathname.endsWith('/recurring-transactions/rec-1')) return { status: 200, body: recurring };
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
    const id = pathname.split('/').pop()!;
    if (pathname.includes('/transactions/') && method === 'GET') {
      const found = [...rows, elsewhere].find((t) => t.id === id);
      return found
        ? { status: 200, body: found }
        : { status: 404, body: { message: 'Transação não encontrada' } };
    }
    if (pathname.includes('/transactions/') && method === 'DELETE') {
      rows = rows.filter((t) => t.id !== id);
      return { status: 204 };
    }
    return undefined;
  });
}

// Stands in for the browser Back button
function BackButton() {
  const navigate = useNavigate();
  return (
    <button type="button" onClick={() => navigate(-1)}>
      Voltar do navegador
    </button>
  );
}

const renderPage = (route = '/transacoes?mes=2026-09&tipo=despesa') =>
  renderWithProviders(
    <>
      <TransactionsPage />
      <BackButton />
    </>,
    { route },
  );

const normalize = (text: string | null) => (text ?? '').replaceAll(String.fromCharCode(160), ' ');

describe('transaction detail drawer', () => {
  it('opens from the list keeping the filters, and shows the full detail', async () => {
    setup();
    const { user } = renderPage();

    await user.click(await screen.findByRole('button', { name: 'Restaurante' }));

    const drawer = await screen.findByRole('dialog', {
      name: 'Detalhes da transação: Restaurante',
    });
    expect(screen.getByTestId('location')).toHaveTextContent(
      '/transacoes?mes=2026-09&tipo=despesa&transacao=t1',
    );
    const text = normalize(drawer.textContent);
    expect(text).toContain('Despesa−R$ 45,90');
    expect(text).toContain('Aniversário da Ana');
    expect(text).toContain('Saiu deConta corrente');
    expect(text).toContain('Sexta-feira, 25 de setembro de 2026');
    expect(text).toMatch(/Registrada em25\/09\/2026 às \d{2}:\d{2}/);
    expect(text).toContain('Lançada manualmente');
    expect(within(drawer).getByRole('button', { name: 'Editar' })).toBeInTheDocument();
  });

  it('also opens by clicking anywhere on the row', async () => {
    setup();
    const { user } = renderPage();

    await user.click((await screen.findAllByText('Conta corrente', { selector: 'td' }))[0]!);

    expect(
      await screen.findByRole('dialog', { name: /Detalhes da transação/ }),
    ).toBeInTheDocument();
  });

  it('closes with Esc, restores the URL and returns focus to the row', async () => {
    setup();
    const { user } = renderPage();
    const trigger = await screen.findByRole('button', { name: 'Restaurante' });

    await user.click(trigger);
    await screen.findByRole('dialog');
    await user.keyboard('{Escape}');

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(screen.getByTestId('location')).toHaveTextContent(
      /^\/transacoes\?mes=2026-09&tipo=despesa$/,
    );
    await waitFor(() => expect(screen.getByRole('button', { name: 'Restaurante' })).toHaveFocus());
  });

  it('closes with the browser Back button', async () => {
    setup();
    const { user } = renderPage();

    await user.click(await screen.findByRole('button', { name: 'Restaurante' }));
    await screen.findByRole('dialog');
    // The drawer traps focus, so Back is triggered as the browser would, outside the page
    screen.getByRole('button', { name: 'Voltar do navegador', hidden: true }).click();

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(screen.getByTestId('location')).not.toHaveTextContent('transacao');
  });

  it('opens from a shared link, even for a transaction outside the current page', async () => {
    const { requests } = setup();
    const { user } = renderPage('/transacoes?mes=2026-09&transacao=t9');

    expect(
      await screen.findByRole('dialog', { name: 'Detalhes da transação: Compra antiga' }),
    ).toBeInTheDocument();
    expect(requests('GET', '/transactions/t9')).toHaveLength(1);

    // Nothing of ours in the history: closing removes the parameter and stays on the page
    await user.click(screen.getByRole('button', { name: 'Fechar' }));
    await waitFor(() =>
      expect(screen.getByTestId('location')).toHaveTextContent(/^\/transacoes\?mes=2026-09$/),
    );
  });

  it('says so when the linked transaction does not exist', async () => {
    setup();
    renderPage('/transacoes?transacao=nao-existe');

    expect(
      await screen.findByText('Esta transação não existe mais ou não está disponível.'),
    ).toBeInTheDocument();
  });

  it('shows the CSV origin of imported transactions', async () => {
    setup();
    const { user } = renderPage();

    await user.click(await screen.findByRole('button', { name: 'UBER *TRIP' }));

    const drawer = await screen.findByRole('dialog', { name: /UBER/ });
    expect(drawer).toHaveTextContent('Importada de extrato CSV');
    expect(drawer).toHaveTextContent('extrato-setembro.csv');
  });

  it('links to the recurrence that generated it, and back', async () => {
    setup();
    const { user } = renderPage('/transacoes?mes=2026-09');

    await user.click(await screen.findByRole('button', { name: 'Salário' }));
    const drawer = await screen.findByRole('dialog', { name: 'Detalhes da transação: Salário' });
    expect(normalize(drawer.textContent)).toContain('Receita+R$ 6.500,00');
    expect(drawer).toHaveTextContent('Entrou em');
    expect(drawer).toHaveTextContent('Gerada por uma recorrência');

    await user.click(within(drawer).getByRole('link', { name: 'Ver recorrência' }));

    const recurrence = await screen.findByRole('dialog', {
      name: 'Detalhes da recorrência: Salário',
    });
    expect(screen.getByTestId('location')).toHaveTextContent('transacao=t2&recorrencia=rec-1');
    expect(recurrence).toHaveTextContent('Todo mês, no dia 5');
    expect(recurrence).toHaveTextContent('Segunda-feira, 5 de outubro de 2026');
    expect(recurrence).toHaveTextContent('12');

    await user.click(within(recurrence).getByRole('button', { name: 'Voltar para a transação' }));
    expect(
      await screen.findByRole('dialog', { name: 'Detalhes da transação: Salário' }),
    ).toBeInTheDocument();

    // Esc from the recurrence would close everything; from here too
    await user.keyboard('{Escape}');
    await waitFor(() =>
      expect(screen.getByTestId('location')).toHaveTextContent(/^\/transacoes\?mes=2026-09$/),
    );
  });

  it('edits in a modal on top of the drawer; Esc closes only the modal', async () => {
    setup();
    const { user } = renderPage();

    await user.click(await screen.findByRole('button', { name: 'Restaurante' }));
    const drawer = await screen.findByRole('dialog', { name: /Restaurante/ });
    await user.click(within(drawer).getByRole('button', { name: 'Editar' }));
    expect(await screen.findByRole('dialog', { name: 'Editar transação' })).toBeInTheDocument();

    await user.keyboard('{Escape}');

    await waitFor(() =>
      expect(screen.queryByRole('dialog', { name: 'Editar transação' })).not.toBeInTheDocument(),
    );
    expect(screen.getByRole('dialog', { name: /Restaurante/ })).toBeInTheDocument();
  });

  it('deletes from the drawer: closes it and moves focus to the list', async () => {
    const { requests } = setup();
    const { user } = renderPage();

    await user.click(await screen.findByRole('button', { name: 'Restaurante' }));
    await user.click(
      within(await screen.findByRole('dialog', { name: /Restaurante/ })).getByRole('button', {
        name: 'Excluir',
      }),
    );
    await user.click(
      within(await screen.findByRole('dialog', { name: 'Excluir transação?' })).getByRole(
        'button',
        { name: 'Excluir' },
      ),
    );

    await waitFor(() => expect(requests('DELETE', '/transactions/t1')).toHaveLength(1));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(screen.queryByRole('button', { name: 'Restaurante' })).not.toBeInTheDocument();
    expect(screen.getByTestId('location')).not.toHaveTextContent('transacao');
    await waitFor(() =>
      expect(screen.getByRole('region', { name: 'Lista de transações' })).toHaveFocus(),
    );
  });
});
