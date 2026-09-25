import { describe, expect, it } from 'vitest';

import { decodeCsvBuffer } from '../../src/utils/csv/decode';
import { parseAmountToCents } from '../../src/utils/csv/parse-amount';
import { parseStatementDate } from '../../src/utils/csv/parse-date';
import { detectDelimiter, parseStatementCsv } from '../../src/utils/csv/statement-parser';
import { formatDateOnly } from '../../src/utils/date';

describe('parseAmountToCents', () => {
  it.each([
    ['1.234,56', 123_456],
    ['1234,56', 123_456],
    ['-1.234,56', -123_456],
    ['R$ 1.234,56', 123_456],
    ['-R$ 45,90', -4_590],
    ['R$ -45,90', -4_590],
    ['(123,45)', -12_345],
    ['123,45-', -12_345],
    ['1,234.56', 123_456],
    ['1234.56', 123_456],
    ['-89.9', -8_990],
    ['0,5', 50],
    ['150', 15_000],
    ['1.234', 123_400],
    ['1.234.567', 123_456_700],
    ['1,234,567', 123_456_700],
    ['+ 10,00', 1_000],
  ])('%s -> %i cents', (input, expected) => {
    expect(parseAmountToCents(input)).toBe(expected);
  });

  it('never goes through floating point (0.1 + 0.2 style errors)', () => {
    expect(parseAmountToCents('0,29')).toBe(29);
    expect(parseAmountToCents('1.005,07')).toBe(100_507);
    expect(parseAmountToCents('4.35')).toBe(435);
  });

  it.each(['', 'abc', '12,345', '1,2,3', '--5', 'R$', '1.23.4', '999999999,99'])(
    'rejects %j',
    (input) => {
      expect(parseAmountToCents(input)).toBeNull();
    },
  );
});

describe('parseStatementDate', () => {
  const fmt = (value: string) => {
    const date = parseStatementDate(value);
    return date && formatDateOnly(date);
  };

  it('accepts Brazilian and ISO formats', () => {
    expect(fmt('25/09/2026')).toBe('2026-09-25');
    expect(fmt('5/9/2026')).toBe('2026-09-05');
    expect(fmt('25-09-2026')).toBe('2026-09-25');
    expect(fmt('25.09.2026')).toBe('2026-09-25');
    expect(fmt('25/09/26')).toBe('2026-09-25');
    expect(fmt('2026-09-25')).toBe('2026-09-25');
    expect(fmt('2026-09-25T14:30:00')).toBe('2026-09-25');
    expect(fmt('25/09/2026 14:30')).toBe('2026-09-25');
  });

  it('rejects impossible and malformed dates', () => {
    expect(fmt('31/02/2026')).toBeNull();
    expect(fmt('29/02/2026')).toBeNull();
    expect(fmt('13/13/2026')).toBeNull();
    expect(fmt('09/25')).toBeNull();
    expect(fmt('ontem')).toBeNull();
  });
});

describe('decodeCsvBuffer', () => {
  it('reads UTF-8 and strips the BOM', () => {
    const buffer = Buffer.concat([
      Buffer.from([0xef, 0xbb, 0xbf]),
      Buffer.from('Descrição', 'utf8'),
    ]);

    expect(decodeCsvBuffer(buffer)).toEqual({ content: 'Descrição', encoding: 'utf-8' });
  });

  it('falls back to Windows-1252', () => {
    const buffer = Buffer.from([0x44, 0xe9, 0x62, 0x69, 0x74, 0x6f]); // "Débito" in Latin-1

    expect(decodeCsvBuffer(buffer)).toEqual({ content: 'Débito', encoding: 'windows-1252' });
  });
});

describe('detectDelimiter', () => {
  it('detects comma, semicolon and tab', () => {
    expect(detectDelimiter('a,b,c\n1,2,3')).toBe(',');
    expect(detectDelimiter('Data;Valor;Descrição\n01/09/2026;-10,50;Café')).toBe(';');
    expect(detectDelimiter('a\tb\n1\t2')).toBe('\t');
  });

  it('ignores delimiters inside quotes', () => {
    expect(detectDelimiter('Data;Descrição;Valor\n01/09;"Loja, Centro";"1,50"')).toBe(';');
  });
});

