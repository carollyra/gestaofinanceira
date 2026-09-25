import { ChevronLeft, ChevronRight } from 'lucide-react';

import { cn } from '@/utils/cn';
import { pageWindow } from '@/utils/page-window';

interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const buttonBase =
  'flex h-9 min-w-9 items-center justify-center rounded-lg px-2 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-emerald-400 disabled:cursor-not-allowed disabled:opacity-40';

export function Pagination({ page, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <nav aria-label="Paginação" className="flex items-center gap-1">
      <button
        type="button"
        className={cn(buttonBase, 'text-zinc-300 hover:bg-zinc-800')}
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        aria-label="Página anterior"
      >
        <ChevronLeft aria-hidden className="size-4" />
      </button>
      {pageWindow(page, totalPages).map((item, i) =>
        item === 'gap' ? (
          <span key={`gap-${i}`} aria-hidden className="px-1 text-zinc-500">
            …
          </span>
        ) : (
          <button
            key={item}
            type="button"
            onClick={() => onPageChange(item)}
            aria-label={`Página ${item}`}
            aria-current={item === page ? 'page' : undefined}
            className={cn(
              buttonBase,
              'hidden tabular-nums sm:flex',
              item === page
                ? 'bg-zinc-800 font-medium text-zinc-50'
                : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100',
            )}
          >
            {item}
          </button>
        ),
      )}
      <span className="px-2 text-sm text-zinc-400 tabular-nums sm:hidden">
        {page} de {totalPages}
      </span>
      <button
        type="button"
        className={cn(buttonBase, 'text-zinc-300 hover:bg-zinc-800')}
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
        aria-label="Próxima página"
      >
        <ChevronRight aria-hidden className="size-4" />
      </button>
    </nav>
  );
}
