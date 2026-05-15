import { normalizeLocaleCode } from './locale';

describe('normalizeLocaleCode', () => {
  it('keeps supported short locale codes', () => {
    expect(normalizeLocaleCode('vi')).toBe('vi');
    expect(normalizeLocaleCode('en')).toBe('en');
  });

  it('normalizes browser locale variants to app locale codes', () => {
    expect(normalizeLocaleCode('vi-VN')).toBe('vi');
    expect(normalizeLocaleCode('en-US')).toBe('en');
    expect(normalizeLocaleCode('EN_us')).toBe('en');
  });

  it('falls back when locale is missing or unsupported', () => {
    expect(normalizeLocaleCode(undefined)).toBe('vi');
    expect(normalizeLocaleCode('fr-FR')).toBe('vi');
    expect(normalizeLocaleCode('', 'en')).toBe('en');
  });
});
