<script setup lang="ts">
import { computed, reactive, watch } from 'vue'
import { setResponseStatus } from 'h3'
import { useRequestEvent } from 'nuxt/app'
import { useLocalization } from '../../composables/useLocalization'
import { useTrpc } from '../../composables/useTrpc'
import { useRoute, useRouter } from 'vue-router'
import type { CategoryTranslation as SharedCategoryTranslation } from '@ew/shared'
import CategorySidebar from '../../components/sidebar/CategorySidebar.vue'
import CategoryMobileSidebar from '../../components/sidebar/CategoryMobileSidebar.vue'
import ProductCard from '../../components/cards/ProductCard.vue'
import { useProduct, type ProductFilter, type ProductSortBy } from '../../composables/useProduct'
import { usePageSeo } from '~/composables/usePageSeo'
import { getCategoryDetailRoute, getCategoryListRoute, getContactRoute, getRouteLocale } from '~/utils/routes'
import { buildCollectionPageSchema, resolveSeoCanonicalUrl } from '~/utils/seo'
import { hasActiveCategoryFilters, resolveCategoryPageState } from '~/utils/categoryPageState'
import { formatCategoryPriceRange, formatCategoryPriceRangeSummary } from '~/utils/categoryPriceRange'
import { formatProductRangeSummary } from '~/utils/productListingSummary'

const { t, locale } = useLocalization()
const trpc = useTrpc()
const route = useRoute()
const router = useRouter()
const siteUrl = useRuntimeConfig().public.siteUrl
const slug = computed(() => route.params.slug as string)
const routeLocale = computed(() => {
  if (route.path.startsWith('/categories')) {
    return 'en'
  }

  if (route.path.startsWith('/danh-muc-san-pham')) {
    return 'vi'
  }

  return getRouteLocale(locale.value)
})

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
  translations?: CategoryTranslation[];
  type?: string;
  active?: boolean;
  isFeatured?: boolean;
  priceRangeMin?: number | null;
  priceRangeMax?: number | null;
}

type CategoryTranslation = Pick<
  SharedCategoryTranslation,
  | 'locale'
  | 'name'
  | 'description'
  | 'slug'
  | 'metaTitle'
  | 'metaDescription'
  | 'metaKeywords'
  | 'ogTitle'
  | 'ogDescription'
  | 'ogImage'
  | 'canonicalUrl'
>

interface LocalizedCategoryLink {
  id: number;
  name: string;
  slug: string;
}

interface CategoryProductFilter extends Omit<ProductFilter, 'categories'> {
  includeNullPrice: boolean;
  categories: number[];
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

interface CategorySupportLink {
  label: string;
  to: string;
}

interface CategorySupportBlock {
  eyebrow: string;
  heading: string;
  summary: string;
  bullets: string[];
  quickLinks: CategorySupportLink[];
  faq: Array<{
    question: string;
    answer: string;
  }>;
}

interface CategoryFilterAttribute {
  id: string;
  name: string;
  values: string[];
}

const tr = (key: string, fallback: string) => t(key) || fallback

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
  locale: routeLocale.value
}

const { data: category, pending: isCategoryPending, error: categoryError, refresh: refreshCategory } = await useAsyncData<Category | null>(
  `category-${slug.value}-${routeLocale.value}`,
  async () => {
    const result = await trpc.category.bySlug.query({
      slug: slug.value,
      locale: routeLocale.value,
    })
    return result ? result as unknown as Category : null
  },
  {
    immediate: true,
    watch: [slug, routeLocale]
  }
)

const resolveCategoryLinkForLocale = (
  item: Category,
  currentLocale: string,
): LocalizedCategoryLink => {
  const translation = item.translations?.find((entry) => entry.locale === currentLocale)

  return {
    id: item.id,
    name: translation?.name || item.name,
    slug: translation?.slug || item.slug,
  }
}

const { data: suggestedCategoryLinks } = await useAsyncData<LocalizedCategoryLink[]>(
  `category-suggestions-${routeLocale.value}`,
  async () => {
    const result = await trpc.category.byType.query({
      type: 'product',
      locale: routeLocale.value,
    })

    return ((result as Category[]) || [])
      .map((item) => resolveCategoryLinkForLocale(item, routeLocale.value))
      .filter((item) => Boolean(item.slug))
  },
  {
    default: () => [],
    watch: [routeLocale],
  }
)

