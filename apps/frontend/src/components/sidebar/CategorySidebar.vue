<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { useLocalization } from '~/composables/useLocalization';
import { useCategory } from '~/composables/useCategory';
import { useProduct, type ProductFilter, type ProductSortBy } from '~/composables/useProduct';
import { 
  Search, 
  DollarSign, 
  Tag, 
  Star, 
  Sparkles, 
  Flame, 
  ChevronUp, 
  ChevronDown, 
  RotateCcw 
} from 'lucide-vue-next';
import Slider from '@vueform/slider';
import '@vueform/slider/themes/default.css';

const { t, locale } = useLocalization();
const DEFAULT_MAX_PRICE = 10_000_000_000;
const { 
  productCategories,
  loading: categoriesLoading,
  uniqueCategories,
  getCategoryTranslation,
  fetchProductCategories
} = useCategory();

const props = defineProps<{
  initialFilters: ProductFilter;
  categoryId?: number;
  quickLinksHeading?: string;
  quickLinks?: Array<{
    label: string;
    to: string;
  }>;
  availableAttributes?: Array<{
    id: string;
    name: string;
    values: string[];
    translations?: Array<{
      locale: string;
      name: string;
    }>;
  }>;
  supportCta?: {
    title: string;
    description: string;
    primaryLabel: string;
    primaryTo: string;
  } | null;
}>();

const emit = defineEmits<{
  (e: 'filter-change', filters: ProductFilter): void;
}>();

const tr = (key: string, fallback: string) => t(key) || fallback;

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
  resetFilters
} = useProduct(props.initialFilters);

// Custom price range inputs
const minPriceInput = ref(formatPriceSimple(filters.value.minPrice ?? 0));
const maxPriceInput = ref(formatPriceSimple(filters.value.maxPrice ?? 0));

// UI state
const expandedSections = ref({
  priceRange: true,
  productType: true,
  attributes: false
});

// Price range data
const minMaxPrice = ref<{ min: number; max: number }>({ min: 0, max: DEFAULT_MAX_PRICE });

// Price range state
const currentRange = ref([0, DEFAULT_MAX_PRICE]);

// Update minMaxPrice when priceRange changes
watch(priceRange, (newRange) => {
  if (newRange) {
    minMaxPrice.value = {
      min: newRange.min,
      max: newRange.max
    };
    currentRange.value = [
      filters.value.minPrice || newRange.min,
      filters.value.maxPrice || newRange.max
    ];
  }
}, { immediate: true });

// Slider options
const sliderOptions = computed(() => ({
  connect: true,
  range: {
    'min': minMaxPrice.value.min,
    'max': minMaxPrice.value.max
  },
  step: 10000,
  tooltips: false,
  pips: false
}));

// Search state
const searchTimeout = ref<NodeJS.Timeout | null>(null);

// Attributes data
interface CategoryAttribute {
  id: string;
  name: string;
  values: string[];
  translations?: Array<{
    locale: string;
    name: string;
  }>;
}

interface CategoryAttributeResponse {
  id: number;
  attributes: Array<{
    id: number;
    name: string;
    values: string[];
    translations?: Array<{
      locale: string;
      name: string;
    }>;
  }>;
}

interface ProductFilterWithAttributes extends ProductFilter {
  attributes?: Array<{
    id: number;
    values: string[];
  }>;
}

const attributes = computed<CategoryAttribute[]>(() => props.availableAttributes || []);
const isLoadingAttributes = ref(false);
const selectedAttributes = ref<Record<string, string[]>>({});

// Computed percentage values for slider positioning
const minPercentage = computed(() => {
  const min = priceRange.value?.min ?? 0;
  const rangeMin = minMaxPrice.value.min;
  const rangeMax = minMaxPrice.value.max;
  return ((min - rangeMin) / (rangeMax - rangeMin)) * 100;
});

const maxPercentage = computed(() => {
  const max = priceRange.value?.max ?? 0;
  const rangeMin = minMaxPrice.value.min;
  const rangeMax = minMaxPrice.value.max;
  return ((max - rangeMin) / (rangeMax - rangeMin)) * 100;
});

// Watch for changes and emit filter updates
watch(filters, (newFilters) => {
  emit('filter-change', newFilters);
}, { deep: true });

// Handle price range change from slider
const handlePriceRangeChange = (values: number[]) => {
  if (Array.isArray(values) && values.length === 2) {
    const [min, max] = values;
    currentRange.value = [min, max];
    filters.value.minPrice = min;
    filters.value.maxPrice = max;
    minPriceInput.value = formatPriceSimple(min);
    maxPriceInput.value = formatPriceSimple(max);
  }
};

