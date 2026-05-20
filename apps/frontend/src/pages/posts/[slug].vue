<script setup lang="ts">
// Auto-imported by Nuxt 3;
import { useRoute, useRouter } from 'vue-router';
import { useTrpc } from '~/composables/useTrpc';
import { computed, ref, watch, onMounted, onBeforeMount } from 'vue';
import RelatedPosts from '~/components/common/RelatedPosts.vue';
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

// Định nghĩa alias cho URL tiếng Việt và tiếng Anh
definePageMeta({
  layout: "default"
});

const route = useRoute();
const router = useRouter();
const { locale } = useI18n();
const slug = route.params.slug as string;
const siteUrl = useRuntimeConfig().public.siteUrl;

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

// Breadcrumb items with localized paths
const breadcrumbItems = computed(() => [
  {
    label: locale.value === 'vi' ? 'Bài viết' : 'Posts',
    to: getLocalizedPath()
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
    { name: locale.value === 'vi' ? 'Trang chu' : 'Home', item: '/' },
    { name: locale.value === 'vi' ? 'Bai viet' : 'Posts', item: locale.value === 'vi' ? '/bai-viet' : '/posts' },
    { name: postTitle.value || 'Post' },
  ]),
  schemas: computed(() => [
    buildArticleSchema({
      headline: postTitle.value || 'Bài viết',
      description: postShortDescription.value || '',
      url: resolvedCanonicalUrl.value,
      image: currentTranslation.value?.ogImage || postThumbnail.value || '',
      datePublished: postCreatedAt.value || undefined,
      dateModified: postUpdatedAt.value || undefined,
      authorName: authorName.value,
    }),
  ]),
});
</script>

<template>
  <div class="post-detail bg-gray-50 dark:bg-gray-900">
    <div class="container mx-auto px-4 py-8">
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
      <div v-else-if="post" class="post-detail__content flex flex-col lg:flex-row gap-8">
        <!-- Main content -->
        <div class="post-detail__main flex-1 lg:max-w-[calc(100%-352px)]">
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
            
            <!-- Post content -->
            <div class="post-detail__body">
              <div class="post-prose first-letter-styled">
                <div v-html="postContent"></div>
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
        <div class="post-detail__sidebar lg:w-[320px] flex-shrink-0">
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
.prose {
  @apply text-gray-800;
}

.prose p {
  @apply mb-4;
}

.prose a {
  @apply text-blue-600 hover:text-blue-800 underline;
}

.prose strong {
  @apply font-bold;
}

.prose h2 {
  @apply text-2xl font-bold mt-8 mb-4;
}

.prose h3 {
  @apply text-xl font-bold mt-6 mb-3;
}

.prose ul, .prose ol {
  @apply my-4 pl-6;
}

.prose li {
  @apply mb-2;
}

.prose blockquote {
  @apply pl-4 border-l-4 border-gray-300 italic my-4 text-gray-600;
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

.post-detail__short-description {
  @apply text-lg text-gray-600 dark:text-gray-300 my-4 font-medium italic;
}

.post-detail__author-name,
.post-detail__date {
  @apply flex items-center text-sm mb-1;
}

.post-detail__author-name {
  @apply font-medium text-gray-800 dark:text-gray-200;
}

.post-detail__date {
  @apply text-gray-600 dark:text-gray-400;
}

.post-detail__author-info {
  @apply flex flex-col justify-center;
}

.post-detail__tags {
  @apply mt-6 border-t border-gray-200 dark:border-gray-700 pt-4;
}

.post-detail__tags-title {
  @apply flex items-center text-gray-600 dark:text-gray-400 mb-3 font-medium;
}

.post-detail__tags-list {
  @apply flex flex-wrap gap-2;
}

.post-detail__tags-item {
  @apply px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-full border border-gray-200 dark:border-gray-700 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-200 inline-flex items-center;
  height: 28px;
  line-height: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.tag-hash {
  @apply mr-0.5 text-gray-500 dark:text-gray-400 font-medium;
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
