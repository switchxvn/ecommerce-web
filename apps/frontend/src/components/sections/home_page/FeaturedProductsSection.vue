<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useTrpc } from '~/composables/useTrpc';
import { useLocalization } from '~/composables/useLocalization';
import ProductCard from '~/components/cards/ProductCard.vue';
import { Swiper, SwiperSlide } from 'swiper/vue';
import { Navigation, Pagination, Autoplay, EffectCreative } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import 'swiper/css/effect-creative';

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

interface ProductsConfig {
  title?: string;
  layout?: 'grid' | 'slider';
  columns?: number;
  maxItems?: number;
  showPrice?: boolean;
  showRating?: boolean;
  showButton?: boolean;
  buttonText?: string;
  buttonStyle?: 'solid' | 'outline' | 'soft' | 'ghost' | 'link';
  gap?: string;
  slidesPerView?: {
    desktop: number;
    tablet: number;
    mobile: number;
  };
  autoplay?: boolean;
  interval?: number;
  showDots?: boolean;
  showArrows?: boolean;
  swipeEffect?: 'slide' | 'creative' | 'fade';
  cardStyle?: {
    background?: string;
    shadow?: string;
    border?: string;
    rounded?: string;
    padding?: string;
    transition?: string;
  };
}

interface Props {
  config?: ProductsConfig;
}

const props = withDefaults(defineProps<Props>(), {
  config: () => ({
    layout: 'slider',
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
    showArrows: true
  })
});

const trpc = useTrpc();
const { t } = useLocalization();
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
    const result = await trpc.product.getFeatured.query({
      limit: props.config?.maxItems || 8
    });
    products.value = result.map(product => ({
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
  <section class="featured-products-section py-12 bg-gray-50 dark:bg-gray-900">
    <div class="container mx-auto px-4">
      <!-- Section Title -->
      <h2 v-if="config?.title" class="text-3xl font-bold text-center mb-8">
        {{ config.title }}
      </h2>

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
        <div v-if="config?.layout === 'grid'"
             class="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <ProductCard v-for="product in products"
                      :key="product.id"
                      :product="product" />
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
  overflow-x: hidden;

  .swiper-outer-container {
    position: relative;
    margin: 0 auto;
    padding: 0;
    width: 100%;

    @media (min-width: 641px) {
      margin: 0 -40px;
      padding: 0 40px;
    }
  }

  .swiper-container {
    overflow: hidden;
    position: relative;
    width: 100%;
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
        opacity: 0;
        visibility: hidden;
        pointer-events: none;
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