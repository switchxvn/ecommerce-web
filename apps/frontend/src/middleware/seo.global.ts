import type { inferRouterOutputs } from '@trpc/server';
import type { AppRouter } from '../../../backend/src/modules/trpc/trpc.router';
import { useTrpc } from '../composables/useTrpc';
import { defineNuxtRouteMiddleware, useRuntimeConfig, useState, useRequestURL } from 'nuxt/app';

import type { RouteLocationNormalized } from 'vue-router';
import { useGTM } from '../composables/useGTM';
import { nextTick } from 'vue';

type RouterOutput = inferRouterOutputs<AppRouter>;
type SeoOutput = RouterOutput['seo']['getSeoByPath'];

const defaultSeo = {
  title: 'Xe Nâng MGA FORKLIFT Động Cơ ISUZU – Bền Bỉ, Mạnh Mẽ, Tiết Kiệm Nhiên Liệu Hàng Đầu',
  description: 'Xe nâng MGA Forklift động cơ ISUZU – giải pháp nâng hạ hiệu suất cao, bền bỉ, mạnh mẽ và tiết kiệm nhiên liệu hàng đầu. Phân phối chính hãng, giá tốt, bảo hành toàn quốc.',
  keywords: 'Xe Nâng MGA FORKLIFT Động Cơ ISUZU – Bền Bỉ, Mạnh Mẽ, Tiết Kiệm Nhiên Liệu Hàng Đầu',
  ogTitle: 'Xe Nâng MGA FORKLIFT Động Cơ ISUZU – Bền Bỉ, Mạnh Mẽ, Tiết Kiệm Nhiên Liệu Hàng Đầu',
  ogDescription: 'Xe nâng MGA Forklift động cơ ISUZU – giải pháp nâng hạ hiệu suất cao, bền bỉ, mạnh mẽ và tiết kiệm nhiên liệu hàng đầu. Phân phối chính hãng, giá tốt, bảo hành toàn quốc.',
  ogImage: '/images/og-default.jpg',
  robotsTxt: 'index, follow',
  canonicalUrl: ''
} as const;

/**
 * Get base URL in a safe way that works in all contexts (Nuxt SSR best practice)
 * - On server: use useRequestURL() to get the real request origin (see Nuxt docs)
 * - On a client: use window.location as before
 */
function getSafeBaseUrl(): string {
  if (process.server) {
    try {
      // Debug: log env and runtimeConfig in SSR
      const config = useRuntimeConfig();
      // eslint-disable-next-line no-console
      console.log('[SEO][SSR] runtimeConfig.public.apiBase:', config.public.apiBase);
      // eslint-disable-next-line no-console
      console.log('[SEO][SSR] process.env.NUXT_PUBLIC_API_BASE:', process.env.NUXT_PUBLIC_API_BASE);
      const url = useRequestURL();
      return url.origin;
    } catch {
      // Fallback if no request context (should rarely happen)
      return 'https://yourdomain.com';
    }
  }
  // Client-side: try various methods
  try {
    if (typeof window !== 'undefined' && window.location) {
      const origin = window.location.origin;
      if (origin.includes(':4200')) {
        return 'http://localhost:3000';
      }
      return origin;
    }
  } catch {
    // Fallback if window access fails
  }
  // Try runtime config as a last resort on a client
  try {
    const config = useRuntimeConfig();
    return config.public.apiBase?.replace('/api', '') || 'http://localhost:3000';
  } catch {
    return 'http://localhost:3000';
  }
}

// Use tRPC type instead of custom interface
// interface SeoMeta will be replaced by SeoOutput from tRPC

export default defineNuxtRouteMiddleware(async (to) => {
  if (shouldSkipRoute(to.path)) {
    return;
  }

  const normalizedPath = normalizePath(to.path);
  const seoState = useState<SeoOutput | null>(`seo-${normalizedPath}`, () => null);

  try {
    if (process.server) {
      seoState.value = await fetchSeoDataFromServer(normalizedPath);
    } else if (!seoState.value) {
      seoState.value = await fetchSeoDataFromClient(normalizedPath);
    }

    const seo = transformSeoData(seoState.value);
    applySeoMeta(seo, normalizedPath);

    if (process.client) {
      await handleClientSideSEO(normalizedPath);
    }
  } catch (error) {
    console.warn('SEO middleware: Failed to load SEO data, using defaults:', error);
    applySeoMeta(transformSeoData(null), normalizedPath);
  }
});

/**
 * Handle client-side tracking and hydration
 */
