import { ref, computed, watch } from 'vue';
import { useHead } from '#imports';
import { useTrpc } from './useTrpc';
import type { RouterOutput } from '../types/trpc';
import { buildFaviconLinks, resolveCurrentFaviconUrl } from '../utils/favicon';

type FaviconData = RouterOutput['logo']['getActiveLogo'];

export const useFavicon = () => {
  const trpc = useTrpc();
  const favicon = ref<FaviconData | null>(null);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  // Default favicon fallback
  const defaultFavicon = '/favicon.ico';

  const fetchFavicon = async () => {
    try {
      isLoading.value = true;
      error.value = null;
      
      // Try to fetch favicon from API
      const faviconData = await trpc.logo.getActiveLogo.query({ type: 'favicon' });
      favicon.value = faviconData;
    } catch (err) {
      // If no favicon found or error, use default
      error.value = err instanceof Error ? err.message : 'Error fetching favicon';
      console.warn('Error fetching favicon, using default:', err);
      favicon.value = null;
    } finally {
      isLoading.value = false;
    }
  };

  // Computed favicon URL based on theme
  const currentFaviconUrl = computed(() => {
    return resolveCurrentFaviconUrl(favicon.value, defaultFavicon);
  });

  // Set favicon in document head
  const setFavicon = (url: string) => {
    useHead({
      link: buildFaviconLinks(url)
    });
  };

  // Watch for favicon changes and update head
  watch(currentFaviconUrl, (newUrl) => {
    if (newUrl) {
      setFavicon(newUrl);
    }
  }, { immediate: true });

  // Initialize favicon on server and client
  const initializeFavicon = async () => {
    if (process.server) {
      // Keep SSR favicon static and same-origin for crawlers.
      setFavicon(defaultFavicon);
      return;
    }

    // Fetch favicon from API on the client only.
    await fetchFavicon();
  };

  // Refresh favicon (useful for admin updates)
  const refreshFavicon = async () => {
    await fetchFavicon();
  };

  // Client-side dynamic update support
  const updateFaviconUrl = (url: string) => {
    if (process.client) {
      // Update existing favicon elements in DOM
      const faviconElements = document.querySelectorAll('link[rel*="icon"], link[rel*="shortcut"]');
      faviconElements.forEach((element: Element) => {
        const linkElement = element as HTMLLinkElement;
        linkElement.href = url;
      });
    }
  };

  return {
    favicon,
    currentFaviconUrl,
    isLoading,
    error,
    fetchFavicon,
    initializeFavicon,
    refreshFavicon,
    updateFaviconUrl,
    setFavicon
  };
};
