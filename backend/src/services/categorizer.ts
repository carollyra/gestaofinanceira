import type { TransactionType } from '../generated/prisma/enums';
import { prisma } from '../utils/prisma';
import { normalizeText } from '../utils/text';

export type SuggestionSource = 'CSV' | 'HISTORY' | 'KEYWORD';

export interface CategorySuggestion {
  categoryId: string;
  source: SuggestionSource;
}

// Built-in hints, matched against the default category names. Only used when
// the user still has a category with that name and type.
const KEYWORD_RULES: { pattern: RegExp; category: string; type: TransactionType }[] = [
  {
    pattern:
      /\b(uber|99 ?app|99pop|cabify|combustivel|posto|shell|ipiranga|estacionamento|pedagio|metro|onibus)\b/,
    category: 'Transporte',
    type: 'EXPENSE',
  },
  {
    pattern:
      /\b(ifood|rappi|restaurante|lanchonete|padaria|pizzaria|burger|mcdonald|bar |cafe|cafeteria)\b/,
    category: 'Alimentação',
    type: 'EXPENSE',
  },
  {
    pattern: /\b(supermercado|mercado|atacadao|assai|carrefour|pao de acucar|hortifruti|sacolao)\b/,
    category: 'Mercado',
    type: 'EXPENSE',
  },
  {
    pattern:
      /\b(netflix|spotify|amazon prime|prime video|disney|hbo|max|youtube premium|deezer|icloud|google one)\b/,
    category: 'Assinaturas',
    type: 'EXPENSE',
  },
  {
    pattern:
      /\b(farmacia|drogaria|droga raia|drogasil|pague menos|hospital|clinica|laboratorio|consulta|unimed)\b/,
    category: 'Saúde',
    type: 'EXPENSE',
  },
  { pattern: /\b(aluguel|condominio|iptu)\b/, category: 'Moradia', type: 'EXPENSE' },
  {
    pattern: /\b(energia|luz|enel|cemig|copel|light|agua|sabesp|internet|vivo|claro|tim|oi|net)\b/,
    category: 'Contas e serviços',
    type: 'EXPENSE',
  },
  {
    pattern: /\b(escola|faculdade|curso|udemy|alura|livraria)\b/,
    category: 'Educação',
    type: 'EXPENSE',
  },
  {
    pattern: /\b(cinema|ingresso|steam|playstation|xbox|show|teatro)\b/,
    category: 'Lazer',
    type: 'EXPENSE',
  },
  { pattern: /\b(petshop|pet shop|petz|cobasi|veterinari)\b/, category: 'Pets', type: 'EXPENSE' },
  {
    pattern: /\b(iof|tarifa|anuidade|imposto|darf|juros)\b/,
    category: 'Impostos e taxas',
    type: 'EXPENSE',
  },
  {
    pattern: /\b(salario|folha|pagamento de salario|proventos)\b/,
    category: 'Salário',
    type: 'INCOME',
  },
  {
    pattern: /\b(rendimento|dividendo|juros sobre capital|resgate)\b/,
    category: 'Investimentos',
    type: 'INCOME',
  },
];

interface HistoryRow {
  description: string;
  type: TransactionType;
  categoryId: string;
}

// Suggests a category for each imported row, in order of confidence:
// 1. category column of the CSV, matched by name
// 2. the category most used by the user for the same description
// 3. keyword rules
export async function createCategorizer(userId: string) {
  const [categories, history] = await Promise.all([
    prisma.category.findMany({ where: { userId }, select: { id: true, name: true, type: true } }),
    // Most frequent category per (description, type), computed in the database
    prisma.$queryRaw<HistoryRow[]>`
      SELECT DISTINCT ON (description, type) description, type, "categoryId"
      FROM (
        SELECT lower(trim(description)) AS description, type, category_id AS "categoryId", COUNT(*) AS uses
        FROM transactions
        WHERE user_id = ${userId}::uuid AND category_id IS NOT NULL
        GROUP BY 1, 2, 3
      ) counted
      ORDER BY description, type, uses DESC
    `,
  ]);

  const categoryByName = new Map(
    categories.map((c) => [`${c.type}|${normalizeText(c.name)}`, c.id]),
  );
  const historyByDescription = new Map(
    history.map((h) => [`${h.type}|${normalizeText(h.description)}`, h.categoryId]),
  );

  return function suggest(
    description: string,
    type: TransactionType,
    csvCategory: string | null,
  ): CategorySuggestion | null {
    if (csvCategory) {
      const id = categoryByName.get(`${type}|${normalizeText(csvCategory)}`);
      if (id) return { categoryId: id, source: 'CSV' };
    }

    const normalized = normalizeText(description);
    const fromHistory = historyByDescription.get(`${type}|${normalized}`);
    if (fromHistory) return { categoryId: fromHistory, source: 'HISTORY' };

    for (const rule of KEYWORD_RULES) {
      if (rule.type === type && rule.pattern.test(normalized)) {
        const id = categoryByName.get(`${type}|${normalizeText(rule.category)}`);
        if (id) return { categoryId: id, source: 'KEYWORD' };
      }
    }

    return null;
  };
}