const categoryData = computed<Category>(() => category.value || {} as Category)
const categoryTranslation = computed<CategoryTranslation | undefined>(() =>
  categoryData.value.translations?.find((translation: CategoryTranslation) => translation.locale === routeLocale.value)
  || categoryData.value.translations?.find((translation: CategoryTranslation) => translation.locale === locale.value)
  || categoryData.value.translations?.[0],
)
const categoryName = computed(() => categoryTranslation.value?.name || categoryData.value.name || '')
const categoryDescription = computed(() => categoryTranslation.value?.description || categoryData.value.description || '')
const categoryPriceRange = computed(() =>
  formatCategoryPriceRange(categoryData.value?.priceRangeMin, categoryData.value?.priceRangeMax),
)
const categoryPriceRangeSummary = computed(() =>
  formatCategoryPriceRangeSummary(categoryData.value?.priceRangeMin, categoryData.value?.priceRangeMax),
)
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
    isPending: isCategoryPending.value,
  }),
)
const isInvalidCategory = computed(() => pageState.value.kind === 'invalid-category')
const isFilteredEmptyState = computed(() => pageState.value.kind === 'filtered-empty')
const isEmptyCategoryState = computed(() => pageState.value.kind === 'empty-category')
const showCategoryError = computed(() => Boolean(error.value) && !isInvalidCategory.value && !isCategoryPending.value)

const relatedCategories = computed(() =>
  (suggestedCategoryLinks.value || [])
    .filter((item) => item.id !== categoryData.value?.id)
    .slice(0, 4),
)

const availableAttributes = computed<CategoryFilterAttribute[]>(() => {
  const attributesMap = new Map<string, CategoryFilterAttribute>()

  for (const product of products.value || []) {
    for (const attribute of product.variantAttributes?.attributes || []) {
      const attributeId = String(attribute.id)
      const existingAttribute = attributesMap.get(attributeId) || {
        id: attributeId,
        name: attribute.displayName || attribute.name,
        values: [],
      }

      const values = new Set(existingAttribute.values)
      for (const value of attribute.values || []) {
        const label = value.displayValue || value.value
        if (label) {
          values.add(label)
        }
      }

      attributesMap.set(attributeId, {
        ...existingAttribute,
        name: existingAttribute.name || attribute.displayName || attribute.name,
        values: Array.from(values),
      })
    }
  }

  return Array.from(attributesMap.values()).filter((attribute) => attribute.values.length > 0)
})

