<script setup lang="ts">
import 'swiper/css';
import 'swiper/css/effect-fade';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import { Swiper, SwiperSlide } from 'swiper/vue';
import { Autoplay, EffectFade, Navigation, Pagination } from 'swiper/modules';
import type { PropType } from 'vue';
import { computed, defineComponent, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useTrpc } from '~/composables/useTrpc';
import type { Hero, HeroSlider, Slide } from '~/types/hero';
import { useLocalization } from '~/composables/useLocalization';
import HeroSliderComponent from '~/components/sliders/HeroSlider.vue';
import type { Swiper as SwiperType } from 'swiper/types';

interface HeroConfig {
  layout?: 'split-columns' | 'full-width';
  autoplay?: boolean;
  interval?: number;
  showDots?: boolean;
  showArrows?: boolean;
  videoWidth?: string;
  sliderWidth?: string;
  videoPosition?: 'left' | 'right';
  sliderPosition?: 'left' | 'right';
  overlay?: {
    enabled: boolean;
    color?: string;
    opacity?: number;
    gradient?: {
      from: string;
      to: string;
      direction: string;
    };
  };
  overlayOpacity?: string;
}

interface Props {
  slides?: Slide[];
  config?: HeroConfig;
}

const props = withDefaults(defineProps<Props>(), {
  slides: () => [],
  config: () => ({
    layout: 'full-width',
    autoplay: true,
    interval: 5000,
    showDots: true,
    showArrows: true,
    overlay: {
      enabled: true,
      color: 'black',
      opacity: 0.5,
      gradient: {
        from: 'rgba(0,0,0,0.7)',
        to: 'rgba(0,0,0,0)',
        direction: 'to-t'
      }
    }
  })
});

const { t } = useI18n();
const { t: localT } = useLocalization();
const currentSlide = ref(0);
const isLoading = ref(true);
const error = ref<Error | null>(null);

const trpc = useTrpc();

// Fetch hero data
const heroQuery = trpc.hero.getHero.query();
const sliderQuery = trpc.hero.getHeroSliders.query({ themeId: props.config?.themeId });

const heroData = ref<Hero[]>([]);
const sliderData = ref<HeroSlider[]>([]);

onMounted(async () => {
  try {
    console.log('Fetching hero data...');
    const [heroResult, sliderResult] = await Promise.all([
      heroQuery,
      sliderQuery
    ]);
    
    console.log('Raw hero result:', heroResult);
    console.log('Raw slider result:', sliderResult);
    
    heroData.value = heroResult as Hero[];
    sliderData.value = sliderResult as HeroSlider[];
    
    console.log('Processed hero data:', heroData.value);
    console.log('Processed slider data:', sliderData.value);
    
    const sortedSlides = computed(() => {
      if (sliderData.value && sliderData.value.length > 0) {
        return [...sliderData.value]
          .sort((a, b) => a.order - b.order)
          .map(slider => ({
            image_url: slider.imageUrl,
            title: slider.title,
            description: slider.description || '',
            link: slider.buttonLink || '#',
            buttonText: slider.buttonText,
            order: slider.order
          }));
      }
      return [...props.slides].sort((a, b) => a.order - b.order);
    });
    
    console.log('Computed sortedSlides:', sortedSlides.value);
    
    isLoading.value = false;
  } catch (err) {
    console.error('Error fetching hero data:', err);
    error.value = err as Error;
    isLoading.value = false;
  }
});

const hero = computed(() => {
  if (heroData.value && heroData.value.length > 0) {
    return heroData.value[0];
  }
  return null;
});

const sliders = computed(() => {
  return sliderData.value || [];
});

const swiperOptions = computed(() => ({
  modules: [Navigation, Pagination, Autoplay, EffectFade],
  slidesPerView: 1,
  slidesPerGroup: 1,
  effect: 'fade',
  loop: true,
  loopPreventsSliding: false,
  loopAddBlankSlides: true,
  speed: 800,
  allowTouchMove: true,
  watchOverflow: true,
  navigation: {
    nextEl: '.hero-swiper-next',
    prevEl: '.hero-swiper-prev',
    enabled: true
  },
  pagination: props.config.showDots ? {
    el: '.hero-swiper-pagination',
    clickable: true,
    enabled: true
  } : false,
  autoplay: props.config.autoplay ? {
    delay: props.config.interval || 5000,
    disableOnInteraction: false,
    pauseOnMouseEnter: true,
    stopOnLastSlide: false,
    waitForTransition: false
  } : false
}));

const sortedSlides = computed(() => {
  if (sliderData.value && sliderData.value.length > 0) {
    return [...sliderData.value]
      .sort((a, b) => a.order - b.order)
      .map(slider => ({
        image_url: slider.imageUrl,
        title: slider.title,
        description: slider.description || '',
        link: slider.buttonLink || '#',
        buttonText: slider.buttonText,
        order: slider.order
      }));
  }
  return [...props.slides].sort((a, b) => a.order - b.order);
});

