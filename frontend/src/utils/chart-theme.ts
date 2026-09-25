// Chart colors for the dark surface (cards are zinc-900, #18181b).
//
// Semantic series: income is blue, expense is orange, everywhere. Both come
// from the validated categorical palette (slots 1 and 2; on #18181b: CVD ΔE 26.8,
// all categorical checks pass).
const INCOME = '#3987e5';
const EXPENSE = '#d95926';

// Monochrome ramps for ranked lists: step 0 is the full semantic color, each
// next rank is darker (softer on the dark surface), same hue, chroma scaled
// with lightness. Generated in OKLCH down to a 2.2:1 floor against #18181b:
//   expense contrast: 4.56 | 3.98 | 3.41 | 2.96 | 2.54 | 2.21
//   income contrast:  4.87 | 4.19 | 3.58 | 3.05 | 2.59 | 2.21
// Adjacent steps differ by ~0.036 in OKLCH L, below the 0.06 needed to tell
// them apart in isolation: the rank is carried by position, name, value and
// percentage; the intensity only reinforces it.
const EXPENSE_RAMP = ['#d95926', '#c95222', '#b84a1f', '#a9431b', '#993c18', '#8a3614'] as const;
const INCOME_RAMP = ['#3987e5', '#347cd3', '#2e71c1', '#2966af', '#245b9e', '#1f518d'] as const;

export const chartTheme = {
  income: INCOME,
  expense: EXPENSE,
  grid: '#2c2c2a',
  axis: '#383835',
  muted: '#898781',
  textSecondary: '#c3c2b7',
  surface: '#18181b',
  // Status text for deltas; always paired with an icon and a label
  good: '#0ca30c',
  bad: '#f87171',
} as const;

export const RANK_RAMP_SIZE = EXPENSE_RAMP.length;

// Color of the item at `rank` (0 = largest) in a ranked list of incomes or expenses
export function rankColor(type: 'INCOME' | 'EXPENSE', rank: number): string {
  const ramp = type === 'INCOME' ? INCOME_RAMP : EXPENSE_RAMP;
  return ramp[Math.min(Math.max(rank, 0), ramp.length - 1)]!;
}
