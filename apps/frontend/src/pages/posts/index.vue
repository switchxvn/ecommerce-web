<script setup lang="ts">
// Auto-imported by Nuxt 3;
import { useTrpc } from "../../composables/useTrpc";
import { ref, computed, reactive, watch } from "vue";
import { useLocalization } from "../../composables/useLocalization";
import { useRoute, useRouter } from 'vue-router';
import PostSidebar from "../../components/sidebar/PostSidebar.vue";
import PostCard from "../../components/ui/card/PostCard.vue";
import PostCardSkeleton from "../../components/ui/skeleton/PostCardSkeleton.vue";
import type { Post } from "@ew/shared";
import type { CategoryTranslation } from "../../types/category-translation";
import Breadcrumb from "../../components/common/Breadcrumb.vue";
import { SearchX, FilterX } from 'lucide-vue-next';
import { usePageSeo } from '~/composables/usePageSeo';
import { getAuthorName } from '~/utils/author';
import { buildPostListQuery, parsePostListQuery } from '~/utils/postFilters';

const { t, locale } = useLocalization();
const route = useRoute();
const router = useRouter();

// Định nghĩa alias cho URL tiếng Việt và meta
definePageMeta({
  layout: "default",
  validate: (route) => {
    // Cho phép tất cả các query parameters
    return true;
  }
});

const trpc = useTrpc();
const posts = ref<Post[]>([]);
const isLoading = ref(false);
const error = ref<string | null>(null);
const totalPosts = ref(0);
const totalPages = ref(0);
const categoryData = ref<any>(null);
const seoData = ref<any>(null);
const shouldResetSidebar = ref(false);
const initialQueryFilters = parsePostListQuery(route.query as Record<string, unknown>);

// Filter state với tất cả các query parameters có thể có
const filters = reactive<{
  search: string;
  categories: string[];
  sort: string;
  page: number;
  limit: number;
  tags: string[];
}>({
  search: initialQueryFilters.search,
  categories: initialQueryFilters.categories,
  sort: initialQueryFilters.sort,
  page: initialQueryFilters.page,
  limit: initialQueryFilters.limit,
  tags: initialQueryFilters.tags,
});

// Đảm bảo page được đồng bộ với URL khi SSR
const currentPage = computed(() => Number(route.query.page || 1));

// Watch currentPage để cập nhật filters.page
watch(currentPage, (newPage) => {
  if (newPage !== filters.page) {
    filters.page = newPage;
  }
});

// Fetch category data by slug
const fetchCategoryData = async (slug: string) => {
  try {
    const category = await trpc.category.getBySlug.query({
      slug,
      locale: locale.value
    });
    categoryData.value = category;
    return category;
  } catch (error) {
    console.error('Error fetching category data:', error);
    categoryData.value = null;
    return null;
  }
};

// Fetch SEO data
const fetchSeoData = async () => {
  try {
    const seo = await trpc.seo.getSeoByPath.query('/posts');
    seoData.value = seo;
    return seo;
  } catch (err) {
    console.error('Error fetching SEO data:', err);
    seoData.value = null;
    return null;
  }
};

// Hàm mới để xử lý việc lấy thông tin category dựa trên filters
const handleCategoryData = async () => {
  // Nếu có nhiều categories hoặc không có category nào
  if (filters.categories.length > 1 || filters.categories.length === 0) {
    categoryData.value = null;
    await fetchSeoData();
    return;
  }
  
  // Nếu chỉ có một category
  if (filters.categories.length === 1) {
    await fetchCategoryData(filters.categories[0]);
  }
};

const fetchPosts = async () => {
  try {
    isLoading.value = true;
    error.value = null;

    // Build query params
    const queryParams: any = {
      locale: locale.value,
      page: filters.page,
      limit: filters.limit,
      sort: filters.sort
    };

    // Add search if exists
    if (filters.search) {
      queryParams.search = filters.search;
    }

    // Add categories if exists
    if (filters.categories && filters.categories.length > 0) {
      queryParams.categories = filters.categories.join(',');
    }

    // Add tags if exists
    if (filters.tags && filters.tags.length > 0) {
      queryParams.tags = filters.tags.join(',');
    }

    // Fetch posts
    const result = await trpc.post.byLocale.query(queryParams);
    posts.value = Array.isArray(result.items) ? result.items.map(transformPost) : [];
    totalPosts.value = result.total;
    totalPages.value = result.totalPages;

    // Xử lý thông tin category dựa trên filters
    await handleCategoryData();

  } catch (err) {
    console.error('Failed to fetch posts:', err);
    error.value = t('posts.fetchError');
  } finally {
    isLoading.value = false;
  }
};