async function handleClientSideSEO(path: string) {
  try {
    // Check if we're in a valid client context
    if (!process.client || typeof window === 'undefined') {
      return;
    }

    // Get the current SEO state (should be hydrated from the server)
    const currentTitle = document?.title;

    // Track page view for GTM
    nextTick(() => {
      try {
        const { trackPageView } = useGTM();
        trackPageView(path, currentTitle);
      } catch (gtmError) {
        console.error('SEO Middleware: GTM tracking error:', gtmError);
      }
    });

  } catch (error) {
    console.error('SEO Middleware: Client-side error:', error);
  }
}

function shouldSkipRoute(path: RouteLocationNormalized['path']): boolean {
  return Boolean(
    path.startsWith('/api/') ||
    path.startsWith('/internal-api/') ||
    path.startsWith('/_nuxt/') ||
    path.startsWith('/static/') ||
    path.startsWith('/images/') ||
    path.startsWith('/favicon') ||
    path.match(/\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot|json|xml|txt)$/),
  );
}

function normalizePath(path: string): string {
  if (!path) {
    return '/';
  }

  if (path.length > 1 && path.endsWith('/')) {
    return path.slice(0, -1);
  }

  return path;
}

async function fetchSeoDataFromServer(path: string): Promise<SeoOutput | null> {
  try {
    const response = await $fetch<{ success: boolean; data: SeoOutput | null }>('/api/seo-meta', {
      params: { path },
    });

    if (response?.success && response.data) {
      return response.data;
    }
  } catch (error) {
    console.warn('SEO Middleware: Server fetch failed, using fallback', error);
  }

  return null;
}

async function fetchSeoDataFromClient(path: string): Promise<SeoOutput | null> {
  try {
    const trpc = useTrpc();
    return await trpc.seo.getSeoByPath.query(path);
  } catch (error) {
    console.warn('SEO Middleware: Client fetch failed, using fallback', error);
    return null;
  }
}

/**
 * Transform SEO data with fallbacks
 */
function transformSeoData(result: SeoOutput | null): {
  title: string;
  description: string;
  keywords: string;
  ogTitle: string;
  ogDescription: string;
  ogImage: string;
  robotsTxt: string;
  canonicalUrl: string;
} {
  if (!result) return { ...defaultSeo };

  return {
    title: result.title || defaultSeo.title,
    description: result.description || defaultSeo.description,
    keywords: result.keywords || defaultSeo.keywords,
    ogTitle: result.ogTitle || result.title || defaultSeo.ogTitle,
    ogDescription: result.ogDescription || result.description || defaultSeo.ogDescription,
    ogImage: result.ogImage || defaultSeo.ogImage,
    robotsTxt: result.robotsTxt || defaultSeo.robotsTxt,
    canonicalUrl: result.canonicalUrl || ''
  };
}

/**
 * Apply SEO meta-tags - CRITICAL for SSR
 */
function applySeoMeta(seo: {
  title: string;
  description: string;
  keywords: string;
  ogTitle: string;
  ogDescription: string;
  ogImage: string;
  robotsTxt: string;
  canonicalUrl: string;
}, path: string) {
  try {
    // Get base URL using the safe method
    const baseUrl = getSafeBaseUrl();

    // Build canonical URL
    const canonicalUrl = seo.canonicalUrl || `${baseUrl}${path}`;
    const fullOgImage = seo.ogImage.startsWith('http') ? seo.ogImage : `${baseUrl}${seo.ogImage}`;

    // Apply SEO meta-tags - wrap in try-catch for safety
    try {
      useSeoMeta({
        title: seo.title,
        ogTitle: seo.ogTitle,
        description: seo.description,
        ogDescription: seo.ogDescription,
        ogImage: fullOgImage,
        keywords: seo.keywords,
        robots: seo.robotsTxt,
        ogUrl: canonicalUrl,
        ogType: 'website',
        ogSiteName: 'Website',
        twitterCard: 'summary_large_image',
        twitterTitle: seo.ogTitle,
        twitterDescription: seo.ogDescription,
        twitterImage: fullOgImage,
      });
    } catch (seoMetaError) {
      console.warn('SEO Middleware: useSeoMeta failed:', seoMetaError);
    }

    // Set document head - wrap in try-catch for safety
    try {
      useHead({
        title: seo.title,
        htmlAttrs: {
          lang: 'vi'
        },
        link: [
          { rel: 'canonical', href: canonicalUrl }
        ],
        meta: [
          { name: 'format-detection', content: 'telephone=no' },
          { property: 'og:locale', content: 'vi_VN' },
          { name: 'revisit-after', content: '1 days' },
          { name: 'author', content: 'Website' },
        ]
      });
    } catch (headError) {
      console.warn('SEO Middleware: useHead failed:', headError);
    }
  } catch (error) {
    console.error('SEO Middleware: Error applying SEO meta:', error);
  }
}
