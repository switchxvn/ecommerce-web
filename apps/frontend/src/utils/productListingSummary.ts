interface ProductRangeSummaryOptions {
  currentPage: number;
  limit: number;
  totalItems: number;
  showingLabel: string;
  ofLabel: string;
  itemsLabel: string;
}

export const formatProductRangeSummary = ({
  currentPage,
  limit,
  totalItems,
  showingLabel,
  ofLabel,
  itemsLabel,
}: ProductRangeSummaryOptions): string => {
  if (totalItems <= 0) {
    return `${showingLabel} 0 ${itemsLabel}`;
  }

  const start = (Math.max(currentPage, 1) - 1) * Math.max(limit, 1) + 1;
  const end = Math.min(Math.max(currentPage, 1) * Math.max(limit, 1), totalItems);

  return `${showingLabel} ${start} - ${end} ${ofLabel} ${totalItems} ${itemsLabel}`;
};

export const formatCategoryItemCount = (count: number, itemsLabel: string): string =>
  `${count} ${itemsLabel}`;
