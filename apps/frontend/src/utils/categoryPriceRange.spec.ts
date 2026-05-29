import { describe, expect, it } from 'vitest';

import {
  formatCategoryPriceRange,
  formatCategoryPriceRangeSummary,
  hasCategoryPriceRange,
} from './categoryPriceRange';

describe('categoryPriceRange', () => {
  it('detects when a category has a valid price range', () => {
    expect(hasCategoryPriceRange(190_000_000, 495_000_000)).toBe(true);
    expect(hasCategoryPriceRange(190_000_000, null)).toBe(true);
    expect(hasCategoryPriceRange(null, null)).toBe(false);
  });

  it('formats a category price range for UI', () => {
    expect(formatCategoryPriceRange(190_000_000, 495_000_000)).toBe('190.000.000 đ - 495.000.000 đ');
    expect(formatCategoryPriceRange(190_000_000, null)).toBe('Từ 190.000.000 đ');
    expect(formatCategoryPriceRange(null, 495_000_000)).toBe('Đến 495.000.000 đ');
    expect(formatCategoryPriceRange(null, null)).toBeNull();
  });

  it('formats a category price range summary for seo copy', () => {
    expect(formatCategoryPriceRangeSummary(190_000_000, 495_000_000)).toBe(
      'Giá tham khảo từ 190.000.000 đ đến 495.000.000 đ',
    );
    expect(formatCategoryPriceRangeSummary(190_000_000, null)).toBe(
      'Giá tham khảo từ 190.000.000 đ',
    );
    expect(formatCategoryPriceRangeSummary(null, 495_000_000)).toBe(
      'Giá tham khảo đến 495.000.000 đ',
    );
    expect(formatCategoryPriceRangeSummary(null, null)).toBeNull();
  });
});
