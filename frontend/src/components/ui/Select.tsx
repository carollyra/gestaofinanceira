import { ChevronDown } from 'lucide-react';
import { forwardRef, type SelectHTMLAttributes, useId } from 'react';

import { cn } from '@/utils/cn';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  hideLabel?: boolean;
  error?: string;
}

// Native select: accessible and uses the phone's own picker on mobile
export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, hideLabel, error, id, className, children, ...props },
  ref,
) {
  const generatedId = useId();
  const selectId = id ?? generatedId;
  const errorId = `${selectId}-error`;

  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={selectId}
        className={cn('text-sm font-medium text-zinc-200', hideLabel && 'sr-only')}
      >
        {label}
      </label>
      <div className="relative">
        <select
          ref={ref}
          id={selectId}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          className={cn(
            'h-10 w-full appearance-none rounded-lg border bg-zinc-900 pr-9 pl-3 text-base text-zinc-100 sm:text-sm',
            'transition-colors outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/30',
            error ? 'border-red-400' : 'border-zinc-700',
            className,
          )}
          {...props}
        >
          {children}
        </select>
        <ChevronDown
          aria-hidden
          className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-zinc-500"
        />
      </div>
      {error && (
        <p id={errorId} className="text-sm text-red-400">
          {error}
        </p>
      )}
    </div>
  );
});
