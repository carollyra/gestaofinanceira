import type { CategoryShare } from '@/types/api';

import { chartTheme } from './chart-theme';

// Beyond this, the tail folds into "Outras" instead of growing the list
export const MAX_CATEGORY_ROWS = 6;

export function foldCategories(
  categories: CategoryShare[],
  maxRows = MAX_CATEGORY_ROWS,
): CategoryShare[] {
  if (categories.length <= maxRows) return categories;

  const head = categories.slice(0, maxRows - 1);
  const tail = categories.slice(maxRows - 1);

  return [
    ...head,
    {
      categoryId: 'others',
      name: `Outras (${tail.length})`,
      color: chartTheme.muted,
      icon: 'ellipsis',
      total: tail.reduce((sum, c) => sum + c.total, 0),
      count: tail.reduce((sum, c) => sum + c.count, 0),
      percentage: Math.round(tail.reduce((sum, c) => sum + c.percentage, 0) * 100) / 100,
    },
  ];
}
