import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';

import { Modal } from './Modal';

function Harness({ onClose }: { onClose?: () => void }) {
  const [open, setOpen] = useState(false);
  const close = () => {
    onClose?.();
    setOpen(false);
  };

  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        Nova transação
      </button>
      <Modal open={open} onClose={close} title="Nova transação" description="Preencha os dados">
        <input aria-label="Descrição" />
        <button type="button">Salvar</button>
      </Modal>
    </>
  );
}

describe('Modal', () => {
  it('opens as an accessible dialog with focus inside', async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.click(screen.getByRole('button', { name: 'Nova transação' }));

    const dialog = screen.getByRole('dialog', { name: 'Nova transação' });
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAccessibleDescription('Preencha os dados');
    expect(dialog).toContainElement(document.activeElement as HTMLElement);
  });

  it('traps focus with Tab and closes with Esc, returning focus to the trigger', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<Harness onClose={onClose} />);
    const trigger = screen.getByRole('button', { name: 'Nova transação' });

    await user.click(trigger);
    const dialog = screen.getByRole('dialog');

    for (let i = 0; i < 5; i++) {
      await user.tab();
      expect(dialog).toContainElement(document.activeElement as HTMLElement);
    }

    await user.keyboard('{Escape}');

    expect(onClose).toHaveBeenCalledOnce();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it('closes from the close button', async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.click(screen.getByRole('button', { name: 'Nova transação' }));
    await user.click(screen.getByRole('button', { name: 'Fechar' }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
