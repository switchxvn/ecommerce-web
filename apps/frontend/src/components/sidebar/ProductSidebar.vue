<script setup lang="ts">
import Slider from '@vueform/slider';
import '@vueform/slider/themes/default.css';
import {
  ChevronDown,
  ChevronUp,
  DollarSign,
  Flame,
  LayoutGrid,
  Mail,
  Phone,
  RotateCcw,
  Search,
  Sparkles,
  Star,
  Tag,
  User,
  Clock
} from 'lucide-vue-next';
import { computed, onMounted, ref, watch } from 'vue';
import { useCategory } from '~/composables/useCategory';
import { useLocalization } from '~/composables/useLocalization';
import { useProduct, type ProductFilter } from '~/composables/useProduct';
import { useComponentStyles } from '~/composables/useComponentStyles';

interface SidebarContactInfo {
  title?: string;
  representativeName?: string;
  position?: string;
  phoneNumber?: string;
  email?: string;
  availability?: string;
  note?: string;
}

const { t } = useLocalization();
const {
  productCategories,
  loading: categoriesLoading,
  uniqueCategories,
  getCategoryTranslation,
  fetchProductCategories
} = useCategory();

const props = defineProps<{
  initialFilters?: ProductFilter;
}>();

const emit = defineEmits<{
  (e: 'filter-change', filters: ProductFilter): void;
}>();

// Initialize product composable
const {
  filters,
  priceRange,
  isLoadingPriceRange,
  isSearching,
  formatPrice,
  formatPriceSimple,
  parsePriceInput,
  fetchPriceRange,
  updatePriceRange,
  handleSearch,
  toggleCategory,
  resetFilters,
  fetchProducts
} = useProduct(props.initialFilters);

// Custom price range inputs
const minPriceInput = ref(formatPriceSimple(filters.value.minPrice || 0));
const maxPriceInput = ref(formatPriceSimple(filters.value.maxPrice || 0));

const { getStyleConfig, initializeStyles } = useComponentStyles();
const defaultContactInfo =
  getStyleConfig('product-sidebar-contact')?.settings?.contactInfo || {
    title: 'Tư vấn mua hàng',
    representativeName: 'Nguyễn Văn A',
    position: 'Chuyên viên kinh doanh',
    phoneNumber: '0900 000 000',
    email: 'sales@example.com',
    availability: '8:00 - 21:00, Thứ 2 - Chủ nhật',
    note: 'Liên hệ ngay để được hỗ trợ chi tiết về sản phẩm'
  };
const contactInfo = ref<SidebarContactInfo | null>(defaultContactInfo);
const loadSidebarContactInfo = async () => {
  try {
    await initializeStyles();
    const config = getStyleConfig('product-sidebar-contact');
    contactInfo.value = config?.settings?.contactInfo || defaultContactInfo;
  } catch (error) {
    console.error('Failed to load sidebar contact config:', error);
    contactInfo.value = defaultContactInfo;
  }
};
const contactPhoneHref = computed(() => {
  if (!contactInfo.value?.phoneNumber) return '';
  const sanitized = contactInfo.value.phoneNumber.replace(/[^\d+]/g, '');
  return sanitized ? `tel:${sanitized}` : '';
});
const contactEmailHref = computed(() => {
  if (!contactInfo.value?.email) return '';
  return `mailto:${contactInfo.value.email}`;
});

// UI state
const expandedSections = ref({
  priceRange: true,
  categories: true,
  productType: true
});

// Slider options
const sliderOptions = computed(() => ({
  connect: true,
  range: {
    'min': priceRange.value.min,
    'max': priceRange.value.max
  },
  step: 10000,
  tooltips: false,
  pips: false
}));

// Handle price range change from slider
const handlePriceRangeChange = (values: number[]) => {
  if (Array.isArray(values) && values.length === 2) {
    updatePriceRange(values[0], values[1]);
    minPriceInput.value = formatPriceSimple(values[0]);
    maxPriceInput.value = formatPriceSimple(values[1]);
  }
};

// Update range when inputs change
const updatePriceInputs = () => {
  const min = parsePriceInput(minPriceInput.value);
  const max = parsePriceInput(maxPriceInput.value);

  if (min !== null && max !== null) {
    // Ensure min <= max
    if (min <= max) {
      updatePriceRange(min, max);
    } else {
      // If min > max, swap values
      updatePriceRange(max, min);
      minPriceInput.value = formatPriceSimple(max);
      maxPriceInput.value = formatPriceSimple(min);
    }
  }
};

// Toggle section expansion
const toggleSection = (section: keyof typeof expandedSections.value) => {
  expandedSections.value[section] = !expandedSections.value[section];
};

// Watch for changes and emit filter updates
watch(filters, (newFilters) => {
  emit('filter-change', newFilters);
}, { deep: true });

// Initialize
onMounted(() => {
  fetchPriceRange();
  fetchProducts();
  fetchProductCategories();
  loadSidebarContactInfo();
});
</script>

