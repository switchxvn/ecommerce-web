<script setup lang="ts">
import { ref, computed, onMounted, watch, reactive } from 'vue'
import { useLocalization } from '../../composables/useLocalization'
import { useTrpc } from '../../composables/useTrpc'
import { useCategory } from '../../composables/useCategory'
import { useRoute, useRouter } from 'vue-router'
import CategorySidebar from '../../components/sidebar/CategorySidebar.vue'
import CategoryMobileSidebar from '../../components/sidebar/CategoryMobileSidebar.vue'
import ProductCard from '../../components/cards/ProductCard.vue'
import { useProduct, type ProductFilter, type ProductSortBy } from '../../composables/useProduct'
import { usePageSeo } from '~/composables/usePageSeo'
import { buildCollectionPageSchema, resolveSeoCanonicalUrl } from '~/utils/seo'

// Sử dụng composables
const { t, locale } = useLocalization()
const trpc = useTrpc()
const route = useRoute()
const router = useRouter()
const siteUrl = useRuntimeConfig().public.siteUrl
const { 
  fetchProductCategories,
  fetchCategoryBySlug,
  getCategoryTranslation
} = useCategory()
const slug = computed(() => route.params.slug as string)

// Định nghĩa alias cho URL tiếng Việt
definePageMeta({
  layout: 'default',
})

// Định nghĩa interface Category đầy đủ
interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string;
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  canonicalUrl?: string;
  parent?: Category | null;
  children?: Category[];
  translations?: Array<{
    locale: string;
    name: string;
    description?: string;
    slug?: string;
  }>;
  type?: string;
  active?: boolean;
  isFeatured?: boolean;
  attributes?: Array<{
    id: number;
    name: string;
    values: string[];
    translations?: Array<{
      locale: string;
      name: string;
    }>;
  }>;
}

// Sử dụng useAsyncData để tải dữ liệu category trước khi trang được render (SSR)
const { data: category, error: categoryError, refresh: refreshCategory } = await useAsyncData<Category | null>(
  `category-${slug.value}-${locale.value}`,
  async (ctx) => {
    try {
      const result = await fetchCategoryBySlug(slug.value);
      return result ? result as unknown as Category : null;
    } catch (err) {
      console.error('Error fetching category:', err);
      return null;
    }
  },
  {
    immediate: true,
    watch: [slug, locale]
  }
);

// Computed properties để truy cập dữ liệu category an toàn
const categoryData = computed<Category>(() => category.value || {} as Category);
const categoryTranslation = computed(() =>
  categoryData.value.translations?.find(t => t.locale === locale.value),
);
const categoryName = computed(() => {
  return categoryTranslation.value?.name || categoryData.value.name || '';
});
const categoryDescription = computed(() => {
  return categoryTranslation.value?.description || categoryData.value.description || '';
});
const error = computed(() => categoryError.value ? (categoryError.value as Error).message : null)

const categorySlugByLocale = computed(() => ({
  vi: categoryData.value.translations?.find((translation) => translation.locale === 'vi')?.slug || categoryData.value.slug,
  en: categoryData.value.translations?.find((translation) => translation.locale === 'en')?.slug,
}));

const resolvedCanonicalUrl = computed(() =>
  resolveSeoCanonicalUrl({
    siteUrl,
    currentPath: route.path,
    locale: locale.value === 'en' ? 'en' : 'vi',
    routeKey: 'category-detail',
    slugByLocale: categorySlugByLocale.value,
  }),
);

usePageSeo({
  title: computed(() => categoryTranslation.value?.metaTitle || categoryName.value || t('categories.defaultTitle')),
  description: computed(() => categoryTranslation.value?.metaDescription || `${t('categories.productsIn')} ${categoryName.value}`),
  keywords: computed(() => categoryTranslation.value?.metaKeywords || `${categoryName.value}, ${t('categories.defaultKeywords')}`),
  ogTitle: computed(() => categoryTranslation.value?.ogTitle || categoryTranslation.value?.metaTitle || categoryName.value),
  ogDescription: computed(() => categoryTranslation.value?.ogDescription || categoryTranslation.value?.metaDescription || `${t('categories.productsIn')} ${categoryName.value}`),
  image: computed(() => categoryTranslation.value?.ogImage || ''),
  canonicalUrl: computed(() => resolvedCanonicalUrl.value),
  currentPath: computed(() => route.path),
  locale: computed(() => (locale.value === 'en' ? 'en' : 'vi')),
  routeKey: 'category-detail',
  slugByLocale: categorySlugByLocale,
  breadcrumbs: computed(() => [
    { name: t('common.home') || 'Home', item: locale.value === 'en' ? '/en' : '/' },
    { name: t('common.categories') || 'Categories', item: locale.value === 'en' ? '/en/categories' : '/danh-muc-san-pham' },
    { name: categoryName.value || 'Category' },
  ]),
  schemas: computed(() => [
    buildCollectionPageSchema(
      siteUrl,
      categoryName.value || 'Category',
      categoryDescription.value || `${t('categories.productsIn')} ${categoryName.value}`,
      resolvedCanonicalUrl.value,
    ),
  ]),
});

