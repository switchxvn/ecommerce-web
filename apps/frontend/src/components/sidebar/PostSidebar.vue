  <script setup lang="ts">
  import { onMounted, ref, watch, reactive, computed, nextTick } from 'vue';
  import { useTrpc } from '~/composables/useTrpc';
  import { useCategory, type Category } from '~/composables/useCategory';
  import { useI18n } from 'vue-i18n';
  import { useRoute, useRouter } from 'vue-router';
  import type { Post } from '@ew/shared';
  import { usePopularPosts } from '~/composables/usePopularPosts';
  import { usePost } from '~/composables/usePost';
  import { formatDate } from '~/utils/date';
  import PopularPostsSection from '../common/PopularPostsSection.vue';
  import SubscribeSection from '../common/SubscribeSection.vue';
  import {
    TrendingUp,
    Star,
    FolderOpen,
    Calendar,
    Bell,
    ChevronUp,
    ChevronDown,
    Search,
    Folder,
    RotateCcw,
    Filter,
    Hash
  } from 'lucide-vue-next';

  // Định nghĩa CategoryType enum giống như trong backend
  enum CategoryType {
    NEWS = 'news',
    PRODUCT = 'product',
    BOTH = 'both'
  }

  const props = defineProps<{
    initialFilters?: {
      search?: string;
      categories?: string[];
      tags?: string[];
      page?: number;
    };
    shouldReset?: boolean;
  }>();

  const emit = defineEmits<{
    (e: 'filter-change', filters: any): void;
  }>();

  const route = useRoute();
  const router = useRouter();
  const trpc = useTrpc();
  const categories = ref<Category[]>([]);
  const loading = ref({
    categories: true,
    featuredCategories: true,
    popularPosts: true,
    searching: false
  });

  // Sử dụng composables
  const { t } = useI18n();
  const { locale } = useI18n();
  const { popularPosts, loading: loadingPopular, fetchPopularPosts } = usePopularPosts();
  const { getTranslationByLocale, getPostUrl } = usePost();
  const {
    featuredCategories,
    fetchFeaturedCategories
  } = useCategory();

  // Filter state
  const filters = reactive({
    search: props.initialFilters?.search || '',
    categories: props.initialFilters?.categories || [],
    tags: props.initialFilters?.tags || [],
    page: props.initialFilters?.page || 1
  });

  // Search state
  const isSearching = ref(false);
  const searchTimeout = ref<NodeJS.Timeout | null>(null);

  // UI state
  const expandedSections = ref({
    filter: true,
    popularPosts: true,
    featuredCategories: true,
    subscribe: true
  });

  async function fetchCategories() {
    try {
      loading.value.categories = true;
      // Chỉ lấy danh mục có type là NEWS
      const result = await trpc.category.byType.query({ type: CategoryType.NEWS });
      categories.value = result as unknown as Category[];
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
      // Lọc chỉ lấy các featured categories có type là NEWS
      featuredCategories.value = featuredCategories.value.filter(
        cat => cat.type === CategoryType.NEWS
      );
    } catch (error) {
      console.error('Failed to fetch featured categories:', error);
    } finally {
      loading.value.featuredCategories = false;
    }
  }

  // Handle search input
  const handleSearchInput = () => {
    isSearching.value = true;

    if (searchTimeout.value) {
      clearTimeout(searchTimeout.value);
    }

    searchTimeout.value = setTimeout(() => {
      applyFilters();
      isSearching.value = false;
    }, 500);
  };

  // Toggle category selection
  const toggleCategory = (categorySlug: string) => {
    const index = filters.categories.indexOf(categorySlug);
    if (index === -1) {
      filters.categories.push(categorySlug);
    } else {
      filters.categories.splice(index, 1);
    }
  };

  // Toggle section expansion
  const toggleSection = (section: keyof typeof expandedSections.value) => {
    expandedSections.value[section] = !expandedSections.value[section];
  };

  // Apply filters
  const applyFilters = () => {
    emit('filter-change', {
      search: filters.search,
      categories: filters.categories.length > 0 ? filters.categories : undefined,
      tags: filters.tags.length > 0 ? filters.tags : undefined,
      page: filters.page
    });

    // Update URL query params
    updateQueryParams();
  };

  // Update URL query params
  const updateQueryParams = () => {
    // Build query params object
    const query: Record<string, string> = {};

    if (filters.search) query.search = filters.search;
    if (filters.categories && filters.categories.length > 0) query.categories = filters.categories.join(',');
    if (filters.tags && filters.tags.length > 0) query.tags = filters.tags.join(',');
    
    query.page = filters.page.toString();
    
    // Update route
    router.replace({ query });
  };

  // Reset filters
  const resetFilters = () => {
    // Lưu lại giá trị page hiện tại
    const currentPage = filters.page;
    
    // Reset all filter values
    filters.search = '';
    filters.categories = [];
    filters.tags = [];
    // Không reset page
    // filters.page = 1;
    
    // Reset UI state
    expandedSections.value = {
      filter: true,
      popularPosts: true,
      featuredCategories: true,
      subscribe: true
    };

    // Clear search timeout if exists
    if (searchTimeout.value) {
      clearTimeout(searchTimeout.value);
      searchTimeout.value = null;
    }

    // Reset loading states
    loading.value = {
      categories: false,
      featuredCategories: false,
      popularPosts: false,
      searching: false
    };

    // Force update the search input
    nextTick(() => {
      const searchInput = document.querySelector('.search-input input') as HTMLInputElement;
      if (searchInput) {
        searchInput.value = '';
      }
    });

    // Emit filter change with empty values
    emit('filter-change', {
      search: '',
      categories: undefined,
      tags: undefined,
      category: undefined,
      // Không emit page để tránh reset page
      // page: 1
    });

    // Update URL query params nhưng giữ nguyên page
    const query: Record<string, string> = {};
    if (route.query.page) {
      query.page = route.query.page as string;
    }
    router.replace({ query });
  };

  // Watch for changes and apply filters
  watch([() => filters.categories, () => filters.tags], () => {
    applyFilters();
  }, { deep: true });

  // Watch for search changes
  watch(() => filters.search, () => {
    handleSearchInput();
  }, { immediate: true });

  // Watch for external reset trigger
  watch(() => props.shouldReset, (shouldReset) => {
    if (shouldReset) {
      resetFilters();
    }
  }, { immediate: true });

  onMounted(() => {
    // Initialize from URL if not provided in props
    if (!props.initialFilters) {
      if (route.query.search) {
        filters.search = route.query.search as string;
      }

      if (route.query.categories) {
        filters.categories = (route.query.categories as string).split(',');
      }

      if (route.query.tags) {
        filters.tags = (route.query.tags as string).split(',');
      }

      if (route.query.page) {
        filters.page = Number(route.query.page);
      }
    }

    fetchPopularPosts({ limit: 5 });
    fetchCategories();
    loadFeaturedCategories();
  });
  </script>

  <template>
    <div class="post-sidebar">
      <!-- Single Card Container -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
        <!-- Search -->
        <div class="p-4">
          <div class="relative">
            <div class="custom-input-container">
              <UInput
                v-model="filters.search"
                :placeholder="t('posts.searchPlaceholder')"
                class="w-full search-input"
                size="md"
                :loading="isSearching"
              >
                <template #leading>
                  <div class="leading-icon-wrapper">
                    <Search class="h-4 w-4 text-gray-500" />
                  </div>
                </template>
              </UInput>
            </div>
            <div v-if="filters.search" class="mt-2 text-sm text-gray-500">
              {{ t("posts.searchingFor") }}:
              <span class="font-medium text-base">{{ filters.search }}</span>
            </div>
          </div>
        </div>

        <hr class="border-gray-200 dark:border-gray-700 mx-4">

        <!-- Filter Section -->
        <div>
          <div
            @click="toggleSection('filter')"
            class="flex cursor-pointer items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            <div class="flex items-center gap-2.5">
              <Filter class="h-5 w-5 text-primary-500" />
              <h3 class="font-medium text-gray-900 dark:text-white text-lg">
                {{ t("sidebar.filters") }}
              </h3>
            </div>
            <component
              :is="expandedSections.filter ? ChevronUp : ChevronDown"
              class="h-5 w-5 text-gray-500"
            />
          </div>

          <div v-if="expandedSections.filter" class="px-4 pb-4">
            <!-- Categories Filter -->
            <div class="mb-4">
              <label class="block text-base font-medium text-gray-700 dark:text-gray-300 mb-2">
                {{ t("sidebar.filterByCategory") }}
              </label>
              <div v-if="loading.categories" class="flex justify-center py-2">
                <div
                  class="h-4 w-4 animate-spin rounded-full border-2 border-primary-500 border-t-transparent"
                ></div>
              </div>
              <div
                v-else-if="categories.length === 0"
                class="text-sm text-gray-500 text-center py-2"
              >
                {{ t("sidebar.noCategories") }}
              </div>
              <div v-else class="space-y-2">
                <div 
                  v-for="category in categories" 
                  :key="category.id"
                  class="flex items-center"
                >
                  <UCheckbox
                    :model-value="filters.categories.includes(category.translations[0]?.slug || '')"
                    @update:model-value="toggleCategory(category.translations[0]?.slug || '')"
                    :name="`category-${category.id}`"
                    color="primary"
                  />
                  <label :for="`category-${category.id}`" class="ml-2 cursor-pointer text-base text-gray-700 dark:text-gray-300">
                    {{ category.translations[0]?.name }}
                    <span class="text-sm text-gray-500">({{ category.posts?.length || 0 }})</span>
                  </label>
                </div>
              </div>
            </div>

            <!-- Reset Button -->
            <UButton
              @click="resetFilters"
              variant="ghost"
              color="gray"
              block
              size="sm"
              class="mt-0"
            >
              <template #leading>
                <RotateCcw class="h-4 w-4 mr-1.5" />
              </template>
              {{ t("posts.resetFilters") }}
            </UButton>
          </div>
        </div>

        <hr class="border-gray-200 dark:border-gray-700 mx-4">

        <!-- Popular Posts -->
        <PopularPostsSection :limit="5" />

        <hr class="border-gray-200 dark:border-gray-700 mx-4">

        <!-- Subscribe -->
        <SubscribeSection />
      </div>
    </div>
  </template>

  <style scoped>
  /* Custom input container */
  .custom-input-container {
    position: relative;
  }

  /* Leading icon wrapper */
  .leading-icon-wrapper {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    margin-right: 12px;
  }

  /* Adjust input padding */
  :deep(.search-input) {
    padding: 0.5rem 0rem;
  }

  /* Adjust input field padding */
  :deep(.search-input input) {
    padding-left: 36px !important;
  }

  /* Position the leading icon */
  :deep(.u-input-leading) {
    position: absolute;
    left: 12px;
    top: 50%;
    transform: translateY(-50%);
    z-index: 10;
  }

  /* Ensure the input form has proper spacing */
  :deep(.u-input-form) {
    position: relative;
  }

  .post-sidebar {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    width: 100%;
  }
  </style>
