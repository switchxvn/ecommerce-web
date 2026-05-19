<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useTrpc } from '~/composables/useTrpc';
import { Swiper, SwiperSlide } from 'swiper/vue';
import { Navigation, Autoplay } from 'swiper/modules';
import { useColorMode } from '@vueuse/core';
import 'swiper/css';
import 'swiper/css/navigation';

interface CustomerLogo {
  id: number;
  imageUrl: string;
  alt: string;
  link?: string;
  order: number;
  isActive: boolean;
}

interface CustomerLogosConfig {
  title?: string;
  displayType: 'grid' | 'slider';
  gridColumns: {
    base: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
  };
  gap: string;
  logoHeight: string;
  logoWidth: string;
  backgroundColor: string;
  containerPadding: string;
  showTitle: boolean;
  titleAlignment: 'left' | 'center' | 'right';
  autoplay: boolean;
  interval: number;
  showArrows: boolean;
  slidesToShow: {
    base: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
  };
  darkMode: {
    backgroundColor: string;
    textColor: string;
  };
  fontSize: {
    title: string;
  };
  useUppercase: boolean;
  colors: {
    title: string;
    text: string;
    primary: string;
    secondary: string;
    accent: string;
  };
  headerStyle: {
    background: string;
    rounded: string;
    padding: string;
  };
}

interface Props {
  sectionId?: number;
  config?: CustomerLogosConfig;
}

const props = withDefaults(defineProps<Props>(), {
  sectionId: undefined,
  config: () => ({
    title: 'Khách hàng tiêu biểu',
    displayType: 'grid',
    gridColumns: {
      base: 2,
      sm: 3,
      md: 4,
      lg: 5,
      xl: 6
    },
    gap: '1rem',
    logoHeight: '80px',
    logoWidth: 'auto',
    backgroundColor: 'transparent',
    containerPadding: '2rem',
    showTitle: true,
    titleAlignment: 'center',
    autoplay: true,
    interval: 3000,
    showArrows: true,
    slidesToShow: {
      base: 2,
      sm: 3,
      md: 4,
      lg: 5,
      xl: 6
    },
    darkMode: {
      backgroundColor: '#1a1a1a',
      textColor: '#ffffff'
    },
    fontSize: {
      title: 'text-2xl sm:text-3xl'
    },
    useUppercase: false,
    colors: {
      title: 'text-gray-900 dark:text-white',
      text: 'text-gray-600 dark:text-gray-300',
      primary: 'text-primary-600 dark:text-primary-400',
      secondary: 'text-gray-500 dark:text-gray-400',
      accent: 'text-accent-600 dark:text-accent-400'
    },
    headerStyle: {
      background: 'bg-primary-600 dark:bg-primary-500',
      rounded: 'rounded-lg',
      padding: 'py-3'
    }
  })
});
const trpc = useTrpc();
const { isDark } = useDarkMode();
const customerLogos = ref<CustomerLogo[]>([]);
const isLoading = ref(false);
const error = ref<string | null>(null);

const sectionStyle = computed(() => {
  const bgColor = isDark.value
    ? props.config.darkMode.backgroundColor || ''
    : props.config.backgroundColor || '';
  
  return {
    backgroundColor: bgColor,
    padding: props.config.containerPadding,
  };
});

const textColor = computed(() => 
  isDark.value ? props.config.darkMode.textColor : undefined
);

const gridClass = computed(() => {
  const { gridColumns } = props.config;
  return {
    'grid gap-4': true,
    [`grid-cols-${gridColumns.base}`]: true,
    [`sm:grid-cols-${gridColumns.sm}`]: true,
    [`md:grid-cols-${gridColumns.md}`]: true,
    [`lg:grid-cols-${gridColumns.lg}`]: true,
    [`xl:grid-cols-${gridColumns.xl}`]: true,
  };
});

const logoStyle = computed(() => ({
  height: props.config.logoHeight,
  width: props.config.logoWidth,
}));

const swiperOptions = computed(() => ({
  modules: [Autoplay, Navigation],
  slidesPerView: props.config.slidesToShow.base,
  spaceBetween: 20,
  navigation: {
    nextEl: '.customer-logos-swiper-next',
    prevEl: '.customer-logos-swiper-prev',
  },
  autoplay: props.config.autoplay ? {
    delay: props.config.interval,
    disableOnInteraction: false,
  } : false,
  breakpoints: {
    640: {
      slidesPerView: props.config.slidesToShow.sm,
    },
    768: {
      slidesPerView: props.config.slidesToShow.md,
    },
    1024: {
      slidesPerView: props.config.slidesToShow.lg,
    },
    1280: {
      slidesPerView: props.config.slidesToShow.xl,
    },
  },
}));

