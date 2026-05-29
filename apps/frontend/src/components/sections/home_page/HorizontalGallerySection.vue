<template>
  <section :class="[settings.colors.background, settings.padding.top, settings.padding.bottom]" class="relative">
    <div class="container mx-auto px-4 py-16">
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

      <!-- Gallery Container -->
      <div class="gallery-outer-container relative" v-if="galleries.length > 0">
        <!-- Navigation Buttons -->
        <button 
          @click="handleScrollLeft" 
          class="nav-button left-button"
          :class="{ 'opacity-0': scrollPosition <= 0 }"
        >
          <ChevronLeft class="h-6 w-6" />
          <span class="sr-only">Previous images</span>
        </button>

        <button 
          @click="handleScrollRight" 
          class="nav-button right-button"
          :class="{ 'opacity-0': scrollPosition >= maxScroll }"
        >
          <ChevronRight class="h-6 w-6" />
          <span class="sr-only">Next images</span>
        </button>

        <!-- Gallery Content -->
        <div 
          class="gallery-container cursor-grab active:cursor-grabbing" 
          ref="galleryContainer"
          @mousedown="startDragging"
          @mouseleave="stopDragging"
          @mouseup="stopDragging"
          @mousemove="onDrag"
        >
          <div class="gallery-wrapper" ref="galleryWrapper">
            <div class="gallery-grid">
              <!-- Row 1 -->
              <div class="gallery-row">
                <figure 
                  v-for="(item, index) in getRowItems(0)"
                  :key="item.id"
                  class="gallery-item"
                  :style="{ width: item.width }"
                >
                  <a
                    :href="item.image"
                    @click.prevent="handleGalleryClick($event, getItemIndex(0, index))"
                    target="_blank"
                    rel="noreferrer"
                  >
                    <NuxtImg
                      :src="item.image"
                      :alt="item.translations?.[0]?.title || ''"
                      class="w-full h-full object-cover rounded-lg"
                      loading="lazy"
                    />
                  </a>
                </figure>
              </div>
              
              <!-- Row 2 -->
              <div class="gallery-row">
                <figure 
                  v-for="(item, index) in getRowItems(1)"
                  :key="item.id"
                  class="gallery-item"
                  :style="{ width: item.width }"
                >
                  <a
                    :href="item.image"
                    @click.prevent="handleGalleryClick($event, getItemIndex(1, index))"
                    target="_blank"
                    rel="noreferrer"
                  >
                    <NuxtImg
                      :src="item.image"
                      :alt="item.translations?.[0]?.title || ''"
                      class="w-full h-full object-cover rounded-lg"
                      loading="lazy"
                    />
                  </a>
                </figure>
              </div>
              
              <!-- Row 3 -->
              <div class="gallery-row">
                <figure 
                  v-for="(item, index) in getRowItems(2)"
                  :key="item.id"
                  class="gallery-item"
                  :style="{ width: item.width }"
                >
                  <a
                    :href="item.image"
                    @click.prevent="handleGalleryClick($event, getItemIndex(2, index))"
                    target="_blank"
                    rel="noreferrer"
                  >
                    <NuxtImg
                      :src="item.image"
                      :alt="item.translations?.[0]?.title || ''"
                      class="w-full h-full object-cover rounded-lg"
                      loading="lazy"
                    />
                  </a>
                </figure>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty State - No Data -->
      <div v-else class="empty-state py-16 text-center bg-gray-50 dark:bg-gray-800 rounded-lg">
        <div class="max-w-md mx-auto px-4">
          <div class="mb-6">
            <ImageIcon class="h-16 w-16 mx-auto text-gray-400 dark:text-gray-500" />
          </div>
          <h3 class="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
            {{ t("gallery.noImages") || 'Không có hình ảnh' }}
          </h3>
          <p class="text-sm text-gray-500 dark:text-gray-400">
            {{ t("gallery.emptyDescription") || 'Hiện chưa có hình ảnh nào trong thư viện này.' }}
          </p>
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

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue';
import { useTrpc } from '~/composables/useTrpc';
import { useI18n } from 'vue-i18n';
import Masonry from 'masonry-layout';
import PhotoSwipe from 'photoswipe';
import 'photoswipe/dist/photoswipe.css';
import { ChevronLeft, ChevronRight, ArrowRight, Image as ImageIcon } from 'lucide-vue-next';
import { useToastNotification } from '~/utils/vueToast';

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
  layout: 'horizontal',
  columns: {
    sm: 1,
    md: 2,
    lg: 3,
    xl: 4
  },
  gap: '24',
  padding: {
    top: 'py-8',
    bottom: 'pb-8'
  },
  maxItems: 12,
  showTitle: true,
  colors: {
    background: 'bg-white dark:bg-gray-900',
    emptyState: 'bg-gray-50 dark:bg-gray-800'
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
  useUppercase: true,
  swiperSettings: {
    autoplay: true,
    interval: 5000,
    slidesPerView: 3,
    rows: 3
  },
  categoryIds: []
};

