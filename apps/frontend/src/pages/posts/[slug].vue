<script setup lang="ts">
// Auto-imported by Nuxt 3;
import { useRoute, useRouter } from 'vue-router';
import { useTrpc } from '~/composables/useTrpc';
import { computed, ref, watch, onMounted, onBeforeMount } from 'vue';
import RelatedPosts from '~/components/common/RelatedPosts.vue';
import TableOfContents from '~/components/common/TableOfContents.vue';
import PostDetailSidebar from '~/components/sidebar/PostDetailSidebar.vue';
import Breadcrumb from '~/components/common/Breadcrumb.vue';
import AppImage from '~/components/ui/AppImage.vue';
import Icon from '~/components/ui/Icon.vue';
import PostComments from '~/components/post/PostComments.vue';
import { useI18n } from 'vue-i18n';
import type { Post, Profile, Author, Tag } from '@ew/shared';
import { usePost } from '~/composables/usePost';
import { formatDateTime } from '~/utils/date';
import { getAuthorName as resolveAuthorName } from '~/utils/author';
import { usePageSeo } from '~/composables/usePageSeo';
import { buildArticleSchema, resolveSeoCanonicalUrl } from '~/utils/seo';
import { formatFullPostContent } from '~/utils/contentFormatter';
import { getCategoryDetailRoute } from '~/utils/routes';

// Định nghĩa alias cho URL tiếng Việt và tiếng Anh
definePageMeta({
  layout: "default"
});

const route = useRoute();
const router = useRouter();
const { locale } = useI18n();
const slug = route.params.slug as string;
const siteUrl = useRuntimeConfig().public.siteUrl;
const siteName = useRuntimeConfig().public.siteName;
const siteLogoUrl = useRuntimeConfig().public.siteLogoUrl as string | undefined;

const { 
  fetchPost, 
  getCurrentTranslation, 
  handleLocaleChange,
} = usePost();

// Sử dụng useAsyncData thay vì useLazyAsyncData để hỗ trợ SSR tốt hơn
const { data: post, pending: loading, error, refresh } = await useAsyncData(
  `post-${slug}`,
  () => fetchPost(slug)
);

// Tạo các computed properties để truy cập dữ liệu post một cách an toàn
const postData = computed(() => post.value || {} as Post);
const currentTranslation = computed(() => getCurrentTranslation(post.value));

const postTitle = computed(() => currentTranslation.value?.title || '');
const postContent = computed(() => currentTranslation.value?.content || '');
const postShortDescription = computed(() => currentTranslation.value?.shortDescription || '');
const postCreatedAt = computed(() => postData.value.createdAt?.toString() || '');
const postUpdatedAt = computed(() => postData.value.updatedAt?.toString() || '');
const postId = computed(() => postData.value.id || 0);
const postThumbnail = computed(() => postData.value.thumbnail || '');
const postOgImage = computed(() => currentTranslation.value?.ogImage || '');
const postMetaKeywords = computed(() => currentTranslation.value?.metaKeywords || '');
const postTags = computed(() => postData.value.tags || []);
const postCategories = computed(() => postData.value.categories || []);
const postContentId = computed(() => `post-content-${postId.value || 'detail'}`);
const formattedPostContent = computed(() => formatFullPostContent(postContent.value));
const hasTableOfContents = computed(() => /<h2\b[^>]*>.*?<\/h2>/i.test(formattedPostContent.value));

function toIsoDateTime(value: string | Date | undefined | null): string | undefined {
  if (!value) {
    return undefined;
  }

  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return undefined;
  }

  return date.toISOString();
}

const postPublishedIso = computed(() => toIsoDateTime(postData.value.createdAt));
const postModifiedIso = computed(() => toIsoDateTime(postData.value.updatedAt));
const articleImages = computed(() => {
  const images = [currentTranslation.value?.ogImage, postThumbnail.value]
    .filter((image): image is string => Boolean(image))
    .map((image) => image.trim())
    .filter(Boolean);

  return [...new Set(images)];
});

const authorName = computed(() => {
  return resolveAuthorName(postData.value.author);
});

const authorInfo = computed(() => {
  return {
    name: authorName.value,
    bio: postData.value.author?.profile?.bio || null
  };
});

