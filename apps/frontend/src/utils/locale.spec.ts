import {
  getLocaleDisplayName,
  getLocaleFallbackOptions,
  normalizeLocaleCode,
  resolveInitialLocaleCode,
} from './locale';

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

describe('getLocaleDisplayName', () => {
  it('returns a built-in native name when runtime locale metadata is unavailable', () => {
    expect(getLocaleDisplayName('vi', [], 'Ngôn ngữ')).toBe('Tiếng Việt');
    expect(getLocaleDisplayName('en', [], 'Language')).toBe('English');
  });

  it('prefers runtime locale metadata when present', () => {
    expect(
      getLocaleDisplayName(
        'vi',
        [
          {
            code: 'vi',
            nativeName: 'VI runtime',
          },
        ],
        'Ngôn ngữ',
      ),
    ).toBe('VI runtime');
  });
});

describe('getLocaleFallbackOptions', () => {
  it('returns built-in locale options when the API list is empty', () => {
    expect(getLocaleFallbackOptions().map((locale) => locale.code)).toEqual(['vi', 'en', 'ko']);
  });

  it('keeps runtime locale options when they already exist', () => {
    const runtimeLocales = [{ code: 'vi', nativeName: 'VI runtime' }];

    expect(getLocaleFallbackOptions(runtimeLocales)).toBe(runtimeLocales);
  });
});