const settings = computed(() => ({
  ...defaultSettings,
  ...(props.section?.settings || {})
}));

// tRPC client
const trpc = useTrpc();
const { t } = useI18n();

// State
const galleries = ref<Gallery[]>([]);
const isLoading = ref(false);
const currentPage = ref(1);
const totalItems = ref(0);
const currentStartIndex = ref(0);
const itemsPerRow = 3;

// Computed
const hasMoreItems = computed(() => galleries.value.length < totalItems.value);

// Masonry instance
let masonryInstance: any = null;

// Refs for DOM elements
const galleryContainer = ref<HTMLElement | null>(null);
const galleryWrapper = ref<HTMLElement | null>(null);
const masonryContainer = ref<HTMLElement | null>(null);
const scrollPosition = ref(0);
const maxScroll = ref(0);

// Add drag scroll functionality
const isDragging = ref(false);
const startX = ref(0);
const dragScrollLeft = ref(0);

// Get size class for items with fixed heights
const getItemClass = (index: number) => {
  // Pattern repeats every 6 images
  const pattern = index % 6;
  
  switch (pattern) {
    case 0: // Large landscape
      return 'w-1/2 h-[400px]';
    case 1: // Portrait
      return 'w-1/4 h-[400px]';
    case 2: // Square
      return 'w-1/4 h-[400px]';
    case 3: // Wide landscape
      return 'w-2/3 h-[300px]';
    case 4: // Small square
      return 'w-1/3 h-[300px]';
    case 5: // Medium landscape
      return 'w-1/2 h-[300px]';
    default:
      return 'w-1/3 h-[300px]';
  }
};

// Initialize Masonry
const initMasonry = () => {
  if (masonryContainer.value) {
    masonryInstance = new Masonry(masonryContainer.value, {
      itemSelector: '.gallery-item',
      columnWidth: '.gallery-item',
      percentPosition: true,
      horizontalOrder: true,
      transitionDuration: '0.3s'
    });
  }
};

// Function to preload image dimensions
const getImageDimensions = (url: string): Promise<{ width: number; height: number }> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.width, height: img.height });
    };
    img.onerror = () => {
      resolve({ width: 800, height: 600 }); // Default fallback size
    };
    img.src = url;
  });
};

// Initialize PhotoSwipe
const initPhotoSwipe = async (index: number = 0) => {
  // Prepare items with actual dimensions
  const itemPromises = galleries.value.map(async (item) => {
    const dimensions = await getImageDimensions(item.image);
    return {
      src: item.image,
      w: dimensions.width,
      h: dimensions.height,
      alt: item.translations?.[0]?.title || ''
    };
  });

  const items = await Promise.all(itemPromises);

  const options = {
    dataSource: items,
    index,
    pswpModule: PhotoSwipe,
    showHideAnimationType: 'fade' as const,
    showAnimationDuration: 300,
    hideAnimationDuration: 300,
    closeOnVerticalDrag: true,
    allowPanToNext: true,
    allowMouseDrag: true,
    maxZoomLevel: 3,
    scaleMode: 'fit' as const
  };

  const lightbox = new PhotoSwipe(options);
  lightbox.init();
};

// Add click handler for gallery items
const handleGalleryClick = (event: Event, index: number) => {
  event.preventDefault();
  initPhotoSwipe(index);
};

// Update template click handler
const template = `
<figure 
  v-for="(item, index) in galleries" 
  :key="item.id"
  class="gallery-item"
  :class="getItemClass(index)"
>
  <a
    :href="item.image"
    @click.prevent="handleGalleryClick($event, index)"
    target="_blank"
    rel="noreferrer"
  >
    <NuxtImg
      :src="item.image"
      :alt="item.translations?.[0]?.title || ''"
      class="w-full h-full object-cover rounded-lg"
      loading="lazy"
    />
  </a>
  <figcaption class="hidden">
    {{ item.translations?.[0]?.title || '' }}
  </figcaption>
</figure>
`;

