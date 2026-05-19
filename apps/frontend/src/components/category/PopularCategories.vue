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
  popularCategories, 
  loading, 
  error, 
  fetchPopularCategories 
} = useCategory();
const { locale } = useLocalization();

// Tải dữ liệu khi component được mount
onMounted(async () => {
  await fetchPopularCategories();
});
</script>

<template>
  <div class="popular-categories">
    <h2 class="popular-categories__title">Danh mục phổ biến</h2>
    
    <!-- Loading state -->
    <div v-if="loading" class="popular-categories__loading">
      <div class="popular-categories__loading-spinner"></div>
    </div>
    
    <!-- Error state -->
    <div v-else-if="error" class="popular-categories__error">
      <p class="popular-categories__error-message">{{ error }}</p>
      <button 
        @click="() => fetchPopularCategories()" 
        class="popular-categories__error-button"
      >
        Thử lại
      </button>
    </div>
    
    <!-- Categories list -->
    <div v-else-if="popularCategories.length > 0" class="popular-categories__list">
      <NuxtLink
        v-for="category in popularCategories"
        :key="category.id"
        :to="getCategoryDetailRoute(category.slug, locale)"
        class="popular-categories__item"
      >
        <div class="popular-categories__item-content">
          <h3 class="popular-categories__item-title">{{ category.name }}</h3>
          <p v-if="category.description" class="popular-categories__item-description">
            {{ category.description }}
          </p>
          <div class="popular-categories__item-posts-count">
            {{ category.posts?.length || 0 }} bài viết
          </div>
        </div>
      </NuxtLink>
    </div>
    
    <!-- Empty state -->
    <div v-else class="popular-categories__empty">
      <p class="popular-categories__empty-message">Không có danh mục phổ biến nào.</p>
    </div>
  </div>
</template>

<style scoped>
.popular-categories {
  @apply w-full py-4;
}

.popular-categories__title {
  @apply text-2xl font-bold mb-4;
}

.popular-categories__list {
  @apply space-y-3;
}

.popular-categories__item {
  @apply block bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-md transition-shadow duration-300 overflow-hidden;
}

.popular-categories__item-content {
  @apply p-4 flex flex-col;
}

.popular-categories__item-title {
  @apply text-lg font-semibold;
}

.popular-categories__item-description {
  @apply text-sm text-gray-600 dark:text-gray-300 mt-1 line-clamp-1;
}

.popular-categories__item-posts-count {
  @apply text-xs text-gray-500 dark:text-gray-400 mt-2;
}

.popular-categories__loading {
  @apply flex justify-center items-center py-8;
}

.popular-categories__loading-spinner {
  @apply w-8 h-8 border-3 border-gray-300 border-t-blue-600 rounded-full animate-spin;
}

.popular-categories__error {
  @apply text-center py-6;
}

.popular-categories__error-message {
  @apply text-red-500 mb-2;
}

.popular-categories__error-button {
  @apply px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors;
}

.popular-categories__empty {
  @apply text-center py-6 text-gray-500;
}
</style> 
