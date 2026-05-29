import { ref, computed, watch } from 'vue';
import { useLocalStorage } from '@vueuse/core';
import { useTrpc } from './useTrpc';
import type { inferRouterOutputs } from '@trpc/server';
import type { AppRouter } from '@backend/modules/trpc/routers';
import { normalizeLocaleCode, resolveInitialLocaleCode } from '../utils/locale';

// Import local translations
import viLocalTranslations from '../i18n/locales/vi.json';
import enLocalTranslations from '../i18n/locales/en.json';
import koLocalTranslations from '../i18n/locales/ko.json';

// Define types for tRPC outputs
type RouterOutput = inferRouterOutputs<AppRouter>;

// Define locale interface
export interface Locale {
  id: number;
  code: string;
  name: string;
  nativeName: string;
  flagCode: string;
  isActive: boolean;
  isDefault: boolean;
}

const normalizeLocaleEntries = (locales: Locale[]): Locale[] => {
  const seenCodes = new Set<string>();

  return locales.reduce<Locale[]>((result, localeEntry) => {
    const normalizedCode = normalizeLocaleCode(localeEntry.code, FALLBACK_LOCALE as 'en');

    if (seenCodes.has(normalizedCode)) {
      return result;
    }

    seenCodes.add(normalizedCode);
    result.push({
      ...localeEntry,
      code: normalizedCode,
    });

    return result;
  }, []);
};

// Define translations interface
export interface Translations {
  [languageCode: string]: {
    [namespace: string]: {
      [key: string]: string;
    };
  };
}

const unwrapTranslationModule = (translations: any) => {
  if (
    translations &&
    typeof translations === 'object' &&
    'default' in translations &&
    translations.default &&
    typeof translations.default === 'object'
  ) {
    return translations.default;
  }

  return translations;
};

// Local translations mapping
const localTranslations: { [key: string]: any } = {
  vi: unwrapTranslationModule(viLocalTranslations),
  en: unwrapTranslationModule(enLocalTranslations),
  ko: unwrapTranslationModule(koLocalTranslations),
};

const FALLBACK_LOCALE = 'en';

const deepMerge = (target: Record<string, any>, source: Record<string, any>) => {
  Object.entries(source).forEach(([key, value]) => {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      if (!target[key] || typeof target[key] !== 'object') {
        target[key] = {};
      }
      deepMerge(target[key], value as Record<string, any>);
      return;
    }

    target[key] = value;
  });
};

const mergeTranslations = (dbTranslations: Record<string, Record<string, string>>, langCode: string) => {
  const result: { [namespace: string]: { [key: string]: string } } = {};
  const localTranslationData = localTranslations[langCode] || {};

  Object.entries(localTranslationData).forEach(([key, value]) => {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      if (!result[key]) result[key] = {};
      deepMerge(result[key], value as Record<string, any>);
      return;
    }

    if (!result.common) result.common = {};
    result.common[key] = value as string;
  });

  Object.entries(dbTranslations).forEach(([namespace, translations]) => {
    if (!result[namespace]) {
      result[namespace] = {};
    }

    Object.entries(translations).forEach(([key, value]) => {
      if (typeof value !== 'string') {
        return;
      }

      const trimmedValue = value.trim();
      const fullKey = `${namespace}.${key}`;

      // Ignore placeholder values persisted in DB like "products.requestPrice"
      // so bundled locale strings remain the effective fallback.
      if (!trimmedValue || trimmedValue === fullKey) {
        return;
      }

      result[namespace][key] = value;
    });
  });

  return result;
};

const resolveNestedTranslation = (source: Record<string, any> | undefined, key: string) => {
  if (!source) return undefined;

  const normalizedSource = unwrapTranslationModule(source);

  return key.split('.').reduce<any>((value, part) => {
    if (!value || typeof value !== 'object') {
      return undefined;
    }

    return unwrapTranslationModule(value[part]);
  }, normalizedSource);
};

const coerceTranslationValue = (value: any): string | undefined => {
  if (typeof value === 'string') {
    return value;
  }

  if (!value || typeof value !== 'object') {
    return undefined;
  }

  if (typeof value.static === 'string') {
    return value.static;
  }

  if (typeof value.source === 'string') {
    return value.source;
  }

  if (value.body && typeof value.body.static === 'string') {
    return value.body.static;
  }

  if (value.loc && typeof value.loc.source === 'string') {
    return value.loc.source;
  }

  return undefined;
};

const getDocumentLocale = () =>
  typeof document !== 'undefined' ? document.documentElement.lang : undefined;

const localeStorage = useLocalStorage('locale', '');
const initialLocale = resolveInitialLocaleCode(
  localeStorage.value,
  getDocumentLocale(),
  'vi',
);

if (localeStorage.value !== initialLocale) {
  localeStorage.value = initialLocale;
}

// Create singleton state
const state = {
  locale: localeStorage,
  locales: ref<Locale[]>([]),
  translations: ref<Translations>({
    [initialLocale]: mergeTranslations({}, initialLocale),
  }),
  isLoading: ref(false),
  error: ref<string | null>(null),
  isInitialized: ref(false)
};

