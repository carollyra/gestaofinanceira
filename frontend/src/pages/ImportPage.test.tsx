import { screen, waitFor, within } from '@testing-library/react';

import { fakeApi } from '@/test/fake-api';
import { renderWithProviders } from '@/test/render';
import type { ImportPreview, ImportPreviewRow } from '@/types/api';

import { ImportPage } from './ImportPage';

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
const categories = [
  {
    id: 'cat-food',
    name: 'Alimentação',
    type: 'EXPENSE',
    color: '#f97316',
    icon: 'utensils',
    _count: { transactions: 0 },
  },
  {
    id: 'cat-transport',
    name: 'Transporte',
    type: 'EXPENSE',
    color: '#3b82f6',
    icon: 'car',
    _count: { transactions: 0 },
  },
  {
    id: 'cat-salary',
    name: 'Salário',
    type: 'INCOME',
    color: '#10b981',
    icon: 'briefcase',
    _count: { transactions: 0 },
  },
];

function row(rowNumber: number, overrides: Partial<ImportPreviewRow>): ImportPreviewRow {
  return {
    rowNumber,
    status: 'VALID',
    errors: [],
    date: '2026-09-15',
    description: `Linha ${rowNumber}`,
    amount: 3_250,
    type: 'EXPENSE',
    notes: null,
    category: null,
    duplicate: null,
    ...overrides,
  };
}

const preview: ImportPreview = {
  detected: { encoding: 'windows-1252', delimiter: ';', headers: [], mapping: {} },
  summary: {
    total: 5,
    valid: 4,
    invalid: 1,
    ignored: 0,
    duplicates: 1,
    possibleDuplicates: 1,
    categorized: 1,
    income: 650_000,
    expense: 25_149,
  },
  rows: [
    row(5, {
      description: 'Salário',
      type: 'INCOME',
      amount: 650_000,
      duplicate: {
        status: 'EXACT',
        transactionId: 't1',
        date: '2026-09-05',
        description: 'Salário',
      },
    }),
    row(6, {
      description: 'ENEL CONTA DE LUZ',
      amount: 21_899,
      duplicate: {
        status: 'POSSIBLE',
        transactionId: 't2',
        date: '2026-09-10',
        description: 'Conta de luz',
      },
    }),
    row(7, {
      description: 'UBER *TRIP',
      category: {
        id: 'cat-transport',
        name: 'Transporte',
        color: '#3b82f6',
        icon: 'car',
        source: 'KEYWORD',
      },
    }),
    row(8, { description: 'Café', amount: 800 }),
    row(9, {
      status: 'INVALID',
      errors: ['Data inválida: "31/09/2026"'],
      date: null,
      description: 'Data errada',
      amount: 1_000,
    }),
  ],
};

function setup(options: { columnsError?: boolean } = {}) {
  let previews = 0;
  return fakeApi(({ url, method }) => {
    if (url.pathname.endsWith('/accounts')) return { status: 200, body: { data: accounts } };
    if (url.pathname.endsWith('/categories')) return { status: 200, body: { data: categories } };
    if (url.pathname.endsWith('/imports/preview') && method === 'POST') {
      previews += 1;
      if (options.columnsError && previews === 1) {
        return {
          status: 400,
          body: { message: 'Não encontramos as colunas de data, descrição e valor no arquivo' },
        };
      }
      return { status: 200, body: preview };
    }
    if (url.pathname.endsWith('/imports/confirm'))
      return { status: 201, body: { created: 3, skipped: 0 } };
    return undefined;
  });
}

const csv = () =>
  new File(['Quando;O que;Quanto\n15/09/2026;UBER *TRIP;-32,50\n'], 'extrato.csv', {
    type: 'text/csv',
  });

async function uploadAndAnalyze(user: ReturnType<typeof renderWithProviders>['user']) {
  await user.upload(await screen.findByLabelText('Arquivo do extrato'), csv());
  await user.click(screen.getByRole('button', { name: 'Analisar arquivo' }));
}