const authorInitial = computed(() => {
  const firstCharacter = authorName.value.trim().charAt(0);
  return firstCharacter ? firstCharacter.toUpperCase() : '?';
});

// Watch locale changes to update content
watch(locale, async (newLocale) => {
  await handleLocaleChange(post.value, newLocale);
});

// Xử lý đường dẫn dựa trên locale
const getLocalizedPath = () => {
  return locale.value === 'vi' ? '/bai-viet' : '/posts';
};

const postPrimaryCategory = computed(() => {
  const category = postCategories.value[0];
  const translation = category?.translations?.find((item: any) => item.locale === locale.value)
    || category?.translations?.[0];

  if (!category || !translation?.name || !translation?.slug) {
    return null;
  }

  return {
    name: translation.name,
    to: getCategoryDetailRoute(String(translation.slug), locale.value),
  };
});

// Breadcrumb items with localized paths
const breadcrumbItems = computed(() => [
  {
    label: postPrimaryCategory.value?.name || (locale.value === 'vi' ? 'Bài viết' : 'Posts'),
    to: postPrimaryCategory.value?.to || getLocalizedPath()
  },
  {
    label: postTitle.value || (locale.value === 'vi' ? 'Chi tiết bài viết' : 'Post Detail')
  }
]);

function goBack() {
  router.back();
}

const postSlugByLocale = computed(() => ({
  vi: postData.value.translations?.find((translation) => translation.locale === 'vi')?.slug,
  en: postData.value.translations?.find((translation) => translation.locale === 'en')?.slug,
}));

const resolvedCanonicalUrl = computed(() =>
  resolveSeoCanonicalUrl({
    siteUrl,
    currentPath: route.path,
    locale: locale.value === 'en' ? 'en' : 'vi',
    routeKey: 'post-detail',
    slugByLocale: postSlugByLocale.value,
    candidate: currentTranslation.value?.canonicalUrl || null,
  }),
);

usePageSeo({
  title: computed(() => currentTranslation.value?.metaTitle || postTitle.value || 'Bài viết'),
  description: computed(() => currentTranslation.value?.metaDescription || postShortDescription.value || (postContent.value ? postContent.value.substring(0, 160) : '') || ''),
  keywords: computed(() => currentTranslation.value?.metaKeywords || ''),
  ogTitle: computed(() => currentTranslation.value?.ogTitle || postTitle.value || ''),
  ogDescription: computed(() => currentTranslation.value?.ogDescription || postShortDescription.value || (postContent.value ? postContent.value.substring(0, 160) : '') || ''),
  image: computed(() => currentTranslation.value?.ogImage || postThumbnail.value || ''),
  ogType: 'article',
  canonicalUrl: computed(() => currentTranslation.value?.canonicalUrl || null),
  currentPath: computed(() => route.path),
  locale: computed(() => (locale.value === 'en' ? 'en' : 'vi')),
  routeKey: 'post-detail',
  slugByLocale: postSlugByLocale,
  breadcrumbs: computed(() => [
    { name: locale.value === 'vi' ? 'Trang chủ' : 'Home', item: '/' },
    { name: postPrimaryCategory.value?.name || (locale.value === 'vi' ? 'Bài viết' : 'Posts'), item: postPrimaryCategory.value?.to || getLocalizedPath() },
    { name: postTitle.value || 'Post' },
  ]),
  schemas: computed(() => [
    buildArticleSchema({
      headline: postTitle.value || 'Bài viết',
      description: postShortDescription.value || '',
      url: resolvedCanonicalUrl.value,
      image: articleImages.value,
      datePublished: postPublishedIso.value,
      dateModified: postModifiedIso.value,
      authorName: authorName.value,
      publisherName: siteName || undefined,
      publisherLogoUrl: siteLogoUrl || undefined,
      inLanguage: locale.value === 'en' ? 'en' : 'vi',
    }),
  ]),
});
</script>

