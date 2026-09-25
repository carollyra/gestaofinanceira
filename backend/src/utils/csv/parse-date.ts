import { formatDateOnly } from '../date';

// Accepts dd/mm/yyyy, dd-mm-yyyy, dd.mm.yyyy, dd/mm/yy and yyyy-mm-dd (with an
// optional time part, which is ignored). Returns a Date at UTC midnight, or
// null for invalid or impossible dates.
export function parseStatementDate(input: string): Date | null {
  const value = input.trim().split(/[ T]/)[0] ?? '';

  let year: number;
  let month: number;
  let day: number;

  const iso = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(value);
  const br = /^(\d{1,2})[/.-](\d{1,2})[/.-](\d{2}|\d{4})$/.exec(value);

  if (iso) {
    [year, month, day] = [Number(iso[1]), Number(iso[2]), Number(iso[3])];
  } else if (br) {
    [day, month, year] = [Number(br[1]), Number(br[2]), Number(br[3])];
    if (br[3]!.length === 2) year += 2000;
  } else {
    return null;
  }

  const date = new Date(Date.UTC(year, month - 1, day));
  const expected = `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

  // Rejects 31/02 and similar, which Date would roll over to the next month
  return formatDateOnly(date) === expected ? date : null;
}