// Thêm computed property để xử lý config
const processedConfig = computed(() => {
  if (!props.config) return props.config;
  
  const config = {
    ...props.config,
    overlay: {
      enabled: props.config.overlay?.enabled ?? true,
      opacity: props.config.overlayOpacity 
        ? parseFloat(props.config.overlayOpacity)
        : props.config.overlay?.opacity ?? 0.5,
      gradient: props.config.overlay?.gradient ?? {
        from: 'rgba(0,0,0,0.7)',
        to: 'rgba(0,0,0,0)',
        direction: 'to-t'
      }
    }
  };

  console.log('Processed Config:', config);
  return config;
});
</script>

<template>
  <section class="hero-section-full relative w-full md:pt-0">
    <div class="aspect-[4/3] md:aspect-[1780/450] w-full">
      <div v-if="isLoading" class="flex items-center justify-center w-full h-full">
        <Loader size="lg" />
      </div>
      
      <div v-else-if="error" class="flex items-center justify-center w-full h-full">
        <p class="text-red-500">{{ error.message }}</p>
      </div>
      
      <div v-else class="w-full h-full relative">
        <Swiper v-if="sortedSlides.length > 0"
                v-bind="swiperOptions"
                class="w-full h-full hero-swiper">
          <SwiperSlide v-for="slide in sortedSlides" :key="slide.order" class="relative">
            <div class="relative w-full h-full">
              <!-- Image layer (z-index: 1) -->
              <img 
                :src="slide.image_url" 
                :alt="slide.title"
                class="absolute inset-0 w-full h-full object-cover object-center z-[1]"
              />
              
              <!-- Dark overlay layer (z-index: 2) -->
              <div v-if="processedConfig.overlay?.enabled" 
                   class="absolute inset-0 z-[2]"
                   :class="{
                     'bg-gradient-to-t from-black/70 to-transparent': processedConfig.overlay.gradient?.direction === 'to-t',
                     'bg-gradient-to-b from-black/70 to-transparent': processedConfig.overlay.gradient?.direction === 'to-b',
                     'bg-gradient-to-l from-black/70 to-transparent': processedConfig.overlay.gradient?.direction === 'to-l',
                     'bg-gradient-to-r from-black/70 to-transparent': processedConfig.overlay.gradient?.direction === 'to-r'
                   }"
                   :style="{
                     '--tw-gradient-from': processedConfig.overlay.gradient?.from || 'rgb(0 0 0 / 0.7)',
                     '--tw-gradient-to': processedConfig.overlay.gradient?.to || 'rgb(0 0 0 / 0)',
                     '--tw-gradient-stops': processedConfig.overlay.gradient 
                       ? `${processedConfig.overlay.gradient.from}, ${processedConfig.overlay.gradient.to}`
                       : undefined
                   }">
              </div>
              
              <!-- Content layer (z-index: 3) -->
              <div class="absolute inset-0 flex items-center justify-center z-[3]" v-if="processedConfig?.overlay?.enabled">
                <div class="container mx-auto px-4 text-center text-white">
                  <h1 class="text-2xl sm:text-3xl md:text-4xl lg:text-6xl font-bold mb-2 md:mb-4 drop-shadow-lg">
                    {{ slide.title }}
                  </h1>
                  <p class="text-base sm:text-lg md:text-xl mb-4 md:mb-8 max-w-2xl mx-auto drop-shadow line-clamp-3 md:line-clamp-none">
                    {{ slide.description }}
                  </p>
                  <NuxtLink 
                    v-if="slide.link"
                    :to="slide.link"
                    class="inline-block bg-primary hover:bg-primary/90 text-white font-semibold py-2 md:py-3 px-6 md:px-8 rounded-lg transition-colors text-sm md:text-base"
                  >
                    {{ slide.buttonText || localT('common.learn_more') }}
                  </NuxtLink>
                </div>
              </div>
            </div>
          </SwiperSlide>
        </Swiper>
        <div v-else class="flex items-center justify-center w-full h-full bg-gray-100 dark:bg-gray-800">
          <p class="text-gray-500 dark:text-gray-400">{{ localT('common.no_slides') }}</p>
        </div>

        <!-- Điều chỉnh vị trí và kích thước navigation cho mobile -->
        <div v-if="processedConfig.showArrows" class="hero-swiper-prev swiper-button-prev !z-10 !hidden md:!flex"></div>
        <div v-if="processedConfig.showArrows" class="hero-swiper-next swiper-button-next !z-10 !hidden md:!flex"></div>
        <div v-if="processedConfig.showDots" class="hero-swiper-pagination !absolute !bottom-4 md:!bottom-8 !left-1/2 !-translate-x-1/2 !z-10 !w-auto"></div>
      </div>
    </div>
  </section>
</template>

<style lang="scss" scoped>
.hero-section-full {
  position: relative;
  
  :deep(.hero-swiper) {
    height: 100%;
  }
  
  // Điều chỉnh kích thước navigation buttons cho mobile
  :deep(.swiper-button-next),
  :deep(.swiper-button-prev) {
    @apply w-8 h-8 md:w-12 md:h-12;
    
    &::after {
      @apply text-base md:text-xl;
    }
  }
  
  // Điều chỉnh kích thước dots cho mobile
  :deep(.swiper-pagination-bullet) {
    @apply w-2 h-2 md:w-3 md:h-3;
  }
}
</style> 