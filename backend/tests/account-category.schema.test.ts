import { describe, expect, it } from 'vitest';

import { createAccountSchema, updateAccountSchema } from '../src/schemas/account.schema';
import { createCategorySchema, updateCategorySchema } from '../src/schemas/category.schema';

describe('account schemas', () => {
  it('defaults initialBalance to zero on create', () => {
    const result = createAccountSchema.parse({ name: 'Carteira', type: 'WALLET' });

    expect(result.initialBalance).toBe(0);
  });

  it('does not inject defaults on update (would reset omitted fields)', () => {
    const result = updateAccountSchema.parse({ name: 'Nova' });

    expect(result).toEqual({ name: 'Nova' });
  });

  it('rejects fractional amounts: money must be integer cents', () => {
    const result = createAccountSchema.safeParse({
      name: 'Conta',
      type: 'CHECKING',
      initialBalance: 10.5,
    });

    expect(result.success).toBe(false);
  });

  it('accepts negative initial balance', () => {
    const result = createAccountSchema.parse({
      name: 'Cartão',
      type: 'CREDIT_CARD',
      initialBalance: -50_000,
    });

    expect(result.initialBalance).toBe(-50_000);
  });

  it('rejects an empty update', () => {
    expect(updateAccountSchema.safeParse({}).success).toBe(false);
  });
});

describe('category schemas', () => {
  it('normalizes color to lowercase', () => {
    const result = createCategorySchema.parse({
      name: 'Café',
      type: 'EXPENSE',
      color: '#AABBCC',
      icon: 'coffee',
    });

    expect(result.color).toBe('#aabbcc');
  });

  it('rejects invalid colors and icons', () => {
    const result = createCategorySchema.safeParse({
      name: 'Café',
      type: 'EXPENSE',
      color: 'red',
      icon: 'Coffee Cup',
    });

    expect(result.success).toBe(false);
  });

  it('does not allow changing the type', () => {
    const result = updateCategorySchema.parse({ name: 'Outro', type: 'INCOME' });

    expect(result).toEqual({ name: 'Outro' });
  });
});
