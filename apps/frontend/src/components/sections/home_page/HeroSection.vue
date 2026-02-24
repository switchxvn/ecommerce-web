<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, defineComponent, onBeforeUnmount } from 'vue';
import { useI18n } from 'vue-i18n';
import { useTrpc } from '~/composables/useTrpc';
import { Swiper, SwiperSlide } from 'swiper/vue';
import { Navigation, Pagination, Autoplay, EffectFade } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import 'swiper/css/effect-fade';
import { useLocalization } from '~/composables/useLocalization';
import { Icon } from '@iconify/vue';
import { NuxtLink } from '#components';
import type { PropType } from 'vue';
import VideoThumbnailComponent from '~/components/media/VideoThumbnail.vue';
import HeroSliderComponent from '~/components/sliders/HeroSlider.vue';
import type { Hero, HeroSlider, VideoThumbnail, Slide, HeroConfig } from '~/types/hero';
import type { SwiperType } from 'swiper/vue';

interface Props {
  slides?: Slide[];
  config?: HeroConfig;
}

const props = withDefaults(defineProps<Props>(), {
  slides: () => [],
  config: () => ({
    height: '600px',
    layout: 'split-columns',
    autoplay: true,
    interval: 5000,
    showDots: true,
    showArrows: true,
    videoWidth: '30%',
    sliderWidth: '70%',
    videoPosition: 'left',
    sliderPosition: 'right',
    maxVideos: 3,
    videoRowHeight: '300px',
    gap: '0.5rem',
    videoGap: '0.5rem',
    backgroundGradient: {
      from: 'rgba(0,0,0,0.7)',
      to: 'rgba(0,0,0,0)',
      direction: 'to-t'
    },
    overlayOpacity: '0.5'
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
const videoQuery = trpc.hero.getHeroVideos.query({ themeId: props.config?.themeId });

const heroData = ref<Hero[]>([]);
const sliderData = ref<HeroSlider[]>([]);
const videoThumbnails = ref<VideoThumbnail[]>([]);

// Cấu hình Swiper cho hero slider
const heroSwiperOptions = {
  modules: [Navigation, Pagination, Autoplay, EffectFade],
  slidesPerView: 1,
  spaceBetween: 0,
  navigation: true,
  pagination: { clickable: true },
  autoplay: {
    delay: 5000,
    disableOnInteraction: false,
  },
  effect: 'fade',
  fadeEffect: {
    crossFade: true
  },
};

const swiperInstance = ref<SwiperType>();

const onSwiper = (swiper: SwiperType) => {
  swiperInstance.value = swiper;
};

// Thêm ref để kiểm soát mounted state
const isMounted = ref(true);

onMounted(async () => {
  try {
    const [heroResult, sliderResult, videoResult] = await Promise.all([
      heroQuery,
      sliderQuery,
      videoQuery
    ]);
    
    if (isMounted.value) {
      heroData.value = heroResult as Hero[];
      sliderData.value = sliderResult as HeroSlider[];
      videoThumbnails.value = videoResult as VideoThumbnail[];
      
      console.log('Hero data:', heroData.value);
      console.log('Slider data:', sliderData.value);
      console.log('Video data:', videoThumbnails.value);
      
      isLoading.value = false;
    }
  } catch (err) {
    if (isMounted.value) {
      console.error('Error fetching hero data:', err);
      error.value = err as Error;
      isLoading.value = false;
    }
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

// Hàm mở video khi click vào thumbnail
const openVideo = (videoUrl: string) => {
  window.open(videoUrl, '_blank');
};

// Thêm hàm xử lý lỗi hình ảnh
const handleImageError = (event: Event, video: VideoThumbnail) => {
  const imgElement = event.target as HTMLImageElement;
  // Thay thế bằng hình ảnh mặc định khi lỗi
  imgElement.src = 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?q=80&w=400&auto=format&fit=crop';
};

const swiperOptions = computed(() => ({
  modules: [Navigation, Pagination, Autoplay, EffectFade],
  slidesPerView: 1,
  effect: 'fade',
  navigation: props.config.showArrows,
  pagination: props.config.showDots ? { clickable: true } : false,
  autoplay: props.config.autoplay ? {
    delay: props.config.interval,
    disableOnInteraction: false,
  } : false,
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

// Components
const VideoThumbnail = defineComponent({
  props: {
    video: {
      type: Object as PropType<VideoThumbnail>,
      required: true
    }
  },
  setup(props) {
    const handleImageError = (event: Event) => {
      const imgElement = event.target as HTMLImageElement;
      imgElement.src = 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?q=80&w=400&auto=format&fit=crop';
    };

    return { handleImageError };
  },
  template: `
    <div class="relative w-full h-full">
      <img :src="video.thumbnailUrl" 
           :alt="video.title"
           @error="handleImageError"
           class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
      
      <!-- Gradient overlay -->
      <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-80 group-hover:opacity-90 transition-opacity"></div>
      
      <!-- Play button overlay -->
      <div class="absolute inset-0 flex items-center justify-center">
        <div class="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center group-hover:scale-110 transition-transform">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
            <path d="M8 5v14l11-7z" />
          </svg>
        </div>
      </div>
      
      <!-- Caption overlay -->
      <div class="absolute bottom-0 left-0 right-0 p-3 text-white">
        <h3 class="font-medium text-sm md:text-base line-clamp-1 group-hover:text-primary-300 transition-colors">
          {{ video.title }}
        </h3>
        <p v-if="video.description" class="text-xs text-white/80 line-clamp-2 mt-1 group-hover:text-white transition-colors">
          {{ video.description }}
        </p>
      </div>
    </div>
  `
});

const HeroSlider = defineComponent({
  props: {
    slides: {
      type: Array as PropType<Slide[]>,
      required: true
    },
    options: {
      type: Object,
      required: true
    },
    config: {
      type: Object as PropType<HeroConfig>,
      default: () => ({})
    }
  },
  setup(props) {
    const { t: localT } = useLocalization();
    return { localT };
  },
  template: `
    <Swiper 
      v-if="slides && slides.length > 0" 
      v-bind="options" 
      class="w-full h-full rounded-lg overflow-hidden shadow-md"
      @swiper="onSwiper"
    >
      <SwiperSlide v-for="slide in slides" :key="slide.order" class="relative">
        <div class="relative w-full h-full">
          <img 
            :src="slide.image_url" 
            :alt="slide.title"
            class="absolute inset-0 w-full h-full object-cover"
          />
          
          <!-- Gradient overlay -->
          <div class="absolute inset-0" :style="slideGradientStyle"></div>
          
          <div class="absolute inset-0 flex items-center justify-center">
            <div class="container mx-auto px-4 text-center text-white">
              <h1 class="text-4xl md:text-6xl font-bold mb-4">
                {{ slide.title }}
              </h1>
              <p class="text-lg md:text-xl mb-8 max-w-2xl mx-auto">
                {{ slide.description }}
              </p>
              <NuxtLink 
                v-if="slide.link"
                :to="slide.link"
                class="inline-block bg-primary hover:bg-primary/90 text-white font-semibold py-3 px-8 rounded-lg transition-colors"
              >
                {{ slide.buttonText || localT('common.learn_more') }}
              </NuxtLink>
            </div>
          </div>
        </div>
      </SwiperSlide>
    </Swiper>
    <div v-else class="flex items-center justify-center w-full h-full bg-gray-100 dark:bg-gray-800 rounded-lg shadow-md">
      <p class="text-gray-500 dark:text-gray-400">{{ localT('common.no_slides') }}</p>
    </div>
  `
});

// Đăng ký components
const components = {
  VideoThumbnail,
  HeroSlider
};

// Thêm computed properties cho styles và gradients
const backgroundGradientStyle = computed(() => {
  if (!props.config?.backgroundGradient) return {};
  
  const direction = props.config.backgroundGradient.direction.replace('to-', 'to ');
  const { from, to } = props.config.backgroundGradient;
  
  return {
    background: `linear-gradient(${direction}, ${from}, ${to})`,
    opacity: props.config?.overlayOpacity || '0.5',
    pointerEvents: 'none'
  };
});

const slideGradientStyle = computed(() => {
  if (!props.config?.backgroundGradient) return {};
  
  const direction = props.config.backgroundGradient.direction.replace('to-', 'to ');
  const { from, to } = props.config.backgroundGradient;
  
  return {
    background: `linear-gradient(${direction}, ${from}, ${to})`,
    opacity: props.config?.overlayOpacity || '0.5'
  };
});

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
</script>

<template>
  <section class="hero-section relative" :style="{ height: config?.height || '600px' }" v-if="isMounted">
    <!-- Background gradient overlay -->
    <div class="absolute inset-0" :style="backgroundGradientStyle"></div>

    <div v-if="isLoading" class="flex items-center justify-center w-full h-full">
      <Loader size="lg" />
    </div>
    
    <div v-else-if="error" class="flex items-center justify-center w-full h-full">
      <p class="text-red-500">{{ error.message }}</p>
    </div>
    
    <div v-else class="container mx-auto h-full py-8">
      <!-- Split Columns Layout -->
      <div v-if="config?.layout === 'split-columns'" 
           class="flex w-full h-full items-stretch space-x-2"
           :style="{ gap: config.gap }">
        <!-- Video Section -->
        <div v-if="videoThumbnails.length > 0" 
             :class="[
               'h-full flex-shrink-0',
               config.videoPosition === 'left' ? 'order-1' : 'order-2'
             ]"
             :style="{ width: config.videoWidth }">
          <div class="flex flex-col h-full space-y-2">
            <div v-for="(video, index) in videoThumbnails.slice(0, config.maxVideos)" 
                 :key="video.id" 
                 class="relative cursor-pointer group overflow-hidden rounded-lg shadow-md hover:shadow-lg transition-all duration-300 flex-1"
                 @click="openVideo(video.videoUrl)">
              <VideoThumbnailComponent :video="video" />
            </div>
          </div>
        </div>

        <!-- Slider Section -->
        <div :class="[
          videoThumbnails.length > 0 ? 
            (config.sliderPosition === 'left' ? 'order-1' : 'order-2') : '',
          'h-full flex-shrink-0'
        ]"
        :style="{ width: videoThumbnails.length > 0 ? config.sliderWidth : '100%' }">
          <HeroSliderComponent :slides="sortedSlides" :options="swiperOptions" :config="config" />
        </div>
      </div>

      <!-- Stacked Rows Layout -->
      <div v-else-if="config?.layout === 'stacked-rows'"
           class="flex flex-col h-full space-y-2"
           :style="{ gap: config.gap }">
        <!-- Slider Row -->
        <div :style="{ height: `calc(100% - ${config.videoRowHeight})` }">
          <HeroSliderComponent :slides="sortedSlides" :options="swiperOptions" :config="config" />
        </div>

        <!-- Videos Row -->
        <div v-if="videoThumbnails.length > 0"
             :style="{ height: config.videoRowHeight }">
          <div 
               :class="[
                 'grid h-full gap-2',
                 videoThumbnails.length === 1 ? 'grid-cols-1' :
                 videoThumbnails.length === 2 ? 'grid-cols-2' :
                 'grid-cols-3'
               ]"
               :style="{ gap: config.videoGap }">
            <div v-for="(video, index) in videoThumbnails.slice(0, config.maxVideos)"
                 :key="index"
                 class="relative cursor-pointer group overflow-hidden rounded-lg shadow-md hover:shadow-lg transition-all duration-300"
                 @click="openVideo(video.videoUrl)">
              <VideoThumbnailComponent :video="video" />
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style lang="scss" scoped>
.hero-section {  
  :deep(.swiper) {
    .swiper-button-next,
    .swiper-button-prev {
      color: white;
      
      &:hover {
        color: hsl(var(--color-primary-200));
      }
    }
    
    .swiper-pagination-bullet {
      background: white;
      opacity: 0.5;
      
      &-active {
        opacity: 1;
        background: hsl(var(--color-primary-200));
      }
    }
  }
}
</style> 