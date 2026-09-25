import { env } from './env';

// Months are handled as Dates at UTC midnight on the 1st, matching `date` columns

export function parseMonth(value: string): Date {
  return new Date(`${value}-01T00:00:00.000Z`);
}

export function formatMonth(date: Date): string {
  return date.toISOString().slice(0, 7);
}

export function addMonths(month: Date, amount: number): Date {
  return new Date(Date.UTC(month.getUTCFullYear(), month.getUTCMonth() + amount, 1));
}

// Current month as seen by the user, not by the server clock (UTC)
export function currentMonth(timeZone = env.APP_TIMEZONE, now = new Date()): Date {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
  }).formatToParts(now);

  const year = parts.find((part) => part.type === 'year')?.value;
  const month = parts.find((part) => part.type === 'month')?.value;

  return parseMonth(`${year}-${month}`);
}
