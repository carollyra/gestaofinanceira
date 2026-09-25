// Calendar dates (no time, no timezone) are stored in `date` columns.
// In JS they are represented as Date objects at UTC midnight.

export function parseDateOnly(value: string): Date {
  return new Date(`${value}T00:00:00.000Z`);
}

export function formatDateOnly(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() + days);
  return result;
}

export function daysInMonth(year: number, monthIndex: number): number {
  return new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();
}

// Today's calendar date for the user (APP_TIMEZONE), as a Date at UTC midnight
export function todayInTimezone(timeZone: string, now = new Date()): Date {
  return parseDateOnly(new Intl.DateTimeFormat('en-CA', { timeZone }).format(now));
}
