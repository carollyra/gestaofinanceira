// Calendar dates travel as "YYYY-MM-DD" strings; they are formatted without
// timezone conversion (new Date("2026-09-25") would be UTC midnight and show
// the previous day in Brazil)

export function formatDate(date: string) {
  const [year, month, day] = date.split('-');
  return `${day}/${month}/${year}`;
}

// "25 de set."
export function formatDayMonth(date: string) {
  const [year, month, day] = date.split('-').map(Number) as [number, number, number];
  return new Intl.DateTimeFormat('pt-BR', {
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
  }).format(new Date(Date.UTC(year, month - 1, day)));
}

// "sexta-feira, 25 de setembro"
export function formatWeekdayDate(date: string) {
  const [year, month, day] = date.split('-').map(Number) as [number, number, number];
  const text = new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: 'UTC',
  }).format(new Date(Date.UTC(year, month - 1, day)));
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export function isValidDate(value: string | null): value is string {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number) as [number, number, number];
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
  );
}

// First and last day of a "YYYY-MM" month
export function monthRange(month: string): { startDate: string; endDate: string } {
  const [year, monthNumber] = month.split('-').map(Number) as [number, number];
  const lastDay = new Date(Date.UTC(year, monthNumber, 0)).getUTCDate();
  return { startDate: `${month}-01`, endDate: `${month}-${String(lastDay).padStart(2, '0')}` };
}
