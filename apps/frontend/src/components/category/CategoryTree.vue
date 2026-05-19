<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useLocalization } from '~/composables/useLocalization';
import { useCategory } from '~/composables/useCategory';
import { getCategoryDetailRoute } from '~/utils/routes';

// Sử dụng composable
const { 
  categoryTree, 
  loading, 
  error, 
  fetchCategoryTree 
} = useCategory();
const { locale } = useLocalization();

// State để theo dõi các danh mục đang mở rộng
const expandedCategories = ref<number[]>([]);

// Tải dữ liệu khi component được mount
onMounted(async () => {
  await fetchCategoryTree();
});

// Toggle trạng thái mở rộng của danh mục
const toggleCategory = (categoryId: number) => {
  const index = expandedCategories.value.indexOf(categoryId);
  if (index === -1) {
    expandedCategories.value.push(categoryId);
  } else {
    expandedCategories.value.splice(index, 1);
  }
};

// Kiểm tra xem danh mục có đang mở rộng không
const isCategoryExpanded = (categoryId: number) => {
  return expandedCategories.value.includes(categoryId);
};

// Kiểm tra xem danh mục có danh mục con không
const hasChildren = (category: any) => {
  return category.children && category.children.length > 0;
};

</script>

<template>
  <div class="category-tree">
    <h2 class="category-tree__title">Danh mục</h2>
    
    <!-- Loading state -->
    <div v-if="loading" class="category-tree__loading">
      <div class="category-tree__loading-spinner"></div>
    </div>
    
    <!-- Error state -->
    <div v-else-if="error" class="category-tree__error">
      <p class="category-tree__error-message">{{ error }}</p>
      <button 
        @click="fetchCategoryTree" 
        class="category-tree__error-button"
      >
        Thử lại
      </button>
    </div>
    
    <!-- Category tree -->
    <div v-else-if="categoryTree.length > 0" class="category-tree__list">
      <div 
        v-for="category in categoryTree" 
        :key="category.id"
        class="category-tree__node category-tree__node--level-0"
      >
        <div 
          class="category-tree__node-header"
          @click="() => hasChildren(category) && toggleCategory(category.id)"
        >
          <span 
            v-if="hasChildren(category)" 
            class="category-tree__toggle"
            :class="{'category-tree__toggle--expanded': isCategoryExpanded(category.id)}"
          >
            {{ isCategoryExpanded(category.id) ? '−' : '+' }}
          </span>
          <NuxtLink 
            :to="getCategoryDetailRoute(category.slug, locale)"
            class="category-tree__link"
          >
            {{ category.name }}
          </NuxtLink>
        </div>
        
        <div 
          v-if="hasChildren(category) && isCategoryExpanded(category.id)"
          class="category-tree__children"
        >
          <div 
            v-for="child in category.children" 
            :key="child.id"
            class="category-tree__node category-tree__node--level-1"
          >
            <div 
              class="category-tree__node-header"
              @click="() => hasChildren(child) && toggleCategory(child.id)"
            >
              <span 
                v-if="hasChildren(child)" 
                class="category-tree__toggle"
                :class="{'category-tree__toggle--expanded': isCategoryExpanded(child.id)}"
              >
                {{ isCategoryExpanded(child.id) ? '−' : '+' }}
              </span>
              <NuxtLink 
                :to="getCategoryDetailRoute(child.slug, locale)"
                class="category-tree__link"
              >
                {{ child.name }}
              </NuxtLink>
            </div>
            
            <div 
              v-if="hasChildren(child) && isCategoryExpanded(child.id)"
              class="category-tree__children"
            >
              <div 
                v-for="grandchild in child.children" 
                :key="grandchild.id"
                class="category-tree__node category-tree__node--level-2"
              >
                <div class="category-tree__node-header">
                  <NuxtLink 
                    :to="getCategoryDetailRoute(grandchild.slug, locale)"
                    class="category-tree__link"
                  >
                    {{ grandchild.name }}
                  </NuxtLink>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Empty state -->
    <div v-else class="category-tree__empty">
      <p class="category-tree__empty-message">Không có danh mục nào.</p>
    </div>
  </div>
</template>

<style scoped>
.category-tree {
  @apply w-full py-4;
}

.category-tree__title {
  @apply text-2xl font-bold mb-4;
}

.category-tree__list {
  @apply border rounded-lg overflow-hidden bg-white dark:bg-gray-800;
}

.category-tree__node {
  @apply border-b last:border-b-0;
}

.category-tree__node-header {
  @apply flex items-center p-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700;
}

.category-tree__node--level-0 > .category-tree__node-header {
  @apply font-semibold;
}

.category-tree__node--level-1 > .category-tree__node-header {
  @apply pl-8;
}

.category-tree__node--level-2 > .category-tree__node-header {
  @apply pl-12;
}

.category-tree__toggle {
  @apply inline-flex items-center justify-center w-5 h-5 mr-2 text-sm font-bold text-gray-600 dark:text-gray-300;
}

.category-tree__link {
  @apply flex-grow hover:text-blue-600 dark:hover:text-blue-400;
}

.category-tree__children {
  @apply border-t;
}

.category-tree__loading {
  @apply flex justify-center items-center py-8;
}

.category-tree__loading-spinner {
  @apply w-8 h-8 border-3 border-gray-300 border-t-blue-600 rounded-full animate-spin;
}

.category-tree__error {
  @apply text-center py-6;
}

.category-tree__error-message {
  @apply text-red-500 mb-2;
}

.category-tree__error-button {
  @apply px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors;
}

.category-tree__empty {
  @apply text-center py-6 text-gray-500;
}
</style> 
