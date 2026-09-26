import { screen, within } from '@testing-library/react';
import { Route, Routes } from 'react-router';

import { fakeApi } from '@/test/fake-api';
import { renderWithProviders } from '@/test/render';

import { AppLayout } from './AppLayout';

function Layout() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="*" element={<p>Conteúdo</p>} />
      </Route>
    </Routes>
  );
}

describe('AppLayout navigation', () => {
  it('lists every section on wide screens', async () => {
    fakeApi();
    renderWithProviders(<Layout />);

    const nav = (await screen.findAllByRole('navigation', { name: 'Principal' }))[0]!;
    expect(
      within(nav)
        .getAllByRole('link')
        .map((link) => link.textContent),
    ).toEqual(['Dashboard', 'Transações', 'Orçamentos', 'Metas', 'Contas', 'Categorias']);
  });

  it('on phones, keeps four shortcuts and puts the rest under "Mais"', async () => {
    fakeApi();
    const { user } = renderWithProviders(<Layout />);

    const bottomNav = (await screen.findAllByRole('navigation', { name: 'Principal' }))[1]!;
    expect(within(bottomNav).getAllByRole('link')).toHaveLength(4);

    await user.click(within(bottomNav).getByRole('button', { name: 'Mais' }));
    const sheet = within(await screen.findByRole('dialog', { name: 'Mais' }));
    expect(sheet.getByRole('link', { name: 'Contas' })).toHaveAttribute('href', '/contas');
    expect(sheet.getByRole('link', { name: 'Categorias' })).toHaveAttribute('href', '/categorias');
    expect(sheet.getByRole('button', { name: 'Sair' })).toBeInTheDocument();
  });
});
