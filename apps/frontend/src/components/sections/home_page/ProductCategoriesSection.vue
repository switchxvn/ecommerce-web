<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useLocalization } from "~/composables/useLocalization";
import { useCategory } from "~/composables/useCategory";
import { useTrpc } from "~/composables/useTrpc";
import ProductCard from "~/components/cards/ProductCard.vue";
import type { Category, CategoryTranslation } from "@ew/shared";

const props = defineProps<{
  config: {
    title: string;
    layout: "grid" | "slider";
    columns: number;
    maxItems: number;
    showIcon: boolean;
    showTitle: boolean;
    showDescription: boolean;
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
    descriptionStyle: {
      size: string;
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
      description: string;
    };
    colors: {
      title: string;
      description: string;
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
            limit: props.config.productsPerCategory || 4,
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

const truncateDescription = (category: Category): string => {
  const translation = getCategoryTranslation(category);
  const description = translation.description || '';
  if (!description) return "";
  return description.length > props.config.descriptionLength
    ? `${description.slice(0, props.config.descriptionLength)}...`
    : description;
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
    />

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
            <div class="mb-8">
              <div class="flex items-center justify-between gap-4">
                <div class="category-header flex-1">
                  <div class="flex flex-col items-center">
                    <h2 :class="[
                      config.fontSize?.title || 'text-2xl sm:text-3xl',
                      config.colors?.title || 'text-gray-900 dark:text-white',
                      'font-bold',
                      config.useUppercase ? 'uppercase' : ''
                    ]">
                      {{ getCategoryTranslation(category).name }}
                    </h2>
                    <div
                      class="mt-2 h-1 w-20 bg-primary-600 dark:bg-primary-500 rounded-full"
                    ></div>
                  </div>
                  <p 
                    v-if="getCategoryTranslation(category).description" 
                    :class="[
                      'mt-3 text-center',
                      config.fontSize?.description || 'text-base',
                      config.colors?.description || 'text-gray-600 dark:text-gray-400'
                    ]"
                  >
                    {{ truncateDescription(category) }}
                  </p>
                </div>
                <NuxtLink
                  :to="`/categories/${getCategoryTranslation(category).slug}`"
                  class="inline-flex items-center justify-center px-4 py-2 text-sm font-medium uppercase tracking-wider text-white bg-primary-600 hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-600 rounded-lg transition-colors duration-200 whitespace-nowrap"
                >
                  {{ t("categories.viewAllIn") }}
                  <UIcon name="i-heroicons-arrow-right" class="ml-2 h-5 w-5" />
                </NuxtLink>
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
                  v-for="(product, productIndex) in categoryProducts[category.id]"
                  :key="productIndex"
                  :product="product"
                  :locale="locale"
                />
              </div>

              <!-- Slider Layout -->
              <UCarousel
                v-else
                :items="categoryProducts[category.id]"
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

  h2 {
    position: relative;
    display: inline-block;

    &::after {
      content: "";
      position: absolute;
      bottom: -0.5rem;
      left: 50%;
      transform: translateX(-50%);
      width: 100%;
      height: 2px;
      background: linear-gradient(90deg, transparent, var(--color-primary-600), transparent);
      border-radius: 1px;
    }
  }
}
</style>
