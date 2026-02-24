<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useTrpc } from '~/composables/useTrpc';
import { useLocalization } from '~/composables/useLocalization';
import ProductCard from '~/components/cards/ProductCard.vue';
import { Swiper, SwiperSlide } from 'swiper/vue';
import { Navigation, Pagination, Autoplay } from 'swiper/modules';
import { ArrowRight } from 'lucide-vue-next';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

interface ProductTranslation {
  locale: string;
  title: string;
  shortDescription: string;
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
}

interface Product {
  id: number;
  sku?: string;
  price: number | null;
  comparePrice: number | null;
  thumbnail?: string;
  slug?: string;
  isFeatured: boolean;
  isNew: boolean;
  isSale: boolean;
  translations: ProductTranslation[];
  formattedPrice?: string;
}

interface Props {
  config: {
    title: string;
    layout: 'grid' | 'slider';
    maxItems: number;
    showPrice: boolean;
    showRating: boolean;
    showButton: boolean;
    buttonText: string;
    buttonStyle: 'solid' | 'outline' | 'soft' | 'ghost' | 'link';
    gap: string;
    slidesPerView: {
      desktop: number;
      tablet: number;
      mobile: number;
    };
    autoplay: boolean;
    interval: number;
    showDots: boolean;
    showArrows: boolean;
    displayMode: 'grid' | 'slider';
    fontSize: {
      title: string;
      description?: string;
    };
    useUppercase: boolean;
    colors: {
      title: string;
      description?: string;
    };
    alignment?: {
      header: string;
      content: string;
      container: string;
    };
    columns?: number;
    showDescription?: boolean;
  };
}

const props = withDefaults(defineProps<Props>(), {
  config: () => ({
    title: 'Sản phẩm nổi bật',
    layout: 'grid',
    maxItems: 8,
    showPrice: true,
    showRating: true,
    showButton: true,
    buttonText: 'Xem chi tiết',
    buttonStyle: 'solid',
    gap: '1rem',
    slidesPerView: {
      desktop: 4,
      tablet: 2,
      mobile: 1
    },
    autoplay: true,
    interval: 5000,
    showDots: true,
    showArrows: true,
    displayMode: 'grid',
    fontSize: {
      title: 'text-2xl',
      description: 'text-base'
    },
    useUppercase: true,
    colors: {
      title: 'text-gray-900 dark:text-white',
      description: 'text-gray-600 dark:text-gray-400'
    },
    alignment: {
      header: 'justify-between',
      content: 'text-left',
      container: 'items-start'
    },
    columns: 8,
    showDescription: true
  })
});

const trpc = useTrpc();
const { t, locale } = useLocalization();
const products = ref<Product[]>([]);
const isLoading = ref(false);
const error = ref<string | null>(null);

const swiperOptions = computed(() => ({
  modules: [Navigation, Pagination, Autoplay],
  slidesPerView: 1,
  spaceBetween: 24,
  navigation: {
    nextEl: '.featured-swiper-next',
    prevEl: '.featured-swiper-prev',
  },
  pagination: {
    el: '.featured-swiper-pagination',
    clickable: true,
  },
  breakpoints: {
    640: {
      slidesPerView: props.config?.slidesPerView?.mobile || 1,
    },
    1024: {
      slidesPerView: props.config?.slidesPerView?.tablet || 2,
    },
    1280: {
      slidesPerView: props.config?.slidesPerView?.desktop || 4,
    },
  },
}));

onMounted(async () => {
  await fetchFeaturedProducts();
});

async function fetchFeaturedProducts() {
  isLoading.value = true;
  error.value = null;
  try {
    const result = await trpc.product.getAll.query({
      limit: props.config?.maxItems || 8,
      isFeatured: true,
      locale: locale.value
    });
    products.value = result.items.map(product => ({
      ...product,
      isFeatured: true,
      isNew: product.isNew || false,
      isSale: !!product.comparePrice,
      translations: product.translations || []
    }));
  } catch (err: any) {
    console.error('Failed to fetch featured products:', err);
    error.value = err.message || t('errors.failed_to_load');
  } finally {
    isLoading.value = false;
  }
}
</script>

