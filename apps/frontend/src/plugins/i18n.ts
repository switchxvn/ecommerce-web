import { createI18n } from 'vue-i18n';
import { defineNuxtPlugin, useRequestURL, useRuntimeConfig } from 'nuxt/app';
import en from '../i18n/locales/en.json';
import vi from '../i18n/locales/vi.json';
import { normalizeLocaleCode } from '../utils/locale';
import { isLocalRuntimeUrl } from '../utils/runtimeOrigin';

interface LanguageResponse {
  code: string;
}

export default defineNuxtPlugin(async ({ vueApp }) => {
  const config = useRuntimeConfig();
  const requestOrigin = process.server ? useRequestURL().origin : '';
  const baseUrl = process.server
    ? (isLocalRuntimeUrl(config.public.apiBase) ? requestOrigin : config.public.apiBase)
    : '';
  const savedLocale = process.client ? localStorage.getItem('locale') : null;

  let defaultLocale = normalizeLocaleCode(savedLocale, 'vi');

  if (!savedLocale) {
    try {
      const language = await $fetch<LanguageResponse>('/api/languages/default', {
        baseURL: baseUrl,
      });

      if (language?.code) {
        defaultLocale = normalizeLocaleCode(language.code, 'vi');
      }
    } catch (error) {
      console.warn('Failed to load default language from database, using fallback locale:', error);
    }
  }

  const i18n = createI18n({
    legacy: false,
    globalInjection: true,
    locale: defaultLocale,
    fallbackLocale: defaultLocale,
    messages: {
      en,
      vi
    }
  });

  if (process.client) {
    const normalizedLocale = normalizeLocaleCode(i18n.global.locale.value, 'vi');
    i18n.global.locale.value = normalizedLocale;
    localStorage.setItem('locale', normalizedLocale);
    document.documentElement.setAttribute('lang', normalizedLocale);
  }

  vueApp.use(i18n);
});