onMounted(async () => {
  await fetchCustomerLogos();
});

async function fetchCustomerLogos() {
  isLoading.value = true;
  error.value = null;
  try {
    customerLogos.value = await trpc.customerLogo.all.query();
  } catch (err: any) {
    console.error('Failed to fetch customer logos:', err);
    error.value = err.message;
  } finally {
    isLoading.value = false;
  }
}
</script>

<template>
  <section v-if="!isLoading && !error && customerLogos.length > 0">
    <div class="container mx-auto px-4">
      <!-- Section Header -->
      <div v-if="config.showTitle" 
           class="mb-8" 
           :class="[config.headerStyle?.background, config.headerStyle?.rounded]">
        <div class="container mx-auto px-4">
          <div class="flex items-center justify-between gap-4 py-3" :class="[config.headerStyle?.padding]">
            <div class="w-32 hidden sm:block"><!-- Spacer --></div>
            <div class="category-header flex-1 text-center">
              <h2 
                class="inline-flex items-center px-4 py-2 mobile-title"
                :class="[
                  config.fontSize?.title || 'text-2xl sm:text-3xl',
                  'font-bold',
                  config.colors?.title || 'text-gray-900 dark:text-white',
                  config.useUppercase ? 'uppercase' : ''
                ]"
              >
                {{ config.title }}
              </h2>
            </div>
            <div class="w-32 hidden sm:block"><!-- Spacer for symmetry --></div>
          </div>
        </div>
      </div>

      <!-- Grid Layout -->
      <div v-if="config.displayType === 'grid'" :class="gridClass">
        <div
          v-for="logo in customerLogos"
          :key="logo.id"
          class="flex items-center justify-center p-4"
        >
          <component
            :is="logo.link ? 'a' : 'div'"
            :href="logo.link"
            :target="logo.link ? '_blank' : undefined"
            class="relative group transition-transform hover:scale-105"
          >
            <img
              :src="logo.imageUrl"
              :alt="logo.alt"
              :style="logoStyle"
              class="object-contain filter"
              :class="{ 'dark:brightness-0 dark:invert': isDark }"
            />
          </component>
        </div>
      </div>

      <!-- Slider Layout -->
      <div v-else class="swiper-outer-container">
        <div class="swiper-container">
          <Swiper v-bind="swiperOptions" class="customer-logos-swiper">
            <SwiperSlide
              v-for="logo in customerLogos"
              :key="logo.id"
              class="flex items-center justify-center"
            >
              <component
                :is="logo.link ? 'a' : 'div'"
                :href="logo.link"
                :target="logo.link ? '_blank' : undefined"
                class="relative group transition-transform hover:scale-105"
              >
                <img
                  :src="logo.imageUrl"
                  :alt="logo.alt"
                  :style="logoStyle"
                  class="object-contain filter"
                  :class="{ 'dark:brightness-0 dark:invert': isDark }"
                />
              </component>
            </SwiperSlide>
          </Swiper>
        </div>

        <!-- Navigation -->
        <div v-if="config.showArrows" class="navigation-buttons">
          <div 
            class="customer-logos-swiper-prev swiper-button-prev !z-10"
            :class="config.colors?.primary || 'text-primary-600 dark:text-primary-400'"
          ></div>
          <div 
            class="customer-logos-swiper-next swiper-button-next !z-10"
            :class="config.colors?.primary || 'text-primary-600 dark:text-primary-400'"
          ></div>
        </div>
      </div>
    </div>
  </section>
</template>

<style lang="scss" scoped>
.category-header {
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
  .customer-logos-swiper {
    .swiper-wrapper {
      display: flex;
      align-items: center;
    }

    .swiper-slide {
      height: auto;
      display: flex;
      justify-content: center;
      align-items: center;
    }
  }

  .customer-logos-swiper-next,
  .customer-logos-swiper-prev {
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

  .customer-logos-swiper-prev {
    left: 0;
  }

  .customer-logos-swiper-next {
    right: 0;
  }
}

@media (max-width: 640px) {
  section {
    overflow-x: hidden;
  }
}
</style> 
