// Page numbers around the current one, with the first and last always shown:
// 1 … 4 5 [6] 7 8 … 20
export function pageWindow(page: number, totalPages: number, radius = 1): (number | 'gap')[] {
  const pages = new Set([1, totalPages]);
  for (let p = page - radius; p <= page + radius; p++) {
    if (p >= 1 && p <= totalPages) pages.add(p);
  }
  const sorted = [...pages].sort((a, b) => a - b);
  const result: (number | 'gap')[] = [];
  sorted.forEach((p, i) => {
    if (i > 0 && p - sorted[i - 1]! > 1) result.push('gap');
    result.push(p);
  });
  return result;
}
