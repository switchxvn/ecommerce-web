<!-- Tourism features section -->
<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { Swiper, SwiperSlide } from 'swiper/vue';
import type { Swiper as SwiperType } from 'swiper';
import { Navigation, Pagination, Autoplay } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import PhotoSwipe from 'photoswipe';
import 'photoswipe/dist/photoswipe.css';
import AppImage from '@/components/ui/AppImage.vue';

interface Feature {
  id: number;
  title: string;
  image: string;
  link: string;
}

interface Props {
  settings: {
    layout?: string;
    backgroundColor?: string;
    textColor?: string;
    padding?: string;
    animation?: {
      enabled: boolean;
      type: string;
      duration: number;
      delay: number;
    };
    features: Feature[];
  };
  translations: {
    title: string;
    subtitle?: string;
    content?: string;
    data?: {
      description?: string;
    };
  };
}

const props = withDefaults(defineProps<Props>(), {
  settings: () => ({ features: [] }),
  translations: () => ({ title: '' })
});

const swiperInstance = ref<SwiperType>();

const onSwiper = (swiper: SwiperType) => {
  swiperInstance.value = swiper;
};

const swiperOptions = {
  modules: [Navigation, Pagination, Autoplay],
  slidesPerView: 1,
  spaceBetween: 24,
  loop: false,
  navigation: {
    nextEl: '.tourism-swiper-next',
    prevEl: '.tourism-swiper-prev',
    enabled: true
  },
  pagination: {
    el: '.tourism-swiper-pagination',
    clickable: true,
    enabled: true,
    type: 'bullets'
  },
  autoplay: {
    delay: 3000,
    disableOnInteraction: false,
    pauseOnMouseEnter: true
  },
  breakpoints: {
    0: { 
      slidesPerView: 1,
      slidesPerGroup: 1 
    },
    640: { 
      slidesPerView: 2,
      slidesPerGroup: 2
    },
    1024: { 
      slidesPerView: 3,
      slidesPerGroup: 3
    },
    1280: { 
      slidesPerView: 4,
      slidesPerGroup: 4
    }
  }
};

// PhotoSwipe
const initPhotoSwipe = async (index: number) => {
  // Get image dimensions for all features
  const items = await Promise.all(
    props.settings.features.map(async (feature) => {
      const img = new Image();
      const dimensions = await new Promise<{ width: number; height: number }>((resolve) => {
        img.onload = () => {
          resolve({
            width: img.naturalWidth,
            height: img.naturalHeight
          });
        };
        img.src = feature.image;
      });
      
      return {
        src: feature.image,
        w: dimensions.width,
        h: dimensions.height,
        alt: feature.title
      };
    })
  );

  const options = {
    dataSource: items,
    index,
    pswpModule: PhotoSwipe,
    showHideAnimationType: 'fade' as const,
    showAnimationDuration: 300,
    hideAnimationDuration: 300,
    wheelToZoom: false,
    tapAction: 'none' as const,
    doubleTapAction: 'none' as const,
    bgOpacity: 0.8
  };

  const lightbox = new PhotoSwipe(options);
  lightbox.init();
};

const handleImageError = (event: Event) => {
  console.error('Image failed to load:', (event.target as HTMLImageElement).src);
};
</script>

