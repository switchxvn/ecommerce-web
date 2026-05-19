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
  hotCategories, 
  loading, 
  error, 
  fetchHotCategories 
} = useCategory();
const { locale } = useLocalization();

// Tải dữ liệu khi component được mount
onMounted(async () => {
  await fetchHotCategories();
});
</script>

<template>
  <div class="hot-categories">
    <h2 class="hot-categories__title">Danh mục mới cập nhật</h2>
    
    <!-- Loading state -->
    <div v-if="loading" class="hot-categories__loading">
      <div class="hot-categories__loading-spinner"></div>
    </div>
    
    <!-- Error state -->
    <div v-else-if="error" class="hot-categories__error">
      <p class="hot-categories__error-message">{{ error }}</p>
      <button 
        @click="() => fetchHotCategories()" 
        class="hot-categories__error-button"
      >
        Thử lại
      </button>
    </div>
    
    <!-- Categories list -->
    <div v-else-if="hotCategories.length > 0" class="hot-categories__list">
      <NuxtLink
        v-for="category in hotCategories"
        :key="category.id"
        :to="getCategoryDetailRoute(category.slug, locale)"
        class="hot-categories__item"
      >
        <div class="hot-categories__item-badge">
          <span class="hot-categories__item-badge-text">Hot</span>
        </div>
        <div class="hot-categories__item-content">
          <h3 class="hot-categories__item-title">{{ category.name }}</h3>
          <p v-if="category.description" class="hot-categories__item-description">
            {{ category.description }}
          </p>
        </div>
      </NuxtLink>
    </div>
    
    <!-- Empty state -->
    <div v-else class="hot-categories__empty">
      <p class="hot-categories__empty-message">Không có danh mục mới cập nhật.</p>
    </div>
  </div>
</template>

<style scoped>
.hot-categories {
  @apply w-full py-4;
}

.hot-categories__title {
  @apply text-2xl font-bold mb-4;
}

.hot-categories__list {
  @apply grid grid-cols-1 gap-4;
}

.hot-categories__item {
  @apply block bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-md transition-shadow duration-300 overflow-hidden relative;
}

.hot-categories__item-badge {
  @apply absolute top-0 right-0 bg-red-500 text-white px-2 py-1 text-xs font-bold rounded-bl;
}

.hot-categories__item-content {
  @apply p-4;
}

.hot-categories__item-title {
  @apply text-lg font-semibold mb-1;
}

.hot-categories__item-description {
  @apply text-sm text-gray-600 dark:text-gray-300 line-clamp-2;
}

.hot-categories__loading {
  @apply flex justify-center items-center py-8;
}

.hot-categories__loading-spinner {
  @apply w-8 h-8 border-3 border-gray-300 border-t-red-600 rounded-full animate-spin;
}

.hot-categories__error {
  @apply text-center py-6;
}

.hot-categories__error-message {
  @apply text-red-500 mb-2;
}

.hot-categories__error-button {
  @apply px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors;
}

.hot-categories__empty {
  @apply text-center py-6 text-gray-500;
}
</style> 
