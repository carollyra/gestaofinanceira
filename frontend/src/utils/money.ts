// Money travels as integer cents everywhere; it only becomes reais here, for display

const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const compactCurrency = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  notation: 'compact',
  maximumFractionDigits: 1,
});
const percent = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 });

export function formatCurrency(cents: number, options: { signed?: boolean } = {}) {
  const formatted = currency.format(cents / 100);
  return options.signed && cents > 0 ? `+${formatted}` : formatted;
}

// Axis ticks and tight spots: "R$ 12,5 mil"
export function formatCompactCurrency(cents: number) {
  return compactCurrency.format(cents / 100);
}

export function formatPercent(value: number) {
  return `${percent.format(value)}%`;
}
