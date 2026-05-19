import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useTrpc } from './useTrpc';
import type { Post } from '@ew/shared';
import { useLocalization } from './useLocalization';

export function usePost() {
  const route = useRoute();
  const router = useRouter();
  const trpc = useTrpc();
  const { locale } = useLocalization();

  /**
   * Fetch post by slug
   */
  async function fetchPost(postSlug: string) {
    try {
      const result = await trpc.post.bySlugWithAuthorAndTags.query({
        slug: postSlug
      });

      // Sau khi fetch được data, set locale dựa trên translation có slug match
      if (result) {
        const matchedTranslation = result.translations?.find(t => t.slug === postSlug);
        if (matchedTranslation && matchedTranslation.locale !== locale.value) {
          locale.value = matchedTranslation.locale;
        }
      }

      return result;
    } catch (err: any) {
      console.error('Failed to fetch post:', err);
      throw new Error(err.message || 'Có lỗi xảy ra khi tải chi tiết bài viết');
    }
  }

  /**
   * Get current translation based on locale
   */
  function getCurrentTranslation(post: Post | null) {
    if (!post?.translations || post.translations.length === 0) {
      return null;
    }
    // Ưu tiên tìm translation có slug match với URL hiện tại
    const slug = route.params.slug as string;
    const matchedTranslation = post.translations.find(t => t.slug === slug);
    if (matchedTranslation) return matchedTranslation;

    // Fallback về locale hiện tại nếu không tìm thấy
    return post.translations.find(t => t.locale === locale.value);
  }

  /**
   * Get translation by locale
   */
  function getTranslationByLocale(post: Post | null, targetLocale: string = locale.value) {
    if (!post?.translations || post.translations.length === 0) {
      return null;
    }
    return post.translations.find(t => t.locale === targetLocale) || post.translations[0];
  }

  /**
   * Get post URL
   */
  function getPostUrl(post: Post, targetLocale: string = locale.value) {
    const translation = getTranslationByLocale(post, targetLocale);
    if (!translation?.slug) return '';
    
    return targetLocale === 'vi' 
      ? `/bai-viet/${translation.slug}`
      : `/posts/${translation.slug}`;
  }

  /**
   * Handle locale change for post
   */
  async function handleLocaleChange(post: Post | null, newLocale: string) {
    if (!post) return;

    // Tìm translation cho locale mới
    const newTranslation = post.translations?.find(t => t.locale === newLocale);
    if (newTranslation?.slug) {
      // Cập nhật URL với slug mới
      const newPath = newLocale === 'vi' 
        ? `/bai-viet/${newTranslation.slug}`
        : `/posts/${newTranslation.slug}`;
      
      // Chỉ thay đổi route, không fetch lại data
      await router.replace(newPath);
    }
  }

  /**
   * Get base URL for SEO
   */
  function getBaseUrl(): string {
    if (process.server) {
      try {
        const config = useRuntimeConfig();
        if (config.public && config.public.siteUrl && typeof config.public.siteUrl === 'string') {
          return config.public.siteUrl;
        }
        const reqURL = useRequestURL();
        return `${reqURL.protocol}//${reqURL.host}`;
      } catch (e) {
        console.error('Error in server URL setup:', e);
        return '';
      }
    }
    return window.location.origin;
  }

  /**
   * Get canonical URL for post
   */
  function getCanonicalUrl(translation: any, baseUrl: string): string {
    if (!translation) return '';
    
    // Nếu bài viết có canonicalUrl, sử dụng nó
    if (translation.canonicalUrl) {
      return translation.canonicalUrl;
    }
    
    // Nếu không, tạo canonical URL từ slug
    const postSlug = translation.slug;
    return `${baseUrl}/bai-viet/${postSlug}`;
  }

  return {
    fetchPost,
    getCurrentTranslation,
    getTranslationByLocale,
    getPostUrl,
    handleLocaleChange,
    getBaseUrl,
    getCanonicalUrl
  };
}