<template>
  <div class="post-detail">
    <div class="post-detail__container">
      <!-- Breadcrumb thay thế cho nút quay lại -->
      <Breadcrumb 
        :items="breadcrumbItems" 
        variant="default" 
        separator="/"
        :showHomeIcon="true"
      />
      
      <!-- Loading state -->
      <div v-if="loading" class="post-detail__loading">
        <div class="post-detail__loading-spinner"></div>
      </div>
      
      <!-- Error state -->
      <div v-else-if="error" class="post-detail__error w-full">
        <div class="post-detail__error-background">
          <div class="post-detail__error-background-shape shape-1"></div>
          <div class="post-detail__error-background-shape shape-2"></div>
          <div class="post-detail__error-background-shape shape-3"></div>
        </div>
        <div class="post-detail__error-content">
          <div class="post-detail__error-illustration">
            <div class="post-detail__error-emoji">🐼</div>
            <div class="post-detail__error-circle"></div>
          </div>
          <h2 class="post-detail__error-title">
            {{ locale === 'vi' ? 'Rất tiếc, đã có lỗi xảy ra' : 'Sorry, an error occurred' }}
          </h2>
          <p class="post-detail__error-message">
            {{ locale === 'vi' 
              ? 'Chúng tôi không thể tải bài viết lúc này. Vui lòng thử lại sau hoặc xem các bài viết khác.' 
              : 'We could not load the post at this time. Please try again later or view other posts.'
            }}
          </p>
          <div class="post-detail__error-actions">
            <button 
              @click="() => refresh()" 
              class="post-detail__error-button primary"
            >
              <Icon name="RefreshCw" :size="20" class="mr-2" />
              {{ locale === 'vi' ? 'Thử lại' : 'Try Again' }}
            </button>
            <NuxtLink 
              :to="getLocalizedPath()"
              class="post-detail__error-button secondary"
            >
              <Icon name="List" :size="20" class="mr-2" />
              {{ locale === 'vi' ? 'Xem bài viết khác' : 'View Other Posts' }}
            </NuxtLink>
          </div>
        </div>
      </div>
      
      <!-- Post content with sidebar -->
      <div v-else-if="post" class="post-detail__content">
        <!-- Main content -->
        <div class="post-detail__main">
          <article class="post-detail__article">
            <!-- Featured image -->
            <div class="post-detail__featured-image">
              <AppImage 
                :src="postThumbnail || postOgImage" 
                :alt="postTitle"
                sizes="(max-width: 768px) 100vw, 900px"
                :priority="true"
                loading="eager"
                fetchpriority="high"
                width="1200"
                height="675"
                class="w-full h-auto rounded-lg"
                :key="postId"
              />
            </div>
            
            <!-- Post header -->
            <div class="post-detail__header">
              <h1 class="post-detail__title">{{ postTitle }}</h1>
              
              <!-- Short Description -->
              <div v-if="postShortDescription" class="post-detail__short-description">
                {{ postShortDescription }}
              </div>
              
              <div class="post-detail__meta">
                <div class="post-detail__author">
                  <div class="post-detail__author-avatar">
                    {{ authorInitial }}
                  </div>
                  <div class="post-detail__author-info">
                    <div class="post-detail__author-name">
                      <Icon name="User" :size="16" class="mr-1" />
                      <span>{{ authorInfo.name }}</span>
                    </div>
                    <div class="post-detail__date">
                      <Icon name="Calendar" :size="16" class="mr-1" />
                      <span>{{ formatDateTime(postCreatedAt) }}</span>
                    </div>
                  </div>
                </div>
                
                <div v-if="postUpdatedAt !== postCreatedAt" class="post-detail__updated">
                  Cập nhật: {{ formatDateTime(postUpdatedAt) }}
                </div>
              </div>
            </div>

            <TableOfContents
              v-if="hasTableOfContents"
              :contentSelector="`#${postContentId}`"
              :offset="100"
              :collapsible="true"
              :defaultCollapsed="false"
              :title="locale === 'vi' ? 'Mục lục bài viết' : 'Table of Contents'"
              class="post-detail__toc"
            />
            
            <!-- Post content -->
            <div class="post-detail__body">
              <div :id="postContentId" class="post-prose first-letter-styled">
                <div v-html="formattedPostContent"></div>
              </div>
            </div>
            
            <!-- Post metadata -->
            <div v-if="postTags.length > 0" class="post-detail__tags">
              <div class="post-detail__tags-title">
                <Icon name="Tag" :size="16" class="mr-1" />
                <span>Tags:</span>
              </div>
              <div class="post-detail__tags-list">
                <NuxtLink 
                  v-for="tag in postTags" 
                  :key="tag.id"
                  :to="`/tags/${tag.slug}`"
                  class="post-detail__tags-item"
                  :style="tag.color ? { backgroundColor: tag.color + '20', borderColor: tag.color } : {}"
                >
                  <span class="tag-hash">#</span>
                  <span>{{ tag.name }}</span>
                </NuxtLink>
              </div>
            </div>
            
            <!-- Comments section -->
            <PostComments v-if="postId" :postId="postId" />
          </article>
          
          <!-- Related posts -->
          <RelatedPosts v-if="post && !loading" :postId="postId" :limit="6" class="mt-8" />
        </div>
        
        <!-- Sidebar -->
        <div class="post-detail__sidebar">
          <PostDetailSidebar 
            :postId="postId" 
          />
        </div>
      </div>
      
      <!-- Not found state -->
      <div v-else class="post-detail__not-found">
        <div class="post-detail__not-found-illustration">
          <div class="post-detail__not-found-emoji animate-bounce">📝</div>
          <div class="post-detail__not-found-circle"></div>
        </div>
        <h2 class="post-detail__not-found-title">
          {{ locale === 'vi' ? 'Không tìm thấy bài viết' : 'Post Not Found' }}
        </h2>
        <p class="post-detail__not-found-message">
          {{ locale === 'vi' 
            ? 'Bài viết bạn đang tìm kiếm không tồn tại hoặc đã bị xóa. Bạn có thể thử tìm kiếm bài viết khác hoặc xem danh sách bài viết mới nhất.' 
            : 'The post you are looking for does not exist or has been removed. You can try searching for another post or view the latest posts.'
          }}
        </p>
        <div class="post-detail__not-found-actions">
          <NuxtLink 
            :to="getLocalizedPath()"
            class="post-detail__not-found-button primary"
          >
            <Icon name="List" :size="20" class="mr-2" />
            {{ locale === 'vi' ? 'Xem tất cả bài viết' : 'View All Posts' }}
          </NuxtLink>
          <NuxtLink 
            to="/"
            class="post-detail__not-found-button secondary"
          >
            <Icon name="Home" :size="20" class="mr-2" />
            {{ locale === 'vi' ? 'Về trang chủ' : 'Back to Home' }}
          </NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.post-detail {
  @apply min-h-screen bg-stone-50 text-gray-900 dark:bg-gray-950 dark:text-gray-100;
}