const syncFiltersFromQuery = (newQuery: Record<string, any>) => {
  const parsed = parsePostListQuery(newQuery as Record<string, unknown>);
  filters.search = parsed.search;
  filters.categories = parsed.categories;
  filters.sort = parsed.sort;
  filters.page = parsed.page;
  filters.limit = parsed.limit;
  filters.tags = parsed.tags;
};

if (import.meta.client) {
  // Fetch posts client-side to avoid blocking SSR render on list pages
  watch(() => route.query, (newQuery) => {
    syncFiltersFromQuery(newQuery as Record<string, any>);
    fetchPosts();
  }, { immediate: true });

  watch(locale, () => {
    fetchPosts();
  });
}

// Định nghĩa kiểu dữ liệu cho breadcrumb item
interface BreadcrumbItem {
  label: string;
  to?: string;
}

// Sort options as computed property to ensure translations are updated
const sortOptions = computed(() => [
  { value: "newest", label: t("sort.newest") },
  { value: "oldest", label: t("sort.oldest") },
  { value: "title_asc", label: t("sort.title_asc") },
  { value: "title_desc", label: t("sort.title_desc") },
]);

/**
 * Chuyển đổi dữ liệu post từ API thành đúng type Post
 */
const transformPost = (post: any): Post => {
  return {
    ...post,
    author: post.author ? {
      ...post.author,
      lastLoginAt: post.author.lastLoginAt ? new Date(post.author.lastLoginAt) : null
    } : null
  };
};

// Handle filter change from sidebar
const handleFilterChange = (newFilters: any) => {

  
  // Update filters
  filters.search = newFilters.search || '';
  filters.categories = newFilters.categories || [];
  filters.tags = newFilters.tags || [];
  filters.page = newFilters.page || 1;
};

// Update URL query params
const updateQueryParams = () => {
  const query = buildPostListQuery({
    search: filters.search,
    categories: filters.categories,
    sort: filters.sort,
    page: filters.page,
    limit: filters.limit,
    tags: filters.tags,
  });

  // Sử dụng replace thay vì push để tránh thêm vào history
  router.replace({ query });
};

// Reset all filters
const resetAllFilters = () => {
  // Set shouldResetSidebar to true to trigger sidebar reset
  shouldResetSidebar.value = true;
  
  // Reset main filters
  filters.search = '';
  filters.categories = [];
  filters.tags = [];
  filters.page = 1;
  filters.sort = 'newest';
  
  // Update URL and fetch posts
  updateQueryParams();
  fetchPosts();
};

// Handle page change
const handlePageChange = (page: number) => {
  filters.page = page;
  updateQueryParams();
  
  // Scroll to top
  window.scrollTo({ top: 0, behavior: "smooth" });
};

// Sort posts
const sortedPosts = computed(() => {
  if (!posts.value) return [];

  // Không cần sắp xếp lại vì đã được sắp xếp từ server
  return posts.value;
});

const handleSortChange = (event: Event) => {
  const target = event.target as HTMLSelectElement;
  filters.sort = target.value;
  filters.page = 1; // Reset to page 1 when sort changes
  updateQueryParams();
};

/**
 * Tạo slug từ tiêu đề nếu không có slug
 */
function getPostSlug(post: Post): string {
  const translation = post.translations?.[0];
  if (translation?.slug) return translation.slug;
  
  // Fallback: Tạo slug từ tiêu đề nếu không có slug
  return (post.title || '')
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Loại bỏ ký tự đặc biệt
    .replace(/\s+/g, '-') // Thay thế khoảng trắng bằng dấu gạch ngang
    .replace(/--+/g, '-') // Loại bỏ nhiều dấu gạch ngang liên tiếp
    .trim() || 'untitled';
}

// Computed property để lấy translation hiện tại của category
const currentCategoryTranslation = computed<CategoryTranslation | null>(() => {
  if (!categoryData.value || !categoryData.value.translations) return null;
  return categoryData.value.translations.find((t: any) => t.locale === locale.value) || null;
});

// Computed property để lấy breadcrumb
const breadcrumbs = computed<BreadcrumbItem[]>(() => {
  const items: BreadcrumbItem[] = [
    { label: t('posts.title'), to: '/posts' }
  ];
  
  if (categoryData.value && currentCategoryTranslation.value) {
    items.push({
      label: currentCategoryTranslation.value.name || '',
      to: undefined
    });
  }
  
  return items;
});

// Computed property để lấy title và description
const pageTitle = computed(() => {
  if (categoryData.value && currentCategoryTranslation.value) {
    return currentCategoryTranslation.value.name;
  }
  return seoData.value?.title || t('posts.title');
});

const pageDescription = computed(() => {
  if (categoryData.value && currentCategoryTranslation.value) {
    return currentCategoryTranslation.value.description;
  }
  return seoData.value?.description || '';
});

