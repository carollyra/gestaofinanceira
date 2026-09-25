export interface PaginationParams {
  page: number;
  pageSize: number;
}

export function toSkipTake({ page, pageSize }: PaginationParams) {
  return { skip: (page - 1) * pageSize, take: pageSize };
}

export function buildPaginationMeta(total: number, { page, pageSize }: PaginationParams) {
  return {
    page,
    pageSize,
    total,
    totalPages: Math.ceil(total / pageSize),
  };
}
