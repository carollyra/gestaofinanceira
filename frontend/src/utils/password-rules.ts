// Mirror of the backend rules (backend/src/schemas/auth.schema.ts) for instant
// feedback. The server still validates and remains the source of truth.
export const PASSWORD_MIN_LENGTH = 8;

export interface PasswordRule {
  id: 'length' | 'letter' | 'number';
  label: string;
  message: string;
  test: (password: string) => boolean;
}

export const PASSWORD_RULES: readonly PasswordRule[] = [
  {
    id: 'length',
    label: `${PASSWORD_MIN_LENGTH}+ caracteres`,
    message: `Senha deve ter no mínimo ${PASSWORD_MIN_LENGTH} caracteres`,
    test: (password) => password.length >= PASSWORD_MIN_LENGTH,
  },
  {
    id: 'letter',
    label: 'Pelo menos uma letra',
    message: 'Senha deve conter pelo menos uma letra',
    // \p{L} also accepts accented letters, like the backend
    test: (password) => /\p{L}/u.test(password),
  },
  {
    id: 'number',
    label: 'Pelo menos um número',
    message: 'Senha deve conter pelo menos um número',
    test: (password) => /\d/.test(password),
  },
];

// bcrypt ignores everything after 72 bytes; the backend rejects longer passwords
export const PASSWORD_MAX_BYTES = 72;

export function passwordByteLength(password: string) {
  return new TextEncoder().encode(password).length;
}
