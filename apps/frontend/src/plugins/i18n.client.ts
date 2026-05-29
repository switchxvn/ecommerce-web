import { defineNuxtPlugin } from 'nuxt/app';
import { normalizeLocaleCode } from '../utils/locale';

export default defineNuxtPlugin(async (nuxtApp) => {
  const savedLocale = localStorage.getItem('locale');
  const targetLocale = normalizeLocaleCode(savedLocale, 'vi');

  if (nuxtApp.$i18n.locale.value !== targetLocale) {
    await nuxtApp.$i18n.setLocale(targetLocale);
  }

  localStorage.setItem('locale', targetLocale);
  document.documentElement.setAttribute('lang', targetLocale);
});
