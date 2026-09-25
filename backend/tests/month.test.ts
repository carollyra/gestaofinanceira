import { describe, expect, it } from 'vitest';

import {
  categoryBreakdownQuerySchema,
  evolutionQuerySchema,
} from '../src/schemas/dashboard.schema';
import { addMonths, currentMonth, formatMonth, parseMonth } from '../src/utils/month';

describe('month utils', () => {
  it('parses and formats YYYY-MM', () => {
    expect(parseMonth('2026-09').toISOString()).toBe('2026-09-01T00:00:00.000Z');
    expect(formatMonth(parseMonth('2026-09'))).toBe('2026-09');
  });

  it('adds months across year boundaries', () => {
    expect(formatMonth(addMonths(parseMonth('2026-01'), -1))).toBe('2025-12');
    expect(formatMonth(addMonths(parseMonth('2026-12'), 1))).toBe('2027-01');
    expect(formatMonth(addMonths(parseMonth('2026-09'), -11))).toBe('2025-10');
  });

  it('uses the user timezone, not UTC, to define the current month', () => {
    // 2026-10-01 01:30 UTC is still 2026-09-30 22:30 in São Paulo
    const now = new Date('2026-10-01T01:30:00Z');

    expect(formatMonth(currentMonth('America/Sao_Paulo', now))).toBe('2026-09');
    expect(formatMonth(currentMonth('UTC', now))).toBe('2026-10');
  });
});

describe('dashboard schemas', () => {
  it('validates the month format', () => {
    expect(evolutionQuerySchema.safeParse({ endMonth: '2026-13' }).success).toBe(false);
    expect(evolutionQuerySchema.safeParse({ endMonth: '2026-9' }).success).toBe(false);
    expect(evolutionQuerySchema.parse({ endMonth: '2026-09' }).months).toBe(12);
  });

  it('limits the evolution window', () => {
    expect(evolutionQuerySchema.safeParse({ months: '0' }).success).toBe(false);
    expect(evolutionQuerySchema.safeParse({ months: '37' }).success).toBe(false);
  });

  it('accepts a month or a full period, never both or half', () => {
    expect(categoryBreakdownQuerySchema.safeParse({ month: '2026-09' }).success).toBe(true);
    expect(
      categoryBreakdownQuerySchema.safeParse({ startDate: '2026-09-01', endDate: '2026-09-15' })
        .success,
    ).toBe(true);
    expect(
      categoryBreakdownQuerySchema.safeParse({ month: '2026-09', startDate: '2026-09-01' }).success,
    ).toBe(false);
    expect(categoryBreakdownQuerySchema.safeParse({ startDate: '2026-09-01' }).success).toBe(false);
  });

  it('defaults to expenses', () => {
    expect(categoryBreakdownQuerySchema.parse({}).type).toBe('EXPENSE');
  });
});
