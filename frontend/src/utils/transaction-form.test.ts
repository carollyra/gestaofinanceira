import type { Transaction } from '@/types/api';

import { parseMoneyDigits } from './money-input';
import {
  changedFields,
  formValuesFromTransaction,
  todayLocal,
  toTransactionInput,
} from './transaction-form';

describe('parseMoneyDigits (money field -> integer cents)', () => {
  it('fills from the cents as digits are typed', () => {
    expect(parseMoneyDigits('1', 999_999_999)).toBe(1);
    expect(parseMoneyDigits('R$ 0,12', 999_999_999)).toBe(12);
    expect(parseMoneyDigits('R$ 1,250', 999_999_999)).toBe(1_250);
  });

  it('accepts pasted formatted values', () => {
    expect(parseMoneyDigits('1.234,56', 999_999_999)).toBe(123_456);
    expect(parseMoneyDigits('R$ 45,90', 999_999_999)).toBe(4_590);
  });

  it('clears to zero and rejects values beyond the limit', () => {
    expect(parseMoneyDigits('R$ ', 999_999_999)).toBe(0);
    expect(parseMoneyDigits('9999999999', 999_999_999)).toBeNull();
  });
});

const transaction: Transaction = {
  id: 't1',
  type: 'EXPENSE',
  amount: 4_590,
  date: '2026-09-10',
  description: 'Mercado',
  notes: null,
  recurringTransactionId: null,
  account: { id: 'acc-1', name: 'Conta', color: '#000000', type: 'CHECKING' },
  category: { id: 'cat-1', name: 'Mercado', color: '#000000', icon: 'shopping-cart' },
};

describe('transaction form mapping', () => {
  it('turns empty optional fields into null for the API', () => {
    expect(
      toTransactionInput({
        ...formValuesFromTransaction(transaction),
        categoryId: '',
        notes: '   ',
      }),
    ).toMatchObject({ categoryId: null, notes: null });
  });

  it('sends only the fields that changed when editing', () => {
    const values = {
      ...formValuesFromTransaction(transaction),
      amount: 5_000,
      description: ' Feira ',
    };

    expect(changedFields(transaction, values)).toEqual({ amount: 5_000, description: 'Feira' });
  });

  it('sends nothing when nothing changed', () => {
    expect(changedFields(transaction, formValuesFromTransaction(transaction))).toEqual({});
  });

  it('uses the local calendar for today', () => {
    expect(todayLocal(new Date(2026, 8, 30, 23, 45))).toBe('2026-09-30');
  });
});
