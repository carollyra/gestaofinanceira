import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { PasswordField } from './PasswordField';
import { PasswordRequirements } from './PasswordRequirements';

describe('PasswordField', () => {
  it('toggles between hidden and visible with an accessible button', async () => {
    const user = userEvent.setup();
    render(<PasswordField label="Senha" />);

    const input = screen.getByLabelText('Senha');
    expect(input).toHaveAttribute('type', 'password');

    await user.click(screen.getByRole('button', { name: 'Mostrar senha' }));
    expect(input).toHaveAttribute('type', 'text');

    const hide = screen.getByRole('button', { name: 'Ocultar senha' });
    expect(hide).toHaveAttribute('aria-pressed', 'true');

    await user.click(hide);
    expect(input).toHaveAttribute('type', 'password');
    expect(screen.getByRole('button', { name: 'Mostrar senha' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
  });

  it('does not submit the form when toggling', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn((event: React.FormEvent) => event.preventDefault());
    render(
      <form onSubmit={onSubmit}>
        <PasswordField label="Senha" />
      </form>,
    );

    await user.click(screen.getByRole('button', { name: 'Mostrar senha' }));

    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('links the error message to the input', () => {
    render(<PasswordField label="Senha" error="Informe sua senha" />);

    const input = screen.getByLabelText('Senha');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAccessibleDescription('Informe sua senha');
  });
});

describe('PasswordRequirements', () => {
  const states = () =>
    screen
      .getAllByRole('listitem')
      .map((item) => [item.textContent, item.getAttribute('data-met')]);

  it('marks each rule as the user types', () => {
    const { rerender } = render(<PasswordRequirements password="" />);
    expect(states()).toEqual([
      ['8+ caracteres(pendente)', 'false'],
      ['Pelo menos uma letra(pendente)', 'false'],
      ['Pelo menos um número(pendente)', 'false'],
    ]);

    rerender(<PasswordRequirements password="abc1" />);
    expect(states().map(([, state]) => state)).toEqual(['false', 'true', 'true']);

    rerender(<PasswordRequirements password="abcdefg1" />);
    expect(states().map(([text]) => text)).toEqual([
      '8+ caracteres(atendido)',
      'Pelo menos uma letra(atendido)',
      'Pelo menos um número(atendido)',
    ]);
  });
});
