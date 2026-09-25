import { LoaderCircle } from 'lucide-react';

import { cn } from '@/utils/cn';

export function Spinner({
  className,
  label = 'Carregando',
}: {
  className?: string;
  label?: string;
}) {
  return (
    <span role="status" className="inline-flex items-center">
      <LoaderCircle aria-hidden className={cn('size-5 animate-spin', className)} />
      <span className="sr-only">{label}</span>
    </span>
  );
}
