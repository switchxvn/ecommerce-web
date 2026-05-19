import type { inferRouterOutputs } from '@trpc/server';
import type { AppRouter } from '@backend/modules/trpc/routers';
import { defineNuxtRouteMiddleware, useState } from 'nuxt/app';
import { nextTick } from 'vue';
import { useGTM } from '../composables/useGTM';
import { usePageSeo } from '../composables/usePageSeo';
import { getRouteIndexPolicy, inferSeoRoute, normalizePath, shouldUseCmsSeoForRoute, type SeoLocale } from '../utils/seo';
import { useTrpc } from '../composables/useTrpc';

type RouterOutput = inferRouterOutputs<AppRouter>;
type SeoOutput = RouterOutput['seo']['getSeoByPath'];

const defaultSeo = {
  title: 'Xe Nâng MGA FORKLIFT Động Cơ ISUZU - Bền Bỉ, Mạnh Mẽ, Tiết Kiệm Nhiên Liệu Hàng Đầu',
  description:
    'Xe nâng MGA Forklift động cơ ISUZU - giải pháp nâng hạ hiệu suất cao, bền bỉ, mạnh mẽ và tiết kiệm nhiên liệu hàng đầu. Phân phối chính hãng, giá tốt, bảo hành toàn quốc.',
  keywords:
    'xe nang MGA, xe nang isuzu, xe nang dien, xe nang dau, gia xe nang',
  ogTitle: 'Xe Nâng MGA FORKLIFT Động Cơ ISUZU - Bền Bỉ, Mạnh Mẽ, Tiết Kiệm Nhiên Liệu Hàng Đầu',
  ogDescription:
    'Xe nâng MGA Forklift động cơ ISUZU - giải pháp nâng hạ hiệu suất cao, bền bỉ, mạnh mẽ và tiết kiệm nhiên liệu hàng đầu. Phân phối chính hãng, giá tốt, bảo hành toàn quốc.',
  ogImage: '/images/og-default.jpg',
} as const;

export default defineNuxtRouteMiddleware(async (to) => {
  if (shouldSkipRoute(to.path)) {
    return;
  }

  const normalizedPath = normalizePath(to.path);
  const routeMatch = inferSeoRoute(normalizedPath);
  const routePolicy = getRouteIndexPolicy(normalizedPath);
  const routeLocale: SeoLocale = routeMatch?.locale || 'vi';
  const seoState = useState<SeoOutput | null>(`seo-${normalizedPath}`, () => null);
  const shouldLoadCmsSeo = shouldUseCmsSeoForRoute(routeMatch?.key);

  try {
    if (!shouldLoadCmsSeo) {
      seoState.value = null;
    } else if (process.server) {
      seoState.value = await fetchSeoDataFromServer(normalizedPath);
    } else if (!seoState.value) {
      seoState.value = await fetchSeoDataFromClient(normalizedPath);
    }
  } catch (error) {
    console.warn('SEO middleware: failed to load CMS SEO, using defaults.', error);
  }

  const seo = transformSeoData(seoState.value);

  usePageSeo({
    title: seo.title,
    description: seo.description,
    keywords: seo.keywords,
    ogTitle: seo.ogTitle,
    ogDescription: seo.ogDescription,
    image: seo.ogImage,
    canonicalUrl: seo.canonicalUrl,
    currentPath: normalizedPath,
    locale: routeLocale,
    routeKey: routeMatch?.key,
    robots: routePolicy.robots,
  });

  if (process.client) {
    await handleClientSideSEO(normalizedPath);
  }
});

function shouldSkipRoute(path: string): boolean {
  return Boolean(
    path.startsWith('/_nuxt/') ||
      path.startsWith('/_ipx/') ||
      path.match(/\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot|json|xml|txt)$/),
  );
}

async function fetchSeoDataFromServer(path: string): Promise<SeoOutput | null> {
  const response = await $fetch<{ success: boolean; data: SeoOutput | null }>('/api/seo-meta', {
    params: { path },
  });

  return response?.success ? response.data : null;
}

async function fetchSeoDataFromClient(path: string): Promise<SeoOutput | null> {
  try {
    const trpc = useTrpc();
    return await trpc.seo.getSeoByPath.query(path);
  } catch (error) {
    console.warn('SEO middleware: client fetch failed, using fallback.', error);
    return null;
  }
}

function transformSeoData(result: SeoOutput | null) {
  if (!result) {
    return {
      ...defaultSeo,
      canonicalUrl: null,
      robotsTxt: 'index,follow',
    };
  }

  return {
    title: result.title || defaultSeo.title,
    description: result.description || defaultSeo.description,
    keywords: result.keywords || defaultSeo.keywords,
    ogTitle: result.ogTitle || result.title || defaultSeo.ogTitle,
    ogDescription: result.ogDescription || result.description || defaultSeo.ogDescription,
    ogImage: result.ogImage || defaultSeo.ogImage,
    canonicalUrl: result.canonicalUrl || null,
    robotsTxt: result.robotsTxt || 'index,follow',
  };
}

async function handleClientSideSEO(path: string) {
  if (!process.client || typeof window === 'undefined') {
    return;
  }

  const currentTitle = document?.title;

  nextTick(() => {
    try {
      const { trackPageView } = useGTM();
      trackPageView(path, currentTitle);
    } catch (error) {
      console.error('SEO middleware: GTM tracking error:', error);
    }
  });
}
