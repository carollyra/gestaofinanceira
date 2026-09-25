import { forwardRef, type InputHTMLAttributes, type ReactNode, useId } from 'react';

import { cn } from '@/utils/cn';

export interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  // Content rendered inside the input, on the right (e.g. a toggle button)
  trailing?: ReactNode;
  // Extra description linked to the input for screen readers
  hint?: ReactNode;
}

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(function TextField(
  { label, error, trailing, hint, id, className, ...props },
  ref,
) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const errorId = `${inputId}-error`;
  const hintId = `${inputId}-hint`;
  const describedBy = [hint ? hintId : null, error ? errorId : null].filter(Boolean).join(' ');

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={inputId} className="text-sm font-medium text-zinc-200">
        {label}
      </label>
      <div className="relative">
        <input
          ref={ref}
          id={inputId}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy || undefined}
          className={cn(
            'h-11 w-full rounded-lg border bg-zinc-900 px-3 text-base text-zinc-100 placeholder:text-zinc-500 sm:text-sm',
            'transition-colors outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/30',
            error ? 'border-red-400' : 'border-zinc-700',
            trailing && 'pr-11',
            className,
          )}
          {...props}
        />
        {trailing && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-1">{trailing}</div>
        )}
      </div>
      {hint && <div id={hintId}>{hint}</div>}
      {error && (
        <p id={errorId} className="text-sm text-red-400">
          {error}
        </p>
      )}
    </div>
  );
});