// Extend ProductFilter to ensure includeNullPrice is required and boolean
interface CategoryProductFilter extends Omit<ProductFilter, 'categories'> {
  includeNullPrice: boolean;
  categories: string[];
  isFeatured: boolean;
  isNew: boolean;
  isSale: boolean;
  sortBy: ProductSortBy;
  page: number;
  limit: number;
}

// Update FilterState to use CategoryProductFilter
interface FilterState extends CategoryProductFilter {
  categorySlug: string;
}

// Convert string IDs to numbers for API
const convertCategoryIds = (ids: (string | number)[]): number[] => {
  return ids.map(id => typeof id === 'string' ? parseInt(id, 10) : id);
};

// Initialize filters
const filters = reactive<FilterState>({
  search: route.query.search as string || '',
  minPrice: route.query.minPrice ? Number(route.query.minPrice) : undefined,
  maxPrice: route.query.maxPrice ? Number(route.query.maxPrice) : undefined,
  includeNullPrice: true,
  categories: [], // Will be updated when category data is loaded
  isFeatured: route.query.isFeatured === 'true',
  isNew: route.query.isNew === 'true',
  isSale: route.query.isSale === 'true',
  sortBy: (route.query.sortBy as ProductSortBy) || 'newest',
  page: Number(route.query.page) || 1,
  limit: Number(route.query.limit) || 12,
  categorySlug: slug.value
});

// Update initial filters
const initialFilters: CategoryProductFilter = {
  search: '',
  minPrice: undefined,
  maxPrice: undefined,
  includeNullPrice: true,
  categories: [],
  isFeatured: false,
  isNew: false,
  isSale: false,
  sortBy: 'newest',
  page: 1,
  limit: 12,
  locale: locale.value
};

// Initialize product composable
const {
  filters: productFilters,
  products,
  totalProducts,
  totalPages,
  isLoadingProducts: isLoading,
  fetchProducts
} = useProduct(initialFilters);

// Sort options as computed property to ensure translations are updated
const sortOptions = computed(() => [
  { value: "newest" as ProductSortBy, label: t("sort.newest") },
  { value: "oldest" as ProductSortBy, label: t("sort.oldest") },
  { value: "price_asc" as ProductSortBy, label: t("sort.price_asc") },
  { value: "price_desc" as ProductSortBy, label: t("sort.price_desc") },
]);

// Watch for category changes to update filters and fetch products
watch([() => slug.value, () => categoryData.value?.id], async ([newSlug, newId]) => {
  if (newId) {
    const updatedFilters: FilterState = {
      search: route.query.search as string || '',
      minPrice: route.query.minPrice ? Number(route.query.minPrice) : undefined,
      maxPrice: route.query.maxPrice ? Number(route.query.maxPrice) : undefined,
      includeNullPrice: true,
      categories: [newId],
      isFeatured: route.query.isFeatured === 'true',
      isNew: route.query.isNew === 'true',
      isSale: route.query.isSale === 'true',
      sortBy: (route.query.sortBy as ProductSortBy) || 'newest',
      page: Number(route.query.page) || 1,
      limit: Number(route.query.limit) || 12,
      categorySlug: slug.value
    };

    Object.assign(filters, updatedFilters);
    
    // Convert to API format
    productFilters.value = {
      ...updatedFilters,
      categories: convertCategoryIds(updatedFilters.categories),
      locale: locale.value
    };
    
    if (!isLoading.value) {
      fetchProducts();
    }
  }
}, { immediate: true });