// Helper function to get fixed width based on index
const getItemWidth = (index: number) => {
  // Pattern repeats every 6 images for consistent layout
  const pattern = index % 6;
  
  switch (pattern) {
    case 0: // Large landscape
      return '500px';
    case 1: // Portrait
      return '300px';
    case 2: // Square
      return '300px';
    case 3: // Wide landscape
      return '600px';
    case 4: // Small square
      return '400px';
    case 5: // Medium landscape
      return '500px';
    default:
      return '400px';
  }
};

// Scroll methods
const handleScrollLeft = () => {
  if (galleryContainer.value) {
    // Scroll by viewport width instead of fixed pixels
    const scrollAmount = galleryContainer.value.clientWidth;
    const newPosition = Math.max(0, scrollPosition.value - scrollAmount);
    galleryContainer.value.scrollTo({
      left: newPosition,
      behavior: 'smooth'
    });
    scrollPosition.value = newPosition;
  }
};

const handleScrollRight = () => {
  if (galleryContainer.value) {
    // Scroll by viewport width instead of fixed pixels
    const scrollAmount = galleryContainer.value.clientWidth;
    const newPosition = Math.min(maxScroll.value, scrollPosition.value + scrollAmount);
    galleryContainer.value.scrollTo({
      left: newPosition,
      behavior: 'smooth'
    });
    scrollPosition.value = newPosition;
  }
};

// Add drag scroll functionality
const startDragging = (e: MouseEvent) => {
  if (!galleryContainer.value) return;
  isDragging.value = true;
  startX.value = e.pageX - galleryContainer.value.offsetLeft;
  dragScrollLeft.value = galleryContainer.value.scrollLeft;
};

const stopDragging = () => {
  isDragging.value = false;
};

const onDrag = (e: MouseEvent) => {
  if (!isDragging.value || !galleryContainer.value) return;
  e.preventDefault();
  const x = e.pageX - galleryContainer.value.offsetLeft;
  const walk = (x - startX.value) * 2;
  galleryContainer.value.scrollLeft = dragScrollLeft.value - walk;
  scrollPosition.value = galleryContainer.value.scrollLeft;
};

// Update scroll position on scroll
const onScroll = () => {
  if (!galleryContainer.value) return;
  scrollPosition.value = galleryContainer.value.scrollLeft;
};

// Update max scroll value
const updateMaxScroll = () => {
  if (galleryWrapper.value && galleryContainer.value) {
    maxScroll.value = galleryWrapper.value.scrollWidth - galleryContainer.value.clientWidth;
  }
};

