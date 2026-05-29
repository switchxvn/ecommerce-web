import { defineNuxtPlugin } from 'nuxt/app';
import { useLanguageInitializer } from '../composables/useLanguageInitializer';

export default defineNuxtPlugin(async () => {
  if (process.server) {
    return;
  }

  const { initializeOnce } = useLanguageInitializer();

  await initializeOnce();
});
