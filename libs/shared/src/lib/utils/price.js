/**
 * Format a number as a price in VND currency
 * @param price The price to format
 * @returns Formatted price string
 */
export const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(price);
};
/**
 * Format a number as a price in VND currency without currency symbol
 * @param price The price to format
 * @returns Formatted price string without currency symbol
 */
export const formatPriceWithoutSymbol = (price) => {
    return new Intl.NumberFormat('vi-VN', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(price);
};
/**
 * Format a number as a price in VND currency with custom options
 * @param price The price to format
 * @param options Custom formatting options
 * @returns Formatted price string
 */
export const formatPriceWithOptions = (price, options = {}) => {
    const defaultOptions = {
        style: 'currency',
        currency: 'VND',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    };
    return new Intl.NumberFormat('vi-VN', {
        ...defaultOptions,
        ...options,
    }).format(price);
};
//# sourceMappingURL=price.js.map