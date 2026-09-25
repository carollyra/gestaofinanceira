// Calendar dates (no time, no timezone) are stored in `date` columns.
// In JS they are represented as Date objects at UTC midnight.

export function parseDateOnly(value: string): Date {
  return new Date(`${value}T00:00:00.000Z`);
}

export function formatDateOnly(date: Date): string {
  return date.toISOString().slice(0, 10);
}
