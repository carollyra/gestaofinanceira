import type { ButtonHTMLAttributes } from 'react';

import { cn } from '@/utils/cn';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost' | 'danger' | 'secondary';
  loading?: boolean;
}

export function Button({
  variant = 'primary',
  loading = false,
  disabled,
  className,
  children,
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(
        'inline-flex h-11 items-center justify-center gap-2 rounded-lg px-4 text-sm font-medium transition-colors',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400',
        'disabled:cursor-not-allowed disabled:opacity-60',
        variant === 'primary' && 'bg-emerald-500 text-zinc-950 hover:bg-emerald-400',
        variant === 'ghost' && 'text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100',
        variant === 'secondary' && 'border border-zinc-700 text-zinc-200 hover:bg-zinc-800',
        variant === 'danger' && 'bg-red-500 text-white hover:bg-red-400',
        className,
      )}
      {...props}
    >
      {loading && (
        <span role="status" aria-label="Enviando" className="flex gap-0.5">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              aria-hidden
              className="size-1.5 rounded-full bg-current motion-safe:animate-pulse"
              style={{ animationDelay: `${i * 150}ms` }}
            />
          ))}
        </span>
      )}
      {children}
    </button>
  );
}
