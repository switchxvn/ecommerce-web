<script setup lang="ts">
import { onMounted } from 'vue';
import { useCategory } from '~/composables/useCategory';
import { useLocalization } from '~/composables/useLocalization';
import { getCategoryDetailRoute } from '~/utils/routes';

// Props
const props = defineProps({
  limit: {
    type: Number,
    default: 5
  }
});

// Sử dụng composable
const { 
  featuredCategories, 
  loading, 
  error, 
  fetchFeaturedCategories 
} = useCategory();
const { locale } = useLocalization();

// Tải dữ liệu khi component được mount
onMounted(async () => {
  await fetchFeaturedCategories();
});
</script>

<template>
  <div class="featured-categories">
    <h2 class="featured-categories__title">Danh mục nổi bật</h2>
    
    <!-- Loading state -->
    <div v-if="loading" class="featured-categories__loading">
      <div class="featured-categories__loading-spinner"></div>
    </div>
    
    <!-- Error state -->
    <div v-else-if="error" class="featured-categories__error">
      <p class="featured-categories__error-message">{{ error }}</p>
      <button 
        @click="fetchFeaturedCategories" 
        class="featured-categories__error-button"
      >
        Thử lại
      </button>
    </div>
    
    <!-- Categories list -->
    <div v-else-if="featuredCategories.length > 0" class="featured-categories__list">
      <NuxtLink
        v-for="category in featuredCategories.slice(0, limit)"
        :key="category.id"
        :to="getCategoryDetailRoute(category.slug, locale)"
        class="featured-categories__item"
      >
        <div class="featured-categories__item-content">
          <h3 class="featured-categories__item-title">{{ category.name }}</h3>
          <p v-if="category.description" class="featured-categories__item-description">
            {{ category.description }}
          </p>
        </div>
      </NuxtLink>
    </div>
    
    <!-- Empty state -->
    <div v-else class="featured-categories__empty">
      <p class="featured-categories__empty-message">Không có danh mục nổi bật nào.</p>
    </div>
  </div>
</template>

<style scoped>
.featured-categories {
  @apply w-full py-4;
}

.featured-categories__title {
  @apply text-2xl font-bold mb-4;
}

.featured-categories__list {
  @apply grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4;
}

.featured-categories__item {
  @apply bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden;
}

.featured-categories__item-content {
  @apply p-4;
}

.featured-categories__item-title {
  @apply text-lg font-semibold mb-2;
}

.featured-categories__item-description {
  @apply text-sm text-gray-600 dark:text-gray-300 line-clamp-2;
}

.featured-categories__loading {
  @apply flex justify-center items-center py-8;
}

.featured-categories__loading-spinner {
  @apply w-10 h-10 border-4 border-gray-300 border-t-blue-600 rounded-full animate-spin;
}

.featured-categories__error {
  @apply text-center py-6;
}

.featured-categories__error-message {
  @apply text-red-500 mb-2;
}

.featured-categories__error-button {
  @apply px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors;
}

.featured-categories__empty {
  @apply text-center py-6 text-gray-500;
}
</style> 