.post-detail__container {
  @apply mx-auto w-full max-w-7xl px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8;
}

.post-detail__content {
  @apply mt-4 flex flex-col gap-10 lg:mt-8 lg:grid lg:gap-10;
}

.post-detail__main {
  @apply min-w-0;
}

.post-detail__article {
  @apply overflow-hidden bg-transparent shadow-none;
}

.post-detail__featured-image {
  @apply mb-5 overflow-hidden rounded-3xl bg-gray-200 dark:bg-gray-800;
}

.post-detail__header {
  @apply mx-auto max-w-3xl border-b border-black/5 px-1 pb-6 pt-1 dark:border-white/10 sm:px-2 lg:px-0;
}

.post-detail__title {
  @apply text-3xl font-semibold text-gray-950 dark:text-white sm:text-4xl lg:text-5xl;
  line-height: 1.08;
  letter-spacing: -0.03em;
  text-wrap: balance;
}

.post-detail__short-description {
  @apply my-5 max-w-2xl text-base font-normal italic leading-8 text-gray-600 dark:text-gray-300 sm:text-lg;
  font-size: 1.05rem;
}

.post-detail__meta {
  @apply flex flex-col gap-3 border-t border-black/5 pt-4 dark:border-white/10 sm:flex-row sm:items-center sm:justify-between;
}

.post-detail__author {
  @apply min-w-0;
}

.post-detail__author-avatar {
  @apply mr-3 h-10 w-10 text-base sm:h-12 sm:w-12 sm:text-lg;
}

