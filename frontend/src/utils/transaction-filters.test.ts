import { formatDate, monthRange } from './date';
import { pageWindow } from './page-window';
import {
  defaultFilters,
  filtersToQuery,
  filtersToSearchParams,
  parseFilters,
} from './transaction-filters';

const today = new Date(2026, 8, 25);
const parse = (query: string) => parseFilters(new URLSearchParams(query), today);

describe('transaction filters <-> URL', () => {
  it('defaults to the current month, newest first, 20 per page', () => {
    expect(parse('')).toEqual(defaultFilters(today));
    expect(filtersToSearchParams(defaultFilters(today), today).toString()).toBe('');
  });

  it('round-trips every filter through Portuguese URL params', () => {
    const query =
      'mes=2026-08&tipo=despesa&conta=acc-1&categoria=sem-categoria&busca=mercado&ordem=valor-asc&pagina=3&por-pagina=50';
    const filters = parse(query);

    expect(filters).toMatchObject({
      period: 'month',
      month: '2026-08',
      type: 'EXPENSE',
      accountId: 'acc-1',
      categoryId: 'none',
      search: 'mercado',
      sortBy: 'amount',
      sortOrder: 'asc',
      page: 3,
      pageSize: 50,
    });
    expect(filtersToSearchParams(filters, today).toString()).toBe(query);
  });

  it('detects custom ranges and the whole period', () => {
    expect(parse('de=2026-01-01&ate=2026-03-31')).toMatchObject({
      period: 'custom',
      from: '2026-01-01',
      to: '2026-03-31',
    });
    expect(parse('periodo=tudo').period).toBe('all');
  });

  it('ignores invalid values instead of breaking the page', () => {
    expect(
      parse('mes=2026-13&tipo=x&ordem=userId-up&pagina=-2&por-pagina=1000&de=2026-02-30'),
    ).toEqual(defaultFilters(today));
  });
});

describe('filtersToQuery', () => {
  it('turns a month into its first and last day', () => {
    expect(filtersToQuery(parse('mes=2028-02'))).toMatchObject({
      startDate: '2028-02-01',
      endDate: '2028-02-29',
    });
  });

  it('sends no period for "tudo" and swaps a reversed custom range', () => {
    const all = filtersToQuery(parse('periodo=tudo'));
    expect(all.startDate).toBeUndefined();
    expect(all.endDate).toBeUndefined();

    expect(filtersToQuery(parse('de=2026-05-10&ate=2026-05-01'))).toMatchObject({
      startDate: '2026-05-01',
      endDate: '2026-05-10',
    });
  });

  it('omits empty filters and trims the search', () => {
    const query = filtersToQuery({ ...defaultFilters(today), search: '  luz  ' });

    expect(query).toMatchObject({
      search: 'luz',
      page: 1,
      pageSize: 20,
      sortBy: 'date',
      sortOrder: 'desc',
    });
    expect(query).not.toHaveProperty('type', expect.anything());
    expect(query.accountId).toBeUndefined();
  });
});

describe('pageWindow', () => {
  it('shows first, last and neighbors, with gaps', () => {
    expect(pageWindow(6, 20)).toEqual([1, 'gap', 5, 6, 7, 'gap', 20]);
    expect(pageWindow(1, 3)).toEqual([1, 2, 3]);
    expect(pageWindow(2, 5)).toEqual([1, 2, 3, 'gap', 5]);
  });
});

describe('date helpers', () => {
  it('formats calendar dates without timezone shifts', () => {
    // new Date('2026-09-01') would be 31/08 in Brazil (UTC-3)
    expect(formatDate('2026-09-01')).toBe('01/09/2026');
  });

  it('knows the last day of each month', () => {
    expect(monthRange('2026-02').endDate).toBe('2026-02-28');
    expect(monthRange('2026-04').endDate).toBe('2026-04-30');
  });
});
