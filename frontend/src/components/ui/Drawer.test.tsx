import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';

import { Drawer } from './Drawer';
import { Modal } from './Modal';

function Harness() {
  const [open, setOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        Abrir detalhe
      </button>
      <Drawer
        open={open}
        onClose={() => setOpen(false)}
        title="Transação"
        ariaLabel="Detalhes da transação: Mercado"
      >
        <p>Conteúdo</p>
        <button type="button" onClick={() => setModalOpen(true)}>
          Editar
        </button>
      </Drawer>
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Editar transação">
        <button type="button">Salvar</button>
      </Modal>
    </>
  );
}

describe('Drawer', () => {
  it('is an accessible modal dialog with focus inside, trapped', async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.click(screen.getByRole('button', { name: 'Abrir detalhe' }));

    const drawer = screen.getByRole('dialog', { name: 'Detalhes da transação: Mercado' });
    expect(drawer).toHaveAttribute('aria-modal', 'true');
    expect(drawer).toHaveAttribute('data-variant', 'side');
    expect(drawer).toContainElement(document.activeElement as HTMLElement);

    for (let i = 0; i < 4; i++) {
      await user.tab();
      expect(drawer).toContainElement(document.activeElement as HTMLElement);
    }
  });

  it('closes with Esc and gives focus back to the opener', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    const opener = screen.getByRole('button', { name: 'Abrir detalhe' });

    await user.click(opener);
    await user.keyboard('{Escape}');

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(opener).toHaveFocus();
  });

  it('closes on the overlay and on the close button', async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.click(screen.getByRole('button', { name: 'Abrir detalhe' }));
    await user.click(document.querySelector('.fixed.inset-0 > [aria-hidden]')!);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Abrir detalhe' }));
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Fechar' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('with a modal on top, Esc closes only the modal', async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.click(screen.getByRole('button', { name: 'Abrir detalhe' }));
    await user.click(screen.getByRole('button', { name: 'Editar' }));
    expect(screen.getByRole('dialog', { name: 'Editar transação' })).toBeInTheDocument();

    await user.keyboard('{Escape}');

    expect(screen.queryByRole('dialog', { name: 'Editar transação' })).not.toBeInTheDocument();
    expect(screen.getByRole('dialog', { name: /Detalhes da transação/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Editar' })).toHaveFocus();
  });

  it('becomes a bottom sheet on phones', async () => {
    vi.stubGlobal('matchMedia', (query: string) => ({
      matches: false,
      media: query,
      addEventListener: () => {},
      removeEventListener: () => {},
    }));
    const user = userEvent.setup();
    render(<Harness />);

    await user.click(screen.getByRole('button', { name: 'Abrir detalhe' }));

    expect(screen.getByRole('dialog')).toHaveAttribute('data-variant', 'sheet');
  });
});
