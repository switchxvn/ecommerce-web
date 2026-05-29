interface ResolveCategoryPageStateInput {
  categoryId?: number | null;
  totalProducts: number;
  hasActiveFilters: boolean;
  errorMessage?: string | null;
  isPending?: boolean;
}

export type CategoryPageStateKind =
  | 'loading'
  | 'invalid-category'
  | 'empty-category'
  | 'filtered-empty'
  | 'has-products';

export interface CategoryPageState {
  kind: CategoryPageStateKind;
  shouldIndex: boolean;
  shouldShowFilters: boolean;
}

export function isCategoryNotFoundMessage(message?: string | null): boolean {
  if (!message) {
    return false;
  }

  return /not found|không tìm thấy|khong tim thay/i.test(message);
}

export function hasActiveCategoryFilters(filters: {
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  isFeatured?: boolean;
  isNew?: boolean;
  isSale?: boolean;
}): boolean {
  return Boolean(
    filters.search?.trim()
      || typeof filters.minPrice === 'number'
      || typeof filters.maxPrice === 'number'
      || filters.isFeatured
      || filters.isNew
      || filters.isSale,
  );
}

export function resolveCategoryPageState(input: ResolveCategoryPageStateInput): CategoryPageState {
  if (input.isPending) {
    return {
      kind: 'loading',
      shouldIndex: false,
      shouldShowFilters: false,
    };
  }

  if (!input.categoryId || isCategoryNotFoundMessage(input.errorMessage)) {
    return {
      kind: 'invalid-category',
      shouldIndex: false,
      shouldShowFilters: false,
    };
  }

  if (input.totalProducts > 0) {
    return {
      kind: 'has-products',
      shouldIndex: true,
      shouldShowFilters: true,
    };
  }

  if (input.hasActiveFilters) {
    return {
      kind: 'filtered-empty',
      shouldIndex: true,
      shouldShowFilters: true,
    };
  }

  return {
    kind: 'empty-category',
    shouldIndex: true,
    shouldShowFilters: false,
  };
}
