// Largest amount accepted from clients: R$ 9.999.999,99.
// Keeps every stored value well inside PostgreSQL's 32-bit integer range.
export const MAX_AMOUNT_CENTS = 999_999_999;

// SUM() over integer columns returns bigint; raw queries give us BigInt.
// Sums of cents stay far below 2^53, but fail loudly if that ever changes.
export function bigintToNumber(value: bigint | number | null | undefined): number {
  if (value === null || value === undefined) return 0;
  if (typeof value === 'number') return value;

  if (value > BigInt(Number.MAX_SAFE_INTEGER) || value < BigInt(Number.MIN_SAFE_INTEGER)) {
    throw new RangeError(`Value ${value} exceeds the safe integer range`);
  }

  return Number(value);
}
