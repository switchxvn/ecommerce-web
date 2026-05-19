<script setup lang="ts">
import { computed, reactive, watch } from 'vue'
import { setResponseStatus } from 'h3'
import { useRequestEvent } from 'nuxt/app'
import { useLocalization } from '../../composables/useLocalization'
import { useTrpc } from '../../composables/useTrpc'
import { useCategory } from '../../composables/useCategory'
import { useRoute, useRouter } from 'vue-router'
import CategorySidebar from '../../components/sidebar/CategorySidebar.vue'
import CategoryMobileSidebar from '../../components/sidebar/CategoryMobileSidebar.vue'
import ProductCard from '../../components/cards/ProductCard.vue'
import { useProduct, type ProductFilter, type ProductSortBy } from '../../composables/useProduct'
import { usePageSeo } from '~/composables/usePageSeo'
import { getCategoryDetailRoute, getCategoryListRoute, getContactRoute } from '~/utils/routes'
import { buildCollectionPageSchema, resolveSeoCanonicalUrl } from '~/utils/seo'
import { hasActiveCategoryFilters, resolveCategoryPageState } from '~/utils/categoryPageState'

const { t, locale } = useLocalization()
const trpc = useTrpc()
const route = useRoute()
const router = useRouter()
const siteUrl = useRuntimeConfig().public.siteUrl
const { fetchCategoryBySlug } = useCategory()
const slug = computed(() => route.params.slug as string)

definePageMeta({
  layout: 'default',
})

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
}

interface LocalizedCategoryLink {
  id: number;
  name: string;
  slug: string;
}

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

interface FilterState extends CategoryProductFilter {
  categorySlug: string;
}

interface BreadcrumbItem {
  label: string;
  to: string;
  active?: boolean;
}

const filters = reactive<FilterState>({
  search: route.query.search as string || '',
  minPrice: route.query.minPrice ? Number(route.query.minPrice) : undefined,
  maxPrice: route.query.maxPrice ? Number(route.query.maxPrice) : undefined,
  includeNullPrice: true,
  categories: [],
  isFeatured: route.query.isFeatured === 'true',
  isNew: route.query.isNew === 'true',
  isSale: route.query.isSale === 'true',
  sortBy: (route.query.sortBy as ProductSortBy) || 'newest',
  page: Number(route.query.page) || 1,
  limit: Number(route.query.limit) || 12,
  categorySlug: slug.value
})

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
}

const { data: category, error: categoryError, refresh: refreshCategory } = await useAsyncData<Category | null>(
  `category-${slug.value}-${locale.value}`,
  async () => {
    const result = await fetchCategoryBySlug(slug.value)
    return result ? result as unknown as Category : null
  },
  {
    immediate: true,
    watch: [slug, locale]
  }
)

const { data: suggestedCategoriesData } = await useAsyncData<Category[]>(
  `category-suggestions-${locale.value}`,
  async () => {
    const result = await trpc.category.byType.query({
      type: 'product',
      locale: locale.value,
    })

    return (result as Category[]) || []
  },
  {
    default: () => [],
    watch: [locale],
  }
)

const categoryData = computed<Category>(() => category.value || {} as Category)
const categoryTranslation = computed(() =>
  categoryData.value.translations?.find((translation) => translation.locale === locale.value),
)
const categoryName = computed(() => categoryTranslation.value?.name || categoryData.value.name || '')
const categoryDescription = computed(() => categoryTranslation.value?.description || categoryData.value.description || '')
const error = computed(() => categoryError.value ? (categoryError.value as Error).message : null)
const hasActiveFilters = computed(() => hasActiveCategoryFilters(filters))

const {
  filters: productFilters,
  products,
  totalProducts,
  isLoadingProducts: isLoading,
  fetchProducts
} = useProduct(initialFilters)

