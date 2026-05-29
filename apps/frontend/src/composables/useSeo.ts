import type { inferRouterOutputs } from '@trpc/server';
import type { AppRouter } from '@backend/modules/trpc/routers';
import { useTrpc } from './useTrpc';
import { useRoute } from 'vue-router';
import { ref, readonly } from 'vue';
import { useSeoMeta } from 'nuxt/app';

type RouterOutput = inferRouterOutputs<AppRouter>;
type SeoOutput = RouterOutput['seo']['getSeoByPath'];

export function useSeo() {
  const trpc = useTrpc();
  const route = useRoute();
  const seoData = ref<SeoOutput | null>(null);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  // Kiểm tra xem đường dẫn có phải là trang chi tiết không
  const isDetailPage = (path: string): boolean => {
    const detailPagePatterns = [
      /^\/posts\/[^\/]+$/,  // Trang chi tiết bài viết: /posts/slug
      /^\/products\/[^\/]+$/,  // Trang chi tiết sản phẩm: /products/slug
      // Thêm các mẫu URL khác nếu cần
    ];
    
    return detailPagePatterns.some(pattern => pattern.test(path));
  };

  const getSeoData = async (path: string = route.path) => {
    // Nếu là trang chi tiết, không gọi API
    if (isDetailPage(path)) {
      return null;
    }
    
    isLoading.value = true;
    error.value = null;
    try {
      const data = await trpc.seo.getSeoByPath.query(path);
      seoData.value = data;
      return data;
    } catch (err) {
      console.error('Error fetching SEO data:', err);
      error.value = err instanceof Error ? err.message : 'Failed to fetch SEO data';
      return null;
    } finally {
      isLoading.value = false;
    }
  };

  const updateMetaTags = (data: SeoOutput) => {
    useSeoMeta({
      title: data.title || undefined,
      description: data.description || undefined,
      // Open Graph
      ogTitle: data.ogTitle || data.title || undefined,
      ogDescription: data.ogDescription || data.description || undefined,
      ogImage: data.ogImage || undefined,
      // Keywords
      keywords: data.keywords || undefined,
      // Robots
      robots: data.robotsTxt || undefined,
      // Canonical
      ...(data.canonicalUrl ? { canonical: data.canonicalUrl } : {}),
    });
  };

  // Fetch SEO data for current route
  const refreshSeoData = async () => {
    // Nếu là trang chi tiết, không gọi API
    if (isDetailPage(route.path)) {
      return null;
    }
    
    const data = await getSeoData();
    if (data) {
      updateMetaTags(data);
    }
    return data;
  };

  return {
    seoData: readonly(seoData),
    isLoading: readonly(isLoading),
    error: readonly(error),
    getSeoData,
    updateMetaTags,
    refreshSeoData,
    isDetailPage,
  };
}
