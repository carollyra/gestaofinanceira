import { MAX_AMOUNT_CENTS } from '../money';

// Parses a monetary string into signed integer cents without ever using
// floating point. Accepts Brazilian and international formats:
//   "1.234,56"  "1234,56"  "-1.234,56"  "R$ 1.234,56"  "(123,45)"
//   "1,234.56"  "1234.56"  "-89.9"  "1.234.567"  "150"
// Returns null when the value is not a valid amount.
export function parseAmountToCents(input: string): number | null {
  let value = input.trim().replace(/\s/g, '').replace(/R\$/i, '');

  let negative = false;
  if (/^\(.*\)$/.test(value)) {
    negative = true;
    value = value.slice(1, -1);
  }
  if (value.startsWith('-')) {
    negative = !negative;
    value = value.slice(1);
  } else if (value.startsWith('+')) {
    value = value.slice(1);
  } else if (value.endsWith('-')) {
    // Some bank exports put the sign at the end: "123,45-"
    negative = !negative;
    value = value.slice(0, -1);
  }

  if (!/^[\d.,]+$/.test(value) || !/\d/.test(value)) return null;

  const lastComma = value.lastIndexOf(',');
  const lastDot = value.lastIndexOf('.');
  let integerPart: string;
  let fractionPart = '';

  if (lastComma !== -1 && lastDot !== -1) {
    // Both present: the last one is the decimal separator
    const decimalIndex = Math.max(lastComma, lastDot);
    integerPart = value.slice(0, decimalIndex);
    fractionPart = value.slice(decimalIndex + 1);
  } else if (lastComma !== -1) {
    // Only commas: Brazilian decimal comma ("1234,56"), unless grouped like "1,234,567"
    if (/^\d{1,3}(,\d{3}){2,}$/.test(value)) {
      integerPart = value;
    } else {
      integerPart = value.slice(0, lastComma);
      fractionPart = value.slice(lastComma + 1);
    }
  } else if (lastDot !== -1) {
    // Only dots: thousands separators when every group has 3 digits ("1.234",
    // "1.234.567"), otherwise a decimal point ("1234.56", "89.9")
    if (/^\d{1,3}(\.\d{3})+$/.test(value)) {
      integerPart = value;
    } else {
      integerPart = value.slice(0, lastDot);
      fractionPart = value.slice(lastDot + 1);
    }
  } else {
    integerPart = value;
  }

  // Thousands separators must form proper groups of 3 digits ("1.234.567"),
  // which rejects things like "1,2,3" or "1.23.4"
  if (!/^(\d*|\d{1,3}(\.\d{3})+|\d{1,3}(,\d{3})+)$/.test(integerPart)) return null;
  if (!/^\d{0,2}$/.test(fractionPart)) return null;

  integerPart = integerPart.replace(/[.,]/g, '');

  const cents = Number(integerPart || '0') * 100 + Number(fractionPart.padEnd(2, '0') || '0');

  if (!Number.isSafeInteger(cents) || cents > MAX_AMOUNT_CENTS) return null;

  return negative ? -cents : cents;
}