// Bao gia nhanh theo nhom nhu cau
const categorySupportBySlug: Record<string, CategorySupportBlock> = {
  'xe-nang-dau': {
    eyebrow: 'Báo giá nhanh theo nhóm nhu cầu',
    heading: 'Tập trung cho nhóm khách hàng đang tìm mua xe nâng dầu mới tại TPHCM',
    summary: 'Danh mục này là trang đích cho các truy vấn như bán xe nâng dầu, xe nâng dầu mới, xe nâng dầu 2.5 tấn đến 10 tấn và các bài toán vận hành ngoài trời hoặc tải nặng nhiều ca.',
    bullets: [
      'Phù hợp kho xưởng, bãi hàng và khu sản xuất cần động cơ mạnh, dễ bảo trì.',
      'Nhóm tải trọng được hỏi nhiều nhất hiện nay là 2.5 tấn, 3.0 tấn, 3.5 tấn, 5.0 tấn và 10 tấn.',
      'Có thể kết hợp thêm dịch vụ thuê ngắn hạn hoặc sửa chữa tận nơi tại TPHCM khi doanh nghiệp cần xử lý gấp.',
    ],
    quickLinks: [
      { label: 'Xe nâng dầu MGA 2.5 tấn', to: '/san-pham/xe-nang-dau-mga-2-5-tan' },
      { label: 'Xe nâng dầu MGA 3.0 tấn', to: '/san-pham/xe-nang-dau-mga-3-0-tan' },
      { label: 'Xe nâng dầu MGA 5.0 tấn', to: '/san-pham/xe-nang-dau-mga-5-0-tan' },
      { label: 'Dịch vụ cho thuê xe nâng TPHCM', to: '/dich-vu/cho-thue-xe-nang-tphcm' },
    ],
    faq: [
      {
        question: 'Khi nào nên ưu tiên xe nâng dầu?',
        answer: 'Khi doanh nghiệp vận hành ngoài trời, tải nặng, chạy nhiều ca hoặc cần biên tải ổn định ở môi trường công nghiệp nặng.',
      },
      {
        question: 'Nhóm xe dầu nào dễ cân đối ngân sách nhất?',
        answer: 'Nhóm 2.5-3.5 tấn thường là điểm bắt đầu hợp lý cho nhiều kho xưởng vì cân bằng giữa giá đầu tư và khả năng nâng pallet phổ thông.',
      },
    ],
  },
  'xe-nang-dien': {
    eyebrow: 'Báo giá nhanh theo nhóm nhu cầu',
    heading: 'Danh mục trung tâm cho cụm bán xe nâng điện và xe nâng điện theo tải trọng',
    summary: 'Trang này nhắm đến người dùng đang tìm xe nâng điện, xe nâng điện 1.5 tấn, 2 tấn, 3 tấn, xe nâng điện ngồi lái và các cấu hình vận hành trong kho kín tại TPHCM.',
    bullets: [
      'Ưu tiên cho kho trong nhà, nhà xưởng sạch, lối đi hẹp và nhu cầu vận hành êm.',
      'Có thể đối chiếu nhanh giữa xe điện đứng lái, ngồi lái và xe điện tải trọng 1.5-3.0 tấn.',
      'Khi phát sinh lỗi bình điện, bộ sạc hoặc mô-tơ, có thể điều hướng sang cụm sửa xe nâng điện tại TPHCM.',
    ],
    quickLinks: [
      { label: 'Xe nâng điện MGA 1.5 tấn', to: '/san-pham/xe-nang-dien-mga-1-5-tan' },
      { label: 'Xe nâng điện MGA 2.0 tấn', to: '/san-pham/xe-nang-dien-mga-2-0-tan' },
      { label: 'Xe nâng điện ngồi lái MGA 1.5 tấn', to: '/san-pham/xe-nang-dien-ngoi-lai-mga-1-5-tan' },
      { label: 'Dịch vụ sửa xe nâng điện TPHCM', to: '/dich-vu/sua-xe-nang-dien-tphcm' },
    ],
    faq: [
      {
        question: 'Xe nâng điện phù hợp môi trường nào nhất?',
        answer: 'Phù hợp kho trong nhà, khu thành phẩm, xưởng sạch và các điểm cần giảm tiếng ồn hoặc khí thải trong nhà.',
      },
      {
        question: 'Nên bắt đầu từ xe điện 1.5 tấn hay 2 tấn?',
        answer: 'Nếu pallet phổ thông và không nâng sát tải liên tục, 1.5 tấn đủ dùng; nếu muốn dư tải hơn cho hàng nặng, nhóm 2.0 tấn thường an toàn hơn.',
      },
    ],
  },
  'phu-tung-xe-nang': {
    eyebrow: 'Báo giá nhanh theo nhóm nhu cầu',
    heading: 'Điểm gom intent cho phụ tùng xe nâng và phụ tùng xe nâng dầu',
    summary: 'Danh mục này phục vụ các truy vấn phụ tùng xe nâng, phụ tùng xe nâng dầu và nhu cầu thay thế linh kiện nhanh để giảm thời gian dừng máy tại TPHCM.',
    bullets: [
      'Tập trung nhóm linh kiện hao mòn, phụ tùng hệ thống nâng, bánh xe, thủy lực và điện.',
      'Phù hợp khách hàng đang cần vừa mua phụ tùng vừa kiểm tra tình trạng xe để tránh thay sai hạng mục.',
      'Kết hợp chặt với cụm sửa chữa xe nâng và bảo dưỡng định kỳ để đẩy lead dịch vụ có giá trị cao hơn.',
    ],
    quickLinks: [
      { label: 'Dịch vụ sửa xe nâng TPHCM', to: '/dich-vu/sua-xe-nang-tphcm' },
      { label: 'Dịch vụ bảo dưỡng xe nâng', to: '/dich-vu/yeu-cau-bao-duong' },
      { label: 'Xe nâng dầu MGA 3.0 tấn', to: '/san-pham/xe-nang-dau-mga-3-0-tan' },
      { label: 'Xe nâng điện MGA 2.0 tấn', to: '/san-pham/xe-nang-dien-mga-2-0-tan' },
    ],
    faq: [
      {
        question: 'Khi nào nên thay phụ tùng thay vì sửa tạm?',
        answer: 'Khi linh kiện đã hao mòn rõ, có nguy cơ gây dừng xe lặp lại hoặc ảnh hưởng trực tiếp đến an toàn nâng hạ và độ ổn định của hệ thống.',
      },
      {
        question: 'Phụ tùng xe nâng dầu và xe nâng điện có nên gom chung?',
        answer: 'Không nên gom khi chẩn đoán mua hàng; nên xác định theo đúng dòng xe và đúng hệ thống để tránh sai part và kéo dài thời gian dừng máy.',
      },
    ],
  },
}

