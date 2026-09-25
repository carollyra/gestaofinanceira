import { render, screen } from '@testing-library/react';

import type { CategoryShare } from '@/types/api';

import { CategoryBreakdownList } from './CategoryBreakdownList';

const categories: CategoryShare[] = Array.from({ length: 8 }, (_, i) => ({
  categoryId: `c${i}`,
  name: `Categoria ${i + 1}`,
  // Arbitrary per-category colors must no longer leak into the list
  color: '#ff00ff',
  icon: 'x',
  total: 10_000 - i * 1_000,
  count: 1,
  percentage: 12.5,
}));

const colorsOf = (testId: string) =>
  screen.getAllByTestId(testId).map((el) => el.style.backgroundColor);

describe('CategoryBreakdownList colors', () => {
  it('uses the expense orange at full strength for the largest item, softer for the next ones', () => {
    render(<CategoryBreakdownList categories={categories} type="EXPENSE" />);

    const dots = colorsOf('rank-dot');
    expect(dots).toHaveLength(6);
    expect(dots[0]).toBe('rgb(217, 89, 38)'); // #d95926, the expense series color
    expect(new Set(dots).size).toBe(6);
    expect(dots).not.toContain('rgb(255, 0, 255)');
  });

  it('paints the dot and the bar of each item with exactly the same color', () => {
    render(<CategoryBreakdownList categories={categories} type="EXPENSE" />);

    expect(colorsOf('rank-bar')).toEqual(colorsOf('rank-dot'));
  });

  it('uses the income blue for incomes', () => {
    render(<CategoryBreakdownList categories={categories.slice(0, 2)} type="INCOME" />);

    expect(colorsOf('rank-dot')[0]).toBe('rgb(57, 135, 229)'); // #3987e5, the income series color
    expect(colorsOf('rank-bar')).toEqual(colorsOf('rank-dot'));
  });

  it('keeps name, value and percentage visible (color is not the only channel)', () => {
    render(<CategoryBreakdownList categories={categories.slice(0, 1)} type="EXPENSE" />);

    const row = screen.getByRole('listitem');
    expect(row).toHaveTextContent('Categoria 1');
    expect(row.textContent?.replaceAll(String.fromCharCode(160), ' ')).toContain(
      'R$ 100,00 · 12,5%',
    );
  });
});