describe('ImportPage', () => {
  it('sends the file, reviews with sensible defaults and imports the selection', async () => {
    const { requests } = setup();
    const { user } = renderWithProviders(<ImportPage />, { route: '/importar' });

    await user.upload(await screen.findByLabelText('Arquivo do extrato'), csv());
    expect(screen.getByText('extrato.csv')).toBeInTheDocument();
    await user.click(screen.getByLabelText(/É fatura de cartão/));
    await user.click(screen.getByRole('button', { name: 'Analisar arquivo' }));

    await waitFor(() => expect(requests('POST', '/imports/preview')).toHaveLength(1));
    const form = requests('POST', '/imports/preview')[0]!.body as FormData;
    expect((form.get('file') as File).name).toBe('extrato.csv');
    expect(form.get('accountId')).toBe('acc-1');
    expect(form.get('invertSign')).toBe('true');

    // Duplicates and invalid rows start unselected; invalid rows cannot be selected
    const box = (n: number) =>
      screen.getByRole('checkbox', { name: new RegExp(`Importar linha ${n}:`) });
    expect(
      await screen.findByRole('button', { name: 'Importar 2 transações' }),
    ).toBeInTheDocument();
    expect(box(5)).not.toBeChecked();
    expect(box(6)).not.toBeChecked();
    expect(box(7)).toBeChecked();
    expect(box(9)).toBeDisabled();
    expect(screen.getByText(/Já registrada: /)).toBeInTheDocument();
    expect(screen.getByText(/Possível duplicata: /)).toBeInTheDocument();
    expect(screen.getByText('Sugerida por palavra-chave')).toBeInTheDocument();

    // The user decides the possible duplicate is real and categorizes the coffee
    await user.click(box(6));
    await user.selectOptions(screen.getByLabelText('Categoria da linha 8'), 'cat-food');
    await user.click(screen.getByRole('button', { name: 'Importar 3 transações' }));

    await waitFor(() => expect(requests('POST', '/imports/confirm')).toHaveLength(1));
    const body = requests('POST', '/imports/confirm')[0]!.body as {
      accountId: string;
      skipDuplicates: boolean;
      rows: unknown[];
    };
    expect(body.accountId).toBe('acc-1');
    expect(body.skipDuplicates).toBe(true);
    expect(body.rows).toEqual([
      {
        date: '2026-09-15',
        description: 'ENEL CONTA DE LUZ',
        amount: 21_899,
        type: 'EXPENSE',
        categoryId: null,
        notes: null,
      },
      {
        date: '2026-09-15',
        description: 'UBER *TRIP',
        amount: 3_250,
        type: 'EXPENSE',
        categoryId: 'cat-transport',
        notes: null,
      },
      {
        date: '2026-09-15',
        description: 'Café',
        amount: 800,
        type: 'EXPENSE',
        categoryId: 'cat-food',
        notes: null,
      },
    ]);

    expect(
      await screen.findByRole('heading', { name: '3 transações importadas' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Ver transações' })).toHaveAttribute(
      'href',
      '/transacoes?periodo=tudo&conta=acc-1',
    );
  });

  it('applies a category to every selected row of the same type', async () => {
    const { requests } = setup();
    const { user } = renderWithProviders(<ImportPage />, { route: '/importar' });
    await uploadAndAnalyze(user);
    await screen.findByRole('button', { name: 'Importar 2 transações' });

    await user.selectOptions(screen.getByLabelText('Categoria para as selecionadas'), 'cat-food');
    await user.click(screen.getByRole('button', { name: 'Aplicar a 2' }));
    expect(screen.getByLabelText('Categoria da linha 7')).toHaveValue('cat-food');
    expect(screen.getByLabelText('Categoria da linha 8')).toHaveValue('cat-food');

    await user.click(screen.getByRole('button', { name: 'Importar 2 transações' }));
    await waitFor(() => expect(requests('POST', '/imports/confirm')).toHaveLength(1));
    const body = requests('POST', '/imports/confirm')[0]!.body as {
      rows: { categoryId: string }[];
    };
    expect(body.rows.map((r) => r.categoryId)).toEqual(['cat-food', 'cat-food']);
  });

  it('sends skipDuplicates=false when an exact duplicate is imported on purpose', async () => {
    const { requests } = setup();
    const { user } = renderWithProviders(<ImportPage />, { route: '/importar' });
    await uploadAndAnalyze(user);

    await user.click(await screen.findByRole('checkbox', { name: /Importar linha 5:/ }));
    await user.click(screen.getByRole('button', { name: 'Importar 3 transações' }));

    await waitFor(() => expect(requests('POST', '/imports/confirm')).toHaveLength(1));
    expect(
      (requests('POST', '/imports/confirm')[0]!.body as { skipDuplicates: boolean }).skipDuplicates,
    ).toBe(false);
  });

  it('filters the review by tab', async () => {
    setup();
    const { user } = renderWithProviders(<ImportPage />, { route: '/importar' });
    await uploadAndAnalyze(user);
    await screen.findByRole('button', { name: 'Importar 2 transações' });

    await user.click(screen.getByRole('tab', { name: /Com problema/ }));

    const table = screen.getByRole('table', { name: 'Linhas do arquivo' });
    expect(within(table).getAllByRole('row')).toHaveLength(2); // header + invalid row
    expect(within(table).getByText(/Data inválida/)).toBeInTheDocument();
  });

  it('asks for the columns when the server cannot find them, suggesting names from the file', async () => {
    const { requests } = setup({ columnsError: true });
    const { user } = renderWithProviders(<ImportPage />, { route: '/importar' });
    await uploadAndAnalyze(user);

    expect(await screen.findByRole('alert')).toHaveTextContent('Não encontramos as colunas');
    const mapping = screen.getByRole('group', { name: 'Indique as colunas do arquivo' });
    const suggestions = [...document.querySelectorAll('#csv-columns option')].map((o) =>
      o.getAttribute('value'),
    );
    expect(suggestions).toEqual(expect.arrayContaining(['Quando', 'O que', 'Quanto']));

    await user.type(within(mapping).getByLabelText('Coluna da data'), 'Quando');
    await user.type(within(mapping).getByLabelText('Coluna da descrição'), 'O que');
    await user.type(within(mapping).getByLabelText('Coluna do valor'), 'Quanto');
    await user.click(screen.getByRole('button', { name: 'Analisar arquivo' }));

    await waitFor(() => expect(requests('POST', '/imports/preview')).toHaveLength(2));
    const form = requests('POST', '/imports/preview')[1]!.body as FormData;
    expect(JSON.parse(String(form.get('mapping')))).toEqual({
      date: 'Quando',
      description: 'O que',
      amount: 'Quanto',
    });
    expect(
      await screen.findByRole('button', { name: 'Importar 2 transações' }),
    ).toBeInTheDocument();
  });
});