usePageSeo({
  title: computed(() => pageTitle.value || t('posts.title')),
  description: computed(() => pageDescription.value || t('posts.description')),
  keywords: computed(() => seoData.value?.keywords || ''),
  ogTitle: computed(() => seoData.value?.ogTitle || pageTitle.value || t('posts.title')),
  ogDescription: computed(() => seoData.value?.ogDescription || pageDescription.value || t('posts.description')),
  image: computed(() => seoData.value?.ogImage || ''),
  canonicalUrl: computed(() => seoData.value?.canonicalUrl || null),
  currentPath: computed(() => route.path),
  locale: computed(() => (locale.value === 'en' ? 'en' : 'vi')),
  routeKey: 'posts',
});
</script>

<template>
  <div class="bg-gray-50 dark:bg-gray-900">
    <div class="container mx-auto px-4 py-8">
      <!-- Breadcrumbs -->
      <div class="mb-6 w-full">
        <Breadcrumb
          :items="breadcrumbs"
          variant="default"
          class="text-sm md:text-base"
        />
      </div>

      <!-- Category Info -->
      <div v-if="categoryData || seoData" class="mb-12">
        <div class="space-y-4">
          <h1 class="text-4xl md:text-5xl font-bold text-primary-500 leading-tight">
            {{ pageTitle }}
          </h1>
          <div v-if="pageDescription" class="text-lg md:text-xl text-gray-600 leading-relaxed w-full">
            <p class="first-letter-styled">
              {{ pageDescription }}
            </p>
          </div>
          <div class="flex items-center gap-4 text-sm text-gray-500 border-t border-gray-200 pt-4 mt-2">
            <span class="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              {{ t('posts.totalPosts', { count: totalPosts }) }}
            </span>
            <span v-if="categoryData?.parent" class="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
              {{ t('posts.parentCategory') }}:
              <NuxtLink
                :to="`/posts?categories=${categoryData.parent.slug}`"
                class="text-primary-600 hover:text-primary-700 ml-1 font-medium transition-colors duration-200"
              >
                {{ categoryData.parent.translations?.find((t: CategoryTranslation) => t.locale === locale)?.name || categoryData.parent.name }}
              </NuxtLink>
            </span>
          </div>
        </div>
      </div>

      <!-- Main Content with Sidebar -->
      <div class="flex flex-col lg:flex-row gap-8">
        <!-- Main Content -->
        <div class="flex-1 lg:max-w-[calc(100%-352px)]">
          <div v-if="!isLoading && posts.length > 0" class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <PostCard
              v-for="(post, index) in sortedPosts"
              :key="`post-${post.id}`"
              :post="post"
              :priority="index === 0"
              class="h-full"
            />
          </div>

          <!-- Skeleton Loading State -->
          <div v-else-if="isLoading" class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <PostCardSkeleton v-for="n in 6" :key="`skeleton-${n}`" />
          </div>

          <!-- No Posts Found -->
          <div v-else class="flex flex-col items-center justify-center py-16 px-4 text-center">
            <div class="bg-gray-100 dark:bg-gray-800 rounded-full p-4 mb-4">
              <SearchX class="w-12 h-12 text-gray-400 dark:text-gray-500" />
            </div>
            <h3 class="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2">
              {{ t('posts.noPostsFound') }}
            </h3>
            <p class="text-gray-600 dark:text-gray-400 max-w-md mb-6">
              {{ t('posts.noPostsFoundDescription') }}
            </p>
            <button 
              @click="resetAllFilters"
              class="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-md transition-colors duration-200"
            >
              <FilterX class="w-4 h-4" />
              {{ t('posts.resetFilters') }}
            </button>
          </div>

          <!-- Pagination -->
          <div v-if="totalPages > 1" class="mt-8 flex justify-center">
            <div class="flex items-center gap-2">
              <button
                v-for="page in totalPages"
                :key="`page-${page}`"
                @click="handlePageChange(page)"
                :class="[
                  'px-4 py-2 rounded-md',
                  Number(route.query.page || 1) === page
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                ]"
              >
                {{ page }}
              </button>
            </div>
          </div>
        </div>

        <!-- Sidebar -->
        <div class="lg:w-[320px] flex-shrink-0">
          <PostSidebar 
            :initial-filters="filters"
            :should-reset="shouldResetSidebar"
            @filter-change="handleFilterChange"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.first-letter-styled {
  display: block;
}

.first-letter-styled::first-letter {
  font-size: 3.5em;
  font-weight: 700;
  @apply text-primary-500;
  float: left;
  padding-right: 0.2em;
  line-height: 0.85;
  margin-top: -0.1em;
}

.first-letter-styled p {
  margin: 0;
  padding: 0;
}
</style>