// Update range when inputs change
const updatePriceInputs = () => {
  const min = parsePriceInput(minPriceInput.value);
  const max = parsePriceInput(maxPriceInput.value);

  if (min !== null && max !== null) {
    // Ensure min <= max
    if (min <= max) {
      filters.value.minPrice = min;
      filters.value.maxPrice = max;
    } else {
      // If min > max, swap values
      filters.value.minPrice = max;
      filters.value.maxPrice = min;
      minPriceInput.value = formatPriceSimple(max);
      maxPriceInput.value = formatPriceSimple(min);
    }
  }
};

// Toggle attribute value selection
const toggleAttributeValue = (attributeId: string, value: string) => {
  if (!selectedAttributes.value[attributeId]) {
    selectedAttributes.value[attributeId] = [];
  }
  
  const index = selectedAttributes.value[attributeId].indexOf(value);
  if (index === -1) {
    selectedAttributes.value[attributeId].push(value);
  } else {
    selectedAttributes.value[attributeId].splice(index, 1);
  }
  
  emit('filter-change', {
    ...props.initialFilters,
    attributes: Object.entries(selectedAttributes.value).map(([id, values]) => ({
      id: Number(id),
      values
    }))
  });
};

// Toggle section expansion
const toggleSection = (section: keyof typeof expandedSections.value) => {
  expandedSections.value[section] = !expandedSections.value[section];
};

// Initialize
onMounted(() => {
  fetchPriceRange();
  fetchProductCategories();
});

// Reset filters with emit
const handleResetFilters = () => {
  selectedAttributes.value = {};
  minPriceInput.value = '';
  maxPriceInput.value = '';
  emit('filter-change', {
    ...props.initialFilters,
    minPrice: undefined,
    maxPrice: undefined,
    attributes: []
  });
};

</script>

