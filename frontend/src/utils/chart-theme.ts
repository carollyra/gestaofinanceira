// Chart colors for the dark surface (cards are zinc-900, #18181b).
// Series slots come from the validated categorical palette, in fixed order:
// slot 1 blue, slot 2 orange (validated on #18181b: CVD ΔE 26.8, all checks pass).
export const chartTheme = {
  series1: '#3987e5',
  series2: '#d95926',
  grid: '#2c2c2a',
  axis: '#383835',
  muted: '#898781',
  textSecondary: '#c3c2b7',
  surface: '#18181b',
  // Status text for deltas; always paired with an icon and a label
  good: '#0ca30c',
  bad: '#f87171',
} as const;
