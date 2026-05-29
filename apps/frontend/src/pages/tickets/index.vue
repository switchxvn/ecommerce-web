<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import TicketCard from "../../components/cards/TicketCard.vue";
import ProductMobileSidebar from "../../components/sidebar/ProductMobileSidebar.vue";
import TicketSidebar from "../../components/sidebar/TicketSidebar.vue";
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
  () => `seo-tickets-${locale.value}`,
  () => trpc.seo.getSeoByPath.query("/tickets").catch(() => null),
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

usePageSeo({
  title: computed(() => seoData.value.title || t("tickets.title")),
  description: computed(() => seoData.value.description || t("tickets.description")),
  keywords: computed(() => seoData.value.keywords || ""),
  ogTitle: computed(() => seoData.value.ogTitle || seoData.value.title || t("tickets.title")),
  ogDescription: computed(() => seoData.value.ogDescription || seoData.value.description || t("tickets.description")),
  image: computed(() => seoData.value.ogImage || ""),
  canonicalUrl: computed(() => seoData.value.canonicalUrl || null),
  currentPath: computed(() => route.path),
  locale: computed(() => (locale.value === 'en' ? 'en' : 'vi')),
  routeKey: 'tickets',
});

// Initialize filters from route query
const initialFilters: ProductFilter = {
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
  limit: Number(route.query.limit) || 12,
  type: 'TICKET'
};

// Use product composable with type filter
const {
  filters,
  products,
  totalProducts,
  totalPages,
  isLoadingProducts: isLoading,
  fetchPriceRange,
  fetchProducts
} = useProduct(initialFilters);

// No need to filter products since we're already filtering by type in the API
const ticketProducts = computed(() => products.value);
const totalTicketProducts = computed(() => totalProducts.value);

// Sort options as computed property to ensure translations are updated
const sortOptions = computed(() => [
  { value: "newest", label: t("sort.newest") },
  { value: "oldest", label: t("sort.oldest") },
  { value: "price_asc", label: t("sort.price_asc") },
  { value: "price_desc", label: t("sort.price_desc") },
  { value: "date_asc", label: t("sort.date_asc") },
  { value: "date_desc", label: t("sort.date_desc") },
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
const handlePageChange = (page: number) => {
  filters.value.page = page;
  updateQueryParams();

  // Scroll to top
  window.scrollTo({ top: 0, behavior: "smooth" });
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
  if (filters.value.limit !== 12) query.limit = String(filters.value.limit);
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
  
  // Reset filters to initial state but keep the type filter
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
    locale: locale.value,
    type: 'TICKET' // Keep the type filter
  };

  // Clear URL query params
  router.replace({ query: {} });

  // Then refresh data
  await fetchPriceRange();
  fetchProducts();
});
</script>

<template>
  <div class="tickets-page bg-gray-50 dark:bg-gray-900">
    <div class="container mx-auto px-4 py-8">
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-900 dark:text-white md:text-4xl">
          {{ seoData.title || t("tickets.title") }}
        </h1>
        <p class="mt-2 text-gray-600 dark:text-gray-400">
          {{ seoData.description || t("tickets.description") }}
        </p>
      </div>

      <!-- Mobile Sidebar -->
      <ProductMobileSidebar
        :initial-filters="filters"
        @filter-change="handleFilterChange"
      />

      <div class="flex flex-col gap-8 lg:flex-row">
        <!-- Desktop Sidebar -->
        <div class="hidden lg:block lg:w-1/4">
          <TicketSidebar
            :initial-filters="filters"
            @filter-change="handleFilterChange"
          />
        </div>

        <!-- Tickets Content -->
        <div class="lg:w-3/4">
          <!-- Toolbar -->
          <div v-if="!isLoading || totalTicketProducts > 0" class="mb-6 flex flex-wrap items-center justify-between gap-4">
            <div class="flex items-center gap-2">
              <span class="text-sm text-gray-600 dark:text-gray-400">
                {{ t("tickets.showing") }} {{ totalTicketProducts }} {{ t("tickets.items") }}
              </span>
            </div>

            <div class="flex items-center gap-2">
              <label for="sort" class="text-sm text-gray-600 dark:text-gray-400">{{ t("posts.sortBy") }}:</label>
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

          <!-- Loading State -->
          <div v-if="isLoading" class="py-2">
            <CardGridSkeleton :item-count="6" :columns="3" />
          </div>

          <template v-else>
            <!-- Tickets Grid -->
            <div v-if="ticketProducts.length > 0" class="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3">
              <TicketCard
                v-for="ticket in ticketProducts"
                :key="ticket.id"
                :product="ticket"
                :locale="locale"
              />
            </div>

            <!-- Pagination -->
            <div v-if="totalTicketProducts > 0" class="mt-8">
              <Pagination
                v-model="filters.page"
                :total="totalTicketProducts"
                :items-per-page="filters.limit"
                :max-visible-buttons="5"
                @update:model-value="handlePageChange"
              />
            </div>
            
            <!-- No Results Message -->
            <div v-if="totalTicketProducts === 0" class="mt-8 text-center">
              <div class="inline-flex items-center justify-center rounded-full bg-gray-100 p-6 dark:bg-gray-800">
                <i class="i-heroicons-inbox-20-solid h-12 w-12 text-gray-400 dark:text-gray-500" />
              </div>
              <h3 class="mt-4 text-lg font-medium text-gray-900 dark:text-white">
                {{ t('tickets.noResults') }}
              </h3>
              <p class="mt-2 text-gray-600 dark:text-gray-400">
                {{ t('tickets.tryAdjustingFilters') }}
              </p>
            </div>
          </template>
        </div>
      </div>
    </div>
  </div>
</template> 
