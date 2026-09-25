import { registerSchema } from './auth-schemas';
import { PASSWORD_RULES } from './password-rules';

const met = (password: string) =>
  PASSWORD_RULES.filter((rule) => rule.test(password)).map((rule) => rule.id);

describe('password rules (mirror of the backend)', () => {
  it('flags each missing requirement', () => {
    expect(met('senhasemnumero')).toEqual(['length', 'letter']);
    expect(met('1234567890')).toEqual(['length', 'number']);
    expect(met('abc123')).toEqual(['letter', 'number']);
    expect(met('senha123')).toEqual(['length', 'letter', 'number']);
  });

  it('counts accented letters as letters', () => {
    expect(met('çãéíóú12')).toEqual(['length', 'letter', 'number']);
  });

  it('produces the same messages as the API', () => {
    const result = registerSchema.safeParse({
      name: 'Ana',
      email: 'ana@example.com',
      password: '1234',
      confirmPassword: '1234',
    });

    expect(result.error?.issues.map((issue) => issue.message)).toEqual([
      'Senha deve ter no mínimo 8 caracteres',
      'Senha deve conter pelo menos uma letra',
    ]);
  });

  it('requires the confirmation to match', () => {
    const result = registerSchema.safeParse({
      name: 'Ana',
      email: 'ana@example.com',
      password: 'senha123',
      confirmPassword: 'senha124',
    });

    expect(result.error?.issues[0]).toMatchObject({
      path: ['confirmPassword'],
      message: 'As senhas não conferem',
    });
  });
});
