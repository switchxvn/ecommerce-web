/**
 * Check if a string is a valid RGB color value
 * @param color The color string to check
 * @returns boolean indicating if the color is a valid RGB value
 */
export const isRgbColor = (color: string): boolean => {
  // Check for rgb() or rgba() format
  const rgbRegex = /^rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/;
  const rgbaRegex = /^rgba\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*([01]?\.?\d*)\)$/;
  
  return rgbRegex.test(color) || rgbaRegex.test(color);
};

/**
 * Check if a string is a CSS variable
 * @param color The color string to check
 * @returns boolean indicating if the color is a CSS variable
 */
export const isCssVariable = (color: string): boolean => {
  return color.startsWith('var(--');
};

/**
 * Get computed RGB value from CSS variable
 * @param cssVar CSS variable name
 * @returns RGB color value
 */
export const getRgbFromCssVariable = (cssVar: string): string => {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return cssVar;
  }

  // Get the CSS variable name
  const varName = cssVar.match(/var\((.*?)\)/)?.[1];
  if (!varName) return cssVar;

  // Get the computed value
  const computedValue = getComputedStyle(document.documentElement)
    .getPropertyValue(varName)
    .trim();

  return computedValue;
};

/**
 * Process color value to ensure RGB format is properly handled
 * @param color The color value to process
 * @returns The processed color value
 */
export const processColorValue = (color: string | undefined): string => {
  if (!color) return '';
  
  // If already RGB format, return as is
  if (isRgbColor(color)) {
    return color;
  }

  // If CSS variable, get its computed value
  if (isCssVariable(color)) {
    const computedColor = getRgbFromCssVariable(color);
    // If computed color is RGB, return it
    if (isRgbColor(computedColor)) {
      return computedColor;
    }
    // Otherwise, return original CSS variable
    return color;
  }
  
  // For other cases (hex, named colors, etc.), return as is
  return color;
}; 
