import type { CSSProperties, ReactNode } from 'react';

import { cn } from '@/utils/cn';

// Placeholders with the shape of the content that will arrive, so the layout
// does not jump when it does. The pulse stops for reduced-motion users.
export function Skeleton({ className, style }: { className?: string; style?: CSSProperties }) {
  return (
    <div
      aria-hidden
      style={style}
      className={cn('rounded-md bg-zinc-800/70 motion-safe:animate-pulse', className)}
    />
  );
}

function LoadingRegion({
  label,
  className,
  children,
}: {
  label: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div role="status" aria-label={label} className={className}>
      {children}
    </div>
  );
}

export function StatCardSkeleton() {
  return (
    <LoadingRegion
      label="Carregando resumo"
      className="flex flex-col gap-3 rounded-2xl border border-zinc-800 bg-zinc-900 p-4"
    >
      <div className="flex justify-between">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="size-4 rounded-full" />
      </div>
      <Skeleton className="h-7 w-36" />
      <Skeleton className="h-3 w-40" />
    </LoadingRegion>
  );
}

const BAR_HEIGHTS = [62, 48, 55, 70, 46, 50, 66, 49, 51, 60, 52, 50];

export function LineChartSkeleton() {
  return (
    <LoadingRegion label="Carregando gráfico" className="flex h-64 gap-3">
      <div className="flex flex-col justify-between py-1">
        {Array.from({ length: 5 }, (_, i) => (
          <Skeleton key={i} className="h-3 w-14" />
        ))}
      </div>
      <div className="relative flex-1">
        {Array.from({ length: 5 }, (_, i) => (
          <div
            key={i}
            className="absolute inset-x-0 border-t border-zinc-800"
            style={{ top: `${i * 25}%` }}
          />
        ))}
        <Skeleton className="absolute inset-x-0 bottom-0 h-3/5 rounded-none [clip-path:polygon(0_70%,20%_55%,40%_50%,60%_35%,80%_25%,100%_10%,100%_100%,0_100%)]" />
      </div>
    </LoadingRegion>
  );
}

export function BarChartSkeleton({ bars = 12 }: { bars?: number }) {
  return (
    <LoadingRegion label="Carregando gráfico" className="flex flex-col gap-3">
      <div className="flex gap-4">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-20" />
      </div>
      <div className="flex h-64 items-end justify-around gap-2 border-b border-zinc-800 pl-16">
        {BAR_HEIGHTS.slice(0, bars).map((height, i) => (
          <div key={i} className="flex h-full items-end gap-0.5">
            <Skeleton className="w-3 rounded-b-none" style={{ height: `${height + 20}%` }} />
            <Skeleton className="w-3 rounded-b-none" style={{ height: `${height - 15}%` }} />
          </div>
        ))}
      </div>
    </LoadingRegion>
  );
}

export function CategoryListSkeleton() {
  return (
    <LoadingRegion label="Carregando categorias" className="flex flex-col gap-3">
      {[100, 70, 22, 20, 8, 5].map((width, i) => (
        <div key={i} className="flex flex-col gap-1.5">
          <div className="flex justify-between">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-4 w-24" />
          </div>
          <Skeleton className="h-2 rounded-full" style={{ width: `${width}%` }} />
        </div>
      ))}
    </LoadingRegion>
  );
}

export function TransactionTableSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <LoadingRegion
      label="Carregando transações"
      className="rounded-2xl border border-zinc-800 bg-zinc-900"
    >
      <div className="flex gap-6 border-b border-zinc-800 px-3 py-3">
        {[16, 24, 20, 16].map((w, i) => (
          <Skeleton key={i} className="h-4" style={{ width: `${w * 4}px` }} />
        ))}
      </div>
      {Array.from({ length: rows }, (_, i) => (
        <div
          key={i}
          className="flex items-center gap-6 border-b border-zinc-800/60 px-3 py-3 last:border-0"
        >
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 flex-1" />
          <div className="flex w-40 items-center gap-2">
            <Skeleton className="size-7 rounded-lg" />
            <Skeleton className="h-4 flex-1" />
          </div>
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-4 w-24" />
        </div>
      ))}
    </LoadingRegion>
  );
}

export function TransactionCardsSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <LoadingRegion label="Carregando transações" className="flex flex-col gap-2">
      <Skeleton className="h-3 w-40" />
      <div className="divide-y divide-zinc-800/60 rounded-xl border border-zinc-800 bg-zinc-900">
        {Array.from({ length: rows }, (_, i) => (
          <div key={i} className="flex items-center gap-3 px-3 py-3">
            <Skeleton className="size-8 rounded-lg" />
            <div className="flex flex-1 flex-col gap-1.5">
              <Skeleton className="h-4 w-3/5" />
              <Skeleton className="h-3 w-2/5" />
            </div>
            <Skeleton className="h-4 w-20" />
          </div>
        ))}
      </div>
    </LoadingRegion>
  );
}

// While the session is checked on load: the app frame, not a spinner
export function AppShellSkeleton() {
  return (
    <LoadingRegion label="Carregando" className="min-h-dvh">
      <div className="h-14 border-b border-zinc-800">
        <div className="mx-auto flex h-full max-w-6xl items-center gap-3 px-4">
          <Skeleton className="size-5 rounded-md" />
          <Skeleton className="h-4 w-20" />
        </div>
      </div>
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-6">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-7 w-44" />
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-32 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-80 rounded-2xl" />
      </div>
    </LoadingRegion>
  );
}
