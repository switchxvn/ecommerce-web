import { ref, computed, watch } from 'vue';
import { useHead } from '#imports';
import { useTrpc } from './useTrpc';
import { useTheme } from './useTheme';
import type { RouterOutput } from '../types/trpc';

type FaviconData = NonNullable<RouterOutput['logo']['getActiveLogo']>;

export const useFavicon = () => {
  const trpc = useTrpc();
  const { isDark } = useTheme();
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
    if (!favicon.value) return defaultFavicon;
    
    // For favicon, usually we only use lightModeUrl, but check both
    const faviconUrl = favicon.value.lightModeUrl || favicon.value.darkModeUrl;
    return faviconUrl || defaultFavicon;
  });

  // Set favicon in document head
  const setFavicon = (url: string) => {
    // Determine correct MIME type based on file extension
    const getMimeType = (faviconUrl: string) => {
      if (faviconUrl.endsWith('.svg')) return 'image/svg+xml';
      if (faviconUrl.endsWith('.png')) return 'image/png';
      if (faviconUrl.endsWith('.gif')) return 'image/gif';
      return 'image/x-icon'; // Default for .ico files
    };

    const mimeType = getMimeType(url);

    useHead({
      link: [
        {
          rel: 'icon',
          type: mimeType,
          href: url
        },
        {
          rel: 'shortcut icon',
          type: mimeType,
          href: url
        },
        // Apple touch icon (for iOS devices)
        {
          rel: 'apple-touch-icon',
          sizes: '180x180',
          href: url
        },
        // Various favicon sizes for different devices
        {
          rel: 'icon',
          type: 'image/png',
          sizes: '32x32',
          href: url
        },
        {
          rel: 'icon',
          type: 'image/png',
          sizes: '16x16',
          href: url
        }
      ]
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
      // On server, set default favicon immediately for SSR
      setFavicon(defaultFavicon);
    }
    
    // Fetch favicon from API (works on both server and client)
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
