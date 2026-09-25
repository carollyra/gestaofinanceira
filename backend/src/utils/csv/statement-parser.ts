import { parse } from 'csv-parse/sync';

import type { TransactionType } from '../../generated/prisma/enums';
import { normalizeText } from '../text';
import { parseAmountToCents } from './parse-amount';
import { parseStatementDate } from './parse-date';

export const MAX_IMPORT_ROWS = 2000;
const HEADER_SEARCH_ROWS = 15;
const DELIMITERS = [',', ';', '\t', '|'] as const;

export type ColumnKey =
  'date' | 'description' | 'amount' | 'credit' | 'debit' | 'type' | 'category' | 'notes';
export type ColumnMapping = Partial<Record<ColumnKey, string>>;

// Header names are compared after normalizeText and removing anything in
// parentheses or non-letters, so "Valor (R$)" and "Descrição" match
const COLUMN_ALIASES: Record<ColumnKey, string[]> = {
  date: [
    'data',
    'date',
    'data lancamento',
    'data do lancamento',
    'data movimento',
    'data da transacao',
    'data transacao',
    'dt',
  ],
  description: [
    'descricao',
    'description',
    'historico',
    'title',
    'titulo',
    'memo',
    'lancamento',
    'estabelecimento',
    'detalhes',
    'descricao do lancamento',
  ],
  amount: ['valor', 'amount', 'value', 'quantia', 'valor rs', 'valor em reais'],
  credit: ['credito', 'entrada', 'entradas', 'credit'],
  debit: ['debito', 'saida', 'saidas', 'debit'],
  type: ['tipo', 'type', 'natureza', 'dc', 'cd'],
  category: ['categoria', 'category'],
  notes: ['observacao', 'observacoes', 'obs', 'notas', 'notes'],
};

const INCOME_WORDS = new Set(['receita', 'credito', 'c', 'entrada', 'income', 'credit', 'cr']);
const EXPENSE_WORDS = new Set(['despesa', 'debito', 'd', 'saida', 'expense', 'debit', 'db']);

// Balance lines ("SALDO ANTERIOR", "Saldo do dia") are not transactions
const IGNORED_DESCRIPTION = /^(saldo|s a l d o)\b/;

export interface ParsedRow {
  rowNumber: number;
  status: 'VALID' | 'INVALID' | 'IGNORED';
  errors: string[];
  date: Date | null;
  description: string;
  amount: number | null;
  type: TransactionType | null;
  categoryName: string | null;
  notes: string | null;
}

export interface ParseOptions {
  mapping?: ColumnMapping;
  // Credit card statements usually list purchases as positive values
  invertSign?: boolean;
}

export interface ParseResult {
  delimiter: string;
  headers: string[];
  mapping: ColumnMapping;
  rows: ParsedRow[];
}

export class CsvFormatError extends Error {}