const pageState = computed(() =>
  resolveCategoryPageState({
    categoryId: categoryData.value?.id,
    totalProducts: totalProducts.value,
    hasActiveFilters: hasActiveFilters.value,
    errorMessage: error.value,
  }),
)
const isInvalidCategory = computed(() => pageState.value.kind === 'invalid-category')
const isFilteredEmptyState = computed(() => pageState.value.kind === 'filtered-empty')
const isEmptyCategoryState = computed(() => pageState.value.kind === 'empty-category')
const showCategoryError = computed(() => Boolean(error.value) && !isInvalidCategory.value)

const resolveCategoryLink = (item: Category): LocalizedCategoryLink => {
  const translation = item.translations?.find((entry) => entry.locale === locale.value)

  return {
    id: item.id,
    name: translation?.name || item.name,
    slug: translation?.slug || item.slug,
  }
}

const relatedCategories = computed(() =>
  (suggestedCategoriesData.value || [])
    .filter((item) => item.id !== categoryData.value?.id)
    .map(resolveCategoryLink)
    .filter((item) => Boolean(item.slug))
    .slice(0, 4),
)

if (import.meta.server) {
  const requestEvent = useRequestEvent()

  if (requestEvent && isInvalidCategory.value) {
    setResponseStatus(requestEvent, 404)
  }
}

const categorySlugByLocale = computed(() => ({
  vi: categoryData.value.translations?.find((translation) => translation.locale === 'vi')?.slug || categoryData.value.slug,
  en: categoryData.value.translations?.find((translation) => translation.locale === 'en')?.slug,
}))

const resolvedCanonicalUrl = computed(() =>
  resolveSeoCanonicalUrl({
    siteUrl,
    currentPath: route.path,
    locale: locale.value === 'en' ? 'en' : 'vi',
    routeKey: 'category-detail',
    slugByLocale: categorySlugByLocale.value,
  }),
)

const pageTitle = computed(() => {
  if (isInvalidCategory.value) {
    return t('categories.invalidCategoryTitle') || 'Không tìm thấy danh mục'
  }

  return categoryTranslation.value?.metaTitle || categoryName.value || t('categories.defaultTitle')
})

const pageDescription = computed(() => {
  if (isInvalidCategory.value) {
    return t('categories.invalidCategoryDescription') || 'Danh mục bạn đang tìm không tồn tại hoặc đã được cập nhật đường dẫn.'
  }

  return categoryTranslation.value?.metaDescription || `${t('categories.productsIn')} ${categoryName.value}`
})

usePageSeo({
  title: pageTitle,
  description: pageDescription,
  keywords: computed(() => categoryTranslation.value?.metaKeywords || `${categoryName.value}, ${t('categories.defaultKeywords')}`),
  ogTitle: computed(() => categoryTranslation.value?.ogTitle || categoryTranslation.value?.metaTitle || pageTitle.value),
  ogDescription: computed(() => categoryTranslation.value?.ogDescription || categoryTranslation.value?.metaDescription || pageDescription.value),
  image: computed(() => categoryTranslation.value?.ogImage || ''),
  robots: computed(() => pageState.value.shouldIndex ? 'index,follow' : 'noindex,nofollow'),
  canonicalUrl: computed(() => resolvedCanonicalUrl.value),
  currentPath: computed(() => route.path),
  locale: computed(() => (locale.value === 'en' ? 'en' : 'vi')),
  routeKey: 'category-detail',
  slugByLocale: categorySlugByLocale,
  breadcrumbs: computed(() => [
    { name: t('common.home') || 'Home', item: '/' },
    { name: t('common.categories') || 'Categories', item: locale.value === 'en' ? '/categories' : '/danh-muc-san-pham' },
    { name: isInvalidCategory.value ? (t('categories.invalidCategoryTitle') || 'Không tìm thấy danh mục') : (categoryName.value || 'Category') },
  ]),
  schemas: computed(() => isInvalidCategory.value ? [] : [
    buildCollectionPageSchema(
      siteUrl,
      categoryName.value || 'Category',
      categoryDescription.value || `${t('categories.productsIn')} ${categoryName.value}`,
      resolvedCanonicalUrl.value,
    ),
  ]),
})

