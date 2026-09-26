import { screen, waitFor, within } from '@testing-library/react';

import { fakeApi } from '@/test/fake-api';
import { renderWithProviders } from '@/test/render';
import type { Goal } from '@/types/api';
import { goalHint } from '@/utils/goal-hint';

import { GoalsPage } from './GoalsPage';

function goal(
  overrides: Omit<Partial<Goal>, 'progress'> & { progress?: Partial<Goal['progress']> },
): Goal {
  return {
    id: 'g1',
    name: 'Viagem',
    targetAmount: 800_000,
    currentAmount: 220_000,
    deadline: '2026-12-25',
    color: '#0ea5e9',
    icon: 'plane',
    ...overrides,
    progress: {
      percentage: 27.5,
      remaining: 580_000,
      completed: false,
      status: 'BEHIND',
      daysLeft: 90,
      monthlyNeeded: 193_334,
      expectedAmount: 400_000,
      ...overrides.progress,
    },
  };
}

function setup(goals: Goal[]) {
  return fakeApi(({ url, method, body }) => {
    if (url.pathname.endsWith('/goals') && method === 'GET') {
      return {
        status: 200,
        body: {
          data: goals,
          summary: {
            count: goals.length,
            completed: 0,
            totalTarget: 800_000,
            totalSaved: 220_000,
            percentage: 27.5,
          },
        },
      };
    }
    if (url.pathname.endsWith('/goals') && method === 'POST')
      return { status: 201, body: goal({ ...(body as object) }) };
    if (url.pathname.endsWith('/deposit')) {
      return {
        status: 200,
        body: goal({
          currentAmount: 800_000,
          progress: { completed: true, status: 'COMPLETED', percentage: 100 },
        }),
      };
    }
    return undefined;
  });
}

const normalize = (text: string | null) => (text ?? '').replaceAll(String.fromCharCode(160), ' ');

describe('goalHint', () => {
  it('tells what to do next in plain words', () => {
    expect(normalize(goalHint(goal({})))).toBe('Guarde R$ 1.933,34 por mês até 25/12/2026');
    expect(goalHint(goal({ progress: { completed: true, status: 'COMPLETED' } }))).toBe(
      'Meta atingida!',
    );
    expect(
      normalize(
        goalHint(
          goal({ deadline: null, progress: { status: 'NO_DEADLINE', monthlyNeeded: null } }),
        ),
      ),
    ).toBe('Faltam R$ 5.800,00');
  });
});

describe('GoalsPage', () => {
  it('shows progress, status and what to save per month', async () => {
    setup([goal({})]);
    renderWithProviders(<GoalsPage />, { route: '/metas' });

    const card = await screen.findByRole('region', { name: 'Viagem' });
    expect(within(card).getByText('Atrasada')).toBeInTheDocument();
    expect(normalize(card.textContent)).toContain('Guarde R$ 1.933,34 por mês até 25/12/2026');
    expect(within(card).getByRole('meter', { name: 'Progresso de Viagem' })).toHaveAttribute(
      'aria-valuenow',
      '28',
    );
  });

  it('deposits and celebrates when the goal is reached', async () => {
    const { requests } = setup([goal({})]);
    const { user } = renderWithProviders(<GoalsPage />, { route: '/metas' });

    await user.click(
      within(await screen.findByRole('region', { name: 'Viagem' })).getByRole('button', {
        name: 'Guardar',
      }),
    );
    const form = within(await screen.findByRole('dialog', { name: 'Guardar em Viagem' }));
    await user.click(form.getByRole('button', { name: /Usar o que falta/ }));
    await user.click(form.getByRole('button', { name: 'Guardar' }));

    await waitFor(() => expect(requests('POST', '/deposit')).toHaveLength(1));
    expect(requests('POST', '/deposit')[0]!.body).toEqual({ amount: 580_000 });
    expect(await screen.findByText('Parabéns! Você atingiu a meta Viagem')).toBeInTheDocument();
  });

  it('does not let a withdrawal exceed what was saved', async () => {
    const { requests } = setup([goal({})]);
    const { user } = renderWithProviders(<GoalsPage />, { route: '/metas' });

    await user.click(
      within(await screen.findByRole('region', { name: 'Viagem' })).getByRole('button', {
        name: 'Retirar',
      }),
    );
    const form = within(await screen.findByRole('dialog', { name: 'Retirar de Viagem' }));
    await user.type(form.getByLabelText('Valor a retirar'), '300000');
    await user.click(form.getByRole('button', { name: 'Retirar' }));

    expect(await form.findByText('Valor maior que o guardado na meta')).toBeInTheDocument();
    expect(requests('POST', '/withdraw')).toHaveLength(0);
  });

  it('creates a goal without deadline', async () => {
    const { requests } = setup([]);
    const { user } = renderWithProviders(<GoalsPage />, { route: '/metas' });
    await screen.findByText(/Nenhuma meta ainda/);

    await user.click(screen.getByRole('button', { name: 'Nova meta' }));
    const form = within(await screen.findByRole('dialog', { name: 'Nova meta' }));
    await user.type(form.getByLabelText('Nome'), 'Notebook');
    await user.type(form.getByLabelText('Valor da meta'), '650000');
    await user.click(form.getByRole('button', { name: 'Criar meta' }));

    await waitFor(() => expect(requests('POST', '/goals')).toHaveLength(1));
    expect(requests('POST', '/goals')[0]!.body).toMatchObject({
      name: 'Notebook',
      targetAmount: 650_000,
      currentAmount: 0,
      deadline: null,
    });
  });
});