.post-detail__author-info {
  @apply min-w-0;
}

.post-detail__author-name,
.post-detail__date {
  @apply mb-0 gap-1.5 text-sm;
}

.post-detail__author-name {
  @apply font-medium text-gray-800 dark:text-gray-100;
}

.post-detail__date,
.post-detail__updated {
  @apply text-gray-500 dark:text-gray-400;
}

.post-detail__updated {
  @apply text-sm not-italic;
}

.post-detail__body {
  @apply mx-auto max-w-3xl px-1 py-8 sm:px-2 lg:px-0 lg:py-10;
}

.post-detail__toc {
  @apply mx-auto mt-6 w-full max-w-3xl;
}

.post-detail__toc :deep(.table-of-contents) {
  @apply rounded-2xl bg-white dark:bg-gray-900;
}

.post-detail__toc :deep(.table-of-contents__header) {
  @apply items-start gap-4;
}

.post-detail__toc :deep(.table-of-contents__title) {
  @apply mb-0;
}

.post-detail__toc :deep(.table-of-contents__list) {
  @apply mt-4;
}

.post-detail__toc :deep(.table-of-contents__item) {
  @apply m-0;
}

.post-detail__toc :deep(.table-of-contents__link) {
  @apply rounded-none px-0 py-0;
}

.post-detail__toc :deep(.table-of-contents__toggle) {
  @apply mt-0.5;
}

.prose {
  @apply max-w-none text-gray-800 dark:text-gray-100 sm:leading-9;
  font-size: 1.0625rem;
  line-height: 2rem;
}

@media (min-width: 640px) {
  .prose {
    font-size: 1.125rem;
  }
}

.prose p {
  @apply mb-5;
}

.prose a {
  @apply break-words font-medium text-primary-600 underline decoration-primary-300 underline-offset-4 transition-colors hover:text-primary-700 dark:text-primary-300 dark:decoration-primary-500/40 dark:hover:text-primary-200;
}

.prose strong {
  @apply font-semibold text-gray-950 dark:text-white;
}

.prose h1 {
  @apply mt-10 text-3xl font-semibold leading-tight text-gray-950 dark:text-white;
  letter-spacing: -0.02em;
}

.prose h2 {
  @apply mb-4 mt-12 font-semibold leading-tight text-gray-950 dark:text-white sm:text-3xl;
  font-size: 1.65rem;
  letter-spacing: -0.02em;
}

.prose h3 {
  @apply mb-3 mt-10 font-semibold leading-snug text-gray-950 dark:text-white sm:text-2xl;
  font-size: 1.35rem;
}

.prose h4 {
  @apply mb-3 mt-8 text-xl font-semibold leading-snug text-gray-950 dark:text-white;
}

.prose ul,
.prose ol {
  @apply my-5 pl-6;
}

.prose li {
  @apply mb-2.5 pl-1;
}

.prose blockquote {
  @apply my-8 rounded-r-2xl border-l-4 border-primary-300 bg-white/70 py-3 pl-5 pr-4 italic text-gray-600 shadow-sm dark:border-primary-700 dark:bg-gray-900/70 dark:text-gray-300;
}

.prose img,
.prose figure,
.prose table,
.prose pre {
  @apply my-8 overflow-hidden rounded-2xl;
}

.prose pre {
  @apply bg-gray-950 p-4 text-sm leading-7 text-gray-100;
}

.prose hr {
  @apply my-10 border-black/10 dark:border-white/10;
}

/* Sử dụng :deep() để CSS có thể xuyên qua v-html */
.post-prose :deep(p:first-of-type) {
  display: block;
}

.post-prose :deep(p:first-of-type::first-letter) {
  font-size: 3.5em;
  font-weight: 700;
  @apply text-primary-500;
  float: left;
  padding-right: 0.2em;
  line-height: 0.85;
  margin-top: 0.05em;
}

.post-detail__tags {
  @apply mx-auto mt-2 flex max-w-3xl flex-col gap-3 border-t border-black/5 px-1 pb-4 pt-6 dark:border-white/10 sm:px-2 lg:px-0;
}

