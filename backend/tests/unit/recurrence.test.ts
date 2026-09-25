import { describe, expect, it } from 'vitest';

import { formatDateOnly, parseDateOnly, todayInTimezone } from '../../src/utils/date';
import {
  defaultDayFor,
  getNextOccurrence,
  getOccurrenceDates,
  isValidDay,
  type RecurrenceRule,
} from '../../src/utils/recurrence';

const d = parseDateOnly;
const fmt = (dates: Date[]) => dates.map(formatDateOnly);

function rule(overrides: Partial<RecurrenceRule>): RecurrenceRule {
  return { frequency: 'MONTHLY', day: 1, startDate: d('2026-01-01'), endDate: null, ...overrides };
}

describe('getOccurrenceDates - MONTHLY', () => {
  it('returns one date per month within the window', () => {
    const dates = getOccurrenceDates(rule({ day: 5 }), d('2026-01-01'), d('2026-04-30'));

    expect(fmt(dates)).toEqual(['2026-01-05', '2026-02-05', '2026-03-05', '2026-04-05']);
  });

  it('clamps day 31 to the last day of shorter months, including leap years', () => {
    const dates = getOccurrenceDates(
      rule({ day: 31, startDate: d('2028-01-01') }),
      d('2028-01-01'),
      d('2028-04-30'),
    );

    expect(fmt(dates)).toEqual(['2028-01-31', '2028-02-29', '2028-03-31', '2028-04-30']);
  });

  it('skips the first month when the day already passed the start date', () => {
    const dates = getOccurrenceDates(
      rule({ day: 10, startDate: d('2026-01-15') }),
      d('2026-01-01'),
      d('2026-03-31'),
    );

    expect(fmt(dates)).toEqual(['2026-02-10', '2026-03-10']);
  });

  it('includes both window bounds and stops at the end date', () => {
    const dates = getOccurrenceDates(
      rule({ day: 10, endDate: d('2026-03-10') }),
      d('2026-01-10'),
      d('2026-12-31'),
    );

    expect(fmt(dates)).toEqual(['2026-01-10', '2026-02-10', '2026-03-10']);
  });

  it('crosses year boundaries', () => {
    const dates = getOccurrenceDates(rule({ day: 15 }), d('2026-11-01'), d('2027-02-28'));

    expect(fmt(dates)).toEqual(['2026-11-15', '2026-12-15', '2027-01-15', '2027-02-15']);
  });

  it('returns nothing when the window is before the start or after the end', () => {
    expect(
      getOccurrenceDates(rule({ startDate: d('2026-06-01') }), d('2026-01-01'), d('2026-05-31')),
    ).toEqual([]);
    expect(
      getOccurrenceDates(rule({ endDate: d('2026-02-01') }), d('2026-03-01'), d('2026-12-31')),
    ).toEqual([]);
  });
});

describe('getOccurrenceDates - WEEKLY', () => {
  it('returns every matching weekday', () => {
    // 2026-09-01 is a Tuesday; day 5 = Friday
    const dates = getOccurrenceDates(
      rule({ frequency: 'WEEKLY', day: 5, startDate: d('2026-09-01') }),
      d('2026-09-01'),
      d('2026-09-30'),
    );

    expect(fmt(dates)).toEqual(['2026-09-04', '2026-09-11', '2026-09-18', '2026-09-25']);
  });

  it('includes the start date when it is the matching weekday', () => {
    const dates = getOccurrenceDates(
      rule({ frequency: 'WEEKLY', day: 2, startDate: d('2026-09-01') }),
      d('2026-09-01'),
      d('2026-09-08'),
    );

    expect(fmt(dates)).toEqual(['2026-09-01', '2026-09-08']);
  });
});

describe('getOccurrenceDates - YEARLY', () => {
  it("repeats in the start date's month", () => {
    const dates = getOccurrenceDates(
      rule({ frequency: 'YEARLY', day: 20, startDate: d('2024-03-20') }),
      d('2024-01-01'),
      d('2026-12-31'),
    );

    expect(fmt(dates)).toEqual(['2024-03-20', '2025-03-20', '2026-03-20']);
  });

  it('moves Feb 29 to Feb 28 in non-leap years', () => {
    const dates = getOccurrenceDates(
      rule({ frequency: 'YEARLY', day: 29, startDate: d('2028-02-29') }),
      d('2028-01-01'),
      d('2030-12-31'),
    );

    expect(fmt(dates)).toEqual(['2028-02-29', '2029-02-28', '2030-02-28']);
  });
});

describe('getOccurrenceDates - no duplicates across consecutive runs', () => {
  it('splitting the period at any day yields the same dates, without overlap', () => {
    const r = rule({ frequency: 'WEEKLY', day: 1, startDate: d('2026-01-01') });
    const whole = fmt(getOccurrenceDates(r, d('2026-01-01'), d('2026-06-30')));

    // Simulates runs on consecutive days: each run starts the day after the previous one
    const pieces: string[] = [];
    let from = d('2026-01-01');
    for (
      let day = d('2026-01-01');
      day <= d('2026-06-30');
      day = new Date(day.getTime() + 86_400_000)
    ) {
      pieces.push(...fmt(getOccurrenceDates(r, from, day)));
      from = new Date(day.getTime() + 86_400_000);
    }

    expect(pieces).toEqual(whole);
    expect(new Set(pieces).size).toBe(pieces.length);
  });
});

describe('recurrence helpers', () => {
  it('derives the default day from the start date', () => {
    expect(defaultDayFor('WEEKLY', d('2026-09-25'))).toBe(5);
    expect(defaultDayFor('MONTHLY', d('2026-09-25'))).toBe(25);
  });

  it('validates the day range per frequency', () => {
    expect(isValidDay('WEEKLY', 0)).toBe(true);
    expect(isValidDay('WEEKLY', 7)).toBe(false);
    expect(isValidDay('MONTHLY', 0)).toBe(false);
    expect(isValidDay('MONTHLY', 31)).toBe(true);
  });

  it('finds the next occurrence, or null after the end date', () => {
    expect(formatDateOnly(getNextOccurrence(rule({ day: 10 }), d('2026-09-11'))!)).toBe(
      '2026-10-10',
    );
    expect(
      getNextOccurrence(rule({ day: 10, endDate: d('2026-09-10') }), d('2026-09-11')),
    ).toBeNull();
  });

  it("computes today in the user's timezone", () => {
    const now = new Date('2026-10-01T01:30:00Z');

    expect(formatDateOnly(todayInTimezone('America/Sao_Paulo', now))).toBe('2026-09-30');
    expect(formatDateOnly(todayInTimezone('UTC', now))).toBe('2026-10-01');
  });
});
