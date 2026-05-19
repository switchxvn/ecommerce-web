import { normalizeLocaleCode, resolveInitialLocaleCode } from './locale';

describe('normalizeLocaleCode', () => {
  it('keeps supported short locale codes', () => {
    expect(normalizeLocaleCode('vi')).toBe('vi');
    expect(normalizeLocaleCode('en')).toBe('en');
    expect(normalizeLocaleCode('ko')).toBe('ko');
  });

  it('normalizes browser locale variants to app locale codes', () => {
    expect(normalizeLocaleCode('vi-VN')).toBe('vi');
    expect(normalizeLocaleCode('en-US')).toBe('en');
    expect(normalizeLocaleCode('EN_us')).toBe('en');
    expect(normalizeLocaleCode('ko-KR')).toBe('ko');
  });

  it('falls back when locale is missing or unsupported', () => {
    expect(normalizeLocaleCode(undefined)).toBe('vi');
    expect(normalizeLocaleCode('fr-FR')).toBe('vi');
    expect(normalizeLocaleCode('', 'en')).toBe('en');
  });
});

describe('resolveInitialLocaleCode', () => {
  it('prefers a persisted locale when available', () => {
    expect(resolveInitialLocaleCode('en', 'vi')).toBe('en');
  });

  it('falls back to the document locale when persisted locale is empty', () => {
    expect(resolveInitialLocaleCode('', 'vi')).toBe('vi');
  });

  it('uses the provided fallback when neither source is valid', () => {
    expect(resolveInitialLocaleCode('', '', 'en')).toBe('en');
    expect(resolveInitialLocaleCode(undefined, 'fr-FR', 'en')).toBe('en');
  });
});
