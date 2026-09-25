import { describe, expect, it } from 'vitest';

import { loginSchema, registerSchema } from '../../src/schemas/auth.schema';

const base = { name: 'Ana Souza', email: 'ana@example.com' };

function passwordErrors(password: string) {
  const result = registerSchema.safeParse({ ...base, password });
  return result.success ? [] : result.error.issues.map((issue) => issue.message);
}

describe('registerSchema password rules', () => {
  it('rejects a password with only letters', () => {
    expect(passwordErrors('senhasemnumero')).toEqual(['Senha deve conter pelo menos um número']);
  });

  it('rejects a password with only numbers', () => {
    expect(passwordErrors('1234567890')).toEqual(['Senha deve conter pelo menos uma letra']);
  });

  it('rejects a password shorter than 8 characters', () => {
    expect(passwordErrors('abc123')).toEqual(['Senha deve ter no mínimo 8 caracteres']);
  });

  it('lists every missing rule at once', () => {
    expect(passwordErrors('1234')).toEqual([
      'Senha deve ter no mínimo 8 caracteres',
      'Senha deve conter pelo menos uma letra',
    ]);
  });

  it('accepts a valid password', () => {
    expect(passwordErrors('senha123')).toEqual([]);
  });

  it('counts accented letters as letters', () => {
    expect(passwordErrors('çãéíóú12')).toEqual([]);
  });
});

describe('registerSchema normalization', () => {
  it('trims and lowercases the e-mail', () => {
    const result = registerSchema.parse({
      ...base,
      email: '  Ana@Example.COM ',
      password: 'senha123',
    });

    expect(result.email).toBe('ana@example.com');
  });
});

describe('loginSchema', () => {
  it('does not apply strength rules on login', () => {
    expect(loginSchema.safeParse({ email: 'ana@example.com', password: 'fraca' }).success).toBe(
      true,
    );
  });
});