function normalizeHeader(header: string) {
  return normalizeText(header)
    .replace(/\(.*?\)/g, '')
    .replace(/[^a-z ]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function detectDelimiter(content: string): string {
  const lines = content
    .split(/\r?\n/)
    .filter((line) => line.trim())
    .slice(0, 20);

  let best: string = ',';
  let bestScore = 0;

  for (const delimiter of DELIMITERS) {
    // Counts outside quotes; the delimiter that appears consistently wins
    const counts = lines.map((line) => line.replace(/"[^"]*"/g, '').split(delimiter).length - 1);
    const frequent = counts.filter((count) => count > 0 && count === Math.max(...counts)).length;
    const score = frequent * Math.max(...counts, 0);
    if (score > bestScore) {
      best = delimiter;
      bestScore = score;
    }
  }

  return best;
}

function detectMapping(headers: string[]): ColumnMapping {
  const mapping: ColumnMapping = {};
  const normalized = headers.map(normalizeHeader);

  for (const key of Object.keys(COLUMN_ALIASES) as ColumnKey[]) {
    const index = normalized.findIndex(
      (header, i) =>
        COLUMN_ALIASES[key].includes(header) && !Object.values(mapping).includes(headers[i]!),
    );
    if (index !== -1) mapping[key] = headers[index]!;
  }

  return mapping;
}

function isUsableMapping(mapping: ColumnMapping) {
  return Boolean(
    mapping.date && mapping.description && (mapping.amount || mapping.credit || mapping.debit),
  );
}

function parseTypeValue(value: string): TransactionType | null {
  const word = normalizeText(value).replace(/[^a-z]/g, '');
  if (INCOME_WORDS.has(word)) return 'INCOME';
  if (EXPENSE_WORDS.has(word)) return 'EXPENSE';
  return null;
}

export function parseStatementCsv(content: string, options: ParseOptions = {}): ParseResult {
  const delimiter = detectDelimiter(content);

  let records: string[][];
  let lineNumbers: number[];
  try {
    const parsed = parse(content, {
      delimiter,
      bom: true,
      skip_empty_lines: true,
      relax_column_count: true,
      relax_quotes: true,
      trim: true,
      // Line of each record in the file, so errors point to the right line
      // even with blank lines or multi-line quoted fields
      info: true,
    }) as unknown as { record: string[]; info: { lines: number } }[];
    records = parsed.map((item) => item.record);
    lineNumbers = parsed.map((item) => item.info.lines);
  } catch {
    throw new CsvFormatError('Não foi possível ler o arquivo CSV');
  }

  // Some banks add a preamble (account number, period...) before the header
  let headerIndex = -1;
  let mapping: ColumnMapping = {};

  for (let i = 0; i < Math.min(records.length, HEADER_SEARCH_ROWS); i++) {
    const headers = records[i]!;
    const candidate = options.mapping ?? detectMapping(headers);
    const allPresent = Object.values(candidate).every((header) => headers.includes(header!));
    if (isUsableMapping(candidate) && allPresent) {
      headerIndex = i;
      mapping = candidate;
      break;
    }
  }

  if (headerIndex === -1) {
    throw new CsvFormatError(
      options.mapping
        ? 'As colunas informadas não foram encontradas no arquivo'
        : 'Não encontramos as colunas de data, descrição e valor no arquivo',
    );
  }

  const headers = records[headerIndex]!;
  const dataRows = records.slice(headerIndex + 1);

  if (dataRows.length === 0) {
    throw new CsvFormatError('O arquivo não possui transações');
  }
  if (dataRows.length > MAX_IMPORT_ROWS) {
    throw new CsvFormatError(`O arquivo possui mais de ${MAX_IMPORT_ROWS} linhas`);
  }

  const column = (key: ColumnKey) => (mapping[key] ? headers.indexOf(mapping[key]) : -1);
  const indexes = Object.fromEntries(
    (Object.keys(COLUMN_ALIASES) as ColumnKey[]).map((key) => [key, column(key)]),
  ) as Record<ColumnKey, number>;

  const rows = dataRows.map((record, i): ParsedRow => {
    const cell = (key: ColumnKey) => (indexes[key] >= 0 ? (record[indexes[key]] ?? '').trim() : '');
    const errors: string[] = [];
    const rowNumber = lineNumbers[headerIndex + 1 + i]!;

    const description = cell('description').slice(0, 255);
    const rawDate = cell('date');
    const date = parseStatementDate(rawDate);

    // Balance lines may carry "Saldo" in the description or in the date column
    if (
      IGNORED_DESCRIPTION.test(normalizeText(description)) ||
      IGNORED_DESCRIPTION.test(normalizeText(rawDate))
    ) {
      return {
        rowNumber,
        status: 'IGNORED',
        errors: ['Linha de saldo ignorada'],
        date,
        description,
        amount: null,
        type: null,
        categoryName: null,
        notes: null,
      };
    }

    if (!date) errors.push(rawDate ? `Data inválida: "${rawDate}"` : 'Data ausente');
    if (!description) errors.push('Descrição ausente');

    // Signed amount: from a single column, or credit minus debit columns
    let signed: number | null = null;
    if (indexes.amount >= 0) {
      signed = cell('amount') ? parseAmountToCents(cell('amount')) : null;
      if (signed === null)
        errors.push(cell('amount') ? `Valor inválido: "${cell('amount')}"` : 'Valor ausente');
    } else {
      const credit = cell('credit') ? parseAmountToCents(cell('credit')) : 0;
      const debit = cell('debit') ? parseAmountToCents(cell('debit')) : 0;
      if (credit === null || debit === null) {
        errors.push('Valor inválido');
      } else {
        signed = Math.abs(credit) - Math.abs(debit);
      }
    }

    let type: TransactionType | null = null;
    let amount: number | null = null;

    if (signed !== null) {
      if (signed === 0) {
        errors.push('Valor zerado');
      } else {
        const explicitType = indexes.type >= 0 ? parseTypeValue(cell('type')) : null;
        if (explicitType) {
          type = explicitType;
        } else {
          const value = options.invertSign ? -signed : signed;
          type = value > 0 ? 'INCOME' : 'EXPENSE';
        }
        amount = Math.abs(signed);
      }
    }

    return {
      rowNumber,
      status: errors.length > 0 ? 'INVALID' : 'VALID',
      errors,
      date,
      description,
      amount,
      type,
      categoryName: cell('category') || null,
      notes: cell('notes') || null,
    };
  });

  return { delimiter, headers, mapping, rows };
}
