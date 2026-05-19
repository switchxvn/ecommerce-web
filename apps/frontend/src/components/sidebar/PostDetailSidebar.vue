<script setup lang="ts">
import { onMounted, ref, computed } from 'vue';
import { useTrpc } from '../../composables/useTrpc';
import { useCategory, type Category } from '../../composables/useCategory';
import { useI18n } from 'vue-i18n';
import Icon from '../ui/Icon.vue';
import type { Post } from '@ew/shared';
import PopularPostsSection from '../common/PopularPostsSection.vue';
import SubscribeSection from '../common/SubscribeSection.vue';
import { getCategoryDetailRoute } from '../../utils/routes';

interface CategoryTranslation {
  id: number;
  name: string;
  description?: string;
  slug: string;
  locale: string;
}

const props = defineProps<{
  postId: number;
}>();

const trpc = useTrpc();
const categories = ref<Category[]>([]);
const loading = ref({
  categories: true,
  featuredCategories: true
});

// Sử dụng composables
const { t } = useI18n();
const { locale } = useI18n();
const { 
  featuredCategories,
  fetchFeaturedCategories
} = useCategory();

// Helper function to get current translation
const getTranslation = (translations: CategoryTranslation[] = [], locale: string): CategoryTranslation | undefined => {
  return translations.find(t => t.locale === locale) || translations[0];
};

async function fetchCategories() {
  try {
    loading.value.categories = true;
    const result = await trpc.category.all.query();
    categories.value = result;
  } catch (error) {
    console.error('Failed to fetch categories:', error);
  } finally {
    loading.value.categories = false;
  }
}

async function loadFeaturedCategories() {
  try {
    loading.value.featuredCategories = true;
    await fetchFeaturedCategories();
  } catch (error) {
    console.error('Failed to fetch featured categories:', error);
  } finally {
    loading.value.featuredCategories = false;
  }
}

onMounted(() => {
  fetchCategories();
  loadFeaturedCategories();
});
</script>

<template>
  <div class="post-sidebar">
    <!-- Single Card Container -->
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
      <!-- Popular Posts -->
      <PopularPostsSection :exclude-id="postId" :limit="5" />

      <hr class="border-gray-200 dark:border-gray-700 mx-4">

      <!-- Featured Categories -->
      <div class="post-sidebar__section">
        <h3 class="post-sidebar__title">
          <Icon name="Star" :size="18" class="mr-2" />
          {{ t('sidebar.featuredCategories') }}
        </h3>
        
        <div v-if="loading.featuredCategories" class="post-sidebar__loading">
          <div class="post-sidebar__loading-spinner"></div>
        </div>
        
        <div v-else-if="featuredCategories.length === 0" class="post-sidebar__empty">
          Không có danh mục nổi bật
        </div>
        
        <div v-else class="post-sidebar__featured-categories">
          <NuxtLink 
            v-for="(category, categoryIndex) in featuredCategories" 
            :key="categoryIndex"
            :to="getCategoryDetailRoute(String(getTranslation(category.translations, locale)?.slug || category.id), locale)"
            class="post-sidebar__featured-category group"
          >
            <div class="post-sidebar__featured-category-content">
              <div class="post-sidebar__featured-category-icon">
                <Icon name="Folder" :size="20" />
              </div>
              <div>
                <h4 class="post-sidebar__featured-category-title group-hover:text-primary-600">
                  {{ getTranslation(category.translations, locale)?.name }}
                </h4>
                <p v-if="getTranslation(category.translations, locale)?.description" class="post-sidebar__featured-category-description">
                  {{ getTranslation(category.translations, locale)?.description }}
                </p>
              </div>
            </div>
          </NuxtLink>
        </div>
      </div>

      <hr class="border-gray-200 dark:border-gray-700 mx-4">

      <!-- Categories -->
      <div class="post-sidebar__section">
        <h3 class="post-sidebar__title">
          <Icon name="FolderOpen" :size="18" class="mr-2" />
          {{ t('sidebar.allCategories') }}
        </h3>
        
        <div v-if="loading.categories" class="post-sidebar__loading">
          <div class="post-sidebar__loading-spinner"></div>
        </div>
        
        <div v-else-if="categories.length === 0" class="post-sidebar__empty">
          Không có danh mục
        </div>
        
        <div v-else class="post-sidebar__categories">
          <NuxtLink 
            v-for="(category, categoryIndex) in categories" 
            :key="categoryIndex"
            :to="getCategoryDetailRoute(String(getTranslation(category.translations, locale)?.slug || category.id), locale)"
            class="post-sidebar__category"
          >
            {{ getTranslation(category.translations, locale)?.name }}
          </NuxtLink>
        </div>
      </div>

      <hr class="border-gray-200 dark:border-gray-700 mx-4">

      <!-- Subscribe -->
      <SubscribeSection />
    </div>
  </div>
</template>

<style scoped>
.post-sidebar {
  @apply w-full;
}

.post-sidebar__section {
  @apply p-4;
}

.post-sidebar__title {
  @apply text-xl font-semibold mb-4 pb-2 border-b border-gray-200 flex items-center text-gray-800;
}

.post-sidebar__loading {
  @apply flex justify-center items-center py-4;
}

.post-sidebar__loading-spinner {
  @apply w-8 h-8 border-4 border-gray-200 border-t-primary-500 rounded-full animate-spin;
}

.post-sidebar__empty {
  @apply text-gray-500 py-2 text-center italic text-base;
}

.post-sidebar__featured-categories {
  @apply space-y-2;
}

.post-sidebar__featured-category {
  @apply block p-3 rounded-md bg-gradient-to-br from-white to-gray-50 hover:from-primary-50 hover:to-primary-100 
    border border-gray-100 shadow-sm transition-all duration-200 mb-2 last:mb-0;
}

.dark .post-sidebar__featured-category {
  @apply from-gray-800 to-gray-700 border-gray-700 hover:from-gray-700 hover:to-gray-600;
}

.post-sidebar__featured-category-content {
  @apply flex items-center gap-2;
}

.post-sidebar__featured-category-icon {
  @apply w-8 h-8 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center flex-shrink-0;
}

.dark .post-sidebar__featured-category-icon {
  @apply bg-primary-900 text-primary-300;
}

.post-sidebar__featured-category-title {
  @apply text-base font-medium text-gray-800 mb-0.5 transition-colors duration-200;
}

.dark .post-sidebar__featured-category-title {
  @apply text-gray-200;
}

.post-sidebar__featured-category-description {
  @apply text-sm text-gray-500 line-clamp-2;
}

.dark .post-sidebar__featured-category-description {
  @apply text-gray-400;
}

.post-sidebar__categories {
  @apply flex flex-wrap gap-2;
}

.post-sidebar__category {
  @apply px-3 py-1.5 text-base bg-gray-50 rounded-full hover:bg-primary-50 hover:text-primary-600 transition-colors duration-200;
}
</style>
