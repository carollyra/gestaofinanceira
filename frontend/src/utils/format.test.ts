import type { CategoryShare } from '@/types/api';

import { foldCategories } from './fold-categories';
import { formatCompactCurrency, formatCurrency, formatPercent } from './money';
import {
  addMonths,
  alternateMonthTicks,
  currentMonth,
  formatMonthLong,
  formatMonthShort,
  formatMonthTitle,
  isValidMonth,
} from './month';

// Intl puts a non-breaking space after "R$"
const NBSP = String.fromCharCode(160);

const normalize = (value: string) => value.replaceAll(NBSP, ' ');

describe('money formatting (cents -> reais only at display time)', () => {
  it('formats integer cents as BRL', () => {
    expect(normalize(formatCurrency(123_456))).toBe('R$ 1.234,56');
    expect(normalize(formatCurrency(5))).toBe('R$ 0,05');
    expect(normalize(formatCurrency(-4_590))).toBe('-R$ 45,90');
  });

  it('adds a plus sign when asked, for results', () => {
    expect(normalize(formatCurrency(10_000, { signed: true }))).toBe('+R$ 100,00');
    expect(normalize(formatCurrency(0, { signed: true }))).toBe('R$ 0,00');
  });

  it('compacts large values for axes', () => {
    expect(normalize(formatCompactCurrency(1_250_000))).toBe('R$ 12,5 mil');
    expect(normalize(formatCompactCurrency(398_000_000))).toBe('R$ 4 mi');
  });

  it('formats percentages with a comma', () => {
    expect(formatPercent(83.333)).toBe('83,3%');
  });
});

describe('month helpers', () => {
  it('navigates across years', () => {
    expect(addMonths('2026-01', -1)).toBe('2025-12');
    expect(addMonths('2026-12', 1)).toBe('2027-01');
  });

  it('uses the local calendar for the current month', () => {
    expect(currentMonth(new Date(2026, 8, 30, 23, 30))).toBe('2026-09');
  });

  it('validates and formats months in Portuguese', () => {
    expect(isValidMonth('2026-09')).toBe(true);
    expect(isValidMonth('2026-13')).toBe(false);
    expect(isValidMonth(null)).toBe(false);
    expect(formatMonthLong('2026-09')).toBe('setembro de 2026');
    expect(formatMonthShort('2026-09')).toBe('set/26');
    expect(formatMonthTitle('2026-09')).toBe('Setembro de 2026');
  });

  it('labels every other month, always including the last one', () => {
    expect(alternateMonthTicks(['2026-01', '2026-02', '2026-03', '2026-04'])).toEqual([
      '2026-02',
      '2026-04',
    ]);
    expect(alternateMonthTicks(['2026-01', '2026-02', '2026-03'])).toEqual(['2026-01', '2026-03']);
    expect(alternateMonthTicks(['2026-01', '2026-02', '2026-03', '2026-04'], 3)).toEqual([
      '2026-01',
      '2026-04',
    ]);
  });
});

describe('foldCategories', () => {
  const category = (name: string, total: number, percentage: number): CategoryShare => ({
    categoryId: name,
    name,
    color: '#000000',
    icon: 'x',
    total,
    count: 1,
    percentage,
  });

  it('keeps short lists untouched', () => {
    const list = [category('A', 100, 100)];
    expect(foldCategories(list)).toBe(list);
  });

  it('folds the tail into "Outras" summing totals and percentages', () => {
    const list = Array.from({ length: 8 }, (_, i) => category(`C${i}`, 100 - i, 12.5));
    const folded = foldCategories(list);

    expect(folded).toHaveLength(6);
    expect(folded[5]).toMatchObject({
      name: 'Outras (3)',
      total: 95 + 94 + 93,
      count: 3,
      percentage: 37.5,
    });
  });
});
