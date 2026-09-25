import { CircleAlert, Inbox, RotateCw } from 'lucide-react';

import { cn } from '@/utils/cn';

export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden className={cn('animate-pulse rounded-lg bg-zinc-800/70', className)} />;
}

export function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center gap-3 py-8 text-center text-sm text-zinc-400"
    >
      <CircleAlert aria-hidden className="size-6 text-red-400" />
      <p>{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-zinc-200 transition-colors hover:bg-zinc-800 focus-visible:outline-2 focus-visible:outline-emerald-400"
      >
        <RotateCw aria-hidden className="size-4" />
        Tentar novamente
      </button>
    </div>
  );
}

export function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center gap-2 py-10 text-center text-sm text-zinc-500">
      <Inbox aria-hidden className="size-6" />
      <p>{message}</p>
    </div>
  );
}
