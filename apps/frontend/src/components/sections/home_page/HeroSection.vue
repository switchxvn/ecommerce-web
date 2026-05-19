<script setup lang="ts">
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import 'swiper/css/effect-fade';
import { computed } from 'vue';
import { Autoplay, EffectFade, Navigation, Pagination } from 'swiper/modules';
import { useAsyncData } from '#imports';
import { useTrpc } from '~/composables/useTrpc';
import { useSkeletonGate } from '~/composables/useSkeletonGate';
import VideoThumbnailComponent from '~/components/media/VideoThumbnail.vue';
import HeroSliderComponent from '~/components/sliders/HeroSlider.vue';
import type { Hero, HeroConfig, HeroSlider, Slide, VideoThumbnail } from '~/types/hero';

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
      direction: 'to-t',
    },
    overlayOpacity: '0.5',
  }),
});

const trpc = useTrpc();
const { shouldShowSkeleton } = useSkeletonGate();
const dataKey = `hero-section-${props.config?.themeId ?? 'default'}`;

const { data: heroPayload, error, pending } = await useAsyncData(
  dataKey,
  async () => {
    const [heroResult, sliderResult, videoResult] = await Promise.all([
      trpc.hero.getHero.query(),
      trpc.hero.getHeroSliders.query({ themeId: props.config?.themeId }),
      trpc.hero.getHeroVideos.query({ themeId: props.config?.themeId }),
    ]);

    return {
      heroData: (heroResult || []) as Hero[],
      sliderData: (sliderResult || []) as HeroSlider[],
      videoData: (videoResult || []) as VideoThumbnail[],
    };
  },
  {
    default: () => ({
      heroData: [] as Hero[],
      sliderData: [] as HeroSlider[],
      videoData: [] as VideoThumbnail[],
    }),
  },
);

const sliderData = computed(() => heroPayload.value?.sliderData ?? []);
const videoThumbnails = computed(() => heroPayload.value?.videoData ?? []);

const swiperOptions = computed(() => ({
  modules: [Navigation, Pagination, Autoplay, EffectFade],
  slidesPerView: 1,
  effect: 'fade',
  navigation: props.config.showArrows,
  pagination: props.config.showDots ? { clickable: true } : false,
  autoplay: props.config.autoplay
    ? {
        delay: props.config.interval,
        disableOnInteraction: false,
      }
    : false,
}));

const sortedSlides = computed(() => {
  if (sliderData.value.length > 0) {
    return [...sliderData.value]
      .sort((a, b) => a.order - b.order)
      .map((slider) => ({
        image_url: slider.imageUrl,
        title: slider.title,
        description: slider.description || '',
        link: slider.buttonLink || '#',
        buttonText: slider.buttonText,
        order: slider.order,
      }));
  }

  return [...props.slides].sort((a, b) => a.order - b.order);
});

const backgroundGradientStyle = computed(() => {
  if (!props.config?.backgroundGradient) {
    return {};
  }

  const direction = props.config.backgroundGradient.direction.replace('to-', 'to ');
  const { from, to } = props.config.backgroundGradient;

  return {
    background: `linear-gradient(${direction}, ${from}, ${to})`,
    opacity: props.config.overlayOpacity || '0.5',
    pointerEvents: 'none',
  };
});

const sectionHeight = computed(() => props.config?.height || '600px');

const openVideo = (videoUrl: string) => {
  if (process.client) {
    window.open(videoUrl, '_blank', 'noopener,noreferrer');
  }
};
</script>

<template>
  <section class="hero-section relative" :style="{ height: sectionHeight }">
    <div class="absolute inset-0" :style="backgroundGradientStyle"></div>

    <div v-if="shouldShowSkeleton || pending" class="container mx-auto h-full py-8">
      <HeroSkeleton class="h-full" overlay-card />
    </div>

    <div v-else-if="error" class="flex items-center justify-center w-full h-full">
      <p class="text-red-500">{{ error.message }}</p>
    </div>

    <div v-else class="container mx-auto h-full py-8">
      <div
        v-if="config?.layout === 'split-columns'"
        class="flex w-full h-full items-stretch space-x-2"
        :style="{ gap: config.gap }"
      >
        <div
          v-if="videoThumbnails.length > 0"
          :class="[
            'h-full flex-shrink-0',
            config.videoPosition === 'left' ? 'order-1' : 'order-2',
          ]"
          :style="{ width: config.videoWidth }"
        >
          <div class="flex flex-col h-full space-y-2">
            <div
              v-for="video in videoThumbnails.slice(0, config.maxVideos)"
              :key="video.id"
              class="relative cursor-pointer group overflow-hidden rounded-lg shadow-md hover:shadow-lg transition-all duration-300 flex-1"
              @click="openVideo(video.videoUrl)"
            >
              <VideoThumbnailComponent :video="video" />
            </div>
          </div>
        </div>

        <div
          :class="[
            videoThumbnails.length > 0
              ? config.sliderPosition === 'left'
                ? 'order-1'
                : 'order-2'
              : '',
            'h-full flex-shrink-0',
          ]"
          :style="{ width: videoThumbnails.length > 0 ? config.sliderWidth : '100%' }"
        >
          <HeroSliderComponent :slides="sortedSlides" :options="swiperOptions" :config="config" />
        </div>
      </div>

      <div
        v-else-if="config?.layout === 'stacked-rows'"
        class="flex flex-col h-full space-y-2"
        :style="{ gap: config.gap }"
      >
        <div :style="{ height: `calc(100% - ${config.videoRowHeight})` }">
          <HeroSliderComponent :slides="sortedSlides" :options="swiperOptions" :config="config" />
        </div>

        <div
          v-if="videoThumbnails.length > 0"
          :style="{ height: config.videoRowHeight }"
        >
          <div
            :class="[
              'grid h-full gap-2',
              videoThumbnails.length === 1 ? 'grid-cols-1' : videoThumbnails.length === 2 ? 'grid-cols-2' : 'grid-cols-3',
            ]"
            :style="{ gap: config.videoGap }"
          >
            <div
              v-for="video in videoThumbnails.slice(0, config.maxVideos)"
              :key="video.id"
              class="relative cursor-pointer group overflow-hidden rounded-lg shadow-md hover:shadow-lg transition-all duration-300"
              @click="openVideo(video.videoUrl)"
            >
              <VideoThumbnailComponent :video="video" />
            </div>
          </div>
        </div>
      </div>

      <div v-else class="h-full">
        <HeroSliderComponent :slides="sortedSlides" :options="swiperOptions" :config="config" />
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