const convertCategoryIds = (ids: (string | number)[]): number[] =>
  ids.map((id) => typeof id === 'string' ? parseInt(id, 10) : id)

const sortOptions = computed(() => [
  { value: 'newest' as ProductSortBy, label: t('sort.newest') },
  { value: 'oldest' as ProductSortBy, label: t('sort.oldest') },
  { value: 'price_asc' as ProductSortBy, label: t('sort.price_asc') },
  { value: 'price_desc' as ProductSortBy, label: t('sort.price_desc') },
])

watch([() => slug.value, () => categoryData.value?.id], async ([, newId]) => {
  if (!newId) {
    return
  }

  const updatedFilters: FilterState = {
    search: route.query.search as string || '',
    minPrice: route.query.minPrice ? Number(route.query.minPrice) : undefined,
    maxPrice: route.query.maxPrice ? Number(route.query.maxPrice) : undefined,
    includeNullPrice: true,
    categories: [newId.toString()],
    isFeatured: route.query.isFeatured === 'true',
    isNew: route.query.isNew === 'true',
    isSale: route.query.isSale === 'true',
    sortBy: (route.query.sortBy as ProductSortBy) || 'newest',
    page: Number(route.query.page) || 1,
    limit: Number(route.query.limit) || 12,
    categorySlug: slug.value
  }

  Object.assign(filters, updatedFilters)
  productFilters.value = {
    ...updatedFilters,
    categories: convertCategoryIds(updatedFilters.categories),
    locale: locale.value
  }

  if (!isLoading.value) {
    fetchProducts()
  }
}, { immediate: true })

const handleFilterChange = (newFilters: ProductFilter) => {
  if (!categoryData.value?.id) return

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
  }

  Object.assign(filters, updatedFilters)
  productFilters.value = {
    ...updatedFilters,
    categories: convertCategoryIds(updatedFilters.categories),
    locale: locale.value
  }

  updateQueryParams()
}

const handleSortChange = (event: Event) => {
  const target = event.target as HTMLSelectElement
  const newSortBy = target.value as ProductSortBy

  filters.sortBy = newSortBy
  filters.page = 1
  productFilters.value.sortBy = newSortBy
  productFilters.value.page = 1

  updateQueryParams()
}

const resetAllFilters = () => {
  handleFilterChange({
    ...initialFilters,
    locale: locale.value,
  })
}

const breadcrumbItems = computed<BreadcrumbItem[]>(() => {
  const items: BreadcrumbItem[] = [
    { label: t('common.home'), to: '/' },
    { label: t('common.categories'), to: getCategoryListRoute(locale.value) }
  ]

  if (isInvalidCategory.value) {
    items.push({
      label: t('categories.invalidCategoryTitle') || 'Không tìm thấy danh mục',
      to: route.path,
      active: true,
    })

    return items
  }

  if (categoryData.value?.parent) {
    items.push({
      label: categoryData.value.parent.name,
      to: getCategoryDetailRoute(categoryData.value.parent.slug, locale.value)
    })
  }

  items.push({
    label: categoryName.value || slug.value,
    to: getCategoryDetailRoute(slug.value, locale.value),
    active: true
  })

  return items
})