// Fetch galleries
const fetchGalleries = async () => {
  try {
    isLoading.value = true;
    const { locale } = useI18n();
    
    // Sử dụng API đã được cập nhật để hỗ trợ mảng categoryIds
    const params: any = { locale: locale.value };
    
    // Thêm categoryIds vào params nếu có
    if (settings.value.categoryIds && settings.value.categoryIds.length > 0) {
      params.categoryIds = settings.value.categoryIds;
    }
    
    const result = await trpc.gallery.active.query(params);
    
    galleries.value = result;
    totalItems.value = result.length;
    
    // Initialize masonry after images are loaded
    nextTick(() => {
      initMasonry();
      updateMaxScroll();
    });
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
  // This function is now deprecated as we show all images in the horizontal scroll
  return;
};

// Lifecycle hooks
onMounted(() => {
  fetchGalleries();
  window.addEventListener('resize', updateMaxScroll);
  
  if (galleryContainer.value) {
    galleryContainer.value.addEventListener('mousedown', startDragging);
    galleryContainer.value.addEventListener('mouseleave', stopDragging);
    galleryContainer.value.addEventListener('mouseup', stopDragging);
    galleryContainer.value.addEventListener('mousemove', onDrag);
    galleryContainer.value.addEventListener('scroll', onScroll);
  }
});

onUnmounted(() => {
  window.removeEventListener('resize', updateMaxScroll);
  if (galleryContainer.value) {
    galleryContainer.value.removeEventListener('mousedown', startDragging);
    galleryContainer.value.removeEventListener('mouseleave', stopDragging);
    galleryContainer.value.removeEventListener('mouseup', stopDragging);
    galleryContainer.value.removeEventListener('mousemove', onDrag);
    galleryContainer.value.removeEventListener('scroll', onScroll);
  }
  if (masonryInstance) {
    masonryInstance.destroy();
  }
});

// Helper function to get random width
const getRandomWidth = () => {
  // More diverse width variations (200px to 600px)
  const baseWidth = Math.floor(Math.random() * (600 - 200) + 200);
  return `${baseWidth}px`;
};

const getItemIndex = (rowIndex: number, indexInRow: number) => {
  const itemsPerRow = Math.ceil(galleries.value.length / 3);
  return rowIndex * itemsPerRow + indexInRow;
};

// Helper functions for row management
const getRowItems = (rowIndex: number) => {
  const itemsPerRow = Math.ceil(galleries.value.length / 3);
  const start = rowIndex * itemsPerRow;
  const items = galleries.value.slice(start, start + itemsPerRow);
  
  // Add fixed width based on position in overall gallery
  return items.map((item, indexInRow) => ({
    ...item,
    width: getItemWidth(start + indexInRow)
  }));
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

.gallery-outer-container {
  position: relative;
  margin: 0;
  overflow: hidden;
}

.gallery-container {
  position: relative;
  overflow-x: auto;
  overflow-y: hidden;
  scroll-behavior: smooth;
  cursor: grab;
  margin: 0 -48px;
  
  &:active {
    cursor: grabbing;
  }
  
  &::-webkit-scrollbar {
    display: none;
  }
  
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.gallery-wrapper {
  display: inline-flex;
  min-width: min-content;
}

.gallery-grid {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.gallery-row {
  display: flex;
  gap: 16px;
  min-height: 250px;
  overflow-x: auto;
  scrollbar-width: none; // Hide scrollbar for Firefox
  -ms-overflow-style: none; // Hide scrollbar for IE/Edge
  
  &::-webkit-scrollbar {
    display: none; // Hide scrollbar for Chrome/Safari
  }
  
  .gallery-item {
    flex: none; // Don't grow or shrink
    height: 250px;
    position: relative;
    overflow: hidden;
    border-radius: 8px;
    transition: all 0.3s ease-in-out;
    
    &:hover {
      z-index: 1;
      transform: translateY(-4px);
      
      img {
        transform: scale(1.05);
      }
    }
    
    a {
      display: block;
      width: 100%;
      height: 100%;
    }

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.3s ease-in-out;
    }
  }
}

// Navigation buttons
.nav-button {
  @apply bg-white/80 dark:bg-gray-800/80 
         backdrop-blur-sm
         text-gray-700 dark:text-gray-200 
         rounded-full shadow-lg
         hover:bg-primary-50 dark:hover:bg-primary-900
         transition-all duration-300 ease-in-out;
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  z-index: 20;
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid theme('colors.gray.200');
  
  &.left-button {
    left: 0;
  }
  
  &.right-button {
    right: 0;
  }
  
  &:hover {
    transform: translateY(-50%) scale(1.1);
  }
}

// Media queries for responsive design
@media (max-width: 768px) {
  .gallery-outer-container {
    padding: 0 36px;
  }

  .gallery-container {
    margin: 0 -36px;
    padding: 0 36px;
  }

  .gallery-grid {
    flex-direction: row !important;
    gap: 12px !important;
  }

  .gallery-row {
    display: none !important;
    
    &:first-child {
      display: flex !important;
      gap: 12px;
      
      .gallery-item {
        width: 280px !important;
        min-width: 280px !important;
        height: 200px !important;
        
        &:last-child {
          width: 320px !important;
          min-width: 320px !important;
        }
      }
    }
  }

  .nav-button {
    width: 36px;
    height: 36px;
    
    svg {
      width: 20px;
      height: 20px;
    }
  }
}

@media (max-width: 640px) {
  .gallery-outer-container {
    padding: 0 24px;
  }

  .gallery-container {
    margin: 0 -24px;
    padding: 0 24px;
  }

  .gallery-row:first-child {
    .gallery-item {
      width: 240px !important;
      min-width: 240px !important;
      height: 180px !important;
      
      &:last-child {
        width: 280px !important;
        min-width: 280px !important;
      }
    }
  }

  .nav-button {
    width: 32px;
    height: 32px;
    
    svg {
      width: 16px;
      height: 16px;
    }
  }
}

// PhotoSwipe overrides
:deep(.pswp) {
  --pswp-bg: rgba(0, 0, 0, 0.85);
  
  .pswp__img {
    object-fit: contain;
    border-radius: 8px;
  }
}
</style> 