<template>
  <section 
    :class="[
      'w-full py-16',
      settings.backgroundColor || 'bg-gray-50',
      settings.textColor || 'text-gray-900'
    ]"
    :data-aos="settings.animation?.enabled ? settings.animation.type : null"
    :data-aos-duration="settings.animation?.duration"
    :data-aos-delay="settings.animation?.delay"
  >
    <div class="container mx-auto px-4">
      <!-- Section Header -->
      <div class="text-center mb-12">
        <h2 class="text-4xl font-extrabold mb-4 text-primary-600 uppercase">{{ translations.title }}</h2>
        <p v-if="translations.subtitle" class="text-2xl mb-4 text-gray-600 font-bold">
          {{ translations.subtitle }}
        </p>
        <div v-if="translations.content" 
          class="max-w-3xl mx-auto mb-8 text-2xl font-bold"
          v-html="translations.content">
        </div>
        <p v-if="translations.data?.description" 
          class="text-lg text-gray-600 max-w-4xl mx-auto">
          {{ translations.data.description }}
        </p>
      </div>

      <!-- Features Slider -->
      <div class="relative tourism-features-slider">
        <Swiper
          v-bind="swiperOptions"
          @swiper="onSwiper"
          class="!pb-12"
        >
          <SwiperSlide 
            v-for="(feature, index) in settings.features" 
            :key="feature.id"
            class="h-full"
          >
            <div 
              class="group relative overflow-hidden rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer h-full"
              @click="initPhotoSwipe(index)"
            >
              <div class="aspect-w-4">
                <AppImage 
                  :src="feature.image" 
                  :alt="feature.title"
                  fallback-src="/images/default-image.jpg"
                  class="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500"
                  @error="handleImageError"
                />
              </div>
              <div class="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
              <div class="absolute bottom-0 left-0 right-0 p-4">
                <h3 class="text-white text-xl font-semibold">{{ feature.title }}</h3>
              </div>
            </div>
          </SwiperSlide>
        </Swiper>

        <!-- Navigation -->
        <button class="tourism-swiper-prev swiper-button-prev !z-10" type="button" aria-label="Previous slide"></button>
        <button class="tourism-swiper-next swiper-button-next !z-10" type="button" aria-label="Next slide"></button>
        <div class="tourism-swiper-pagination !absolute !bottom-0 !z-10 !w-full flex justify-center"></div>
      </div>
    </div>

    <!-- PhotoSwipe Template -->
    <div class="pswp" tabindex="-1" role="dialog" aria-hidden="true">
      <div class="pswp__bg"></div>
      <div class="pswp__scroll-wrap">
        <div class="pswp__container">
          <div class="pswp__item"></div>
          <div class="pswp__item"></div>
          <div class="pswp__item"></div>
        </div>
        <div class="pswp__ui pswp__ui--hidden">
          <div class="pswp__top-bar">
            <div class="pswp__counter"></div>
            <button class="pswp__button pswp__button--close" title="Close (Esc)"></button>
            <button class="pswp__button pswp__button--share" title="Share"></button>
            <button class="pswp__button pswp__button--fs" title="Toggle fullscreen"></button>
            <button class="pswp__button pswp__button--zoom" title="Zoom in/out"></button>
            <div class="pswp__preloader">
              <div class="pswp__preloader__icn">
                <div class="pswp__preloader__cut">
                  <div class="pswp__preloader__donut"></div>
                </div>
              </div>
            </div>
          </div>
          <div class="pswp__share-modal pswp__share-modal--hidden pswp__single-tap">
            <div class="pswp__share-tooltip"></div>
          </div>
          <button class="pswp__button pswp__button--arrow--left" title="Previous (arrow left)"></button>
          <button class="pswp__button pswp__button--arrow--right" title="Next (arrow right)"></button>
          <div class="pswp__caption">
            <div class="pswp__caption__center"></div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.aspect-w-4 {
  position: relative;
  width: 100%;
  height: 200px;
}

.aspect-w-4::before {
  display: none;
}

/* Swiper custom styles */
.tourism-features-slider {
  :deep(.swiper) {
    height: 200px;
    padding-bottom: 2rem;
  }

  :deep(.swiper-slide) {
    height: 200px !important;
    
    img {
      width: 100%;
      height: 200px;
      object-fit: cover;
    }
  }

  :deep(.swiper-button-next),
  :deep(.swiper-button-prev) {
    @apply !text-white bg-primary-600/90 hover:bg-primary-600 transition-all duration-200 !w-8 !h-8;
    margin-top: -16px;
    opacity: 0;
    cursor: pointer;
  }

  :deep(.swiper-button-next)::after,
  :deep(.swiper-button-prev)::after {
    @apply !text-sm;
    font-size: 1rem !important;
  }

  :deep(.swiper-button-next) {
    @apply !right-2;
  }

  :deep(.swiper-button-prev) {
    @apply !left-2;
  }

  &:hover {
    :deep(.swiper-button-next),
    :deep(.swiper-button-prev) {
      opacity: 0.9;
    }
  }

  :deep(.swiper-pagination) {
    @apply !bottom-0;
    position: absolute;
    left: 50% !important;
    transform: translateX(-50%) !important;
    width: auto !important;
    display: flex !important;
    justify-content: center !important;
    gap: 20px;
  }

  :deep(.swiper-pagination-bullet) {
    @apply !w-3 !h-3 bg-gray-300 dark:bg-gray-600 transition-all duration-200 rounded-full;
    opacity: 0.5;
    cursor: pointer;
    margin: 0 4px !important;
  }

  :deep(.swiper-pagination-bullet-active) {
    @apply !bg-primary-600 dark:!bg-primary-400;
    opacity: 1;
    transform: scale(1.1);
  }
}

/* PhotoSwipe customization */
:deep(.pswp) {
  --pswp-bg: rgba(0, 0, 0, 0.85);
  
  .pswp__img {
    object-fit: contain !important;
    border-radius: 8px;
  }
  
  .pswp__zoom-wrap {
    display: flex;
    align-items: center;
    justify-content: center;
  }
}

@media (max-width: 640px) {
  .tourism-features-slider {    
    :deep(.swiper-button-next),
    :deep(.swiper-button-prev) {
      @apply !hidden;
    }
  }
}
</style>
