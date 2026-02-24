<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useLocalization } from "~/composables/useLocalization";
import { useCategory } from "~/composables/useCategory";
import { useTrpc } from "~/composables/useTrpc";
import ProductCard from "~/components/cards/ProductCard.vue";
import type { Category, CategoryTranslation } from "@ew/shared";
import { ArrowRight } from "lucide-vue-next";

const props = defineProps<{
  config: {
    title: string;
    layout: "grid" | "slider";
    columns: number;
    maxItems: number;
    showIcon: boolean;
    showTitle: boolean;
    descriptionLength: number;
    gap: string;
    backgroundGradient: {
      from: string;
      to: string;
      direction: string;
    };
    overlayOpacity: string;
    padding: {
      top: string;
      bottom: string;
    };
    cardStyle: {
      background: string;
      shadow: string;
      border: string;
      rounded: string;
      padding: string;
      transition: string;
    };
    iconStyle: {
      size: string;
      background: string;
      color: string;
      rounded: string;
      padding: string;
    };
    titleStyle: {
      size: string;
      weight: string;
      color: string;
      margin: string;
    };
    categoryIds?: number[];
    productsPerCategory?: number;
    displayMode: "grid" | "slider";
    alignment: {
      container: string;
      header: string;
      content: string;
    };
    fontSize: {
      title: string;
    };
    colors: {
      title: string;
    };
    useUppercase?: boolean;
  };
}>();

const { t, locale } = useLocalization();
const { loading, error } = useCategory();
const trpc = useTrpc();

// State
const categories = ref<Category[]>([]);
const categoryProducts = ref<Record<number, any[]>>({});

// Composables
const { fetchCategoryById } = useCategory();

// Methods
const fetchCategories = async () => {
  if (!props.config.categoryIds?.length) return;

  try {
    const fetchedCategories = await Promise.all(
      props.config.categoryIds.map((id) => fetchCategoryById(id))
    );

    categories.value = fetchedCategories.filter((cat) => cat !== null);

    // Fetch products for each category
    await Promise.all(
      categories.value.map(async (category) => {
        try {
          const result = await trpc.product.getAll.query({
            categories: [category.id],
            limit: props.config.maxItems || 8,
            locale: locale.value,
          });
          categoryProducts.value[category.id] = result.items;
        } catch (err) {
          console.error(`Error fetching products for category ${category.id}:`, err);
          categoryProducts.value[category.id] = [];
        }
      })
    );
  } catch (err) {
    console.error("Error fetching categories:", err);
  }
};

// Computed
const getCategoryTranslation = (category: Category): CategoryTranslation => {
  return category.translations?.find((t: CategoryTranslation) => t.locale === locale.value) || {} as CategoryTranslation;
};

const gridClasses = computed(() => {
  const cols = props.config.columns || 4;
  return {
    "grid-cols-1": true,
    "sm:grid-cols-2": cols >= 2,
    "md:grid-cols-3": cols >= 3,
    "lg:grid-cols-4": cols >= 4,
  };
});

// Lifecycle
onMounted(() => {
  fetchCategories();
});
</script>

