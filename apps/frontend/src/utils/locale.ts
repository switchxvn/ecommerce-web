export type SupportedLocaleCode = 'vi' | 'en' | 'ko';

const SUPPORTED_LOCALES: SupportedLocaleCode[] = ['vi', 'en', 'ko'];

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
