import type { ReactNode } from 'react';

import { Skeleton } from '@/components/skeletons';

// Definition list: screen readers announce each value with its label
export function DetailList({ children }: { children: ReactNode }) {
  return (
    <dl className="flex flex-col divide-y divide-zinc-800 rounded-xl border border-zinc-800">
      {children}
    </dl>
  );
}

export function DetailRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 px-3 py-2.5 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
      <dt className="shrink-0 text-sm text-zinc-500">{label}</dt>
      <dd className="text-sm text-zinc-100 sm:text-right">{children}</dd>
    </div>
  );
}

export function ColorDot({ color }: { color: string }) {
  return (
    <span
      aria-hidden
      className="inline-block size-2.5 shrink-0 rounded-full"
      style={{ backgroundColor: color }}
    />
  );
}

export function DetailSkeleton() {
  return (
    <div role="status" aria-label="Carregando detalhes" className="flex flex-col gap-4">
      <Skeleton className="h-10 w-48" />
      <Skeleton className="h-5 w-64" />
      <Skeleton className="h-48 rounded-xl" />
    </div>
  );
}

export function DetailMessage({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-6 text-center text-sm text-zinc-400">
      {children}
    </p>
  );
}
