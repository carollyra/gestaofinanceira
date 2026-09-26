// Digits typed or pasted into a money field -> integer cents. Separators and
// currency symbols are ignored ("1.234,56" and "R$ 1234,56" -> 123456).
// Returns null when the value would exceed the limit.
export function parseMoneyDigits(text: string, max: number): number | null {
  const digits = text.replace(/\D/g, '').replace(/^0+/, '');
  if (digits.length > String(max).length) return null;
  const cents = Number(digits || '0');
  return cents > max ? null : cents;
}
