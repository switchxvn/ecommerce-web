export type SupportedLocaleCode = 'vi' | 'en';

const SUPPORTED_LOCALES: SupportedLocaleCode[] = ['vi', 'en'];

export function normalizeLocaleCode(
  input: string | null | undefined,
  fallback: SupportedLocaleCode = 'vi',
): SupportedLocaleCode {
  if (!input) {
    return fallback;
  }

  const normalized = input.trim().toLowerCase().replace('_', '-');
  const primaryCode = normalized.split('-')[0];

  if (SUPPORTED_LOCALES.includes(primaryCode as SupportedLocaleCode)) {
    return primaryCode as SupportedLocaleCode;
  }

  return fallback;
}
