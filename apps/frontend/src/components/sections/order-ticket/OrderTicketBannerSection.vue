<script setup lang="ts">
import { computed, onMounted, onBeforeUnmount, ref } from 'vue';
import { useLocalization } from '~/composables/useLocalization';
import { Swiper, SwiperSlide } from 'swiper/vue';
import type { Swiper as SwiperType } from 'swiper';
import { Autoplay, Pagination, Navigation, EffectFade } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';
import 'swiper/css/effect-fade';

const { t } = useLocalization();

interface BannerSlide {
  backgroundImage: string;
  title?: string;
  subtitle?: string;
  content?: string;
  buttonText?: string;
  buttonLink?: string;
}

interface Props {
  settings?: {
    backgroundColor?: string;
    textColor?: string;
    padding?: string;
    height?: {
      mobile?: string;
      desktop?: string;
    };
    animation?: {
      enabled: boolean;
      type: string;
      duration: number;
      delay: number;
    };
    slides?: BannerSlide[];
    swiperOptions?: {
      autoplay?: boolean;
      delay?: number;
      effect?: 'slide' | 'fade';
      loop?: boolean;
    };
    overlayColor?: string;
    overlayOpacity?: number;
    defaultButtonText?: string;
    defaultButtonLink?: string;
  };
  translations?: {
    title?: string;
    subtitle?: string;
    content?: string;
    data?: Record<string, any>;
  };
  titleTag?: string;
  fallbackTitleTag?: string;
}

const props = withDefaults(defineProps<Props>(), {
  settings: () => ({
    backgroundColor: 'bg-primary-900',
    textColor: 'text-white',
    padding: '0',
    height: {
      mobile: 'h-[600px]',
      desktop: 'h-[800px]'
    },
    animation: {
      enabled: true,
      type: 'fade-up',
      duration: 1000,
      delay: 200
    },
    slides: [
      {
        backgroundImage: '/images/banner/slide-1.jpg',
        title: 'Khám phá vẻ đẹp núi Sam',
        subtitle: 'Trải nghiệm hành trình tâm linh độc đáo',
        buttonText: 'Đặt vé ngay',
        buttonLink: '#ticket-order'
      },
      {
        backgroundImage: '/images/banner/slide-2.jpg',
        title: 'Cáp treo hiện đại',
        subtitle: 'Công nghệ Châu Âu đẳng cấp',
        buttonText: 'Xem chi tiết',
        buttonLink: '#features'
      }
    ],
    swiperOptions: {
      autoplay: true,
      delay: 5000,
      effect: 'fade',
      loop: true
    },
    overlayColor: 'bg-black',
    overlayOpacity: 0.4,
    defaultButtonText: 'Đặt vé ngay',
    defaultButtonLink: '#ticket-order'
  }),
  translations: () => ({}),
  titleTag: 'h1',
  fallbackTitleTag: 'div',
});

const containerClasses = computed(() => [
  props.settings?.backgroundColor,
  props.settings?.textColor,
  props.settings?.padding
]);

const overlayClasses = computed(() => [
  props.settings?.overlayColor
]);

const overlayStyle = computed(() => {
  const opacity = props.settings?.overlayOpacity || 0.4;
  return {
    opacity: opacity
  };
});

// Tính toán chiều cao tối thiểu dựa trên tỷ lệ khung hình
const bannerHeight = computed(() => {
  const defaultHeight = isMobile.value ? '50vh' : '60vh'
  return defaultHeight
});

const sectionStyle = computed(() => {
  return {
    height: bannerHeight.value,
    maxHeight: '80vh',
  }
});

// Thêm biến để kiểm tra môi trường mobile
const isMobile = ref(false);

// Kiểm tra kích thước màn hình khi component được mount
onMounted(() => {
  checkMobile();
  window.addEventListener('resize', checkMobile);
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', checkMobile);
});

// Hàm kiểm tra kích thước màn hình
const checkMobile = () => {
  isMobile.value = window.innerWidth < 768;
};

// Swiper modules
const modules = [Autoplay, Pagination, Navigation, EffectFade];

const swiperInstance = ref<SwiperType>();

const onSwiper = (swiper: SwiperType) => {
  swiperInstance.value = swiper;
};

// Thêm ref để kiểm soát mounted state
const isMounted = ref(true);

// Cải thiện cleanup
onBeforeUnmount(() => {
  isMounted.value = false;
  if (swiperInstance.value) {
    try {
      swiperInstance.value.destroy(true, true);
      swiperInstance.value = undefined;
    } catch (error) {
      console.error('Error destroying swiper:', error);
    }
  }
});

// Swiper options
const swiperOptions = computed(() => ({
  modules,
  slidesPerView: 1,
  slidesPerGroup: 1,
  effect: props.settings?.swiperOptions?.effect || 'fade',
  loop: props.settings?.swiperOptions?.loop ?? true,
  loopPreventsSliding: false,
  loopAddBlankSlides: true,
  speed: 800,
  allowTouchMove: true,
  watchOverflow: true,
  navigation: {
    nextEl: '.order-ticket-swiper-next',
    prevEl: '.order-ticket-swiper-prev',
    enabled: true
  },
  pagination: {
    el: '.order-ticket-swiper-pagination',
    clickable: true,
    enabled: true
  },
  autoplay: props.settings?.swiperOptions?.autoplay ? {
    delay: props.settings?.swiperOptions?.delay || 5000,
    disableOnInteraction: false,
    pauseOnMouseEnter: true,
    stopOnLastSlide: false,
    waitForTransition: false
  } : false
}));

