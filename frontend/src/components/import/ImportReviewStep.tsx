import { CircleAlert, CopyCheck, Sparkles } from 'lucide-react';
import { useMemo, useState } from 'react';

import { TransactionAmount } from '@/components/transactions/TransactionAmount';
import { Button } from '@/components/ui/Button';
import { Pagination } from '@/components/ui/Pagination';
import { Select } from '@/components/ui/Select';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import type { Category, ImportPreview, ImportPreviewRow, SuggestionSource } from '@/types/api';
import { cn } from '@/utils/cn';
import { formatDate } from '@/utils/date';
import {
  categoryFor,
  type CategoryOverrides,
  filterRows,
  isSelectable,
  type ReviewFilter,
} from '@/utils/import-selection';
import { formatCurrency } from '@/utils/money';

const PAGE_SIZE = 50;

const SOURCE_LABEL: Record<SuggestionSource, string> = {
  CSV: 'do arquivo',
  HISTORY: 'pelo histórico',
  KEYWORD: 'por palavra-chave',
};

interface ImportReviewStepProps {
  preview: ImportPreview;
  categories: Category[];
  selected: Set<number>;
  overrides: CategoryOverrides;
  submitting: boolean;
  onToggle: (rowNumber: number, checked: boolean) => void;
  onToggleMany: (rowNumbers: number[], checked: boolean) => void;
  onCategory: (rowNumbers: number[], categoryId: string) => void;
  onBack: () => void;
  onConfirm: () => void;
}

function RowNotes({ row }: { row: ImportPreviewRow }) {
  if (row.status === 'INVALID') {
    return (
      <p className="flex items-center gap-1 text-xs text-red-400">
        <CircleAlert aria-hidden className="size-3.5 shrink-0" />
        {row.errors.join('; ')}
      </p>
    );
  }
  if (row.status === 'IGNORED') return <p className="text-xs text-zinc-500">{row.errors[0]}</p>;
  if (row.duplicate) {
    return (
      <p className="flex items-center gap-1 text-xs text-amber-300">
        <CopyCheck aria-hidden className="size-3.5 shrink-0" />
        {row.duplicate.status === 'EXACT' ? 'Já registrada' : 'Possível duplicata'}: “
        {row.duplicate.description}” em {formatDate(row.duplicate.date)}
      </p>
    );
  }
  return null;
}