<template>
  <div class="product-sidebar">
    <!-- Single Card Container -->
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
      <!-- Search -->
      <div class="p-4">
        <div class="relative">
          <div class="custom-input-container">
            <UInput
              :model-value="filters.search"
              @update:model-value="handleSearch"
              :placeholder="t('products.searchPlaceholder')"
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
          <div v-if="filters.search" class="mt-2 text-xs text-gray-500">
            {{ t("products.searchingFor") }}:
            <span class="font-medium">{{ filters.search }}</span>
          </div>
        </div>
      </div>

      <hr class="border-gray-200 dark:border-gray-700 mx-4" />

      <!-- Price Range -->
      <div>
        <div
          @click="toggleSection('priceRange')"
          class="flex cursor-pointer items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700"
        >
          <div class="flex items-center gap-2.5">
            <DollarSign class="h-5 w-5 text-primary-500" />
            <h3 class="font-medium text-gray-900 dark:text-white">
              {{ t("products.priceRange") }}
            </h3>
          </div>
          <component
            :is="expandedSections.priceRange ? ChevronUp : ChevronDown"
            class="h-5 w-5 text-gray-500"
          />
        </div>

        <div v-if="expandedSections.priceRange" class="px-4 pb-4">
          <div v-if="isLoadingPriceRange" class="flex justify-center py-4">
            <div
              class="h-5 w-5 animate-spin rounded-full border-2 border-primary-500 border-t-transparent"
            ></div>
          </div>

          <div v-else>
            <!-- Price Range Display -->
            <div class="mb-2 flex items-center justify-between">
              <span class="text-sm font-medium text-sky-500 dark:text-sky-400">
                {{ formatPrice(filters.minPrice || 0) }}
              </span>
              <span class="text-sm font-medium text-sky-500 dark:text-sky-400">
                {{ formatPrice(filters.maxPrice || 0) }}
              </span>
            </div>

            <!-- Vueform Slider -->
            <div class="mb-6 mt-6 px-2">
              <Slider
                :model-value="[filters.minPrice || 0, filters.maxPrice || 0]"
                :options="sliderOptions"
                class="slider-primary"
                @update="handlePriceRangeChange"
              />
            </div>

            <!-- Price Inputs -->
            <div class="mt-4 flex items-center justify-between gap-4">
              <div class="w-1/2">
                <div class="custom-input-container">
                  <UInput
                    v-model="minPriceInput"
                    class="w-full price-input"
                    size="md"
                    @blur="updatePriceInputs"
                    @keyup.enter="updatePriceInputs"
                  >
                    <template #leading>
                      <div class="leading-icon-wrapper">
                        <span class="text-xs text-gray-500">₫</span>
                      </div>
                    </template>
                  </UInput>
                </div>
              </div>
              <div class="text-gray-400">-</div>
              <div class="w-1/2">
                <div class="custom-input-container">
                  <UInput
                    v-model="maxPriceInput"
                    class="w-full price-input"
                    size="md"
                    @blur="updatePriceInputs"
                    @keyup.enter="updatePriceInputs"
                  >
                    <template #leading>
                      <div class="leading-icon-wrapper">
                        <span class="text-xs text-gray-500">₫</span>
                      </div>
                    </template>
                  </UInput>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <hr class="border-gray-200 dark:border-gray-700 mx-4" />

      <!-- Categories -->
      <div>
        <div
          @click="toggleSection('categories')"
          class="flex cursor-pointer items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700"
        >
          <div class="flex items-center gap-2.5">
            <LayoutGrid class="h-5 w-5 text-primary-500" />
            <h3 class="font-medium text-gray-900 dark:text-white">
              {{ t("products.categories") }}
            </h3>
          </div>
          <component
            :is="expandedSections.categories ? ChevronUp : ChevronDown"
            class="h-5 w-5 text-gray-500"
          />
        </div>

        <div v-if="expandedSections.categories" class="px-4 pb-4">
          <div v-if="categoriesLoading" class="flex justify-center py-4">
            <div
              class="h-5 w-5 animate-spin rounded-full border-2 border-primary-500 border-t-transparent"
            ></div>
          </div>

          <div
            v-else-if="uniqueCategories.length === 0"
            class="py-2 text-sm text-gray-500 text-center"
          >
            {{ t("products.noCategories") || "Không có danh mục nào" }}
          </div>

          <div v-else class="space-y-2">
            <div
              v-for="category in uniqueCategories"
              :key="category.id"
              class="flex items-center"
            >
              <UCheckbox
                :model-value="(filters.categories || []).includes(category.id)"
                @update:model-value="toggleCategory(category.id)"
                :name="`category-${category.id}`"
                color="primary"
              />
              <label
                :for="`category-${category.id}`"
                class="ml-2 cursor-pointer text-sm text-gray-700 dark:text-gray-300"
              >
                {{ getCategoryTranslation(category)?.name || "" }}
                <span class="text-xs text-gray-500"
                  >({{ category.products?.length || 0 }})</span
                >
              </label>
            </div>
          </div>
        </div>
      </div>

      <hr class="border-gray-200 dark:border-gray-700 mx-4" />

      <!-- Product Flags -->
      <div>
        <div
          @click="toggleSection('productType')"
          class="flex cursor-pointer items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700"
        >
          <div class="flex items-center gap-2.5">
            <Tag class="h-5 w-5 text-primary-500" />
            <h3 class="font-medium text-gray-900 dark:text-white">
              {{ t("products.productType") }}
            </h3>
          </div>
          <component
            :is="expandedSections.productType ? ChevronUp : ChevronDown"
            class="h-5 w-5 text-gray-500"
          />
        </div>

        <div v-if="expandedSections.productType" class="px-4 pb-4">
          <div class="space-y-2">
            <div class="flex items-center">
              <UCheckbox v-model="filters.isFeatured" name="featured" color="primary" />
              <label
                for="featured"
                class="ml-2 cursor-pointer text-sm text-gray-700 dark:text-gray-300 flex items-center gap-1.5"
              >
                <Star class="h-4 w-4 text-amber-500" />
                {{ t("products.featured") }}
              </label>
            </div>

            <div class="flex items-center">
              <UCheckbox v-model="filters.isNew" name="new" color="primary" />
              <label
                for="new"
                class="ml-2 cursor-pointer text-sm text-gray-700 dark:text-gray-300 flex items-center gap-1.5"
              >
                <Sparkles class="h-4 w-4 text-blue-500" />
                {{ t("products.new") }}
              </label>
            </div>

            <div class="flex items-center">
              <UCheckbox v-model="filters.isSale" name="sale" color="primary" />
              <label
                for="sale"
                class="ml-2 cursor-pointer text-sm text-gray-700 dark:text-gray-300 flex items-center gap-1.5"
              >
                <Flame class="h-4 w-4 text-red-500" />
                {{ t("products.sale") }}
              </label>
            </div>
          </div>
        </div>
      </div>

      <hr class="border-gray-200 dark:border-gray-700 mx-4" />

      <!-- Reset Filters -->
      <div class="p-4">
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
          {{ t("products.resetFilters") }}
        </UButton>
      </div>
    </div>

    <!-- Sales Contact Card -->
    <div
      v-if="contactInfo"
      class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 p-5 contact-card"
    >
      <div class="flex items-start gap-3">
        <div
          class="flex h-12 w-12 items-center justify-center rounded-full bg-primary-50 text-primary-600 dark:bg-primary-500/10 dark:text-primary-300"
        >
          <Phone class="h-5 w-5" />
        </div>
        <div>
          <p class="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
            {{ contactInfo.title }}
          </p>
          <div class="flex items-center gap-2 mt-1">
            <User class="h-4 w-4 text-gray-400" />
            <p class="text-lg font-semibold text-gray-900 dark:text-white">
              {{ contactInfo.representativeName }}
            </p>
          </div>
          <p v-if="contactInfo.position" class="text-sm text-gray-600 dark:text-gray-300 mt-1">
            {{ contactInfo.position }}
          </p>
        </div>
      </div>

      <div class="mt-4 space-y-3 text-sm">
        <div class="flex items-center gap-2 text-primary-600 dark:text-primary-400">
          <Phone class="h-4 w-4" />
          <a
            v-if="contactPhoneHref"
            :href="contactPhoneHref"
            class="font-medium hover:underline"
          >
            {{ contactInfo.phoneNumber }}
          </a>
          <span v-else>{{ contactInfo.phoneNumber }}</span>
        </div>

        <div
          v-if="contactInfo.email"
          class="flex items-center gap-2 text-gray-600 dark:text-gray-300"
        >
          <Mail class="h-4 w-4" />
          <a
            v-if="contactEmailHref"
            :href="contactEmailHref"
            class="hover:underline"
          >
            {{ contactInfo.email }}
          </a>
          <span v-else>{{ contactInfo.email }}</span>
        </div>

        <div
          v-if="contactInfo.availability"
          class="flex items-center gap-2 text-gray-600 dark:text-gray-300"
        >
          <Clock class="h-4 w-4" />
          <span>{{ contactInfo.availability }}</span>
        </div>

        <p v-if="contactInfo.note" class="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
          {{ contactInfo.note }}
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Custom styles for @vueform/slider */
.slider-primary {
  --slider-connect-bg: #0ea5e9;
  --slider-handle-ring-color: #0ea5e9;
  --slider-handle-bg: white;
  --slider-handle-border-color: #0ea5e9;
  --slider-handle-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  --slider-handle-width: 18px;
  --slider-handle-height: 18px;
  --slider-bg: #e5e7eb;
  --slider-height: 8px;
  --slider-touch-area-bg: rgba(14, 165, 233, 0.15);
  --slider-touch-area-width: 40px;
  --slider-touch-area-height: 40px;
}

/* Dark mode adjustments */
:deep(.dark) .slider-primary {
  --slider-connect-bg: #38bdf8;
  --slider-handle-ring-color: #38bdf8;
  --slider-handle-bg: #1f2937;
  --slider-handle-border-color: #38bdf8;
  --slider-bg: #374151;
  --slider-touch-area-bg: rgba(56, 189, 248, 0.2);
}

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
:deep(.search-input),
:deep(.price-input) {
  padding: 0.5rem 0rem;
}

/* Adjust input field padding */
:deep(.search-input input),
:deep(.price-input input) {
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

.product-sidebar {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
</style>
