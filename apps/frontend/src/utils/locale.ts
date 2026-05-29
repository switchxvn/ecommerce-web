export type SupportedLocaleCode = 'vi' | 'en' | 'ko';

const SUPPORTED_LOCALES: SupportedLocaleCode[] = ['vi', 'en', 'ko'];
const DEFAULT_LOCALE_METADATA: Record<SupportedLocaleCode, { name: string; nativeName: string; flagCode: string }> = {
  vi: {
    name: 'Vietnamese',
    nativeName: 'Tiếng Việt',
    flagCode: 'vn',
  },
  en: {
    name: 'English',
    nativeName: 'English',
    flagCode: 'us',
  },
  ko: {
    name: 'Korean',
    nativeName: '한국어',
    flagCode: 'kr',
  },
};

function parseSupportedLocaleCode(
  input: string | null | undefined,
): SupportedLocaleCode | null {
  if (!input) {
    return null;
  }

  const normalized = input.trim().toLowerCase().replace('_', '-');
  const primaryCode = normalized.split('-')[0];

  if (SUPPORTED_LOCALES.includes(primaryCode as SupportedLocaleCode)) {
    return primaryCode as SupportedLocaleCode;
  }

  return null;
}

export function normalizeLocaleCode(
  input: string | null | undefined,
  fallback: SupportedLocaleCode = 'vi',
): SupportedLocaleCode {
  return parseSupportedLocaleCode(input) ?? fallback;
}

export function resolveInitialLocaleCode(
  persistedLocale: string | null | undefined,
  documentLocale: string | null | undefined,
  fallback: SupportedLocaleCode = 'vi',
): SupportedLocaleCode {
  return parseSupportedLocaleCode(persistedLocale)
    ?? parseSupportedLocaleCode(documentLocale)
    ?? fallback;
}

export function getLocaleDisplayName(
  input: string | null | undefined,
  locales: Array<{ code: string; nativeName?: string | null }> = [],
  fallbackLabel = 'Language',
): string {
  const normalizedCode = parseSupportedLocaleCode(input);
  const runtimeLocale = normalizedCode
    ? locales.find((locale) => parseSupportedLocaleCode(locale.code) === normalizedCode)
    : undefined;

  if (runtimeLocale?.nativeName?.trim()) {
    return runtimeLocale.nativeName;
  }

  if (normalizedCode) {
    return DEFAULT_LOCALE_METADATA[normalizedCode].nativeName;
  }

  return fallbackLabel;
}

export function getLocaleFallbackOptions<T extends { code: string }>(
  locales?: T[],
): T[] | Array<{ code: SupportedLocaleCode; name: string; nativeName: string; flagCode: string }> {
  if (locales?.length) {
    return locales;
  }

  return SUPPORTED_LOCALES.map((code) => ({
    code,
    ...DEFAULT_LOCALE_METADATA[code],
  }));
}