<template>
  <section
    class="categories-section relative"
  >
    <!-- Background gradient overlay -->
    <div
      v-if="config.backgroundGradient"
      class="absolute inset-0"
      :style="{
        backgroundImage: `linear-gradient(${config.backgroundGradient.direction.replace(
          'to-',
          'to '
        )}, ${config.backgroundGradient.from}, ${config.backgroundGradient.to})`,
        opacity: config.overlayOpacity || '0.1',
        pointerEvents: 'none',
      }"
    ></div>

    <!-- Categories Grid/Slider -->
    <div v-if="!loading && !error && categories.length > 0" class="space-y-0">
      <div
        v-for="(category, index) in categories.slice(0, config.maxItems)"
        :key="index"
        class="category-section w-full"
        :class="{
          'bg-gray-50 dark:bg-gray-800/50': index % 2 === 0,
          'bg-white dark:bg-gray-900/50': index % 2 === 1
        }"
      >
        <div class="container mx-auto px-4">
          <div class="py-12">
            <!-- Category Header -->
            <div class="mb-8 bg-primary-600 dark:bg-primary-500 rounded-lg">
              <div class="container mx-auto px-4">
                <div class="flex items-center justify-between gap-4 py-3">
                  <div class="w-32 hidden sm:block"><!-- Spacer to help with centering --></div>
                  <div class="category-header flex-1 text-center">
                    <h2 
                      class="inline-flex items-center px-4 py-2 mobile-title"
                      :class="[
                        config.fontSize?.title || 'text-2xl sm:text-3xl',
                        'font-bold text-white',
                        config.useUppercase ? 'uppercase' : ''
                      ]"
                    >
                      {{ getCategoryTranslation(category).name }}
                    </h2>
                  </div>
                  <div class="w-32 flex justify-end">
                    <NuxtLink
                      :to="`/categories/${getCategoryTranslation(category).slug}`"
                      class="mobile-view-all inline-flex items-center justify-center px-4 py-2 text-xs sm:text-lg font-semibold uppercase tracking-wider text-white hover:text-primary-100 transition-colors duration-200 whitespace-nowrap"
                    >
                      {{ t("categories.viewAllIn") }}
                      <ArrowRight class="ml-1 h-3 w-3 sm:h-5 sm:w-5" aria-hidden="true" />
                    </NuxtLink>
                  </div>
                </div>
              </div>
            </div>

            <!-- Products Display -->
            <template v-if="categoryProducts[category.id]?.length > 0">
              <!-- Grid Layout -->
              <div
                v-if="config.displayMode === 'grid'"
                class="grid gap-6"
                :class="gridClasses"
              >
                <ProductCard
                  v-for="(product, productIndex) in categoryProducts[category.id].slice(0, config.maxItems)"
                  :key="productIndex"
                  :product="product"
                  :locale="locale"
                />
              </div>

              <!-- Slider Layout -->
              <UCarousel
                v-else
                :items="categoryProducts[category.id].slice(0, config.maxItems)"
                :options="{
                  itemsToShow: 1.2,
                  snapAlign: 'start',
                  breakpoints: {
                    640: { itemsToShow: 2.2 },
                    768: { itemsToShow: 3.2 },
                    1024: { itemsToShow: 4.2 },
                  },
                }"
              >
                <template #item="{ item: product }">
                  <div class="px-2">
                    <ProductCard :product="product" :locale="locale" />
                  </div>
                </template>
              </UCarousel>
            </template>

            <!-- No Products Message -->
            <div v-else class="text-center py-8 text-gray-500 dark:text-gray-400">
              {{ t("categories.noProductsInCategory", { category: getCategoryTranslation(category).name }) }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-else-if="loading" class="container mx-auto px-4">
      <div class="flex justify-center items-center py-12">
        <Loader size="lg" />
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="container mx-auto px-4">
      <div class="text-center text-red-500 py-8">
        {{ error }}
      </div>
    </div>

    <!-- Empty State -->
    <div v-else class="container mx-auto px-4">
      <div class="text-center py-8">
        {{ t("categories.no_categories") }}
      </div>
    </div>
  </section>
</template>

<style lang="scss" scoped>
.category-section {
  &:not(:last-child) {
    margin-bottom: 0;
  }
}

.category-header {
  position: relative;

  @media (max-width: 640px) {
    text-align: left !important;
    
    h2.mobile-title {
      font-size: 0.875rem !important; /* text-sm */
      line-height: 1.25rem !important;
      padding: 0.375rem 0 !important;
      justify-content: flex-start !important;
      letter-spacing: 0.025em !important;
      font-weight: 600 !important;
    }
  }
}

.mobile-view-all {
  @media (max-width: 640px) {
    font-size: 0.75rem !important; /* text-xs */
    line-height: 1rem !important;
    padding: 0.25rem 0.75rem !important;
    font-weight: 500 !important;
    letter-spacing: 0.025em !important;
  }
}
</style> 