function CategoryCell({
  row,
  categories,
  overrides,
  onCategory,
}: {
  row: ImportPreviewRow;
  categories: Category[];
  overrides: CategoryOverrides;
  onCategory: ImportReviewStepProps['onCategory'];
}) {
  if (!isSelectable(row)) return <span className="text-zinc-600">—</span>;
  const value = categoryFor(row, overrides);
  const suggested = row.category && overrides[row.rowNumber] === undefined;

  return (
    <div className="flex flex-col gap-0.5">
      <Select
        label={`Categoria da linha ${row.rowNumber}`}
        hideLabel
        value={value}
        onChange={(event) => onCategory([row.rowNumber], event.target.value)}
        className="h-9"
      >
        <option value="">Sem categoria</option>
        {categories
          .filter((c) => c.type === row.type)
          .map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
      </Select>
      {suggested && (
        <span className="flex items-center gap-1 text-xs text-zinc-500">
          <Sparkles aria-hidden className="size-3" />
          Sugerida {SOURCE_LABEL[row.category!.source]}
        </span>
      )}
    </div>
  );
}

export function ImportReviewStep({
  preview,
  categories,
  selected,
  overrides,
  submitting,
  onToggle,
  onToggleMany,
  onCategory,
  onBack,
  onConfirm,
}: ImportReviewStepProps) {
  const [filter, setFilter] = useState<ReviewFilter>('all');
  const [page, setPage] = useState(1);
  const [bulkCategory, setBulkCategory] = useState('');
  const isWide = useMediaQuery('(min-width: 768px)');
  const { summary } = preview;

  const visible = useMemo(
    () => filterRows(preview.rows, filter, selected),
    [preview.rows, filter, selected],
  );
  const totalPages = Math.max(1, Math.ceil(visible.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageRows = visible.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const selectableOnPage = pageRows.filter(isSelectable).map((row) => row.rowNumber);
  const allOnPageSelected =
    selectableOnPage.length > 0 && selectableOnPage.every((n) => selected.has(n));
  const someOnPageSelected = selectableOnPage.some((n) => selected.has(n));

  const selectedRows = preview.rows.filter((row) => selected.has(row.rowNumber));
  const selectedIncome = selectedRows
    .filter((r) => r.type === 'INCOME')
    .reduce((s, r) => s + (r.amount ?? 0), 0);
  const selectedExpense = selectedRows
    .filter((r) => r.type === 'EXPENSE')
    .reduce((s, r) => s + (r.amount ?? 0), 0);

  const bulkTarget = categories.find((c) => c.id === bulkCategory);
  const bulkMatches = bulkTarget
    ? selectedRows.filter((r) => r.type === bulkTarget.type).length
    : 0;

  const tabs: [ReviewFilter, string, number][] = [
    ['all', 'Todas', summary.total],
    ['selected', 'Selecionadas', selected.size],
    ['duplicates', 'Duplicadas', summary.duplicates + summary.possibleDuplicates],
    ['errors', 'Com problema', summary.invalid + summary.ignored],
  ];

  return (
    <div className="flex flex-col gap-4">
      <section
        aria-label="Resumo do arquivo"
        className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-4"
      >
        {(
          [
            ['Válidas', summary.valid],
            ['Já registradas', summary.duplicates],
            ['Possíveis duplicatas', summary.possibleDuplicates],
            ['Com erro ou ignoradas', summary.invalid + summary.ignored],
          ] as const
        ).map(([label, value]) => (
          <div key={label} className="rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2">
            <p className="text-xs text-zinc-500">{label}</p>
            <p className="font-medium text-zinc-100 tabular-nums">{value}</p>
          </div>
        ))}
      </section>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div
          role="tablist"
          aria-label="Filtrar linhas"
          className="flex flex-wrap gap-1 rounded-lg border border-zinc-800 bg-zinc-900 p-1"
        >
          {tabs.map(([value, label, count]) => (
            <button
              key={value}
              type="button"
              role="tab"
              aria-selected={filter === value}
              onClick={() => {
                setFilter(value);
                setPage(1);
              }}
              className={cn(
                'rounded-md px-3 py-1.5 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-emerald-400',
                filter === value ? 'bg-zinc-800 text-zinc-50' : 'text-zinc-400 hover:text-zinc-100',
              )}
            >
              {label} <span className="text-zinc-400 tabular-nums">{count}</span>
            </button>
          ))}
        </div>

        {selected.size > 0 && (
          <div className="flex items-end gap-2">
            <div className="w-56">
              <Select
                label="Categoria para as selecionadas"
                value={bulkCategory}
                onChange={(event) => setBulkCategory(event.target.value)}
              >
                <option value="">Escolha…</option>
                <optgroup label="Despesas">
                  {categories
                    .filter((c) => c.type === 'EXPENSE')
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                </optgroup>
                <optgroup label="Receitas">
                  {categories
                    .filter((c) => c.type === 'INCOME')
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                </optgroup>
              </Select>
            </div>
            <Button
              variant="secondary"
              disabled={!bulkTarget || bulkMatches === 0}
              onClick={() => {
                // A category only fits rows of its own type
                onCategory(
                  selectedRows.filter((r) => r.type === bulkTarget!.type).map((r) => r.rowNumber),
                  bulkTarget!.id,
                );
                setBulkCategory('');
              }}
            >
              Aplicar{bulkTarget ? ` a ${bulkMatches}` : ''}
            </Button>
          </div>
        )}
      </div>

      {pageRows.length === 0 ? (
        <p className="rounded-2xl border border-zinc-800 bg-zinc-900 py-10 text-center text-sm text-zinc-400">
          Nenhuma linha neste filtro.
        </p>
      ) : isWide ? (
        <div className="overflow-x-auto rounded-2xl border border-zinc-800 bg-zinc-900">
          <table className="w-full text-sm">
            <caption className="sr-only">Linhas do arquivo</caption>
            <thead className="border-b border-zinc-800 text-left text-zinc-400">
              <tr>
                <th scope="col" className="w-10 px-3 py-2.5">
                  <input
                    type="checkbox"
                    aria-label="Selecionar todas as linhas válidas desta página"
                    checked={allOnPageSelected}
                    ref={(el) => {
                      if (el) el.indeterminate = !allOnPageSelected && someOnPageSelected;
                    }}
                    disabled={selectableOnPage.length === 0}
                    onChange={(event) => onToggleMany(selectableOnPage, event.target.checked)}
                    className="size-4 accent-emerald-500"
                  />
                </th>
                <th scope="col" className="px-3 py-2.5 font-medium">
                  Linha
                </th>
                <th scope="col" className="px-3 py-2.5 font-medium">
                  Data
                </th>
                <th scope="col" className="px-3 py-2.5 font-medium">
                  Descrição
                </th>
                <th scope="col" className="w-56 px-3 py-2.5 font-medium">
                  Categoria
                </th>
                <th scope="col" className="px-3 py-2.5 text-right font-medium">
                  Valor
                </th>
              </tr>
            </thead>
            <tbody>
              {pageRows.map((row) => (
                <tr
                  key={row.rowNumber}
                  className={cn(
                    'border-b border-zinc-800/60 last:border-0',
                    !isSelectable(row) && 'text-zinc-500',
                  )}
                >
                  <td className="px-3 py-2.5">
                    <input
                      type="checkbox"
                      aria-label={`Importar linha ${row.rowNumber}: ${row.description || 'sem descrição'}`}
                      checked={selected.has(row.rowNumber)}
                      disabled={!isSelectable(row)}
                      onChange={(event) => onToggle(row.rowNumber, event.target.checked)}
                      className="size-4 accent-emerald-500 disabled:opacity-30"
                    />
                  </td>
                  <td className="px-3 py-2.5 text-zinc-500 tabular-nums">{row.rowNumber}</td>
                  <td className="px-3 py-2.5 whitespace-nowrap tabular-nums">
                    {row.date ? formatDate(row.date) : '—'}
                  </td>
                  <td className="max-w-72 px-3 py-2.5">
                    <p className={cn('truncate', isSelectable(row) && 'text-zinc-100')}>
                      {row.description || '—'}
                    </p>
                    <RowNotes row={row} />
                  </td>
                  <td className="px-3 py-2">
                    <CategoryCell
                      row={row}
                      categories={categories}
                      overrides={overrides}
                      onCategory={onCategory}
                    />
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    {row.type && row.amount !== null ? (
                      <TransactionAmount type={row.type} amount={row.amount} />
                    ) : (
                      '—'
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {pageRows.map((row) => (
            <li
              key={row.rowNumber}
              className={cn(
                'rounded-xl border border-zinc-800 bg-zinc-900 p-3',
                !isSelectable(row) && 'opacity-70',
              )}
            >
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  aria-label={`Importar linha ${row.rowNumber}: ${row.description || 'sem descrição'}`}
                  checked={selected.has(row.rowNumber)}
                  disabled={!isSelectable(row)}
                  onChange={(event) => onToggle(row.rowNumber, event.target.checked)}
                  className="mt-1 size-4 accent-emerald-500 disabled:opacity-30"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex justify-between gap-2">
                    <p className="truncate text-sm text-zinc-100">{row.description || '—'}</p>
                    {row.type && row.amount !== null && (
                      <TransactionAmount type={row.type} amount={row.amount} />
                    )}
                  </div>
                  <p className="text-xs text-zinc-500">
                    Linha {row.rowNumber}
                    {row.date && ` · ${formatDate(row.date)}`}
                  </p>
                  <RowNotes row={row} />
                  {isSelectable(row) && (
                    <div className="mt-2">
                      <CategoryCell
                        row={row}
                        categories={categories}
                        overrides={overrides}
                        onCategory={onCategory}
                      />
                    </div>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Pagination page={currentPage} totalPages={totalPages} onPageChange={setPage} />

      <div className="sticky bottom-20 z-[5] flex flex-col gap-3 rounded-2xl border border-zinc-800 bg-zinc-900/95 p-3 backdrop-blur sm:flex-row sm:items-center sm:justify-between md:bottom-4">
        <p className="text-sm text-zinc-400" aria-live="polite">
          {selected.size} {selected.size === 1 ? 'selecionada' : 'selecionadas'} · receitas{' '}
          {formatCurrency(selectedIncome)} · despesas {formatCurrency(selectedExpense)}
        </p>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={onBack}>
            Voltar
          </Button>
          <Button onClick={onConfirm} disabled={selected.size === 0} loading={submitting}>
            Importar {selected.size} {selected.size === 1 ? 'transação' : 'transações'}
          </Button>
        </div>
      </div>
    </div>
  );
}
