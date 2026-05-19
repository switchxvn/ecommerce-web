<!-- GalleryMasonrySection.vue -->
<template>
  <section :class="[settings.colors.background, settings.padding.top, settings.padding.bottom]" >
    <div class="container mx-auto px-4">
      <!-- Section Header -->
      <div v-if="settings.showTitle" class="mb-8 bg-primary-600 dark:bg-primary-500 rounded-lg">
        <div class="container mx-auto px-4">
          <div class="flex items-center justify-between gap-4 py-3">
            <div class="w-32 hidden sm:block"><!-- Spacer --></div>
            <div class="category-header flex-1 text-center">
              <h2 
                class="inline-flex items-center px-4 py-2 mobile-title"
                :class="[
                  'text-2xl sm:text-3xl',
                  'font-bold text-white',
                  settings.useUppercase ? 'uppercase' : ''
                ]"
              >
                {{ section.title }}
              </h2>
            </div>
            <div class="w-32 flex justify-end">
              <NuxtLink
                to="/gallery"
                class="mobile-view-all inline-flex items-center justify-center px-4 py-2 text-xs sm:text-lg font-semibold uppercase tracking-wider text-white hover:text-primary-100 transition-colors duration-200 whitespace-nowrap"
              >
                {{ t("common.viewAll") }}
                <ArrowRight class="ml-1 h-3 w-3 sm:h-5 sm:w-5" aria-hidden="true" />
              </NuxtLink>
            </div>
          </div>
        </div>
      </div>

      <!-- Masonry Gallery -->
      <ClientOnly>
        <div v-if="galleries?.length" class="pswp-gallery" ref="galleryRef">
          <div 
            class="masonry"
            :style="{ 
              columnCount: currentColumns, 
              columnGap: `${settings.gap}px`,
              margin: '0 auto'
            }"
          >
            <div
              v-for="(item, index) in galleries"
              :key="item.id"
              class="masonry-item mb-4 break-inside-avoid cursor-pointer"
              @click="openGallery(index)"
            >
              <div class="relative overflow-hidden rounded-lg transform transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
                <NuxtImg
                  :src="item.image"
                  :alt="item.translations?.[0]?.title || ''"
                  class="w-full h-auto object-cover"
                  loading="lazy"
                />
              </div>
            </div>
          </div>
        </div>
      </ClientOnly>

      <!-- Load More Button -->
      <div v-if="settings.loadMoreButton.show && hasMoreItems" class="text-center mt-8">
        <UButton
          variant="solid"
          color="primary"
          :label="settings.loadMoreButton.text"
          @click="loadMore"
          :loading="isLoading"
        />
      </div>
    </div>

    <!-- PhotoSwipe Root Element -->
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

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useTrpc } from '~/composables/useTrpc';
import PhotoSwipe from 'photoswipe';
import type { PhotoSwipeOptions } from 'photoswipe';
import { useToastNotification } from '~/utils/vueToast';
// CSS is already imported globally in nuxt.config.ts

interface GalleryTranslation {
  id: number;
  locale: string;
  title: string;
  description?: string;
}

interface Gallery {
  id: number;
  image: string;
  isActive: boolean;
  sequence: number;
  type: 'common' | 'food';
  translations: GalleryTranslation[];
}

interface ThemeSection {
  id: number;
  type: string;
  title: string;
  settings?: Record<string, any>;
}

const props = defineProps<{
  section: ThemeSection;
}>();

// Default settings
const defaultSettings = {
  layout: 'masonry',
  columns: {
    sm: 1,
    md: 2,
    lg: 3,
    xl: 4
  },
  gap: '16',
  padding: {
    top: 'py-4',
    bottom: 'pb-4'
  },
  maxItems: 12,
  showTitle: true,
  colors: {
    background: 'bg-white dark:bg-gray-900'
  },
  loadMoreButton: {
    show: true,
    text: 'Xem thêm',
    style: 'primary'
  },
  viewAllButton: {
    show: true,
    text: 'Xem tất cả',
    style: 'primary'
  },
  useUppercase: true
};

const settings = computed(() => ({
  ...defaultSettings,
  ...(props.section?.settings || {})
}));

