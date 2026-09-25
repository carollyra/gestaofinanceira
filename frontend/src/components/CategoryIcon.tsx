import { createElement } from 'react';

import { getCategoryIcon } from '@/utils/category-icons';
import { cn } from '@/utils/cn';

interface CategoryIconProps {
  icon: string;
  color: string;
  className?: string;
}

// Category identity: its icon on a tint of its own color
export function CategoryIcon({ icon, color, className }: CategoryIconProps) {
  return (
    <span
      aria-hidden
      className={cn('flex size-8 shrink-0 items-center justify-center rounded-lg', className)}
      style={{ backgroundColor: `${color}26`, color }}
    >
      {/* The icon comes from a fixed lookup table, not a component created per render */}
      {createElement(getCategoryIcon(icon), { className: 'size-4' })}
    </span>
  );
}
