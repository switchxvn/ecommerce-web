import {
  formatCategoryItemCount,
  formatProductRangeSummary,
} from './productListingSummary';

describe('productListingSummary', () => {
  it('formats a paginated product range summary', () => {
    expect(formatProductRangeSummary({
      currentPage: 1,
      limit: 12,
      totalItems: 15,
      showingLabel: 'Hiển thị',
      ofLabel: 'trong số',
      itemsLabel: 'sản phẩm',
    })).toBe('Hiển thị 1 - 12 trong số 15 sản phẩm');
  });

  it('formats an empty product range summary without a fake range', () => {
    expect(formatProductRangeSummary({
      currentPage: 1,
      limit: 12,
      totalItems: 0,
      showingLabel: 'Hiển thị',
      ofLabel: 'trong số',
      itemsLabel: 'sản phẩm',
    })).toBe('Hiển thị 0 sản phẩm');
  });

  it('formats category counts with an explicit item label', () => {
    expect(formatCategoryItemCount(15, 'sản phẩm')).toBe('15 sản phẩm');
  });
});
