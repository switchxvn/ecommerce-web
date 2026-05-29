<!-- FoodGallerySection.vue -->
<template>
  <section :class="[settings.colors.background, settings.padding.top, settings.padding.bottom]" class="pb-12">
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
            <div class="w-32"><!-- Spacer --></div>
          </div>
        </div>
      </div>

      <!-- Empty State - No Data -->
      <div v-if="!isLoading && (!galleries || galleries.length === 0)" class="py-8 text-center">
        <div class="inline-flex justify-center items-center p-4 rounded-full bg-gray-100 dark:bg-gray-800 mb-4">
          <UtensilsCrossed class="text-gray-400 dark:text-gray-500 w-12 h-12" />
        </div>
        <h3 class="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
          {{ $t('gallery.noImagesFound') }}
        </h3>
        <p class="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
          {{ $t('gallery.noImagesDescription') }}
        </p>
      </div>

      <!-- Loading State -->
      <div v-else-if="isLoading" class="flex justify-center items-center py-12">
        <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 animate-spin text-primary-500" />
      </div>

      <!-- Content - Has Data -->
      <template v-else>
        <!-- Mobile Swiper View -->
        <div class="md:hidden">
          <Swiper v-if="galleries?.length"
            :modules="[Pagination, Navigation, Autoplay]"
            :slides-per-view="2"
            :space-between="16"
            :pagination="{ 
              el: '.food-swiper-pagination',
              clickable: true,
              type: 'bullets'
            }"
            :autoplay="{
              delay: 5000,
              disableOnInteraction: false,
              pauseOnMouseEnter: true
            }"
            class="pb-12"
          >
            <SwiperSlide v-for="(item, index) in galleries" :key="item.id">
              <div
                class="relative group cursor-pointer"
                :class="[settings.card.rounded, settings.card.shadow]"
                @click="openGallery(index)"
              >
                <!-- Image Container -->
                <div class="relative overflow-hidden" :class="settings.card.rounded">
                  <NuxtImg
                    :src="item.image"
                    :alt="item.translations?.[0]?.title || ''"
                    class="w-full h-full object-cover transition-transform duration-300"
                    :class="settings.card.animation"
                    :style="{
                      aspectRatio: settings.card.aspectRatio
                    }"
                    loading="lazy"
                    @error="handleImageError"
                  />
                  
                  <!-- Overlay -->
                  <div v-if="settings.card.overlay.show"
                    class="absolute inset-0 transition-all duration-300 transform translate-y-full group-hover:translate-y-0"
                    :class="[
                      settings.card.overlay.opacity,
                      'group-hover:opacity-100',
                      settings.card.overlay.content.position === 'bottom' ? 'bg-gradient-to-t from-black/60 to-transparent' : ''
                    ]"
                  >
                    <div class="absolute bottom-0 left-0 right-0"
                      :class="settings.card.overlay.content.padding"
                    >
                      <h3 class="text-white font-semibold mb-1"
                        :class="settings.card.overlay.content.titleSize"
                      >
                        {{ item.translations?.[0]?.title }}
                      </h3>
                      <p v-if="item.translations?.[0]?.description"
                        class="text-white/90"
                        :class="settings.card.overlay.content.descriptionSize"
                      >
                        {{ item.translations?.[0]?.description }}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </SwiperSlide>

            <!-- Pagination -->
            <div class="food-swiper-pagination flex justify-center w-full mt-6"></div>
          </Swiper>
        </div>

        <!-- Desktop Grid View -->
        <div v-if="galleries?.length" class="hidden md:grid gap-6"
          :class="{
            'grid-cols-1': currentColumns === 1,
            'grid-cols-2': currentColumns === 2,
            'grid-cols-3': currentColumns === 3,
            'grid-cols-4': currentColumns === 4
          }"
        >
          <div
            v-for="(item, index) in galleries"
            :key="item.id"
            class="relative group cursor-pointer"
            :class="[settings.card.rounded, settings.card.shadow]"
            @click="openGallery(index)"
          >
            <!-- Image Container -->
            <div class="relative overflow-hidden" :class="settings.card.rounded">
              <NuxtImg
                :src="item.image"
                :alt="item.translations?.[0]?.title || ''"
                class="w-full h-full object-cover transition-transform duration-300"
                :class="settings.card.animation"
                :style="{
                  aspectRatio: settings.card.aspectRatio
                }"
                loading="lazy"
                @error="handleImageError"
              />
              
              <!-- Overlay -->
              <div v-if="settings.card.overlay.show"
                class="absolute inset-0 transition-all duration-300 transform translate-y-full group-hover:translate-y-0"
                :class="[
                  settings.card.overlay.opacity,
                  'group-hover:opacity-100',
                  settings.card.overlay.content.position === 'bottom' ? 'bg-gradient-to-t from-black/60 to-transparent' : ''
                ]"
              >
                <div class="absolute bottom-0 left-0 right-0"
                  :class="settings.card.overlay.content.padding"
                >
                  <h3 class="text-white font-semibold mb-1"
                    :class="settings.card.overlay.content.titleSize"
                  >
                    {{ item.translations?.[0]?.title }}
                  </h3>
                  <p v-if="item.translations?.[0]?.description"
                    class="text-white/90"
                    :class="settings.card.overlay.content.descriptionSize"
                  >
                    {{ item.translations?.[0]?.description }}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

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
      </template>
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
import { Swiper, SwiperSlide } from 'swiper/vue';
import { Pagination, Navigation, Autoplay } from 'swiper/modules';
import { UtensilsCrossed } from 'lucide-vue-next';
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
  categoryIds?: number[];
}

