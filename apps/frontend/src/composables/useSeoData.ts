interface SeoMeta {
  title: string;
  description: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogUrl: string;
  twitterCard: string;
  keywords?: string;
  canonical?: string;
}

/**
 * Composable to fetch and apply SEO meta data
 * Optimized for SSR and client-side navigation
 */
export const useSeoData = () => {
  const route = useRoute();

  // Reactive state for SEO data
  const seoMeta = ref<SeoMeta | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  // Default fallback meta using runtime config
  const config = useRuntimeConfig();
  const siteName = config.public.siteName || 'Ecommerce Web';

  const defaultMeta: SeoMeta = {
    title: `${siteName} - Trang thương mại điện tử`,
    description: `Khám phá các sản phẩm chất lượng cao tại ${siteName}. Mua sắm online dễ dàng, giao hàng nhanh chóng.`,
    ogTitle: `${siteName} - Trang thương mại điện tử`,
    ogDescription: `Khám phá các sản phẩm chất lượng cao tại ${siteName}. Mua sắm online dễ dàng, giao hàng nhanh chóng.`,
    ogImage: '/images/og-default.jpg',
    ogUrl: '',
    twitterCard: 'summary_large_image',
    keywords: 'thương mại điện tử, mua sắm online, sản phẩm chất lượng',
    canonical: ''
  };

  // Fetch SEO data from server API
  const fetchSeoData = async (path?: string, customUrl?: string) => {
    loading.value = true;
    error.value = null;

    try {
      const currentPath = path || route.path;
      const currentUrl = customUrl || (process.client
        ? window.location.href
        : `${config.public.siteUrl}${route.fullPath}`);

      const response = await $fetch<{ success: boolean; data: SeoMeta }>('/api/seo-meta', {
        params: {
          path: currentPath,
          url: currentUrl
        }
      });

      if (!response.data) throw new Error('No SEO data received');

      const data = response.data;

      seoMeta.value = {
        ...data,
        ogUrl: data.ogUrl || currentUrl,
        canonical: data.canonical || currentUrl
      };

      return seoMeta.value;
    } catch (err) {
      console.error('Failed to fetch SEO meta:', err);
      error.value = 'Failed to load SEO data';

      // Use default meta on error
      const currentUrl = customUrl || (process.client
        ? window.location.href
        : `${config.public.siteUrl}${route.fullPath}`);

      seoMeta.value = {
        ...defaultMeta,
        ogUrl: currentUrl,
        canonical: currentUrl
      };

      return seoMeta.value;
    } finally {
      loading.value = false;
    }
  };

  // Apply SEO meta to page head
  const applySeoMeta = (meta?: SeoMeta) => {
    const metaToApply = meta || seoMeta.value;
    if (!metaToApply) return;

    // Set page title and meta tags
    useHead({
      title: metaToApply.title,
      meta: [
        { name: 'description', content: metaToApply.description },
        { name: 'keywords', content: metaToApply.keywords || '' },
        { property: 'og:title', content: metaToApply.ogTitle || metaToApply.title },
        { property: 'og:description', content: metaToApply.ogDescription || metaToApply.description },
        { property: 'og:image', content: metaToApply.ogImage || '/images/og-default.jpg' },
        { property: 'og:url', content: metaToApply.ogUrl },
        { name: 'twitter:title', content: metaToApply.ogTitle || metaToApply.title },
        { name: 'twitter:description', content: metaToApply.ogDescription || metaToApply.description },
        { name: 'twitter:image', content: metaToApply.ogImage || '/images/og-default.jpg' }
      ],
      link: [
        { rel: 'canonical', href: metaToApply.canonical || metaToApply.ogUrl }
      ]
    });

    // Use useSeoMeta for additional optimization
    useSeoMeta({
      title: metaToApply.title,
      description: metaToApply.description,
      ogTitle: metaToApply.ogTitle || metaToApply.title,
      ogDescription: metaToApply.ogDescription || metaToApply.description,
      ogImage: metaToApply.ogImage,
      ogUrl: metaToApply.ogUrl,
      twitterTitle: metaToApply.ogTitle || metaToApply.title,
      twitterDescription: metaToApply.ogDescription || metaToApply.description,
      twitterImage: metaToApply.ogImage
    });
  };

  // Initialize SEO data for current route
  const initializeSeo = async (customPath?: string, customUrl?: string) => {
    const meta = await fetchSeoData(customPath, customUrl);
    applySeoMeta(meta);
    return meta;
  };

  // Update SEO for specific content (useful for dynamic content)
  const updateSeo = (updates: Partial<SeoMeta>) => {
    if (!seoMeta.value) return;

    const updatedMeta = {
      ...seoMeta.value,
      ...updates
    };

    seoMeta.value = updatedMeta;
    applySeoMeta(updatedMeta);
  };

  return {
    seoMeta: readonly(seoMeta),
    loading: readonly(loading),
    error: readonly(error),
    fetchSeoData,
    applySeoMeta,
    initializeSeo,
    updateSeo
  };
}; 