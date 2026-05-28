import { formatPrice } from './price';

const isValidPrice = (value: number | null | undefined): value is number =>
  typeof value === 'number' && Number.isFinite(value) && value >= 0;

const formatCategoryMoney = (value: number): string =>
  formatPrice(value).replace(/\s*₫/, ' đ').replace(/\u00A0/g, ' ');

export const hasCategoryPriceRange = (
  minPrice: number | null | undefined,
  maxPrice: number | null | undefined,
): boolean => isValidPrice(minPrice) || isValidPrice(maxPrice);

export const formatCategoryPriceRange = (
  minPrice: number | null | undefined,
  maxPrice: number | null | undefined,
): string | null => {
  const hasMin = isValidPrice(minPrice);
  const hasMax = isValidPrice(maxPrice);

  if (hasMin && hasMax) {
    return `${formatCategoryMoney(minPrice)} - ${formatCategoryMoney(maxPrice)}`;
  }

  if (hasMin) {
    return `Từ ${formatCategoryMoney(minPrice)}`;
  }

  if (hasMax) {
    return `Đến ${formatCategoryMoney(maxPrice)}`;
  }

  return null;
};

export const formatCategoryPriceRangeSummary = (
  minPrice: number | null | undefined,
  maxPrice: number | null | undefined,
): string | null => {
  const hasMin = isValidPrice(minPrice);
  const hasMax = isValidPrice(maxPrice);

  if (hasMin && hasMax) {
    return `Giá tham khảo từ ${formatCategoryMoney(minPrice)} đến ${formatCategoryMoney(maxPrice)}`;
  }

  if (hasMin) {
    return `Giá tham khảo từ ${formatCategoryMoney(minPrice)}`;
  }

  if (hasMax) {
    return `Giá tham khảo đến ${formatCategoryMoney(maxPrice)}`;
  }

  return null;
};
