import { describe, expect, it } from 'vitest';

import { dateOnlySchema } from '../src/schemas/common.schema';
import {
  createTransferSchema,
  listTransfersQuerySchema,
  updateTransferSchema,
} from '../src/schemas/transfer.schema';

const FROM = '01a0d063-b433-77a3-bd86-868f88c12daf';
const TO = '01a0d063-ecb0-7149-bfd1-a1cf9760fdcb';

describe('dateOnlySchema', () => {
  it('parses YYYY-MM-DD to UTC midnight', () => {
    expect(dateOnlySchema.parse('2026-03-15').toISOString()).toBe('2026-03-15T00:00:00.000Z');
  });

  it('rejects impossible dates instead of rolling them over', () => {
    expect(dateOnlySchema.safeParse('2026-02-30').success).toBe(false);
    expect(dateOnlySchema.safeParse('2026-13-01').success).toBe(false);
  });

  it('accepts Feb 29 only on leap years', () => {
    expect(dateOnlySchema.safeParse('2028-02-29').success).toBe(true);
    expect(dateOnlySchema.safeParse('2026-02-29').success).toBe(false);
  });

  it('rejects datetimes and other formats', () => {
    expect(dateOnlySchema.safeParse('2026-03-15T10:00:00Z').success).toBe(false);
    expect(dateOnlySchema.safeParse('15/03/2026').success).toBe(false);
  });
});

describe('createTransferSchema', () => {
  it('fills default description', () => {
    const result = createTransferSchema.parse({
      fromAccountId: FROM,
      toAccountId: TO,
      amount: 10_000,
      date: '2026-09-01',
    });

    expect(result.description).toBe('Transferência');
  });

  it('rejects transfers to the same account', () => {
    const result = createTransferSchema.safeParse({
      fromAccountId: FROM,
      toAccountId: FROM,
      amount: 10_000,
      date: '2026-09-01',
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.path).toEqual(['toAccountId']);
  });

  it('rejects zero, negative and fractional amounts', () => {
    for (const amount of [0, -100, 10.5]) {
      const result = createTransferSchema.safeParse({
        fromAccountId: FROM,
        toAccountId: TO,
        amount,
        date: '2026-09-01',
      });
      expect(result.success).toBe(false);
    }
  });
});

describe('updateTransferSchema', () => {
  it('does not inject defaults', () => {
    expect(updateTransferSchema.parse({ amount: 500 })).toEqual({ amount: 500 });
  });

  it('rejects same account when both are sent', () => {
    expect(updateTransferSchema.safeParse({ fromAccountId: TO, toAccountId: TO }).success).toBe(
      false,
    );
  });
});

describe('listTransfersQuerySchema', () => {
  it('applies pagination defaults and coerces strings', () => {
    expect(listTransfersQuerySchema.parse({})).toMatchObject({ page: 1, pageSize: 20 });
    expect(listTransfersQuerySchema.parse({ page: '3', pageSize: '50' })).toMatchObject({
      page: 3,
      pageSize: 50,
    });
  });

  it('caps page size and rejects inverted periods', () => {
    expect(listTransfersQuerySchema.safeParse({ pageSize: '500' }).success).toBe(false);
    expect(
      listTransfersQuerySchema.safeParse({ startDate: '2026-09-10', endDate: '2026-09-01' })
        .success,
    ).toBe(false);
  });
});
