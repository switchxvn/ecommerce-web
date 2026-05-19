import {
  hasActiveCategoryFilters,
  isCategoryNotFoundMessage,
  resolveCategoryPageState,
} from './categoryPageState';

describe('categoryPageState', () => {
  it('marks missing categories as invalid and non-indexable', () => {
    expect(resolveCategoryPageState({
      categoryId: null,
      totalProducts: 0,
      hasActiveFilters: false,
      errorMessage: 'Category with slug "xe-nang" not found',
    })).toEqual({
      kind: 'invalid-category',
      shouldIndex: false,
      shouldShowFilters: false,
    });
  });

  it('keeps valid categories with products in the normal listing state', () => {
    expect(resolveCategoryPageState({
      categoryId: 12,
      totalProducts: 8,
      hasActiveFilters: false,
      errorMessage: null,
    })).toEqual({
      kind: 'has-products',
      shouldIndex: true,
      shouldShowFilters: true,
    });
  });

  it('shows a filtered empty state when no product matches the current filters', () => {
    expect(resolveCategoryPageState({
      categoryId: 12,
      totalProducts: 0,
      hasActiveFilters: true,
      errorMessage: null,
    })).toEqual({
      kind: 'filtered-empty',
      shouldIndex: true,
      shouldShowFilters: true,
    });
  });

  it('shows a category empty state when the category exists but has no products yet', () => {
    expect(resolveCategoryPageState({
      categoryId: 12,
      totalProducts: 0,
      hasActiveFilters: false,
      errorMessage: null,
    })).toEqual({
      kind: 'empty-category',
      shouldIndex: true,
      shouldShowFilters: false,
    });
  });

  it('detects only real user-facing filters as active category filters', () => {
    expect(hasActiveCategoryFilters({})).toBe(false);
    expect(hasActiveCategoryFilters({ search: 'xe nâng điện' })).toBe(true);
    expect(hasActiveCategoryFilters({ minPrice: 1000000 })).toBe(true);
    expect(hasActiveCategoryFilters({ isSale: true })).toBe(true);
  });

  it('recognizes not-found messages in multiple locales', () => {
    expect(isCategoryNotFoundMessage('Category with slug "abc" not found')).toBe(true);
    expect(isCategoryNotFoundMessage('Không tìm thấy danh mục phù hợp')).toBe(true);
    expect(isCategoryNotFoundMessage('Failed to retrieve category')).toBe(false);
  });
});
