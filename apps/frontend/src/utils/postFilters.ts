export interface PostListFilters {
  search: string;
  categories: string[];
  sort: string;
  page: number;
  limit: number;
  tags: string[];
}

function splitCsv(value: unknown): string[] {
  if (typeof value !== 'string') {
    return [];
  }

  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function parsePositiveInt(value: unknown, fallback: number): number {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

export function parsePostListQuery(query: Record<string, unknown>): PostListFilters {
  const categories = splitCsv(query.categories);
  const legacyCategory = typeof query['danh-muc'] === 'string' ? query['danh-muc'].trim() : '';

  return {
    search: typeof query.search === 'string' ? query.search : '',
    categories: categories.length > 0 ? categories : legacyCategory ? [legacyCategory] : [],
    sort: typeof query.sort === 'string' ? query.sort : 'newest',
    page: parsePositiveInt(query.page, 1),
    limit: parsePositiveInt(query.limit, 12),
    tags: splitCsv(query.tags),
  };
}

export function buildPostListQuery(filters: PostListFilters): Record<string, string> {
  const query: Record<string, string> = {};

  if (filters.search) {
    query.search = filters.search;
  }

  if (filters.categories.length > 0) {
    query.categories = filters.categories.join(',');
  }

  if (filters.tags.length > 0) {
    query.tags = filters.tags.join(',');
  }

  if (filters.sort !== 'newest') {
    query.sort = filters.sort;
  }

  if (filters.page > 1) {
    query.page = String(filters.page);
  }

  if (filters.limit !== 12) {
    query.limit = String(filters.limit);
  }

  return query;
}
