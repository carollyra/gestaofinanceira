import { render, screen } from '@testing-library/react';

import { AnimatedNumber } from './AnimatedNumber';

const format = (cents: number) => `R$ ${(cents / 100).toFixed(2)}`;

describe('AnimatedNumber', () => {
  it('shows the value immediately on first render', () => {
    render(<AnimatedNumber value={12_345} format={format} />);

    expect(screen.getByText('R$ 123.45', { selector: '[aria-hidden]' })).toBeInTheDocument();
  });

  it('ends on the new value and announces it once for screen readers', async () => {
    const { rerender } = render(<AnimatedNumber value={10_000} format={format} />);

    rerender(<AnimatedNumber value={25_000} format={format} />);

    expect(screen.getByText('R$ 250.00', { selector: '.sr-only' })).toBeInTheDocument();
    expect(await screen.findByText('R$ 250.00', { selector: '[aria-hidden]' })).toBeInTheDocument();
  });
});