// Add computed properties for animation
const animationProps = computed(() => {
  if (!props.settings?.animation?.enabled) return {};
  
  return {
    'data-aos': props.settings.animation.type,
    'data-aos-duration': props.settings.animation.duration,
    'data-aos-delay': props.settings.animation.delay
  };
});
</script>

<template>
  <section :class="containerClasses" class="relative overflow-hidden w-full" :style="sectionStyle" v-if="isMounted">
    <Swiper 
      v-if="settings?.slides && settings.slides.length > 0"
      v-bind="swiperOptions" 
      class="order-ticket-swiper h-full" 
      @swiper="onSwiper"
    >
      <SwiperSlide v-for="(slide, index) in settings?.slides" :key="index" class="h-full">
        <!-- Background Image with Overlay -->
        <div class="absolute inset-0 z-0 image-container">
          <img 
            :src="slide.backgroundImage" 
            :alt="slide.title"
            class="banner-image"
            :style="{
              objectPosition: 'center',
              objectFit: 'cover'
            }"
          />
          <div 
            v-if="(settings?.overlayOpacity ?? 0) > 0"
            class="absolute inset-0 z-10"
            :class="overlayClasses"
            :style="overlayStyle"
          ></div>
        </div>

        <!-- Content -->
        <div class="container mx-auto px-4 py-10 sm:py-12 md:py-16 lg:py-24 relative z-20 h-full flex items-center">
          <div 
            class="max-w-4xl mx-auto text-center"
            v-bind="animationProps"
          >
            <component
              :is="index === 0 ? titleTag : fallbackTitleTag"
              v-if="slide.title"
              class="text-3xl md:text-4xl lg:text-5xl font-extrabold mb-4 leading-tight"
            >
              {{ slide.title }}
            </component>
            
            <p class="text-lg md:text-xl lg:text-2xl mb-6 opacity-90" v-if="slide.subtitle">
              {{ slide.subtitle }}
            </p>
            
            <div class="prose prose-sm md:prose-lg prose-invert mx-auto mb-6" v-if="slide.content"
                 v-html="slide.content">
            </div>

            <a v-if="slide.buttonText || settings?.defaultButtonText"
               :href="slide.buttonLink || settings?.defaultButtonLink"
               class="inline-block bg-primary-500 hover:bg-primary-600 text-white font-bold py-3 px-6 rounded-full transition-all duration-300 transform hover:scale-105 hover:shadow-lg">
              {{ slide.buttonText || settings?.defaultButtonText }}
            </a>
          </div>
        </div>
      </SwiperSlide>
    </Swiper>

    <!-- Navigation -->
    <div class="order-ticket-swiper-prev swiper-button-prev !z-30 !hidden md:!flex"></div>
    <div class="order-ticket-swiper-next swiper-button-next !z-30 !hidden md:!flex"></div>
    <div class="order-ticket-swiper-pagination !absolute !bottom-4 !left-1/2 !-translate-x-1/2 !z-30 !w-auto"></div>
  </section>
</template>

<style lang="scss" scoped>
.prose :deep(a) {
  @apply text-primary-300 hover:text-primary-200;
}

.prose :deep(ul) {
  @apply list-disc list-inside;
}

.prose :deep(ol) {
  @apply list-decimal list-inside;
}

.banner-section {
  width: 100%;
}

/* Swiper custom styles */
.order-ticket-swiper {
  width: 100%;
  
  :deep(.swiper-slide) {
    position: relative;
    overflow: hidden;
    aspect-ratio: 16/9;
  }
  
  :deep(.swiper-button-next),
  :deep(.swiper-button-prev) {
    @apply w-8 h-8 md:w-12 md:h-12 text-white/70 hover:text-white transition-colors duration-300 cursor-pointer;
    
    &::after {
      @apply text-base md:text-xl;
    }
    
    &.swiper-button-disabled {
      @apply opacity-50 pointer-events-none;
    }
  }
  
  :deep(.swiper-pagination-bullet) {
    @apply w-2 h-2 md:w-3 md:h-3 bg-white/70 cursor-pointer;
    
    &.swiper-pagination-bullet-active {
      @apply bg-primary-500;
    }
  }
}
</style>

<style scoped>
.image-container {
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  width: 100%;
  height: 100%;
}

.banner-image {
  width: 100%;
  height: 100%;
  object-position: center;
  object-fit: cover;
}

/* Overwrite swiper navigation styles */
:deep(.swiper-button-prev),
:deep(.swiper-button-next) {
  color: white;
  opacity: 0.7;
  transition: all 0.3s ease;
}

:deep(.swiper-button-prev:hover),
:deep(.swiper-button-next:hover) {
  opacity: 1;
  transform: scale(1.1);
}

:deep(.swiper-pagination-bullet) {
  background-color: white;
  opacity: 0.7;
}

:deep(.swiper-pagination-bullet-active) {
  background-color: var(--primary-500, #4f46e5);
  opacity: 1;
}

/* Đảm bảo giữ tỉ lệ khung hình */
@media (max-width: 767px) {
  .banner-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  
  /* Ensure text is readable on mobile */
  h1 {
    line-height: 1.2;
    letter-spacing: -0.01em;
  }
  
  /* Improve spacing on mobile */
  .container {
    padding-left: 1rem;
    padding-right: 1rem;
  }
}
</style>
