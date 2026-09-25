import type { RecurrenceFrequency } from '../generated/prisma/enums';
import { addDays, daysInMonth } from './date';

export interface RecurrenceRule {
  frequency: RecurrenceFrequency;
  // WEEKLY: 0 (Sunday) to 6. MONTHLY/YEARLY: day of month, 1 to 31
  day: number;
  startDate: Date;
  endDate: Date | null;
}

// Day 31 in a 30-day month (or 29-31 in February) falls on the month's last day
function clampedDate(year: number, monthIndex: number, day: number): Date {
  return new Date(Date.UTC(year, monthIndex, Math.min(day, daysInMonth(year, monthIndex))));
}

// Default `day` when the client does not send one: taken from the start date
export function defaultDayFor(frequency: RecurrenceFrequency, startDate: Date): number {
  return frequency === 'WEEKLY' ? startDate.getUTCDay() : startDate.getUTCDate();
}

export function isValidDay(frequency: RecurrenceFrequency, day: number): boolean {
  return frequency === 'WEEKLY' ? day >= 0 && day <= 6 : day >= 1 && day <= 31;
}

// All occurrence dates of the rule within [from, to], both inclusive
export function getOccurrenceDates(rule: RecurrenceRule, from: Date, to: Date): Date[] {
  const start = from > rule.startDate ? from : rule.startDate;
  const end = rule.endDate && rule.endDate < to ? rule.endDate : to;

  if (start > end) return [];

  const dates: Date[] = [];

  switch (rule.frequency) {
    case 'WEEKLY': {
      const offset = (rule.day - start.getUTCDay() + 7) % 7;
      for (let date = addDays(start, offset); date <= end; date = addDays(date, 7)) {
        dates.push(date);
      }
      break;
    }

    case 'MONTHLY': {
      let year = start.getUTCFullYear();
      let month = start.getUTCMonth();

      while (Date.UTC(year, month, 1) <= end.getTime()) {
        const date = clampedDate(year, month, rule.day);
        if (date >= start && date <= end) dates.push(date);

        month += 1;
        if (month === 12) {
          month = 0;
          year += 1;
        }
      }
      break;
    }

    case 'YEARLY': {
      // Happens every year in the start date's month
      const month = rule.startDate.getUTCMonth();

      for (let year = start.getUTCFullYear(); year <= end.getUTCFullYear(); year++) {
        const date = clampedDate(year, month, rule.day);
        if (date >= start && date <= end) dates.push(date);
      }
      break;
    }
  }

  return dates;
}

export function getNextOccurrence(rule: RecurrenceRule, from: Date): Date | null {
  // Two years always contain at least one occurrence of any active rule
  const horizon = new Date(
    Date.UTC(from.getUTCFullYear() + 2, from.getUTCMonth(), from.getUTCDate()),
  );
  return getOccurrenceDates(rule, from, horizon)[0] ?? null;
}
