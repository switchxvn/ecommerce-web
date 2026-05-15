<script setup lang="ts">
import { ref, onMounted, watch, computed } from "vue";
import { useLocalization } from "../../composables/useLocalization";
import { useTrpc } from "../../composables/useTrpc";
import { useRoute, useRouter } from "vue-router";
import ServiceCardWithThumbnail from "../../components/ui/card/ServiceCardWithThumbnail.vue";
import { useService, type ServiceFilter } from "../../composables/useService";
import { usePageSeo } from "~/composables/usePageSeo";
import { normalizeLocaleCode } from "~/utils/locale";

const { t, locale } = useLocalization();
const trpc = useTrpc();
const route = useRoute();
const router = useRouter();

definePageMeta({
  layout: "default",
});

const { data: seoDataState } = await useAsyncData(
  () => `seo-services-${locale.value}`,
  () => trpc.seo.getSeoByPath.query("/services").catch(() => null),
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
  title: computed(() => seoData.value.title || t("services.title")),
  description: computed(() => seoData.value.description || t("services.description")),
  keywords: computed(() => seoData.value.keywords || ""),
  ogTitle: computed(() => seoData.value.ogTitle || seoData.value.title || t("services.title")),
  ogDescription: computed(() => seoData.value.ogDescription || seoData.value.description || t("services.description")),
  image: computed(() => seoData.value.ogImage || ""),
  canonicalUrl: computed(() => seoData.value.canonicalUrl || null),
  currentPath: computed(() => route.path),
  locale: computed(() => (locale.value === 'en' ? 'en' : 'vi')),
  routeKey: 'services',
});

// State
const currentPage = ref(Number(route.query.page) || 1);
const itemsPerPage = ref(12);
const currentSort = ref<'newest' | 'oldest' | 'name_asc' | 'name_desc'>('newest');

// Initialize filters from route query
const filters = computed<ServiceFilter>(() => ({
  search: (route.query.search as string) || undefined,
  isFeatured: route.query.isFeatured === "true" ? true : undefined,
  isNew: route.query.isNew === "true" ? true : undefined,
  sortBy: currentSort.value,
  page: currentPage.value,
  limit: itemsPerPage.value,
  locale: normalizeLocaleCode(locale.value),
}));

// Sort options
const sortOptions = [
  { value: 'newest', label: t('sort.newest') },
  { value: 'oldest', label: t('sort.oldest') },
  { value: 'name_asc', label: t('sort.title_asc') },
  { value: 'name_desc', label: t('sort.title_desc') },
] as const;

// Use service composable
const { services, totalServices, isLoading, error, fetchServices } = useService();

// Handle filter changes
const handleFilterChange = (newFilters: ServiceFilter) => {
  // Update URL query params
  const query: Record<string, string> = {};
  
  if (newFilters.search) query.search = newFilters.search;
  if (newFilters.isFeatured) query.isFeatured = "true";
  if (newFilters.isNew) query.isNew = "true";
  
  // Reset to page 1
  currentPage.value = 1;
  query.page = "1";

  // Update route
  router.replace({ query });

  // Fetch services
  fetchServices(currentPage.value, itemsPerPage.value, {
    ...newFilters,
    locale: normalizeLocaleCode(locale.value),
    sortBy: currentSort.value,
  });
};

// Handle sort change
const handleSortChange = (event: Event) => {
  const target = event.target as HTMLSelectElement;
  currentSort.value = target.value as typeof currentSort.value;
  
  // Reset to page 1
  currentPage.value = 1;

  // Fetch services with new sort
  fetchServices(currentPage.value, itemsPerPage.value, {
    ...filters.value,
    locale: normalizeLocaleCode(locale.value),
    sortBy: currentSort.value,
  });
};

// Handle page change
const handlePageChange = (page: number) => {
  currentPage.value = page;
  
  // Update URL query params
  router.replace({
    query: {
      ...route.query,
      page: String(page),
    },
  });

  // Fetch services
  fetchServices(page, itemsPerPage.value, filters.value);

  // Scroll to top
  window.scrollTo({ top: 0, behavior: "smooth" });
};

// Initial fetch
onMounted(async () => {
  fetchServices(currentPage.value, itemsPerPage.value, filters.value);
});

// Watch for locale changes
watch(locale, async () => {
  fetchServices(1, itemsPerPage.value, {
    ...filters.value,
    locale: normalizeLocaleCode(locale.value),
  });
});
</script>

<template>
  <div class="services-page bg-gray-50 dark:bg-gray-900">
    <div class="container mx-auto px-4 py-8">
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-900 dark:text-white md:text-4xl">
          {{ seoData.title || t("services.title") }}
        </h1>
        <p class="mt-2 text-gray-600 dark:text-gray-400">
          {{ seoData.description || t("services.description") }}
        </p>
      </div>

      <!-- Services Content -->
      <div class="w-full">
        <!-- Toolbar -->
        <div v-if="!isLoading && totalServices > 0" class="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div class="flex items-center gap-2">
            <span class="text-sm text-gray-600 dark:text-gray-400">
              {{ t("services.showing") }} {{ totalServices }} {{ t("services.items") }}
            </span>
          </div>

          <div class="flex items-center gap-2">
            <label for="sort" class="text-sm text-gray-600 dark:text-gray-400">{{ t("services.sortBy") }}:</label>
            <select
              id="sort"
              :value="currentSort"
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

        <!-- Main Content Area -->
        <div class="min-h-[400px]">
          <template v-if="isLoading">
            <!-- Loading State -->
            <div class="flex items-center justify-center py-12">
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
          </template>

          <template v-else-if="services && services.length > 0">
            <!-- Services Grid -->
            <div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <ServiceCardWithThumbnail
                v-for="service in services"
                :key="service.id"
                :service="service"
                :locale="locale"
              />
            </div>
          </template>

          <template v-else>
            <!-- No Results Message -->
            <div class="mt-8 text-center">
              <div class="inline-flex items-center justify-center rounded-full bg-gray-100 p-6 dark:bg-gray-800">
                <i class="i-heroicons-inbox-20-solid h-12 w-12 text-gray-400 dark:text-gray-500" />
              </div>
              <h3 class="mt-4 text-lg font-medium text-gray-900 dark:text-white">
                {{ t('services.noResults') }}
              </h3>
              <p class="mt-2 text-gray-600 dark:text-gray-400">
                {{ t('services.tryAdjustingFilters') }}
              </p>
            </div>
          </template>
        </div>

        <!-- Pagination -->
        <div v-if="!isLoading && totalServices > itemsPerPage" class="mt-8">
          <Pagination
            v-model="currentPage"
            :total="totalServices"
            :items-per-page="itemsPerPage"
            :max-visible-buttons="5"
            @update:model-value="handlePageChange"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Add your styles here */
</style> 