// Handle filter changes
const handleFilterChange = (newFilters: ProductFilter) => {
  if (!categoryData.value?.id) return;
  
  const updatedFilters: FilterState = {
    ...newFilters,
    categories: [categoryData.value.id.toString()],
    categorySlug: slug.value,
    search: newFilters.search || '',
    limit: newFilters.limit || 12,
    page: 1,
    includeNullPrice: newFilters.includeNullPrice ?? true,
    isFeatured: newFilters.isFeatured ?? false,
    isNew: newFilters.isNew ?? false,
    isSale: newFilters.isSale ?? false,
    sortBy: newFilters.sortBy || 'newest'
  };
  
  Object.assign(filters, updatedFilters);
  
  // Convert to API format
  productFilters.value = {
    ...updatedFilters,
    categories: convertCategoryIds(updatedFilters.categories),
    locale: locale.value
  };
  
  updateQueryParams();
};

// Handle sort change
const handleSortChange = (event: Event) => {
  const target = event.target as HTMLSelectElement;
  const newSortBy = target.value as ProductSortBy;
  
  // Update both filter states
  filters.sortBy = newSortBy;
  filters.page = 1;
  
  productFilters.value.sortBy = newSortBy;
  productFilters.value.page = 1;
  
  updateQueryParams();
};

// Breadcrumb data
interface BreadcrumbItem {
  label: string;
  to: string;
  active?: boolean;
}

const breadcrumbItems = computed<BreadcrumbItem[]>(() => {
  const items: BreadcrumbItem[] = [
    { label: t('common.home'), to: '/' },
    { label: t('common.categories'), to: '/categories' }
  ];
  
  if (categoryData.value?.parent) {
    items.push({
      label: categoryData.value.parent.name,
      to: `/categories/${categoryData.value.parent.slug}`
    });
  }
  
  items.push({
    label: categoryName.value || slug.value,
    to: `/categories/${slug.value}`,
    active: true
  });
  
  return items;
});