const handlePageChange = (page: number) => {
  filters.page = page
  productFilters.value.page = page
  updateQueryParams()
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const updateQueryParams = () => {
  if (!categoryData.value?.id) return

  const query: Record<string, string | number | undefined> = {}

  if (filters.search) query.search = filters.search
  if (filters.minPrice !== undefined) query.minPrice = filters.minPrice
  if (filters.maxPrice !== undefined) query.maxPrice = filters.maxPrice
  if (filters.includeNullPrice) query.includeNullPrice = 'true'
  if (filters.isFeatured) query.isFeatured = 'true'
  if (filters.isNew) query.isNew = 'true'
  if (filters.isSale) query.isSale = 'true'
  if (filters.sortBy && filters.sortBy !== 'newest') query.sortBy = filters.sortBy
  if (filters.page > 1) query.page = filters.page
  if (filters.limit !== 12) query.limit = filters.limit

  router.replace({ query })

  if (!isLoading.value) {
    fetchProducts()
  }
}
</script>

<template>
  <div class="products-page bg-gray-50 dark:bg-gray-900">
    <div class="container mx-auto px-4 py-8">
      <div v-if="showCategoryError" class="mb-8 rounded-lg border border-red-200 bg-red-50 p-8 text-center dark:border-red-800 dark:bg-red-900/20">
        <UIcon name="i-heroicons-exclamation-circle" class="mx-auto mb-4 h-12 w-12 text-red-500" />
        <h3 class="mb-2 text-lg font-medium text-red-800 dark:text-red-400">{{ t('common.error') }}</h3>
        <p class="text-red-600 dark:text-red-300">{{ error }}</p>
        <UButton color="red" variant="soft" class="mt-4" @click="refreshCategory">
          {{ t('common.tryAgain') }}
        </UButton>
      </div>

      <template v-else>
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
            {{ isInvalidCategory ? (t('categories.invalidCategoryTitle') || 'Không tìm thấy danh mục') : (categoryName || slug) }}
          </h1>
          <p v-if="isInvalidCategory" class="mt-2 max-w-3xl text-gray-600 dark:text-gray-400">
            {{ t('categories.invalidCategoryDescription') || 'Danh mục bạn đang tìm không tồn tại hoặc đã được cập nhật đường dẫn.' }}
          </p>
          <p v-else-if="categoryDescription" class="mt-2 text-gray-600 dark:text-gray-400">
            {{ categoryDescription }}
          </p>
        </div>

        <div
          v-if="isInvalidCategory"
          class="mb-10 overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-800"
        >
          <div class="grid gap-6 p-6 md:grid-cols-[1.4fr_1fr] md:p-8">
            <div>
              <p class="mb-3 inline-flex rounded-full bg-amber-100 px-3 py-1 text-sm font-medium text-amber-800 dark:bg-amber-900/40 dark:text-amber-200">
                404 / {{ t('categories.invalidCategoryLabel') || 'Đường dẫn không hợp lệ' }}
              </p>
              <h2 class="text-2xl font-semibold text-gray-900 dark:text-white">
                {{ t('categories.invalidCategoryHeading') || 'Có thể danh mục đã đổi tên hoặc link đang bị sai' }}
              </h2>
              <p class="mt-3 text-gray-600 dark:text-gray-300">
                {{ t('categories.invalidCategoryHelp') || 'Bạn có thể quay về trang danh mục sản phẩm, xem các nhóm xe nâng nổi bật hoặc liên hệ trực tiếp để MGA tư vấn model phù hợp tải trọng và ngân sách.' }}
              </p>
              <div class="mt-6 flex flex-wrap gap-3">
                <NuxtLink
                  :to="getCategoryListRoute(locale)"
                  class="inline-flex items-center rounded-full bg-primary-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-primary-700"
                >
                  {{ t('categories.backToCategoryList') || 'Xem tất cả danh mục' }}
                </NuxtLink>
                <NuxtLink
                  :to="getContactRoute(locale)"
                  class="inline-flex items-center rounded-full border border-gray-300 px-5 py-3 text-sm font-semibold text-gray-800 transition hover:border-primary-500 hover:text-primary-600 dark:border-gray-600 dark:text-gray-100 dark:hover:border-primary-400 dark:hover:text-primary-300"
                >
                  {{ t('categories.contactForAdvice') || 'Liên hệ tư vấn mua hàng' }}
                </NuxtLink>
              </div>
            </div>

            <div class="rounded-2xl bg-gray-50 p-5 dark:bg-gray-900/60">
              <p class="text-sm font-semibold uppercase tracking-[0.14em] text-gray-500 dark:text-gray-400">
                {{ t('categories.quickSupport') || 'Hỗ trợ nhanh' }}
              </p>
              <div class="mt-4 space-y-4">
                <a href="tel:0917001254" class="block rounded-2xl border border-gray-200 bg-white p-4 transition hover:border-primary-500 dark:border-gray-700 dark:bg-gray-800">
                  <p class="text-sm text-gray-500 dark:text-gray-400">{{ t('categories.salesHotline') || 'Hotline mua hàng' }}</p>
                  <p class="mt-1 text-xl font-bold text-gray-900 dark:text-white">0917 001 254</p>
                </a>
                <a href="tel:0918865060" class="block rounded-2xl border border-gray-200 bg-white p-4 transition hover:border-primary-500 dark:border-gray-700 dark:bg-gray-800">
                  <p class="text-sm text-gray-500 dark:text-gray-400">{{ t('categories.serviceHotline') || 'Hỗ trợ dịch vụ' }}</p>
                  <p class="mt-1 text-xl font-bold text-gray-900 dark:text-white">0918 865 060</p>
                </a>
              </div>
            </div>
          </div>

          <div v-if="relatedCategories.length > 0" class="border-t border-gray-200 bg-gray-50 px-6 py-6 dark:border-gray-700 dark:bg-gray-900/40 md:px-8">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
              {{ t('categories.suggestedCategories') || 'Danh mục được xem nhiều' }}
            </h3>
            <div class="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <NuxtLink
                v-for="item in relatedCategories"
                :key="item.id"
                :to="getCategoryDetailRoute(item.slug, locale)"
                class="rounded-2xl border border-gray-200 bg-white px-4 py-4 text-sm font-medium text-gray-800 transition hover:border-primary-500 hover:text-primary-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:hover:border-primary-400 dark:hover:text-primary-300"
              >
                {{ item.name }}
              </NuxtLink>
            </div>
          </div>
        </div>

        <template v-else>
          <div v-if="categoryData?.children && categoryData.children.length > 0" class="mb-8">
            <h2 class="mb-4 text-xl font-semibold text-gray-900 dark:text-white">
              {{ t('categories.subcategories') }}
            </h2>
            <div class="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              <NuxtLink
                v-for="subcat in categoryData.children"
                :key="subcat.id"
                :to="getCategoryDetailRoute(subcat.slug, locale)"
                class="flex flex-col items-center rounded-lg border border-gray-200 bg-white p-4 text-center transition-colors hover:border-primary-500 hover:bg-primary-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:border-primary-500 dark:hover:bg-primary-900/30"
              >
                <span class="mt-2 text-sm font-medium text-gray-900 dark:text-white">{{ subcat.name }}</span>
              </NuxtLink>
            </div>
          </div>

          <CategoryMobileSidebar
            v-if="pageState.shouldShowFilters"
            :initial-filters="filters"
            :category-id="categoryData?.id"
            @filter-change="handleFilterChange"
            class="mb-6 lg:hidden"
          />

          <div class="flex flex-col gap-8 lg:flex-row">
            <div v-if="pageState.shouldShowFilters" class="hidden lg:block lg:w-1/4">
              <CategorySidebar
                :initial-filters="filters"
                :category-id="categoryData?.id"
                @filter-change="handleFilterChange"
              />
            </div>

            <div :class="pageState.shouldShowFilters ? 'lg:w-3/4' : 'lg:w-full'">
              <div v-if="pageState.kind === 'has-products' || isFilteredEmptyState" class="mb-6 flex flex-wrap items-center justify-between gap-4">
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

              <div v-if="isLoading" class="py-2">
                <CardGridSkeleton :item-count="6" :columns="3" />
              </div>

              <template v-else>
                <div v-if="isFilteredEmptyState" class="rounded-3xl border border-amber-200 bg-amber-50 p-6 dark:border-amber-900/60 dark:bg-amber-900/20">
                  <h3 class="text-xl font-semibold text-amber-900 dark:text-amber-100">
                    {{ t('categories.filteredEmptyTitle') || 'Chưa có sản phẩm phù hợp với bộ lọc hiện tại' }}
                  </h3>
                  <p class="mt-2 text-amber-800 dark:text-amber-200">
                    {{ t('categories.filteredEmptyDescription') || 'Hãy nới khoảng giá, bỏ bớt điều kiện lọc hoặc xem toàn bộ danh mục để tìm model phù hợp hơn.' }}
                  </p>
                  <div class="mt-4 flex flex-wrap gap-3">
                    <button
                      type="button"
                      class="inline-flex items-center rounded-full bg-amber-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-amber-700"
                      @click="resetAllFilters"
                    >
                      {{ t('products.resetFilters') || 'Đặt lại bộ lọc' }}
                    </button>
                    <NuxtLink
                      :to="getContactRoute(locale)"
                      class="inline-flex items-center rounded-full border border-amber-300 px-5 py-3 text-sm font-semibold text-amber-900 transition hover:border-amber-500 dark:border-amber-700 dark:text-amber-100"
                    >
                      {{ t('categories.contactForAdvice') || 'Nhờ tư vấn nhanh' }}
                    </NuxtLink>
                  </div>
                </div>

                <div v-else-if="isEmptyCategoryState" class="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-800 md:p-8">
                  <h3 class="text-2xl font-semibold text-gray-900 dark:text-white">
                    {{ t('categories.emptyCategoryTitle') || 'Danh mục này đang được cập nhật sản phẩm' }}
                  </h3>
                  <p class="mt-3 max-w-3xl text-gray-600 dark:text-gray-300">
                    {{ t('categories.emptyCategoryDescription') || 'MGA chưa đăng sản phẩm trong nhóm này hoặc đang chuẩn hóa lại cấu hình. Bạn có thể xem các danh mục liên quan hoặc liên hệ để nhận tư vấn báo giá nhanh.' }}
                  </p>
                  <div class="mt-5 flex flex-wrap gap-3">
                    <NuxtLink
                      :to="getCategoryListRoute(locale)"
                      class="inline-flex items-center rounded-full bg-primary-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-primary-700"
                    >
                      {{ t('categories.backToCategoryList') || 'Xem tất cả danh mục' }}
                    </NuxtLink>
                    <NuxtLink
                      :to="getContactRoute(locale)"
                      class="inline-flex items-center rounded-full border border-gray-300 px-5 py-3 text-sm font-semibold text-gray-800 transition hover:border-primary-500 hover:text-primary-600 dark:border-gray-600 dark:text-gray-100 dark:hover:border-primary-400 dark:hover:text-primary-300"
                    >
                      {{ t('categories.contactForAdvice') || 'Liên hệ tư vấn mua hàng' }}
                    </NuxtLink>
                  </div>

                  <div v-if="relatedCategories.length > 0" class="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    <NuxtLink
                      v-for="item in relatedCategories"
                      :key="item.id"
                      :to="getCategoryDetailRoute(item.slug, locale)"
                      class="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-4 text-sm font-medium text-gray-800 transition hover:border-primary-500 hover:text-primary-600 dark:border-gray-700 dark:bg-gray-900/40 dark:text-gray-100 dark:hover:border-primary-400 dark:hover:text-primary-300"
                    >
                      {{ item.name }}
                    </NuxtLink>
                  </div>
                </div>

                <template v-else>
                  <div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    <ProductCard
                      v-for="product in products"
                      :key="product.id"
                      :product="product"
                      :locale="locale"
                    />
                  </div>

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