<template>
  <section class="featured-products-section py-12">
    <div class="container mx-auto px-4">
      <!-- Section Header -->
      <div class="mb-8 bg-primary-600 dark:bg-primary-500 rounded-lg">
        <div class="container mx-auto px-4">
          <div class="flex items-center gap-4 py-3" :class="config.alignment?.header || 'justify-between'">
            <div class="w-32 hidden sm:block"><!-- Spacer to help with centering --></div>
            <div class="category-header flex-1" :class="config.alignment?.content || 'text-center'">
              <h2 
                class="inline-flex items-center px-4 py-2 mobile-title"
                :class="[
                  config.fontSize?.title || 'text-2xl sm:text-3xl',
                  'font-bold',
                  config.colors?.title || 'text-white',
                  config.useUppercase ? 'uppercase' : ''
                ]"
              >
                {{ config.title }}
              </h2>
            </div>
            <div class="w-32 flex justify-end">
              <NuxtLink
                to="/products"
                class="mobile-view-all inline-flex items-center justify-center px-4 py-2 text-xs sm:text-lg font-semibold uppercase tracking-wider text-white hover:text-primary-100 transition-colors duration-200 whitespace-nowrap"
              >
                {{ t("products.viewAll") }}
                <ArrowRight class="ml-1 h-3 w-3 sm:h-5 sm:w-5" aria-hidden="true" />
              </NuxtLink>
            </div>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="isLoading" class="flex justify-center items-center py-12">
        <Loader size="lg" />
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="text-center text-red-500 py-8">
        {{ error }}
      </div>

      <!-- No Products State -->
      <div v-else-if="products.length === 0" class="text-center py-8">
        {{ t('products.no_featured_products') }}
      </div>

      <!-- Products Display -->
      <template v-else>
        <!-- Grid Layout -->
        <div v-if="config?.displayMode === 'grid'"
             class="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
             :class="[`gap-${config.gap || '6'}`]">
          <template v-for="(product, index) in products" :key="product.id">
            <ProductCard v-if="index < (config.maxItems || 8)"
                      :product="product"
                      class="w-full" />
          </template>
        </div>

        <!-- Slider Layout -->
        <div v-else class="swiper-outer-container">
          <div class="swiper-container">
            <Swiper v-bind="swiperOptions" class="featured-products-swiper">
              <SwiperSlide v-for="product in products" 
                          :key="product.id"
                          class="!h-auto">
                <ProductCard :product="product" />
              </SwiperSlide>
            </Swiper>
          </div>

          <!-- Navigation -->
          <div class="featured-swiper-prev swiper-button-prev !z-10"></div>
          <div class="featured-swiper-next swiper-button-next !z-10"></div>
          
          <!-- Pagination -->
          <div class="featured-swiper-pagination mt-6"></div>
        </div>
      </template>
    </div>
  </section>
</template>

<style lang="scss" scoped>
.featured-products-section {
  @media (max-width: 640px) {
    overflow-x: hidden;
  }

  .category-header {
    @media (max-width: 640px) {
      text-align: left !important;
      
      h2.mobile-title {
        font-size: 0.875rem !important;
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
      font-size: 0.75rem !important;
      line-height: 1rem !important;
      padding: 0.25rem 0.75rem !important;
      font-weight: 500 !important;
      letter-spacing: 0.025em !important;
    }
  }

  .swiper-outer-container {
    position: relative;
    width: 100vw;
    left: 50%;
    right: 50%;
    margin-left: -50vw;
    margin-right: -50vw;
    padding: 0;

    @media (min-width: 641px) {
      width: auto;
      left: auto;
      right: auto;
      margin: 0 -40px;
      padding: 0 40px;
    }
  }

  .swiper-container {
    overflow: hidden;
    position: relative;
    width: 100%;
    padding: 0 16px;

    @media (min-width: 641px) {
      padding: 0;
    }
  }

  :deep() {
    .featured-products-swiper {
      .swiper-wrapper {
        display: flex;
        align-items: stretch;
      }

      .swiper-slide {
        height: auto;
        display: flex;
        width: 100%;
      }
    }

    .featured-swiper-next,
    .featured-swiper-prev {
      position: absolute;
      top: 50%;
      transform: translateY(-50%);
      width: 40px;
      height: 40px;
      margin-top: -20px;
      background: white;
      border-radius: 50%;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      cursor: pointer;
      z-index: 10;
      
      @media (max-width: 640px) {
        display: none;
      }
      
      &::after {
        font-size: 1.2rem;
        font-weight: bold;
        color: var(--primary);
      }
      
      &:hover {
        background-color: var(--primary);
        &::after {
          color: white;
        }
      }
      
      &.swiper-button-disabled {
        opacity: 0.5;
        cursor: not-allowed;
        
        &:hover {
          background-color: white;
          &::after {
            color: var(--primary);
          }
        }
      }
    }

    .featured-swiper-prev {
      left: 0;
    }

    .featured-swiper-next {
      right: 0;
    }

    .featured-swiper-pagination {
      position: relative;
      bottom: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      margin-top: 1rem;
      
      .swiper-pagination-bullet {
        width: 8px;
        height: 8px;
        margin: 0;
        background-color: var(--primary);
        opacity: 0.3;
        transition: all 0.3s ease;
        
        &-active {
          opacity: 1;
          transform: scale(1.2);
        }
      }
    }
  }
}
</style> 