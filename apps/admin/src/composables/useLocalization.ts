import { useI18n } from 'vue-i18n';
import { ref, computed } from 'vue';
import type { Composer } from 'vue-i18n';
import { useTrpc } from './useTrpc';

export type SupportedLocale = string;

interface LocaleOption {
  code: SupportedLocale;
  name: string;
  nativeName: string;
  flag: string;
  flagCode: string;
  isDefault?: boolean;
}

const DEFAULT_LOCALES: LocaleOption[] = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '/images/flag/us.svg', flagCode: 'us', isDefault: false },
  { code: 'vi', name: 'Tiếng Việt', nativeName: 'Tiếng Việt', flag: '/images/flag/vn.svg', flagCode: 'vn', isDefault: true }
];

const buildFlagPath = (flagCode?: string) => {
  if (!flagCode) return '';
  return `/images/flag/${flagCode.toLowerCase()}.svg`;
};

const state = {
  availableLocales: ref<LocaleOption[]>([...DEFAULT_LOCALES]),
  isInitialized: ref(false),
  isLoading: ref(false),
};

export const useLocalization = () => {
  const trpc = useTrpc();

  // Sử dụng try-catch để xử lý trường hợp i18n chưa được khởi tạo
  let i18n: Composer | undefined;
  try {
    i18n = useI18n();
  } catch {
    console.warn('i18n not initialized yet, using fallback');
  }

  const currentLocaleCode = ref<SupportedLocale>('');
  const availableLocales = state.availableLocales;
  const locales = computed(() => availableLocales.value.map(locale => locale.code));

  const currentLocale = computed(() => {
    return i18n?.locale.value || currentLocaleCode.value || availableLocales.value.find(locale => locale.isDefault)?.code || availableLocales.value[0]?.code || 'en';
  });

  const currentLocaleOption = computed(() => {
    const activeCode = i18n?.locale.value || currentLocaleCode.value;
    if (activeCode) {
      const matchedLocale = availableLocales.value.find(l => l.code === activeCode);
      if (matchedLocale) {
        return matchedLocale;
      }
    }

    return availableLocales.value.find(l => l.isDefault) || availableLocales.value[0] || DEFAULT_LOCALES[0];
  });

  const syncLocale = (localeCode: SupportedLocale) => {
    if (!localeCode) return;

    currentLocaleCode.value = localeCode;

    if (i18n) {
      i18n.locale.value = localeCode;
    }

    if (process.client) {
      localStorage.setItem('locale', localeCode);
      document.documentElement.setAttribute('lang', localeCode);
    }
  };

  const loadLocales = async () => {
    if (state.isInitialized.value || state.isLoading.value) return;

    state.isLoading.value = true;

    try {
      const languages = await trpc.language.getLanguages.query();

      if (languages?.length) {
        availableLocales.value = languages.map(language => ({
          code: language.code,
          name: language.name,
          nativeName: language.nativeName,
          flag: buildFlagPath(language.flagCode),
          flagCode: language.flagCode,
          isDefault: language.isDefault,
        }));
      }
    } catch (error) {
      console.warn('Failed to load locales from database, using fallback locales:', error);
      availableLocales.value = [...DEFAULT_LOCALES];
    } finally {
      state.isInitialized.value = true;
      state.isLoading.value = false;
    }
  };

  const setLocale = (localeCode: SupportedLocale) => {
    syncLocale(localeCode);
  };

  // Alias for setLocale that matches frontend API
  const switchLanguage = (localeCode: SupportedLocale) => {
    return setLocale(localeCode);
  };

  // Hàm tiện ích để lấy chuỗi dịch với các tham số
  const translate = (key: string, params?: Record<string, any>) => {
    if (i18n) {
      return i18n.t(key, params || {});
    }
    return key; // Fallback khi i18n chưa sẵn sàng
  };

  // Hàm tiện ích để lấy chuỗi dịch từ một namespace cụ thể
  const translateFromNamespace = (namespace: string, key: string, params?: Record<string, any>) => {
    if (!i18n) return key;
    
    const messages = i18n.tm(namespace);
    if (messages && typeof messages === 'object' && key in messages) {
      const translation = messages[key];
      if (typeof translation === 'string') {
        // Xử lý các tham số nếu có
        if (params) {
          // Sửa lỗi linter về phương thức replace
          return Object.entries(params).reduce(
            (acc: string, entry: [string, any]) => {
              const [paramKey, paramValue] = entry;
              return acc.replace(new RegExp(`{${paramKey}}`, 'g'), String(paramValue));
            },
            translation
          );
        }
        return translation;
      }
    }
    return key; // Trả về key nếu không tìm thấy bản dịch
  };

  // Khởi tạo ngôn ngữ từ localStorage nếu có
  const initLocale = async () => {
    await loadLocales();

    const runtimeLocale = i18n?.locale.value;
    if (runtimeLocale) {
      currentLocaleCode.value = runtimeLocale as SupportedLocale;
    }

    const defaultLocale = availableLocales.value.find(locale => locale.isDefault)?.code || availableLocales.value[0]?.code || 'en';

    if (process.client) {
      const savedLocale = localStorage.getItem('locale') as SupportedLocale | null;
      if (savedLocale) {
        syncLocale(savedLocale);
        return;
      }
    }

    syncLocale(runtimeLocale || defaultLocale);
  };

  return {
    locale: computed({
      get: () => i18n?.locale.value || currentLocaleCode.value,
      set: (value) => syncLocale(value),
    }),
    locales,
    availableLocales,
    currentLocale,
    currentLocaleOption,
    setLocale,
    switchLanguage,
    t: translate,
    translateFromNamespace,
    initLocale
  };
}; 