const categorySupport = computed<CategorySupportBlock | null>(() =>
  categorySupportBySlug[slug.value] || null,
)

const categorySupportCta = computed(() => {
  if (!categorySupport.value) {
    return null
  }

  return {
    title: 'Cần tư vấn nhanh?',
    description: 'MGA hỗ trợ chọn tải trọng và cấu hình phù hợp theo kho, lối đi và ngân sách vận hành.',
    primaryLabel: tr('categories.contactForAdvice', 'Liên hệ tư vấn mua hàng'),
    primaryTo: getContactRoute(locale.value),
  }
})

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
    locale: routeLocale.value,
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

  const fallbackDescription = categoryTranslation.value?.metaDescription || `${t('categories.productsIn')} ${categoryName.value}`

  return categoryPriceRangeSummary.value
    ? `${fallbackDescription}. ${categoryPriceRangeSummary.value}`
    : fallbackDescription
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
  locale: routeLocale,
  routeKey: 'category-detail',
  slugByLocale: categorySlugByLocale,
  breadcrumbs: computed(() => [
    { name: tr('common.home', routeLocale.value === 'vi' ? 'Trang chủ' : 'Home'), item: '/' },
    { name: tr('common.categories', routeLocale.value === 'vi' ? 'Danh mục sản phẩm' : 'Product Categories'), item: getCategoryListRoute(routeLocale.value) },
    { name: isInvalidCategory.value ? tr('categories.invalidCategoryTitle', routeLocale.value === 'vi' ? 'Không tìm thấy danh mục' : 'Category not found') : (categoryName.value || 'Category') },
  ]),
  schemas: computed(() => isInvalidCategory.value ? [] : [
    buildCollectionPageSchema(
      siteUrl,
      categoryName.value || 'Category',
      categoryPriceRangeSummary.value
        ? [categoryDescription.value || `${t('categories.productsIn')} ${categoryName.value}`, categoryPriceRangeSummary.value].filter(Boolean).join('. ')
        : (categoryDescription.value || `${t('categories.productsIn')} ${categoryName.value}`),
      resolvedCanonicalUrl.value,
    ),
  ]),
})

const sortOptions = computed(() => [
  { value: 'newest' as ProductSortBy, label: t('sort.newest') },
  { value: 'oldest' as ProductSortBy, label: t('sort.oldest') },
  { value: 'price_asc' as ProductSortBy, label: t('sort.price_asc') },
  { value: 'price_desc' as ProductSortBy, label: t('sort.price_desc') },
])

const productResultsSummary = computed(() =>
  formatProductRangeSummary({
    currentPage: filters.page,
    limit: filters.limit,
    totalItems: totalProducts.value,
    showingLabel: t('products.showing') || 'Hiển thị',
    ofLabel: t('products.of') || 'trong số',
    itemsLabel: t('products.items') || 'sản phẩm',
  }),
)

watch([() => slug.value, () => categoryData.value?.id], async ([, newId]) => {
  if (!newId) {
    return
  }

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
  }

  Object.assign(filters, updatedFilters)
  productFilters.value = {
    ...updatedFilters,
    categories: updatedFilters.categories,
    locale: routeLocale.value
  }

  if (!isLoading.value) {
    fetchProducts()
  }
}, { immediate: true })

const handleFilterChange = (newFilters: ProductFilter) => {
  if (!categoryData.value?.id) return

  const updatedFilters: FilterState = {
    ...newFilters,
    categories: [categoryData.value.id],
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
    categories: updatedFilters.categories,
    locale: routeLocale.value
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
    locale: routeLocale.value,
  })
}