.post-detail__tags-title {
  @apply mb-0 flex items-center text-sm font-medium uppercase text-gray-500 dark:text-gray-400;
  letter-spacing: 0.14em;
}

.post-detail__tags-list {
  @apply flex flex-wrap gap-2.5;
}

.post-detail__tags-item {
  @apply inline-flex items-center justify-center rounded-full border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 transition-colors duration-200 hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800;
  min-height: 2rem;
}

.tag-hash {
  @apply mr-0.5 text-gray-500 dark:text-gray-400 font-medium;
}

.post-detail__sidebar {
  @apply border-t border-black/5 pt-8 dark:border-white/10 lg:border-t-0 lg:pt-0;
}

.post-detail__sidebar :deep(.post-sidebar) {
  @apply mx-auto max-w-3xl lg:max-w-none;
}

.post-detail__sidebar :deep(.post-sidebar__shell) {
  @apply bg-transparent shadow-none ring-0 lg:rounded-3xl lg:border lg:border-black/5 lg:bg-white lg:shadow-sm dark:lg:border-white/10 dark:lg:bg-gray-900;
}

.post-detail__sidebar :deep(.post-sidebar__section) {
  @apply px-0 py-5 lg:px-5;
}

.post-detail__sidebar :deep(.post-sidebar__title) {
  @apply text-sm font-semibold uppercase text-gray-500 dark:text-gray-400 lg:text-base lg:normal-case lg:tracking-normal;
  letter-spacing: 0.14em;
}

.post-detail__sidebar :deep(hr) {
  @apply mx-0 lg:mx-5;
}

.post-detail__sidebar :deep(.post-sidebar__category) {
  @apply bg-white dark:bg-gray-900;
}

.post-detail__sidebar :deep(.subscribe-section) {
  @apply px-0 lg:px-4;
}

.post-detail__not-found {
  @apply flex flex-col items-center justify-center py-16 px-4 text-center max-w-2xl mx-auto;
}

.post-detail__not-found-illustration {
  @apply relative mb-8;
}

.post-detail__not-found-emoji {
  @apply text-6xl z-10 relative;
  animation: float 3s ease-in-out infinite;
}

.post-detail__not-found-circle {
  @apply absolute w-24 h-24 rounded-full bg-primary-100 dark:bg-primary-900/30 -z-10;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  animation: pulse 2s ease-in-out infinite;
}

.post-detail__not-found-title {
  @apply text-3xl font-bold mb-4 text-gray-900 dark:text-white;
  animation: fadeIn 0.5s ease-in-out;
}

.post-detail__not-found-message {
  @apply text-lg text-gray-600 dark:text-gray-400 mb-8 max-w-lg;
  animation: fadeIn 0.5s ease-in-out 0.2s both;
}

.post-detail__not-found-actions {
  @apply flex flex-col sm:flex-row gap-4 w-full justify-center;
  animation: fadeIn 0.5s ease-in-out 0.4s both;
}

.post-detail__not-found-button {
  @apply flex items-center justify-center px-6 py-3 rounded-lg font-medium transition-all duration-200 min-w-[200px];
}

.post-detail__not-found-button.primary {
  @apply bg-primary-600 hover:bg-primary-700 text-white shadow-lg hover:shadow-xl;
}

.post-detail__not-found-button.secondary {
  @apply bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 
    text-gray-700 dark:text-gray-300;
}

@keyframes float {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}