const props = defineProps<{
  section: ThemeSection;
}>();

// Default settings
const defaultSettings = {
  layout: 'grid',
  columns: {
    sm: 1,
    md: 2,
    lg: 3,
    xl: 4
  },
  gap: '1.5rem',
  padding: {
    top: 'py-4',
    bottom: 'pb-24'
  },
  maxItems: 8,
  showTitle: true,
  colors: {
    background: 'bg-white dark:bg-gray-900'
  },
  loadMoreButton: {
    show: true,
    text: 'Xem thêm món ăn',
    style: 'primary'
  },
  useUppercase: true,
  categoryIds: [],
  card: {
    aspectRatio: '1/1',
    rounded: 'rounded-xl',
    shadow: 'shadow-lg hover:shadow-xl',
    animation: 'hover:scale-105',
    overlay: {
      show: true,
      opacity: 'bg-black/40',
      content: {
        position: 'bottom',
        padding: 'p-4',
        titleSize: 'text-lg',
        descriptionSize: 'text-sm'
      }
    }
  }
};

const settings = computed(() => ({
  ...defaultSettings,
  ...(props.section?.settings || {})
}));

const currentColumns = ref(settings.value.columns.xl);

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
        title: item.translations?.[0]?.title,
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
    
    // Get categoryIds from section settings or defaults
    const categoryIds = props.section?.categoryIds || 
                       settings.value.categoryIds || 
                       (props.section?.settings?.categoryIds || []);
    
    // Call active galleries endpoint with categoryIds
    const result = await trpc.gallery.active.query({ 
      locale: locale.value,
      categoryIds: categoryIds.length > 0 ? categoryIds : undefined
    });
    
    // Map API response to Gallery interface
    // Filter by type if available, otherwise include all galleries returned from the API
    const foodGalleries = result
      .filter(item => {
        // Nếu không có type hoặc giá trị khác undefined, giả định tất cả là hợp lệ
        // Trong trường hợp có type, chỉ lấy các gallery có type là 'food'
        if (typeof item.type === 'undefined') return true;
        return item.type === 'food';
      })
      .map(item => ({
        id: item.id,
        image: item.image,
        isActive: item.isActive,
        sequence: item.sequence,
        // Nếu không có trường type trong API response, mặc định là 'food' cho component này
        type: item.type || 'food',
        translations: item.translations.map(t => ({
          id: t.id,
          locale: t.locale,
          title: t.title,
          description: t.description
        }))
      }));
      
    galleries.value = foodGalleries;
    totalItems.value = galleries.value.length;
  } catch (error) {
    console.error('Error fetching galleries:', error);
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

// Handle image error
const handleImageError = (event: Event) => {
  const img = event.target as HTMLImageElement;
  img.src = '/images/placeholder-image.jpg'; // Fallback image
};
</script>

<style lang="scss" scoped>
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