<template>
  <div class="category-sidebar">
    <!-- Single Card Container -->
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
      <!-- Search -->
      <div class="p-4">
        <div class="relative">
          <div class="custom-input-container">
            <UInput
              v-model="filters.search"
              :placeholder="tr('products.searchPlaceholder', 'Tìm kiếm sản phẩm...')"
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
            {{ tr('products.searchingFor', 'Đang tìm kiếm') }}: <span class="font-medium">{{ filters.search }}</span>
          </div>
        </div>
      </div>
      
      <hr class="border-gray-200 dark:border-gray-700 mx-4">
      
      <!-- Price Range -->
      <div>
        <div 
          @click="toggleSection('priceRange')"
          class="flex cursor-pointer items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700"
        >
          <div class="flex items-center gap-2.5">
            <DollarSign class="h-5 w-5 text-primary-500" />
            <h3 class="font-medium text-gray-900 dark:text-white">{{ tr('products.priceRange', 'Khoảng giá') }}</h3>
          </div>
          <component 
            :is="expandedSections.priceRange ? ChevronUp : ChevronDown" 
            class="h-5 w-5 text-gray-500"
          />
        </div>
        
        <div v-if="expandedSections.priceRange" class="px-4 pb-4">
          <div v-if="isLoadingPriceRange" class="flex justify-center py-4">
            <div class="h-5 w-5 animate-spin rounded-full border-2 border-primary-500 border-t-transparent"></div>
          </div>
          
          <div v-else>
            <!-- Price Range Display -->
            <div class="mb-2 flex items-center justify-between">
              <span class="text-sm font-medium text-sky-500 dark:text-sky-400">
                {{ formatPrice(currentRange[0]) }}
              </span>
              <span class="text-sm font-medium text-sky-500 dark:text-sky-400">
                {{ formatPrice(currentRange[1]) }}
              </span>
            </div>
            
            <!-- Vueform Slider -->
            <div class="mb-6 mt-6 px-2">
              <Slider
                v-model="currentRange"
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
      
      <hr class="border-gray-200 dark:border-gray-700 mx-4">
      
      <!-- Product Flags -->
      <div>
        <div 
          @click="toggleSection('productType')"
          class="flex cursor-pointer items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700"
        >
          <div class="flex items-center gap-2.5">
            <Tag class="h-5 w-5 text-primary-500" />
            <h3 class="font-medium text-gray-900 dark:text-white">{{ tr('products.productType', 'Loại sản phẩm') }}</h3>
          </div>
          <component 
            :is="expandedSections.productType ? ChevronUp : ChevronDown" 
            class="h-5 w-5 text-gray-500"
          />
        </div>
        
        <div v-if="expandedSections.productType" class="px-4 pb-4">
          <div class="space-y-2">
            <div class="flex items-center">
              <UCheckbox
                v-model="filters.isFeatured"
                name="featured"
                color="primary"
              />
              <label for="featured" class="ml-2 cursor-pointer text-sm text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                <Star class="h-4 w-4 text-amber-500" />
                {{ tr('products.featured', 'Nổi bật') }}
              </label>
            </div>
            
            <div class="flex items-center">
              <UCheckbox
                v-model="filters.isNew"
                name="new"
                color="primary"
              />
              <label for="new" class="ml-2 cursor-pointer text-sm text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                <Sparkles class="h-4 w-4 text-blue-500" />
                {{ tr('products.new', 'Hàng mới về') }}
              </label>
            </div>
            
            <div class="flex items-center">
              <UCheckbox
                v-model="filters.isSale"
                name="sale"
                color="primary"
              />
              <label for="sale" class="ml-2 cursor-pointer text-sm text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                <Flame class="h-4 w-4 text-red-500" />
                {{ tr('products.sale', 'Khuyến mãi') }}
              </label>
            </div>
          </div>
        </div>
      </div>
      
      <hr class="border-gray-200 dark:border-gray-700 mx-4">
      
      <!-- Category Attributes -->
      <div v-if="attributes.length > 0">
        <div 
          @click="toggleSection('attributes')"
          class="flex cursor-pointer items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700"
        >
          <div class="flex items-center gap-2.5">
            <UIcon name="i-heroicons-adjustments-horizontal" class="h-5 w-5 text-primary-500" />
            <h3 class="font-medium text-gray-900 dark:text-white">{{ tr('products.attributes', 'Thuộc tính') }}</h3>
          </div>
          <component 
            :is="expandedSections.attributes ? ChevronUp : ChevronDown" 
            class="h-5 w-5 text-gray-500"
          />
        </div>
        
        <div v-if="expandedSections.attributes" class="px-4 pb-4">
          <div v-if="isLoadingAttributes" class="flex justify-center py-4">
            <div class="h-5 w-5 animate-spin rounded-full border-2 border-primary-500 border-t-transparent"></div>
          </div>
          
          <div v-else class="space-y-4">
            <div v-for="attribute in attributes" :key="attribute.id" class="border-b border-gray-100 pb-3 dark:border-gray-800 last:border-0 last:pb-0">
              <h4 class="mb-2 font-medium text-sm text-gray-800 dark:text-gray-200">
                {{ attribute.translations?.find(t => t.locale === locale)?.name || attribute.name }}
              </h4>
              <div class="space-y-1">
                <div 
                  v-for="value in attribute.values" 
                  :key="`${attribute.id}-${value}`"
                  class="flex items-center"
                >
                  <UCheckbox
                    :model-value="selectedAttributes[attribute.id]?.includes(value)"
                    @update:model-value="() => toggleAttributeValue(attribute.id, value)"
                    :name="`attr-${attribute.id}-${value}`"
                    color="primary"
                  />
                  <label :for="`attr-${attribute.id}-${value}`" class="ml-2 cursor-pointer text-sm text-gray-700 dark:text-gray-300">
                    {{ value }}
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <hr class="border-gray-200 dark:border-gray-700 mx-4">
      </div>
      
      <!-- Reset Filters -->
      <div class="p-4">
        <UButton
          @click="handleResetFilters"
          variant="ghost"
          color="gray"
          block
          size="sm"
          class="mt-0"
        >
          <template #leading>
            <RotateCcw class="h-4 w-4 mr-1.5" />
          </template>
          {{ tr('products.resetFilters', 'Đặt lại bộ lọc') }}
        </UButton>
      </div>
    </div>

    <div
      v-if="props.quickLinks?.length"
      class="mt-6 rounded-3xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-800"
    >
      <h3 class="text-base font-semibold text-gray-900 dark:text-white">
        {{ props.quickLinksHeading || 'Xem nhanh theo nhu cầu' }}
      </h3>
      <div class="mt-4 space-y-3">
        <NuxtLink
          v-for="item in props.quickLinks"
          :key="item.to"
          :to="item.to"
          class="flex items-center justify-between rounded-2xl border border-gray-200 px-4 py-3 text-sm font-medium text-gray-800 transition hover:border-primary-500 hover:text-primary-600 dark:border-gray-700 dark:text-gray-100 dark:hover:border-primary-400 dark:hover:text-primary-300"
        >
          <span>{{ item.label }}</span>
          <span aria-hidden="true">→</span>
        </NuxtLink>
      </div>
    </div>

    <div
      v-if="props.supportCta"
      class="mt-6 rounded-3xl border border-primary-200 bg-primary-50 p-5 shadow-sm dark:border-primary-900/60 dark:bg-primary-900/20"
    >
      <h3 class="text-base font-semibold text-gray-900 dark:text-white">
        {{ props.supportCta.title }}
      </h3>
      <p class="mt-2 text-sm text-gray-600 dark:text-gray-300">
        {{ props.supportCta.description }}
      </p>
      <NuxtLink
        :to="props.supportCta.primaryTo"
        class="mt-4 inline-flex items-center rounded-full bg-primary-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-700"
      >
        {{ props.supportCta.primaryLabel }}
      </NuxtLink>
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

.category-sidebar {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  z-index: 110;
}
</style> 