@keyframes pulse {
  0%, 100% {
    transform: translate(-50%, -50%) scale(1);
    opacity: 0.5;
  }
  50% {
    transform: translate(-50%, -50%) scale(1.1);
    opacity: 0.3;
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.post-detail__error {
  @apply bg-white dark:bg-gray-800 rounded-lg shadow-lg min-h-[calc(100vh-12rem)] relative overflow-hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

.post-detail__error-background {
  @apply absolute inset-0 overflow-hidden opacity-20 dark:opacity-10;
  z-index: 0;
}

.post-detail__error-background-shape {
  @apply absolute rounded-full opacity-50;
  background: linear-gradient(45deg, var(--primary-500), var(--primary-600));
}

.post-detail__error-background-shape.shape-1 {
  width: 600px;
  height: 600px;
  top: -200px;
  right: -200px;
  border-radius: 40% 60% 70% 30% / 40% 50% 60% 50%;
  animation: floating 20s infinite alternate;
}

.post-detail__error-background-shape.shape-2 {
  width: 450px;
  height: 450px;
  bottom: -150px;
  left: -150px;
  border-radius: 60% 40% 30% 70% / 60% 30% 70% 40%;
  animation: floating 15s infinite alternate-reverse;
}

.post-detail__error-background-shape.shape-3 {
  width: 300px;
  height: 300px;
  bottom: 20%;
  right: 20%;
  border-radius: 50% 50% 20% 80% / 25% 80% 20% 75%;
  animation: floating 18s infinite alternate;
}

.post-detail__error-content {
  @apply flex flex-col items-center justify-center py-20 text-center w-full relative;
  z-index: 1;
}

.post-detail__error-illustration {
  @apply relative mb-12;
  transform: scale(1.2);
}

.post-detail__error-emoji {
  @apply text-7xl z-10 relative;
  animation: wobble 3s ease-in-out infinite;
  transform-origin: center bottom;
}

.post-detail__error-circle {
  @apply absolute w-32 h-32 rounded-full bg-green-100/50 dark:bg-green-900/30 -z-10 backdrop-blur-sm;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  animation: pulse 2s ease-in-out infinite;
}

.post-detail__error-title {
  @apply text-4xl font-bold mb-6 text-gray-900 dark:text-white;
  animation: fadeIn 0.5s ease-in-out;
}

.post-detail__error-message {
  @apply text-xl text-gray-600 dark:text-gray-400 mb-12 mx-auto px-4;
  max-width: min(800px, 100% - 2rem);
}

.post-detail__error-actions {
  @apply flex flex-col sm:flex-row gap-6 justify-center items-center w-full px-4;
  max-width: min(600px, 100% - 2rem);
  margin: 0 auto;
}

.post-detail__error-button {
  @apply flex items-center justify-center px-8 py-4 rounded-lg font-medium transition-all duration-200 text-lg backdrop-blur-sm;
  min-width: min(240px, 100% - 2rem);
}

.post-detail__error-button.primary {
  @apply bg-primary-600/90 hover:bg-primary-700 text-white shadow-lg hover:shadow-xl 
    transform hover:-translate-y-0.5 active:translate-y-0;
}

.post-detail__error-button.secondary {
  @apply bg-white/80 dark:bg-gray-800/80 hover:bg-gray-50 dark:hover:bg-gray-700/90
    text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700
    transform hover:-translate-y-0.5 active:translate-y-0;
}

@media (max-width: 1023px) {
  .post-detail__content {
    grid-template-columns: none;
  }

  .post-detail__featured-image {
    margin-left: -1rem;
    margin-right: -1rem;
    border-radius: 0;
  }

  .post-prose :deep(p:first-of-type::first-letter) {
    font-size: 3.1em;
  }
}

@media (max-width: 639px) {
  .post-detail__container {
    padding-bottom: 3rem;
  }

  .post-detail__toc {
    margin-top: 1.25rem;
  }

  .post-detail :deep(.breadcrumb) {
    @apply mb-3;
  }

  .post-detail :deep(.breadcrumb__home),
  .post-detail :deep(.breadcrumb__separator:first-of-type) {
    display: none;
  }
}

@media (min-width: 1024px) {
  .post-detail__content {
    grid-template-columns: minmax(0, 1fr) 320px;
  }

  .post-detail__sidebar :deep(.post-sidebar__title) {
    letter-spacing: normal;
  }
}

@keyframes floating {
  0% {
    transform: translate(0, 0) rotate(0deg);
  }
  50% {
    transform: translate(30px, 20px) rotate(4deg);
  }
  100% {
    transform: translate(-20px, -15px) rotate(-2deg);
  }
}

@keyframes wobble {
  0%, 100% {
    transform: rotate(0deg) scale(1);
  }
  25% {
    transform: rotate(-5deg) scale(1.1);
  }
  50% {
    transform: rotate(0deg) scale(1);
  }
  75% {
    transform: rotate(5deg) scale(1.1);
  }
}
</style> 