const currentColumns = ref(settings.value.columns.xl);
const galleryRef = ref<HTMLElement | null>(null);

// Handle responsive columns
const updateColumns = () => {
  const width = window.innerWidth;
  if (width >= 1280) {
    currentColumns.value = settings.value.columns.xl;
  } else if (width >= 1024) {
    currentColumns.value = settings.value.columns.lg;
  } else if (width >= 768) {
    currentColumns.value = settings.value.columns.md;
  } else {
    currentColumns.value = settings.value.columns.sm;
  }
};

// PhotoSwipe
let pswpInstance: PhotoSwipe | null = null;

const getImageDimensions = (url: string): Promise<{ width: number; height: number }> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      resolve({
        width: img.naturalWidth,
        height: img.naturalHeight
      });
    };
    img.src = url;
  });
};

const openGallery = async (index: number) => {
  const items = await Promise.all(
    galleries.value.map(async (item) => {
      const dimensions = await getImageDimensions(item.image);
      return {
        src: item.image,
        w: dimensions.width,
        h: dimensions.height,
        originalSrc: item.image,
      };
    })
  );

  const options: Partial<PhotoSwipeOptions> = {
    index,
    bgOpacity: 0.9,
    padding: { top: 20, bottom: 20, left: 20, right: 20 },
    showHideOpacity: true,
    allowPanToNext: true,
    wheelToZoom: false,
    pinchToClose: true,
    maxZoomLevel: 4,
    imageClickAction: false,
    tapAction: false,
    doubleTapAction: false,
    errorMsg: 'Không thể tải ảnh',
  };

  pswpInstance = new PhotoSwipe({
    dataSource: items,
    ...options,
    pswpModule: PhotoSwipe,
  });

  // Set zoom levels for maintaining aspect ratio
  pswpInstance.on('firstUpdate', () => {
    const slide = pswpInstance?.currSlide;
    if (slide) {
      slide.zoomLevels.initial = 1;
      slide.zoomLevels.secondary = 2;
      slide.zoomLevels.max = 4;
    }
  });

  pswpInstance.init();
};

onMounted(() => {
  updateColumns();
  window.addEventListener('resize', updateColumns);
});

onUnmounted(() => {
  window.removeEventListener('resize', updateColumns);
  if (pswpInstance) {
    pswpInstance.destroy();
    pswpInstance = null;
  }
});

// tRPC client
const trpc = useTrpc();

// State
const galleries = ref<Gallery[]>([]);
const isLoading = ref(false);
const currentPage = ref(1);
const totalItems = ref(0);

// Computed
const hasMoreItems = computed(() => galleries.value.length < totalItems.value);

// Methods
const fetchGalleries = async () => {
  try {
    isLoading.value = true;
    const { locale } = useI18n();
    const result = await trpc.gallery.active.query({ 
      locale: locale.value,
      type: 'common'
    });
    galleries.value = result;
    totalItems.value = result.length;
  } catch (error) {
    console.error('Error fetching galleries:', error);
    // Show user-friendly error message
    const { t } = useI18n();
    useToastNotification().add({
      id: 'gallery-error',
      title: t('common.error'),
      description: t('gallery.fetchError'),
      color: 'red'
    });
    galleries.value = [];
    totalItems.value = 0;
  } finally {
    isLoading.value = false;
  }
};

const loadMore = async () => {
  if (isLoading.value || !hasMoreItems.value) return;
  currentPage.value++;
  await fetchGalleries();
};

// Initial fetch
onMounted(() => {
  fetchGalleries();
});
</script>

<style lang="scss" scoped>
.masonry {
  columns: v-bind('currentColumns');
  column-gap: v-bind('settings.gap');
  width: 100%;
}

.masonry-item {
  display: inline-block;
  width: 100%;
  box-sizing: border-box;
}

.break-inside-avoid {
  break-inside: avoid;
}

.category-header {
  position: relative;

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

:deep(.pswp__img) {
  object-fit: contain !important;
}

:deep(.pswp__zoom-wrap) {
  transform-origin: center !important;
}
</style> 