describe('parseStatementCsv', () => {
  const summary = (csv: string, options = {}) =>
    parseStatementCsv(csv, options).rows.map((r) => ({
      date: r.date && formatDateOnly(r.date),
      description: r.description,
      amount: r.amount,
      type: r.type,
      status: r.status,
    }));

  it('reads a bank account export (signed amounts, comma delimiter)', () => {
    const csv = [
      'Data,Valor,Identificador,Descrição',
      '01/09/2026,6500.00,abc,Salário',
      '02/09/2026,-45.90,def,Padaria Central',
    ].join('\n');

    expect(summary(csv)).toEqual([
      {
        date: '2026-09-01',
        description: 'Salário',
        amount: 650_000,
        type: 'INCOME',
        status: 'VALID',
      },
      {
        date: '2026-09-02',
        description: 'Padaria Central',
        amount: 4_590,
        type: 'EXPENSE',
        status: 'VALID',
      },
    ]);
  });

  it('inverts the sign for credit card statements (purchases are positive)', () => {
    const csv = [
      'date,title,amount',
      '2026-09-03,Uber Trip,23.50',
      '2026-09-04,Estorno,-10.00',
    ].join('\n');

    expect(summary(csv, { invertSign: true }).map((r) => r.type)).toEqual(['EXPENSE', 'INCOME']);
  });

  it('skips a preamble before the header and ignores balance lines', () => {
    const csv = [
      'Extrato Conta Corrente',
      'Conta ;12345-6',
      '',
      'Data Lançamento;Histórico;Valor (R$);Saldo (R$)',
      '31/08/2026;SALDO ANTERIOR;;1.000,00',
      '01/09/2026;PIX RECEBIDO;1.500,00;2.500,00',
      '02/09/2026;COMPRA CARTAO;-250,75;2.249,25',
    ].join('\n');

    const result = parseStatementCsv(csv);

    expect(result.delimiter).toBe(';');
    expect(result.mapping).toMatchObject({
      date: 'Data Lançamento',
      description: 'Histórico',
      amount: 'Valor (R$)',
    });
    expect(result.rows.map((r) => [r.rowNumber, r.status, r.amount])).toEqual([
      [5, 'IGNORED', null],
      [6, 'VALID', 150_000],
      [7, 'VALID', 25_075],
    ]);
  });

  it('supports separate credit and debit columns', () => {
    const csv = [
      'Data;Descrição;Crédito;Débito',
      '01/09/2026;Depósito;100,00;',
      '02/09/2026;Saque;;40,00',
    ].join('\n');

    expect(summary(csv).map((r) => [r.type, r.amount])).toEqual([
      ['INCOME', 10_000],
      ['EXPENSE', 4_000],
    ]);
  });

  it('uses an explicit type column over the amount sign', () => {
    const csv = [
      'Data,Descrição,Valor,Tipo',
      '01/09/2026,Mercado,120.00,D',
      '02/09/2026,Freela,800.00,Crédito',
    ].join('\n');

    expect(summary(csv).map((r) => r.type)).toEqual(['EXPENSE', 'INCOME']);
  });

  it('reports invalid rows with the reason instead of failing the whole file', () => {
    const csv = [
      'Data,Descrição,Valor',
      '31/02/2026,Data impossível,10.00',
      '01/09/2026,,10.00',
      '01/09/2026,Valor ruim,abc',
      '01/09/2026,Zerado,0,00',
      '01/09/2026,Ok,10.00',
    ].join('\n');

    const rows = parseStatementCsv(csv).rows;

    expect(rows.map((r) => r.status)).toEqual([
      'INVALID',
      'INVALID',
      'INVALID',
      'INVALID',
      'VALID',
    ]);
    expect(rows[0]!.errors).toEqual(['Data inválida: "31/02/2026"']);
    expect(rows[1]!.errors).toEqual(['Descrição ausente']);
    expect(rows[2]!.errors).toEqual(['Valor inválido: "abc"']);
  });

  it('handles quoted fields with delimiters and quotes inside', () => {
    const csv = ['Data;Descrição;Valor', '01/09/2026;"Loja ""Boa"", Centro";"-1.234,56"'].join(
      '\n',
    );

    expect(summary(csv)[0]).toMatchObject({ description: 'Loja "Boa", Centro', amount: 123_456 });
  });

  it('accepts a manual column mapping', () => {
    const csv = ['Quando,O que,Quanto', '01/09/2026,Café,-5.00'].join('\n');

    expect(
      summary(csv, { mapping: { date: 'Quando', description: 'O que', amount: 'Quanto' } }),
    ).toEqual([
      { date: '2026-09-01', description: 'Café', amount: 500, type: 'EXPENSE', status: 'VALID' },
    ]);
  });

  it('fails clearly when required columns are missing', () => {
    expect(() => parseStatementCsv('foo,bar\n1,2')).toThrow(
      'Não encontramos as colunas de data, descrição e valor no arquivo',
    );
  });
});
