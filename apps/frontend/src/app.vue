<script setup lang="ts">
import { useHead } from '@unhead/vue';
import { ref, onMounted } from 'vue';
import { useFeatureFlags } from './composables/useFeatureFlags';
import { useComponentStyles } from './composables/useComponentStyles';
import { useTheme } from './composables/useTheme';
import { useDarkMode } from './composables/useDarkMode';
import { useSettings } from './composables/useSettings';
import { useFavicon } from './composables/useFavicon';

const isLoading = ref(true);

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

const appInitPromise = initApp();

// Add font awesome and meta tags
useHead({
  link: [
    { rel: 'preconnect', href: 'https://cdn.mgavietnam.com', crossorigin: '' },
    { rel: 'dns-prefetch', href: '//cdn.mgavietnam.com' }
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

onMounted(async () => {
  const overlayStart = performance.now();
  const MIN_OVERLAY_MS = 400;
  const MAX_INIT_WAIT_MS = 10000;

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

  const waitWithTimeout = async (promise: Promise<unknown>, timeoutMs: number) => {
    await Promise.race([
      promise,
      new Promise((resolve) => window.setTimeout(resolve, timeoutMs)),
    ]);
  };

  try {
    await waitWithTimeout(appInitPromise, MAX_INIT_WAIT_MS);
    await waitWithTimeout(runSecondaryInit(), MAX_INIT_WAIT_MS);
  } catch {
    // Overlay still releases below.
  }

  const releaseOverlay = () => {
    const elapsed = performance.now() - overlayStart;
    const remaining = Math.max(0, MIN_OVERLAY_MS - elapsed);

    window.setTimeout(() => {
      window.requestAnimationFrame(() => {
        isLoading.value = false;
      });
    }, remaining);
  };

  releaseOverlay();

  // Hard safety timeout in case the browser delays animation frames or long API hangs.
  window.setTimeout(() => {
    isLoading.value = false;
  }, MAX_INIT_WAIT_MS + MIN_OVERLAY_MS);
});
</script>

<template>
  <LoadingScreen :is-loading="isLoading" />
  <!-- NuxtLayout sẽ tự động sử dụng layout default -->
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
