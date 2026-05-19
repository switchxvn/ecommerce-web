<script setup lang="ts">
import { useHead } from '#imports';
import { onMounted } from 'vue';
import { useFeatureFlags } from './composables/useFeatureFlags';
import { useComponentStyles } from './composables/useComponentStyles';
import { useTheme } from './composables/useTheme';
import { useDarkMode } from './composables/useDarkMode';
import { useSettings } from './composables/useSettings';
import { useFavicon } from './composables/useFavicon';

// Initialize theme and component styles
const { initializeTheme } = useTheme();
const { initializeStyles } = useComponentStyles();
const { initializeDarkMode } = useDarkMode();

const { getPublicSettingValueByKey } = useSettings();
const { initializeFavicon } = useFavicon();

const logGTMSettings = async () => {
  try {
    await getPublicSettingValueByKey('google_tag_manager_id', '');
  } catch (error) {
    // Non-blocking diagnostics only
  }
};

const initApp = async () => {
  try {
    await initializeTheme();

    try {
      await initializeFavicon();
    } catch {
      // Keep default favicon on failure
    }

    if (process.client) {
      initializeDarkMode();
    }
  } catch {
    // Keep app usable even when some critical init step fails.
  }
};

// Add font awesome and meta tags
useHead({
  link: [
    { rel: 'preconnect', href: 'https://cdn.mgavietnam.com', crossorigin: '' },
    { rel: 'dns-prefetch', href: '//cdn.mgavietnam.com' }
  ],
  style: [
    {
      key: 'base-paint-mode',
      innerHTML: 'html{background:#ffffff;color-scheme:light;}html.dark{color-scheme:dark;}body{background:#ffffff;}#__nuxt{min-height:100vh;background:#ffffff;}html.dark body,html.dark #__nuxt{background:rgb(var(--background,17 24 39));}',
    }
  ],
  script: [
    {
      key: 'theme-mode-init',
      innerHTML: `(function(){try{var stored=localStorage.getItem('color-theme');var prefersDark=window.matchMedia('(prefers-color-scheme: dark)').matches;var isDark=stored==='dark'||(stored==='auto'&&prefersDark);document.documentElement.classList.toggle('dark',isDark);localStorage.removeItem('vueuse-color-scheme');}catch(e){document.documentElement.classList.remove('dark');}})();`,
      tagPosition: 'head',
    }
  ],
  meta: [
    // Favicon-related meta tags for better browser support
    {
      name: 'msapplication-TileColor',
      content: '#ffffff'
    },
    {
      name: 'theme-color',
      content: '#ffffff'
    }
  ]
});

void initApp();

onMounted(() => {
  const runSecondaryInit = async () => {
    try {
      await initializeStyles();
      const { fetchFeatureFlags } = useFeatureFlags();
      await fetchFeatureFlags();
      await logGTMSettings();
    } catch {
      // Keep UI usable even when background init APIs fail.
    }
  };

  if (typeof window.requestIdleCallback === 'function') {
    window.requestIdleCallback(() => {
      void runSecondaryInit();
    }, { timeout: 2000 });
  } else {
    window.setTimeout(() => {
      void runSecondaryInit();
    }, 300);
  }
});
</script>

<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>

<style>
/* Global styles */
html, body {
  margin: 0;
  padding: 0;
}
</style>
