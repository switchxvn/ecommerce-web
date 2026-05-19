import { describe, expect, it } from 'vitest';

import { getIconName } from './icon';

describe('getIconName', () => {
  it('maps legacy phosphor footer icons to lucide equivalents', () => {
    expect(getIconName('ph:facebook-logo')).toBe('Facebook');
    expect(getIconName('ph:linkedin-logo')).toBe('Linkedin');
    expect(getIconName('ph:youtube-logo')).toBe('Youtube');
    expect(getIconName('ph:envelope')).toBe('Mail');
    expect(getIconName('ph:shopping-cart')).toBe('ShoppingCart');
  });

  it('maps legacy heroicon utility names used by action buttons', () => {
    expect(getIconName('i-heroicons-currency-dollar')).toBe('BadgeDollarSign');
    expect(getIconName('i-heroicons-phone')).toBe('Phone');
    expect(getIconName('i-heroicons-arrow-down')).toBe('ArrowDown');
  });
});
