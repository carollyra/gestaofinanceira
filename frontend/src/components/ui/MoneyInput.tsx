import { forwardRef, type InputHTMLAttributes, useId } from 'react';

import { cn } from '@/utils/cn';
import { formatCurrency } from '@/utils/money';
import { parseMoneyDigits } from '@/utils/money-input';

interface MoneyInputProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'value' | 'onChange' | 'type'
> {
  label: string;
  // Integer cents
  value: number;
  onValueChange: (cents: number) => void;
  max?: number;
  error?: string;
}

// Banking-app style: digits fill from the cents ("1250" -> R$ 12,50). The
// string -> integer cents conversion happens here, at the edge; the rest of
// the app never sees a float. Works with typing, paste and mobile keyboards
// (it reads the input value instead of key events).
export const MoneyInput = forwardRef<HTMLInputElement, MoneyInputProps>(function MoneyInput(
  { label, value, onValueChange, max = 999_999_999, error, id, className, ...props },
  ref,
) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const errorId = `${inputId}-error`;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={inputId} className="text-sm font-medium text-zinc-200">
        {label}
      </label>
      <input
        ref={ref}
        id={inputId}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        value={value === 0 ? '' : formatCurrency(value)}
        placeholder={formatCurrency(0)}
        onChange={(event) => {
          const cents = parseMoneyDigits(event.target.value, max);
          // Extra digits beyond the limit are ignored, keeping the last valid value
          if (cents !== null) onValueChange(cents);
        }}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        className={cn(
          'h-12 w-full rounded-lg border bg-zinc-900 px-3 text-xl font-semibold text-zinc-50 tabular-nums placeholder:text-zinc-600',
          'transition-colors outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/30',
          error ? 'border-red-400' : 'border-zinc-700',
          className,
        )}
        {...props}
      />
      {error && (
        <p id={errorId} className="text-sm text-red-400">
          {error}
        </p>
      )}
    </div>
  );
});