// Handle page change
const handlePageChange = (page: number) => {
  // Update both filter states
  filters.page = page;
  productFilters.value.page = page;
  
  // Update URL query params
  updateQueryParams();
  
  // Scroll to top
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

// Update URL query params and fetch products
const updateQueryParams = () => {
  if (!categoryData.value?.id) return;
  
  // Build query params object
  const query: Record<string, string | number | undefined> = {};
  
  if (filters.search) query.search = filters.search;
  if (filters.minPrice !== undefined) query.minPrice = filters.minPrice;
  if (filters.maxPrice !== undefined) query.maxPrice = filters.maxPrice;
  if (filters.includeNullPrice) query.includeNullPrice = 'true';
  if (filters.isFeatured) query.isFeatured = 'true';
  if (filters.isNew) query.isNew = 'true';
  if (filters.isSale) query.isSale = 'true';
  if (filters.sortBy && filters.sortBy !== 'newest') query.sortBy = filters.sortBy;
  if (filters.page > 1) query.page = filters.page;
  if (filters.limit !== 12) query.limit = filters.limit;
  
  // Update route without category in query
  router.replace({ query });
  
  // Fetch products with current filters
  if (!isLoading.value) {
    fetchProducts();
  }
};
</script>

<template>
  <div class="products-page bg-gray-50 dark:bg-gray-900">
    <div class="container mx-auto px-4 py-8">
      <div v-if="error" class="mb-8 rounded-lg border border-red-200 bg-red-50 p-8 text-center dark:border-red-800 dark:bg-red-900/20">
        <UIcon name="i-heroicons-exclamation-circle" class="mx-auto mb-4 h-12 w-12 text-red-500" />
        <h3 class="mb-2 text-lg font-medium text-red-800 dark:text-red-400">{{ t('common.error') }}</h3>
        <p class="text-red-600 dark:text-red-300">{{ error }}</p>
        <UButton color="red" variant="soft" class="mt-4" @click="refreshCategory">
          {{ t('common.tryAgain') }}
        </UButton>
      </div>
      
      <template v-else>
        <!-- Breadcrumb -->
        <nav class="mb-4">
          <ol class="flex flex-wrap items-center gap-2">
            <li v-for="(item, index) in breadcrumbItems" :key="index" class="flex items-center">
              <NuxtLink
                :to="item.to"
                :class="[
                  'text-sm hover:text-primary-600 dark:hover:text-primary-400',
                  item.active ? 'text-primary-600 dark:text-primary-400' : 'text-gray-600 dark:text-gray-400'
                ]"
              >
                {{ item.label }}
              </NuxtLink>
              <span v-if="index < breadcrumbItems.length - 1" class="ml-2 text-gray-400">/</span>
            </li>
          </ol>
        </nav>

        <div class="mb-8">
          <h1 class="text-3xl font-bold text-gray-900 dark:text-white md:text-4xl">
            {{ categoryName || slug }}
          </h1>
          <p v-if="categoryDescription" class="mt-2 text-gray-600 dark:text-gray-400">
            {{ categoryDescription }}
          </p>
        </div>
        
        <!-- Subcategories (if any) -->
        <div v-if="categoryData?.children && categoryData.children.length > 0" class="mb-8">
          <h2 class="mb-4 text-xl font-semibold text-gray-900 dark:text-white">
            {{ t('categories.subcategories') }}
          </h2>
          <div class="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            <NuxtLink
              v-for="subcat in categoryData.children"
              :key="subcat.id"
              :to="`/categories/${subcat.slug}`"
              class="flex flex-col items-center rounded-lg border border-gray-200 bg-white p-4 text-center transition-colors hover:border-primary-500 hover:bg-primary-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:border-primary-500 dark:hover:bg-primary-900/30"
            >
              <span class="mt-2 text-sm font-medium text-gray-900 dark:text-white">{{ subcat.name }}</span>
            </NuxtLink>
          </div>
        </div>
        
        <!-- Mobile Sidebar -->
        <CategoryMobileSidebar
          :initial-filters="filters"
          :category-id="categoryData?.id"
          @filter-change="handleFilterChange"
          class="mb-6 lg:hidden"
        />
        
        <div class="flex flex-col gap-8 lg:flex-row">
          <!-- Desktop Sidebar -->
          <div class="hidden lg:block lg:w-1/4">
            <CategorySidebar
              :initial-filters="filters"
              :category-id="categoryData?.id"
              @filter-change="handleFilterChange"
            />
          </div>
          
          <!-- Products Content -->
          <div class="lg:w-3/4">
            <!-- Toolbar -->
            <div class="mb-6 flex flex-wrap items-center justify-between gap-4">
              <div class="flex items-center gap-2">
                <span class="text-sm text-gray-600 dark:text-gray-400">
                  {{ t('products.showing') }} {{ totalProducts }} {{ t('products.items') }}
                </span>
              </div>
              
              <div class="flex items-center gap-2">
                <label for="sort" class="text-sm text-gray-600 dark:text-gray-400">{{ t('posts.sortBy') }}:</label>
                <select
                  id="sort"
                  v-model="filters.sortBy"
                  @change="handleSortChange"
                  class="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm dark:border-gray-700 dark:bg-gray-800"
                >
                  <option v-for="option in sortOptions" :key="option.value" :value="option.value">
                    {{ option.label }}
                  </option>
                </select>
              </div>
            </div>
            
            <!-- Products Grid -->
            <template v-if="!error">
              <div v-if="isLoading" class="flex items-center justify-center py-12">
                <div class="text-center">
                  <div class="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary-500 border-r-transparent align-[-0.125em]" role="status">
                    <span class="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]">
                      {{ t('common.loading') }}...
                    </span>
                  </div>
                  <div class="mt-4 text-sm text-gray-600 dark:text-gray-400">
                    {{ t('common.loading') }}...
                  </div>
                </div>
              </div>

              <template v-else>
                <!-- Debug info -->
                <div v-if="products.length === 0" class="mb-4 rounded-lg bg-yellow-50 p-4 dark:bg-yellow-900/20">
                  <p class="text-yellow-800 dark:text-yellow-200">{{ t('products.noProducts') }}</p>
                  <pre class="mt-2 text-xs text-yellow-600 dark:text-yellow-400">Filters: {{ JSON.stringify(filters, null, 2) }}</pre>
                </div>

                <div v-else class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  <ProductCard
                    v-for="product in products"
                    :key="product.id"
                    :product="product"
                    :locale="locale"
                  />
                </div>

                <!-- Pagination -->
                <div v-if="totalProducts > 0" class="mt-8 flex justify-center">
                  <Pagination
                    v-model="filters.page"
                    :total="totalProducts"
                    :items-per-page="filters.limit"
                    :max-visible-buttons="5"
                    @update:model-value="handlePageChange"
                  />
                </div>
              </template>
            </template>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<style scoped>
/* Hiệu ứng hover cho các thẻ */
:deep(.u-breadcrumb-item) {
  @apply transition-colors duration-200;
}

:deep(.u-breadcrumb-item:hover) {
  @apply text-primary-600 dark:text-primary-400;
}

:deep(.u-pagination-item) {
  @apply transition-colors duration-200;
}

:deep(.u-pagination-item:hover) {
  @apply bg-primary-50 text-primary-600 dark:bg-primary-900/50 dark:text-primary-400;
}

:deep(.u-pagination-item.active) {
  @apply bg-primary-500 text-white dark:bg-primary-600;
}
</style> 