const breadcrumbItems = computed<BreadcrumbItem[]>(() => {
  const items: BreadcrumbItem[] = [
    { label: tr('common.home', routeLocale.value === 'vi' ? 'Trang chủ' : 'Home'), to: '/' },
    { label: tr('common.categories', routeLocale.value === 'vi' ? 'Danh mục sản phẩm' : 'Product Categories'), to: getCategoryListRoute(routeLocale.value) }
  ]

  if (isInvalidCategory.value) {
    items.push({
      label: tr('categories.invalidCategoryTitle', routeLocale.value === 'vi' ? 'Không tìm thấy danh mục' : 'Category not found'),
      to: route.path,
      active: true,
    })

    return items
  }

  if (categoryData.value?.parent) {
    items.push({
      label: categoryData.value.parent.name,
      to: getCategoryDetailRoute(categoryData.value.parent.slug, routeLocale.value)
    })
  }

  items.push({
    label: categoryName.value || slug.value,
    to: getCategoryDetailRoute(slug.value, routeLocale.value),
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

      <div v-else-if="isCategoryPending" class="py-2">
        <CardGridSkeleton :item-count="6" :columns="3" />
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
          <p
            v-if="!isInvalidCategory && categoryPriceRange"
            class="mt-3 inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-900/20 dark:text-emerald-200"
          >
            {{ categoryPriceRange }}
          </p>
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
            :available-attributes="availableAttributes"
            @filter-change="handleFilterChange"
            class="mb-6 lg:hidden"
          />

          <div class="flex flex-col gap-8 lg:flex-row">
            <div v-if="pageState.shouldShowFilters" class="hidden lg:block lg:w-1/4">
              <CategorySidebar
                :initial-filters="filters"
                :category-id="categoryData?.id"
                :available-attributes="availableAttributes"
                :quick-links-heading="'Xem nhanh theo nhu cầu'"
                :quick-links="categorySupport?.quickLinks || []"
                :support-cta="categorySupportCta"
                @filter-change="handleFilterChange"
              />
            </div>

            <div :class="pageState.shouldShowFilters ? 'lg:w-3/4' : 'lg:w-full'">
              <div v-if="pageState.kind === 'has-products' || isFilteredEmptyState" class="mb-6 flex flex-wrap items-center justify-between gap-4">
                <div class="flex items-center gap-2">
                  <span class="text-sm text-gray-600 dark:text-gray-400">
                    {{ productResultsSummary }}
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

                  <section
                    v-if="categorySupport"
                    class="mt-10 rounded-3xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-800"
                  >
                    <p class="text-sm font-semibold uppercase tracking-[0.18em] text-primary-600 dark:text-primary-400">
                      {{ categorySupport.eyebrow }}
                    </p>
                    <h2 class="mt-3 text-2xl font-semibold text-gray-900 dark:text-white">
                      {{ categorySupport.heading }}
                    </h2>
                    <p class="mt-3 text-gray-600 dark:text-gray-300">
                      {{ categorySupport.summary }}
                    </p>
                    <ul class="mt-5 space-y-3 text-sm text-gray-700 dark:text-gray-200">
                      <li v-for="item in categorySupport.bullets" :key="item" class="flex gap-3">
                        <span class="mt-1 h-2.5 w-2.5 rounded-full bg-primary-500" />
                        <span>{{ item }}</span>
                      </li>
                    </ul>
                  </section>

                  <section
                    v-if="categorySupport"
                    class="mt-8 rounded-3xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-800"
                  >
                    <h2 class="text-xl font-semibold text-gray-900 dark:text-white">
                      Câu hỏi thường gặp trong nhóm {{ categoryName }}
                    </h2>
                    <div class="mt-5 grid gap-4 lg:grid-cols-2">
                      <article
                        v-for="item in categorySupport.faq"
                        :key="item.question"
                        class="rounded-2xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-900/50"
                      >
                        <h3 class="text-base font-semibold text-gray-900 dark:text-white">
                          {{ item.question }}
                        </h3>
                        <p class="mt-2 text-sm text-gray-600 dark:text-gray-300">
                          {{ item.answer }}
                        </p>
                      </article>
                    </div>
                  </section>
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
