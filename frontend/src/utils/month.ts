// Months are handled as "YYYY-MM" strings, the format the API uses

export function currentMonth(now = new Date()): string {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

export function addMonths(month: string, amount: number): string {
  const [year, monthNumber] = month.split('-').map(Number) as [number, number];
  const date = new Date(Date.UTC(year, monthNumber - 1 + amount, 1));
  return date.toISOString().slice(0, 7);
}

export function isValidMonth(value: string | null): value is string {
  return !!value && /^\d{4}-(0[1-9]|1[0-2])$/.test(value);
}

const toDate = (month: string) => new Date(`${month}-01T12:00:00Z`);

// "setembro de 2026"
export function formatMonthLong(month: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(toDate(month));
}

// "set/26"
export function formatMonthShort(month: string) {
  const name = new Intl.DateTimeFormat('pt-BR', { month: 'short', timeZone: 'UTC' })
    .format(toDate(month))
    .replace('.', '');
  return `${name}/${month.slice(2, 4)}`;
}

// "Setembro de 2026": only the first letter (CSS capitalize would also give "De")
export function formatMonthTitle(month: string) {
  const text = formatMonthLong(month);
  return text.charAt(0).toUpperCase() + text.slice(1);
}

// One label every `step` months counting back from the last one, so the latest
// month is always labeled and the spacing stays even
export function alternateMonthTicks(months: string[], step = 2): string[] {
  return months.filter((_, i) => (months.length - 1 - i) % step === 0);
}
