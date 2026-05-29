<script setup lang="ts">
import { ProductType, type Product } from '@ew/shared';
import { computed, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import ProductCard from "../../components/cards/ProductCard.vue";
import ProductMobileSidebar from "../../components/sidebar/ProductMobileSidebar.vue";
import ProductSidebar from "../../components/sidebar/ProductSidebar.vue";
import { useLocalization } from "../../composables/useLocalization";
import { useProduct, type ProductFilter, type ProductSortBy } from "../../composables/useProduct";
import { usePageSeo } from "~/composables/usePageSeo";
import { useTrpc } from "../../composables/useTrpc";

const { t, locale } = useLocalization();
const trpc = useTrpc();
const route = useRoute();
const router = useRouter();

definePageMeta({
  layout: "default",
});

const { data: seoDataState } = await useAsyncData(
  () => `seo-products-${locale.value}`,
  () => trpc.seo.getSeoByPath.query("/products").catch(() => null),
  { watch: [locale] },
);

const seoData = computed(() => seoDataState.value || {
  title: "",
  description: "",
  keywords: "",
  ogTitle: "",
  ogDescription: "",
  ogImage: "",
  canonicalUrl: "",
});

const seoHubHighlights = [
  {
    title: 'Xe nâng dầu cho kho xưởng và bãi ngoài trời',
    description: 'Phù hợp doanh nghiệp cần tải trọng 2.5-10 tấn, làm việc nhiều ca và ưu tiên động cơ mạnh, dễ bảo trì.',
    to: '/danh-muc-san-pham/xe-nang-dau',
  },
  {
    title: 'Xe nâng điện cho kho trong nhà và xưởng sạch',
    description: 'Tối ưu cho môi trường cần vận hành êm, sạch, tiết kiệm chi phí nhiên liệu và dễ xoay trở trong lối đi hẹp.',
    to: '/danh-muc-san-pham/xe-nang-dien',
  },
  {
    title: 'Phụ tùng xe nâng sẵn hàng cho bảo trì nhanh',
    description: 'Tập trung các nhóm phụ tùng hao mòn và linh kiện thay thế giúp giảm thời gian dừng xe khi vận hành thực tế.',
    to: '/danh-muc-san-pham/phu-tung-xe-nang',
  },
];

const seoHubQuickLinks = [
  { label: 'Xe nâng dầu 2.5 tấn', to: '/san-pham/xe-nang-dau-mga-2-5-tan' },
  { label: 'Xe nâng dầu 3.0 tấn', to: '/san-pham/xe-nang-dau-mga-3-0-tan' },
  { label: 'Xe nâng dầu 5.0 tấn', to: '/san-pham/xe-nang-dau-mga-5-0-tan' },
  { label: 'Xe nâng điện 2.0 tấn', to: '/san-pham/xe-nang-dien-mga-2-0-tan' },
  { label: 'Xe nâng điện ngồi lái', to: '/san-pham/xe-nang-dien-ngoi-lai-mga-1-5-tan' },
];

const seoHubFaqs = [
  {
    question: 'Nên chọn xe nâng dầu hay xe nâng điện?',
    answer: 'Nếu doanh nghiệp vận hành ngoài trời, tải nặng và làm việc nhiều ca, xe nâng dầu thường phù hợp hơn. Với kho trong nhà, xưởng sạch và yêu cầu tiếng ồn thấp, xe nâng điện là lựa chọn hợp lý hơn.',
  },
  {
    question: 'Nhóm tải trọng nào được hỏi báo giá nhiều nhất?',
    answer: 'Thực tế nhu cầu tìm kiếm tập trung nhiều ở các dải 2.5 tấn, 3.0 tấn, 3.5 tấn và 5.0 tấn vì đây là nhóm cân bằng tốt giữa ngân sách đầu tư và khả năng vận hành.',
  },
  {
    question: 'MGA có hỗ trợ khách hàng tại TPHCM không?',
    answer: 'Có. Các cụm sản phẩm, dịch vụ thuê, sửa chữa và tư vấn nhanh trong chiến dịch này đều ưu tiên nội dung, nhu cầu triển khai và hỗ trợ khách hàng tại khu vực TPHCM.',
  },
];

usePageSeo({
  title: computed(() => seoData.value.title || t("products.title")),
  description: computed(() => seoData.value.description || t("products.description")),
  keywords: computed(() => seoData.value.keywords || ""),
  ogTitle: computed(() => seoData.value.ogTitle || seoData.value.title || t("products.title")),
  ogDescription: computed(() => seoData.value.ogDescription || seoData.value.description || t("products.description")),
  image: computed(() => seoData.value.ogImage || ""),
  canonicalUrl: computed(() => seoData.value.canonicalUrl || null),
  currentPath: computed(() => route.path),
  locale: computed(() => (locale.value === 'en' ? 'en' : 'vi')),
  routeKey: 'products',
});

// Add type for specifications
interface ProductSpecification {
  name: string;
  value: string;
}

// Initialize filters from route query
const initialFilters = ref<ProductFilter>({
  search: (route.query.search as string) || "",
  minPrice: route.query.minPrice ? Number(route.query.minPrice) : undefined,
  maxPrice: route.query.maxPrice ? Number(route.query.maxPrice) : undefined,
  includeNullPrice: route.query.includeNullPrice === "true",
  categories: route.query.categories
    ? String(route.query.categories).split(",").map(Number)
    : undefined,
  isFeatured: route.query.isFeatured === "true" ? true : undefined,
  isNew: route.query.isNew === "true" ? true : undefined,
  isSale: route.query.isSale === "true" ? true : undefined,
  sortBy: (route.query.sortBy as ProductSortBy) || "newest",
  page: Number(route.query.page) || 1,
  limit: 12, // Set default limit
  type: (route.query.type as ProductType) || ProductType.PHYSICAL,
});

// Current page
const currentPage = ref(Number(route.query.page) || 1);

// Use product composable
const {
  filters,
  products,
  totalProducts,
  totalPages,
  isLoadingProducts: isLoading,
  fetchPriceRange,
  fetchProducts
} = useProduct(initialFilters.value);

// Remove client-side filtering
const hasProducts = computed(() => products.value.length > 0);

// Filter products by type
const ticketProducts = computed(() => products.value.filter((product: Product) => product.type === ProductType.TICKET));
const regularProducts = computed(() => products.value.filter((product: Product) => product.type !== ProductType.TICKET));
const hasTickets = computed(() => ticketProducts.value.length > 0);

// Sort options as computed property to ensure translations are updated
const sortOptions = computed(() => [
  { value: "newest", label: t("sort.newest") },
  { value: "oldest", label: t("sort.oldest") },
  { value: "price_asc", label: t("sort.price_asc") },
  { value: "price_desc", label: t("sort.price_desc") },
]);

// Handle filter changes
const handleFilterChange = (newFilters: ProductFilter) => {
  // Update filters
  Object.assign(filters.value, newFilters);

  // Reset to page 1 when filters change
  filters.value.page = 1;

  // Update URL query params
  updateQueryParams();
};

// Handle sort change
const handleSortChange = (event: Event) => {
  const target = event.target as HTMLSelectElement;
  filters.value.sortBy = target.value as ProductSortBy;
  filters.value.page = 1;
  updateQueryParams();
};

// Handle page change
const handlePageChange = async (page: number) => {
  currentPage.value = page;
  filters.value = {
    ...filters.value,
    page
  };

  // Update URL query params
  await router.replace({
    query: {
      ...route.query,
      page: String(page)
    }
  });

  // Scroll to top
  window.scrollTo({ top: 0, behavior: "smooth" });

  // Fetch products with new page
  await fetchProducts();
};

// Update URL query params
const updateQueryParams = () => {
  // Build query params object
  const query: Record<string, string> = {};

  if (filters.value.search) query.search = filters.value.search;
  if (filters.value.minPrice !== undefined) query.minPrice = String(filters.value.minPrice);
  if (filters.value.maxPrice !== undefined) query.maxPrice = String(filters.value.maxPrice);
  if (filters.value.includeNullPrice) query.includeNullPrice = "true";
  if (filters.value.categories && filters.value.categories.length > 0)
    query.categories = filters.value.categories.join(",");
  if (filters.value.isFeatured) query.isFeatured = "true";
  if (filters.value.isNew) query.isNew = "true";
  if (filters.value.isSale) query.isSale = "true";
  if (filters.value.sortBy && filters.value.sortBy !== "newest") query.sortBy = filters.value.sortBy;
  if (filters.value.page && filters.value.page > 1) query.page = String(filters.value.page);
  if (filters.value.limit && filters.value.limit !== 12) query.limit = String(filters.value.limit);
  if (filters.value.type) query.type = filters.value.type;

  // Update route
  router.replace({ query });

  // Fetch products with new filters
  fetchProducts();
};

// Initial fetch
onMounted(() => {
  fetchPriceRange();
  fetchProducts();
});

// Watch for locale changes
watch(locale, async () => {
  // Reset all states first
  products.value = [];
  totalProducts.value = 0;
  totalPages.value = 0;
  currentPage.value = 1;

  // Reset filters to initial state
  filters.value = {
    search: '',
    minPrice: undefined,
    maxPrice: undefined,
    includeNullPrice: false,
    categories: undefined,
    isFeatured: false,
    isNew: false,
    isSale: false,
    sortBy: 'newest',
    page: 1,
    limit: 12,
    type: ProductType.PHYSICAL,
  };

  // Clear URL query params
  await router.replace({ query: {} });

  // Then refresh data
  await fetchPriceRange();
  await fetchProducts();
});
</script>

<template>
  <div class="products-page bg-gray-50 dark:bg-gray-900">
    <div class="container mx-auto px-4 py-8">
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-900 dark:text-white md:text-4xl">
          {{ seoData.title || t("products.title") }}
        </h1>
        <p class="mt-2 text-gray-600 dark:text-gray-400">
          {{ seoData.description || t("products.description") }}
        </p>
      </div>

      <section class="mb-8 grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
        <div class="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-800">
          <p class="text-sm font-semibold uppercase tracking-[0.18em] text-primary-600 dark:text-primary-400">
            Giải pháp xe nâng theo nhu cầu thực tế
          </p>
          <h2 class="mt-3 text-2xl font-semibold text-gray-900 dark:text-white">
            Hub sản phẩm cho nhóm keyword bán xe nâng, giá xe nâng và xe nâng công nghiệp
          </h2>
          <p class="mt-3 text-gray-600 dark:text-gray-300">
            Trang này được tối ưu như điểm bắt đầu cho khách hàng đang tìm <strong>xe nâng</strong>, <strong>bán xe nâng</strong>, <strong>xe nâng công nghiệp</strong> và các nhóm tải trọng phổ biến trước khi đi sâu vào từng dòng xe dầu, xe điện hoặc phụ tùng liên quan.
          </p>
          <div class="mt-6 grid gap-4 md:grid-cols-3">
            <NuxtLink
              v-for="item in seoHubHighlights"
              :key="item.to"
              :to="item.to"
              class="rounded-2xl border border-gray-200 bg-gray-50 p-4 transition hover:border-primary-500 hover:bg-primary-50 dark:border-gray-700 dark:bg-gray-900/50 dark:hover:border-primary-400"
            >
              <h3 class="text-base font-semibold text-gray-900 dark:text-white">{{ item.title }}</h3>
              <p class="mt-2 text-sm text-gray-600 dark:text-gray-300">{{ item.description }}</p>
            </NuxtLink>
          </div>
        </div>

        <div class="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-800">
          <p class="text-sm font-semibold uppercase tracking-[0.18em] text-primary-600 dark:text-primary-400">
            Báo giá nhanh theo tải trọng
          </p>
          <div class="mt-4 space-y-3">
            <NuxtLink
              v-for="item in seoHubQuickLinks"
              :key="item.to"
              :to="item.to"
              class="flex items-center justify-between rounded-2xl border border-gray-200 px-4 py-3 text-sm font-medium text-gray-800 transition hover:border-primary-500 hover:text-primary-600 dark:border-gray-700 dark:text-gray-100 dark:hover:border-primary-400 dark:hover:text-primary-300"
            >
              <span>{{ item.label }}</span>
              <span aria-hidden="true">→</span>
            </NuxtLink>
          </div>
          <div class="mt-5 rounded-2xl bg-primary-50 p-4 text-sm text-primary-900 dark:bg-primary-900/30 dark:text-primary-100">
            Ưu tiên khách hàng <strong>TPHCM</strong> đang cần tư vấn nhanh theo bài toán kho xưởng, ngân sách đầu tư hoặc nhu cầu so sánh xe nâng dầu và xe nâng điện.
          </div>
        </div>
      </section>

      <!-- Mobile Sidebar -->
      <ProductMobileSidebar
        :initial-filters="filters"
        @filter-change="handleFilterChange"
      />

      <div class="flex flex-col gap-8 lg:flex-row">
        <!-- Desktop Sidebar -->
        <div class="hidden lg:block lg:w-1/4">
          <ProductSidebar
            :initial-filters="filters"
            @filter-change="handleFilterChange"
          />
        </div>

        <!-- Products Content -->
        <div class="lg:w-3/4">
          <!-- Toolbar -->
          <div
            v-if="!isLoading || totalProducts > 0"
            class="mb-6 flex flex-wrap items-center justify-between gap-4"
          >
            <div class="flex items-center gap-2">
              <span class="text-sm text-gray-600 dark:text-gray-400">
                {{ t("products.showing") }}
                {{ (currentPage - 1) * (filters.limit || 12) + 1 }} -
                {{ Math.min(currentPage * (filters.limit || 12), totalProducts) }}
                {{ t("products.of") }} {{ totalProducts }} {{ t("products.items") }}
              </span>
            </div>

            <div class="flex items-center gap-2">
              <label for="sort" class="text-sm text-gray-600 dark:text-gray-400"
                >{{ t("posts.sortBy") }}:</label
              >
              <select
                id="sort"
                v-model="filters.sortBy"
                @change="handleSortChange"
                class="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm dark:border-gray-700 dark:bg-gray-800"
              >
                <option
                  v-for="option in sortOptions"
                  :key="option.value"
                  :value="option.value"
                >
                  {{ option.label }}
                </option>
              </select>
            </div>
          </div>

          <!-- Loading State -->
          <div v-if="isLoading" class="py-2">
            <CardGridSkeleton :item-count="6" :columns="3" />
          </div>

          <template v-else>
            <!-- Products Grid -->
            <div
              v-if="hasProducts"
              class="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3"
            >
              <ProductCard
                v-for="product in products"
                :key="product.id"
                :product="product"
                :locale="locale"
              />
            </div>

            <!-- Pagination -->
            <div v-if="totalProducts > 0" class="mt-8">
              <nav
                class="flex items-center justify-center"
                role="navigation"
                aria-label="pagination"
              >
                <ul class="flex items-center -space-x-px">
                  <!-- Previous -->
                  <li>
                    <button
                      :disabled="currentPage === 1"
                      @click="handlePageChange(currentPage - 1)"
                      class="ml-0 block rounded-l-lg border border-gray-300 bg-white px-3 py-2 leading-tight text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"
                      :class="{ 'opacity-50 cursor-not-allowed': currentPage === 1 }"
                    >
                      <span class="sr-only">Previous</span>
                      <svg class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fill-rule="evenodd"
                          d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                          clip-rule="evenodd"
                        />
                      </svg>
                    </button>
                  </li>

                  <!-- Page Numbers -->
                  <li v-for="page in totalPages" :key="page">
                    <button
                      @click="handlePageChange(page)"
                      class="border border-gray-300 px-3 py-2 leading-tight"
                      :class="{
                        'bg-primary-600 text-white': currentPage === page,
                        'bg-white text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white':
                          currentPage !== page,
                      }"
                    >
                      {{ page }}
                    </button>
                  </li>

                  <!-- Next -->
                  <li>
                    <button
                      :disabled="currentPage === totalPages"
                      @click="handlePageChange(currentPage + 1)"
                      class="block rounded-r-lg border border-gray-300 bg-white px-3 py-2 leading-tight text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"
                      :class="{
                        'opacity-50 cursor-not-allowed': currentPage === totalPages,
                      }"
                    >
                      <span class="sr-only">Next</span>
                      <svg class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fill-rule="evenodd"
                          d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                          clip-rule="evenodd"
                        />
                      </svg>
                    </button>
                  </li>
                </ul>
              </nav>
            </div>
          </template>
        </div>
      </div>

      <section class="mt-10 rounded-3xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-800">
        <h2 class="text-2xl font-semibold text-gray-900 dark:text-white">
          Câu hỏi thường gặp khi tìm mua xe nâng
        </h2>
        <div class="mt-6 grid gap-4 lg:grid-cols-3">
          <article
            v-for="item in seoHubFaqs"
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
    </div>
  </div>
</template>
