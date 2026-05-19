<script setup lang="ts">
import { computed, watch } from 'vue';
import AppImage from '~/components/ui/AppImage.vue';
import type { Post } from '@ew/shared';
import { useLocalization } from '~/composables/useLocalization';
import { usePost } from '~/composables/usePost';
import { formatDate } from '~/utils/date';
import { truncateContent } from '~/utils/text';
import { getAuthorName } from '~/utils/author';
import { getLocalizedRoute } from '~/utils/routes';

const { locale } = useLocalization();
const { getTranslationByLocale } = usePost();

const props = defineProps<{
  post: Post;
  compact?: boolean;
  priority?: boolean;
  showDate?: boolean;
  showAuthor?: boolean;
  showExcerpt?: boolean;
  excerptLength?: number;
  imageAspectRatio?: string;
  overlayOpacity?: number;
  backgroundGradient?: {
    from: string;
    to: string;
    direction: string;
  };
  buttonText?: string;
  buttonStyle?: string;
}>();

const currentTranslation = computed(() => getTranslationByLocale(props.post, locale.value));
const postTitle = computed(() => currentTranslation.value?.title || '');
const postContent = computed(() => currentTranslation.value?.content || '');
const postShortDescription = computed(() => currentTranslation.value?.shortDescription || '');
const postMetaDescription = computed(() => currentTranslation.value?.metaDescription || '');
const postSlug = computed(() => currentTranslation.value?.slug || props.post.id.toString());

/**
 * Kiểm tra xem bài viết có hình ảnh không
 */
const hasImage = computed(() => {
  return !!props.post.thumbnail;
});

/**
 * Lấy mô tả ngắn gọn của bài viết
 */
const getDescription = computed(() => {
  if (!props.showExcerpt) return '';
  return postShortDescription.value || postMetaDescription.value || postContent.value || '';
});

/**
 * Cắt nội dung theo độ dài yêu cầu
 */
const truncatedDescription = computed(() => {
  if (!getDescription.value) return '';
  return truncateContent(getDescription.value, props.excerptLength || 120);
});

const postUrl = computed(() => {
  return getLocalizedRoute('POST_DETAIL', locale.value, { slug: postSlug.value });
});

// Watch for locale changes to trigger re-computation
watch(locale, () => {
  // The computed properties will automatically re-compute
  // when locale changes because they depend on currentTranslation
  // which in turn depends on locale.value
}, { immediate: true });
</script>

<template>
  <NuxtLink :to="postUrl" class="block h-full">
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300 h-full flex flex-col">
      <div class="flex" :class="{ 'flex-col flex-grow': !compact, 'flex-row': compact }">
        <!-- Hình ảnh bài viết - phiên bản lớn khi không compact -->
        <div v-if="!compact" class="image-container" :style="imageAspectRatio ? { aspectRatio: imageAspectRatio } : {}">
          <div class="relative w-full h-full">
            <AppImage 
              :src="post.thumbnail || '/images/default-image.jpg'" 
              :alt="postTitle" 
              :priority="!!priority"
              :loading="priority ? 'eager' : 'lazy'"
              :fetchpriority="priority ? 'high' : 'low'"
              sizes="(max-width: 768px) 100vw, 50vw"
              width="640"
              height="360"
              class="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
            />
            <div v-if="overlayOpacity !== undefined" 
                 class="absolute inset-0" 
                 :style="{
                   background: backgroundGradient ? `linear-gradient(${backgroundGradient.direction}, ${backgroundGradient.from}, ${backgroundGradient.to})` : 'none',
                   opacity: overlayOpacity
                 }">
            </div>
          </div>
        </div>
        
        <!-- Hình ảnh bài viết - phiên bản nhỏ khi compact -->
        <div v-else-if="compact && hasImage" class="compact-image-container">
          <div class="relative w-full h-full">
            <AppImage 
              :src="post.thumbnail || '/images/default-image.jpg'" 
              :alt="postTitle" 
              :loading="'lazy'"
              :fetchpriority="'low'"
              sizes="80px"
              width="80"
              height="80"
              class="w-full h-full object-cover"
            />
            <div v-if="overlayOpacity !== undefined" 
                 class="absolute inset-0" 
                 :style="{
                   background: backgroundGradient ? `linear-gradient(${backgroundGradient.direction}, ${backgroundGradient.from}, ${backgroundGradient.to})` : 'none',
                   opacity: overlayOpacity
                 }">
            </div>
          </div>
        </div>
        
        <!-- Nội dung bài viết -->
        <div class="p-4 flex-grow flex flex-col">
          <h3 class="title-container">{{ postTitle }}</h3>
          
          <p v-if="!compact && getDescription" class="description-container">
            {{ truncatedDescription }}
          </p>
          
          <div class="flex justify-between items-center text-sm text-gray-500 dark:text-gray-400 mt-auto">
            <span v-if="showDate !== false">{{ formatDate(post.createdAt) }}</span>
            <span v-if="post.author && (showAuthor !== false) && !compact">{{ getAuthorName(post.author) }}</span>
          </div>
          
          <div v-if="buttonText" class="mt-4">
            <UButton 
              :color="buttonStyle || 'primary'" 
              variant="soft" 
              size="sm"
              class="w-full justify-center"
            >
              {{ buttonText }}
            </UButton>
          </div>
        </div>
      </div>
    </div>
  </NuxtLink>
</template>

<style scoped>
.hover\:scale-105:hover {
  transform: scale(1.05);
}

/* Cố định chiều cao cho hình ảnh */
.image-container {
  height: 240px;
  width: 100%;
  overflow: hidden;
}

.compact-image-container {
  width: 80px;
  height: 80px;
  flex-shrink: 0;
  overflow: hidden;
}

/* Cố định chiều cao cho tiêu đề */
.title-container {
  height: 72px;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  text-overflow: ellipsis;
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 0.75rem;
  color: inherit;
}

.dark .title-container {
  color: white;
}

/* Cố định chiều cao cho mô tả */
.description-container {
  @apply text-sm text-gray-600 dark:text-gray-300 mt-2;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.5;
}

.dark .description-container {
  color: #d1d5db;
}
</style> 
