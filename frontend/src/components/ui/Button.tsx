import type { ButtonHTMLAttributes } from 'react';

import { cn } from '@/utils/cn';

import { Spinner } from './Spinner';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost';
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
        className,
      )}
      {...props}
    >
      {loading && <Spinner className="size-4" label="Enviando" />}
      {children}
    </button>
  );
}
