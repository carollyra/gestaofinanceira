import { useId } from 'react';

import { cn } from '@/utils/cn';

// Logo: a rising line inside a rounded square, the same shape as the favicon
export function BrandMark({ className }: { className?: string }) {
  const gradientId = useId();

  return (
    <svg viewBox="0 0 32 32" aria-hidden className={cn('size-7', className)}>
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#34d399" />
          <stop offset="1" stopColor="#059669" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="9" fill={`url(#${gradientId})`} />
      <path
        d="M8 21.5 13.5 15l4 3.5L24 10.5"
        fill="none"
        stroke="#052e1f"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="24" cy="10.5" r="2" fill="#052e1f" />
    </svg>
  );
}

export function BrandLogo({ className }: { className?: string }) {
  return (
    <span className={cn('flex items-center gap-2', className)}>
      <BrandMark />
      <span className="font-display text-lg font-semibold tracking-tight text-zinc-50">
        Finanças
      </span>
    </span>
  );
}