export function useLocalization() {
  const trpc = useTrpc();

  // Computed
  const currentTranslations = computed(() => {
    if (!state.locale.value || !state.translations.value[state.locale.value]) {
      return {};
    }
    return state.translations.value[state.locale.value];
  });

  // Methods
  const initializeLocalization = async (options?: { force?: boolean }) => {
    const shouldForce = options?.force === true;

    // Skip if already initialized
    if (state.isInitialized.value && !shouldForce) return;

    state.isLoading.value = true;
    state.error.value = null;

    try {
      const [defaultLang, languages] = await Promise.all([
        trpc.language.getDefaultLanguage.query(),
        trpc.language.getLanguages.query(),
      ]);

      state.locales.value = normalizeLocaleEntries(languages);

      if (defaultLang && !state.locale.value) {
        state.locale.value = normalizeLocaleCode(defaultLang.code, FALLBACK_LOCALE as 'en');
      }

      const langCode = normalizeLocaleCode(state.locale.value || defaultLang?.code || FALLBACK_LOCALE, FALLBACK_LOCALE as 'en');
      
      // First set local translations
      state.translations.value = {
        [langCode]: mergeTranslations({}, langCode)
      };

      // Then try to get and merge database translations
      try {
        const translations = await trpc.language.getAllTranslations.query({ languageCode: langCode });
        state.translations.value = {
          [langCode]: mergeTranslations(translations, langCode)
        };
      } catch (dbErr) {
        console.warn('Failed to fetch database translations, using local translations only:', dbErr);
      }

      state.isInitialized.value = true;
    } catch (err) {
      console.error('Failed to initialize localization:', err);
      const langCode = normalizeLocaleCode(state.locale.value || FALLBACK_LOCALE, FALLBACK_LOCALE as 'en');
      state.translations.value = {
        [langCode]: mergeTranslations({}, langCode)
      };
      state.error.value = 'Failed to initialize localization';
    } finally {
      state.isLoading.value = false;
    }
  };

  const fetchTranslations = async (languageCode: string) => {
    const normalizedLanguageCode = normalizeLocaleCode(languageCode, FALLBACK_LOCALE as 'en');
    if (state.translations.value[normalizedLanguageCode]) return; // Skip if already loaded
    
    state.isLoading.value = true;
    state.error.value = null;
    
    // First set local translations
    state.translations.value = {
      ...state.translations.value,
      [normalizedLanguageCode]: mergeTranslations({}, normalizedLanguageCode)
    };

    try {
      const dbTranslations = await trpc.language.getAllTranslations.query({ languageCode: normalizedLanguageCode });
      state.translations.value = {
        ...state.translations.value,
        [normalizedLanguageCode]: mergeTranslations(dbTranslations, normalizedLanguageCode)
      };
    } catch (err) {
      console.warn(`Failed to fetch database translations for ${normalizedLanguageCode}, using local translations only:`, err);
    } finally {
      state.isLoading.value = false;
    }
  };

  const switchLanguage = async (code: string) => {
    const normalizedCode = normalizeLocaleCode(code, FALLBACK_LOCALE as 'en');
    if (normalizedCode === state.locale.value) return;
    
    // If we don't have translations for this language yet, fetch them
    if (!state.translations.value[normalizedCode]) {
      await fetchTranslations(normalizedCode);
    }
    
    state.locale.value = normalizedCode;
    
    // Update HTML lang attribute
    if (process.client) {
      document.documentElement.setAttribute('lang', normalizedCode);
    }
  };

  // Translation function
  const t = (key: string, params?: Record<string, any>) => {
    const activeLocale = normalizeLocaleCode(state.locale.value || initialLocale, FALLBACK_LOCALE as 'en');
    const translations = state.translations.value[activeLocale] || mergeTranslations({}, activeLocale);
    let value = coerceTranslationValue(resolveNestedTranslation(translations, key));

    if (typeof value !== 'string' || value.trim() === key) {
      value = coerceTranslationValue(resolveNestedTranslation(localTranslations[activeLocale], key));
    }

    if ((typeof value !== 'string' || value.trim() === key) && activeLocale !== FALLBACK_LOCALE) {
      value = coerceTranslationValue(resolveNestedTranslation(localTranslations[FALLBACK_LOCALE], key));
    }

    if (typeof value !== 'string' || value.trim() === key) {
      console.warn(`Translation not found for key "${key}"`);
      return '';
    }

    // Replace parameters in the translation string
    if (params) {
      Object.entries(params).forEach(([paramKey, paramValue]) => {
        value = value.replace(new RegExp(`{${paramKey}}`, 'g'), paramValue);
      });
    }
    
    return value;
  };

  // Watch for language changes to update HTML lang attribute
watch(state.locale, (newLocale) => {
    if (process.client && newLocale) {
      const normalizedLocale = normalizeLocaleCode(newLocale, FALLBACK_LOCALE as 'en');
      if (normalizedLocale !== newLocale) {
        state.locale.value = normalizedLocale;
        return;
      }

      localStorage.setItem('locale', normalizedLocale);
      document.documentElement.setAttribute('lang', normalizedLocale);
    }
  });

  return {
    locale: state.locale,
    locales: state.locales,
    translations: state.translations,
    currentTranslations,
    isLoading: state.isLoading,
    error: state.error,
    t,
    switchLanguage,
    initializeLocalization,
  };
} 
