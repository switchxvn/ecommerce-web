<template>
  <div class="bg-white dark:bg-gray-900 min-h-screen">
    <div class="container mx-auto px-4 py-16">

      <!-- Video Gallery Section -->
      <div class="mb-16">
        <div class="mb-8 bg-primary-600 dark:bg-primary-500 rounded-lg">
          <div class="container mx-auto px-4">
            <div class="flex items-center justify-between gap-4 py-3">
              <div class="w-32 hidden sm:block"><!-- Spacer --></div>
              <div class="category-header flex-1 text-center">
                <h2 
                  class="inline-flex items-center px-4 py-2 mobile-title text-xl sm:text-2xl font-bold text-white uppercase"
                >
                  {{ t('gallery.videoGallery') }}
                </h2>
              </div>
              <div class="w-32"><!-- Spacer --></div>
            </div>
          </div>
        </div>
        
        <!-- Video Gallery Container -->
        <div class="video-gallery-container">
          <!-- Loading State -->
          <div v-if="isVideoLoading" class="flex justify-center items-center py-16">
            <UIcon name="i-heroicons-arrow-path" class="text-primary-500 animate-spin w-10 h-10" />
          </div>

          <!-- Error State -->
          <div v-else-if="hasVideoError" class="text-center py-16">
            <p class="text-red-500 mb-4">{{ t('gallery.fetchVideoError') }}</p>
            <UButton @click="fetchVideos" color="primary">
              {{ t('common.tryAgain') }}
            </UButton>
          </div>

          <!-- Empty State -->
          <div v-else-if="videos.length === 0" class="text-center py-16">
            <p class="text-gray-500 dark:text-gray-400">{{ t('gallery.noVideos') }}</p>
          </div>

          <!-- Video Gallery Content -->
          <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div
              v-for="video in videos"
              :key="video.id"
              class="video-card group relative h-[480px] bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <div class="relative h-[280px] overflow-hidden">
                <template v-if="getVideoId(video.videoUrl)">
                  <img
                    v-if="!isVideoActivated(video.id)"
                    :src="getVideoThumbnail(video.videoUrl, video.thumbnailUrl)"
                    :alt="video.title"
                    class="w-full h-full object-cover"
                    loading="lazy"
                    @error="handleImageError"
                  />
                  <iframe
                    v-else
                    :src="getEmbedUrl(video.videoUrl)"
                    class="w-full h-full object-cover"
                    :title="video.title"
                    loading="lazy"
                    frameborder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowfullscreen
                  ></iframe>
                  <button
                    v-if="!isVideoActivated(video.id)"
                    class="absolute inset-0 flex items-center justify-center bg-black/25 hover:bg-black/35 transition-colors"
                    :aria-label="`Play ${video.title}`"
                    @click="activateVideo(video.id)"
                  >
                    <PlayCircle class="w-16 h-16 text-white drop-shadow-lg" />
                  </button>
                </template>
                <!-- Fallback for non-YouTube videos or invalid URLs -->
                <img
                  v-else-if="!getVideoId(video.videoUrl)"
                  :src="video.thumbnailUrl"
                  :alt="video.title"
                  class="w-full h-full object-cover"
                  @error="handleImageError"
                />
              </div>
              <!-- Video Info Section -->
              <div class="p-6 flex flex-col h-[200px]">
                <div class="flex-1">
                  <!-- Title -->
                  <h3 class="text-xl font-semibold mb-3 line-clamp-2 text-gray-900 dark:text-gray-100">
                    {{ video.title }}
                  </h3>
                  
                  <!-- Description -->
                  <p class="text-sm text-gray-600 dark:text-gray-400 line-clamp-3">
                    {{ video.description }}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Image Gallery Section -->
      <div class="mb-16">
        <div class="mb-8 bg-primary-600 dark:bg-primary-500 rounded-lg">
          <div class="container mx-auto px-4">
            <div class="flex items-center justify-between gap-4 py-3">
              <div class="w-32 hidden sm:block"><!-- Spacer --></div>
              <div class="category-header flex-1 text-center">
                <h2 
                  class="inline-flex items-center px-4 py-2 mobile-title text-xl sm:text-2xl font-bold text-white uppercase"
                >
                  {{ t('gallery.imageGallery') }}
                </h2>
              </div>
              <div class="w-32"><!-- Spacer --></div>
            </div>
          </div>
        </div>
        
        <!-- Filter Controls -->
        <div class="mb-8">
          <div class="flex flex-wrap gap-4 justify-center">
            <UButton
              v-for="category in categories"
              :key="category.id"
              variant="soft"
              :color="selectedCategoryId === category.id ? 'primary' : 'gray'"
              @click="setSelectedCategory(category.id)"
              class="text-xl font-semibold uppercase tracking-wide"
            >
              <Image v-if="category.name.toLowerCase().includes('common') || category.name.toLowerCase().includes('chung')" class="w-6 h-6 mr-2" />
              <Utensils v-else-if="category.name.toLowerCase().includes('food') || category.name.toLowerCase().includes('thức ăn')" class="w-6 h-6 mr-2" />
              <Route v-else class="w-6 h-6 mr-2" />
              {{ category.name }}
            </UButton>
          </div>
        </div>

        <!-- Gallery Container -->
        <div class="gallery-outer-container relative">
          <!-- Loading State -->
          <div v-if="isLoading" class="flex justify-center items-center py-16">
            <UIcon name="i-heroicons-arrow-path" class="text-primary-500 animate-spin w-10 h-10" />
          </div>

          <!-- Error State -->
          <div v-else-if="hasError" class="text-center py-16">
            <p class="text-red-500 mb-4">{{ t('gallery.fetchError') }}</p>
            <UButton @click="fetchGalleries" color="primary">
              {{ t('common.tryAgain') }}
            </UButton>
          </div>

          <!-- Empty State -->
          <div v-else-if="galleries.length === 0" class="text-center py-16">
            <p class="text-gray-500 dark:text-gray-400">{{ t('gallery.noImages') }}</p>
          </div>

          <!-- Gallery Content -->
          <template v-else>
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
                      v-for="(item, itemIndex) in getRowItems(0)"
                      :key="`row0-${item.id}-${itemIndex}`"
                      class="gallery-item"
                      :style="{ width: item.width }"
                    >
                      <a
                        :href="item.image"
                        :data-pswp-width="1200"
                        :data-pswp-height="800"
                        :data-cropped="true"
                        :data-pswp-src="item.image"
                        target="_blank"
                        rel="noreferrer"
                      >
                        <NuxtImg
                          :src="item.image"
                          :alt="item.translations?.[0]?.title || ''"
                          class="w-full h-full object-cover rounded-lg"
                          loading="lazy"
                          @click.prevent="handleGalleryClick($event, itemIndex)"
                        />
                      </a>
                    </figure>
                  </div>
                  
                  <!-- Row 2 -->
                  <div class="gallery-row">
                    <figure 
                      v-for="(item, itemIndex) in getRowItems(1)"
                      :key="`row1-${item.id}-${itemIndex}`"
                      class="gallery-item"
                      :style="{ width: item.width }"
                    >
                      <a
                        :href="item.image"
                        :data-pswp-width="1200"
                        :data-pswp-height="800"
                        :data-cropped="true"
                        :data-pswp-src="item.image"
                        target="_blank"
                        rel="noreferrer"
                      >
                        <NuxtImg
                          :src="item.image"
                          :alt="item.translations?.[0]?.title || ''"
                          class="w-full h-full object-cover rounded-lg"
                          loading="lazy"
                          @click.prevent="handleGalleryClick($event, itemIndex)"
                        />
                      </a>
                    </figure>
                  </div>
                  
                  <!-- Row 3 -->
                  <div class="gallery-row">
                    <figure 
                      v-for="(item, itemIndex) in getRowItems(2)"
                      :key="`row2-${item.id}-${itemIndex}`"
                      class="gallery-item"
                      :style="{ width: item.width }"
                    >
                      <a
                        :href="item.image"
                        :data-pswp-width="1200"
                        :data-pswp-height="800"
                        :data-cropped="true"
                        :data-pswp-src="item.image"
                        target="_blank"
                        rel="noreferrer"
                      >
                        <NuxtImg
                          :src="item.image"
                          :alt="item.translations?.[0]?.title || ''"
                          class="w-full h-full object-cover rounded-lg"
                          loading="lazy"
                          @click.prevent="handleGalleryClick($event, itemIndex)"
                        />
                      </a>
                    </figure>
                  </div>
                </div>
              </div>
            </div>
          </template>
        </div>
      </div>
    </div>

    <!-- Lightbox Modal -->
    <div 
      v-if="isLightboxOpen" 
      class="lightbox-overlay" 
      @click="closeLightbox"
      @touchstart="handleTouchStart"
      @touchend="handleTouchEnd"
    >
      <div class="lightbox-container" @click.stop>
        <!-- Close button -->
        <button class="lightbox-close-btn" @click="closeLightbox">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-8 w-8">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
        
        <!-- Navigation buttons -->
        <button class="lightbox-nav-btn lightbox-prev-btn" @click.stop="showPreviousImage">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-10 w-10">
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
        </button>
        
        <button class="lightbox-nav-btn lightbox-next-btn" @click.stop="showNextImage">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-10 w-10">
            <polyline points="9 18 15 12 9 6"></polyline>
          </svg>
        </button>
        
                  <!-- Image container -->
          <div class="lightbox-image-container">
            <div v-if="allGalleryItems.length === 0" class="text-white text-center">
              Không có hình ảnh nào để hiển thị
            </div>
            <img 
              v-else-if="lightboxIndex < allGalleryItems.length"
              :src="allGalleryItems[lightboxIndex].image"
              :alt="allGalleryItems[lightboxIndex].translations?.[0]?.title || ''"
              class="lightbox-image"
              @error="handleImageError"
            />
          
                     <!-- Caption -->
          <div v-if="allGalleryItems.length > 0 && lightboxIndex < allGalleryItems.length" class="lightbox-caption">
            <div class="lightbox-title">
              {{ allGalleryItems[lightboxIndex].translations?.[0]?.title || '' }}
            </div>
            <div class="lightbox-description">
              {{ allGalleryItems[lightboxIndex].translations?.[0]?.description || '' }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue';
import { useTrpc } from '~/composables/useTrpc';
import { usePageSeo } from '~/composables/usePageSeo';
import { useToastNotification } from '~/utils/vueToast';

import { ChevronLeft, ChevronRight, Image, Utensils, PlayCircle, Route } from 'lucide-vue-next';

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
  width?: string;
}

interface VideoIntro {
  id: number;
  title: string;
  description: string;
  videoUrl: string;
  thumbnailUrl: string;
  isActive: boolean;
  order: number;
}

// i18n
const { t, locale } = useI18n();

usePageSeo({
  title: computed(() => t('gallery.title') || 'Thu vien anh'),
  description: computed(() => t('gallery.description') || 'Khám phá bộ sưu tập ảnh đẹp của chúng tôi'),
  currentPath: computed(() => (locale.value === 'en' ? '/gallery' : '/thu-vien-hinh-anh')),
  locale: computed(() => (locale.value === 'en' ? 'en' : 'vi')),
  routeKey: 'gallery',
});

// tRPC client
const trpc = useTrpc();

// State
const galleries = ref<Gallery[]>([]);
const videos = ref<VideoIntro[]>([]);
const isLoading = ref(false);
const isVideoLoading = ref(false);
const hasError = ref(false);
const hasVideoError = ref(false);
const selectedCategoryId = ref<number | null>(null);
const categories = ref<Array<{id: number, name: string}>>([]);

// Refs for DOM elements
const galleryContainer = ref<HTMLElement | null>(null);
const galleryWrapper = ref<HTMLElement | null>(null);
const scrollPosition = ref(0);
const maxScroll = ref(0);

// Add drag scroll functionality
const isDragging = ref(false);
const startX = ref(0);
const dragScrollLeft = ref(0);

// Add ResizeObserver
let resizeObserver: ResizeObserver;

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
  if (!galleryContainer.value) return;
  const containerWidth = galleryContainer.value.clientWidth;
  const newPosition = Math.max(0, scrollPosition.value - containerWidth);
  galleryContainer.value.scrollTo({
    left: newPosition,
    behavior: 'smooth'
  });
};

const handleScrollRight = () => {
  if (!galleryContainer.value || !galleryWrapper.value) return;
  const containerWidth = galleryContainer.value.clientWidth;
  const scrollWidth = galleryWrapper.value.scrollWidth;
  const currentScroll = galleryContainer.value.scrollLeft;
  
  // Calculate the maximum scroll position
  const maxScrollPosition = scrollWidth - containerWidth;
  
  // Calculate new scroll position
  const newPosition = Math.min(maxScrollPosition, currentScroll + containerWidth);
  
  // Update scroll position
  galleryContainer.value.scrollTo({
    left: newPosition,
    behavior: 'smooth'
  });
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
  if (!galleryContainer.value || !galleryWrapper.value) return;
  const containerWidth = galleryContainer.value.clientWidth;
  const scrollWidth = galleryWrapper.value.scrollWidth;
  
  scrollPosition.value = galleryContainer.value.scrollLeft;
  maxScroll.value = scrollWidth - containerWidth;
};

// Update max scroll value
const updateMaxScroll = () => {
  if (!galleryContainer.value || !galleryWrapper.value) return;
  const containerWidth = galleryContainer.value.clientWidth;
  const scrollWidth = galleryWrapper.value.scrollWidth;
  
  maxScroll.value = scrollWidth - containerWidth;
  scrollPosition.value = galleryContainer.value.scrollLeft;
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

// State for lightbox
const isLightboxOpen = ref(false);
const lightboxIndex = ref(0);
const touchStartX = ref(0);
const touchEndX = ref(0);
const allGalleryItems = ref<Gallery[]>([]);
const activatedVideos = ref<Set<number>>(new Set());

// Add click handler for gallery items
const handleGalleryClick = (event: Event, index: number) => {
  event.preventDefault();
  
  // Nếu danh sách ảnh chưa được khởi tạo, tạo lại
  if (allGalleryItems.value.length === 0) {
    allGalleryItems.value = createFlatGalleryList();
  }
  
  // Mở lightbox
  openLightbox(0, index);
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

// Change selected category
const setSelectedCategory = (categoryId: number) => {
  if (selectedCategoryId.value === categoryId) return;
  
  selectedCategoryId.value = categoryId;
  fetchGalleries();
};

// Helper function to get YouTube video ID
const getVideoId = (url: string): string | null => {
  if (!url) return null;
  
  try {
    let videoId: string | null = null;
    
    if (url.includes('youtube.com')) {
      videoId = url.split('v=')[1]?.split('&')[0] || null;
    } else if (url.includes('youtu.be')) {
      videoId = url.split('/').pop() || null;
    }
    
    return videoId;
  } catch (error) {
    console.error('Error extracting video ID:', error);
    return null;
  }
};

// Get embed URL for YouTube videos
const getEmbedUrl = (url: string): string => {
  const videoId = getVideoId(url);
  if (!videoId) return '';
  
  // Add parameters for better performance and user experience
  const params = new URLSearchParams({
    autoplay: '1',
    rel: '0', // Don't show related videos
    modestbranding: '1', // Minimal YouTube branding
    playsinline: '1'
  });
  
  return `https://www.youtube.com/embed/${videoId}?${params.toString()}`;
};

const getVideoThumbnail = (url: string, fallback?: string): string => {
  const videoId = getVideoId(url);
  if (videoId) {
    return `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
  }

  return fallback || "https://placehold.co/800x600/e2e8f0/a0aec0?text=Video";
};

const activateVideo = (videoId: number) => {
  activatedVideos.value.add(videoId);
};

const isVideoActivated = (videoId: number) => {
  return activatedVideos.value.has(videoId);
};

// Handle image error
const handleImageError = (event: Event) => {
  const imgElement = event.target as HTMLImageElement;
  if (imgElement) {
    imgElement.src = "https://placehold.co/800x600/e2e8f0/a0aec0?text=Image+Not+Found";
  }
};

// Fetch galleries
const fetchGalleries = async () => {
  try {
    isLoading.value = true;
    hasError.value = false;
    const result = await trpc.gallery.active.query({ 
      locale: locale.value,
      categoryId: selectedCategoryId.value || undefined
    });
    
    galleries.value = result;
    
    // Tạo danh sách phẳng cho lightbox ngay sau khi nhận dữ liệu
    nextTick(() => {
      allGalleryItems.value = createFlatGalleryList();
      updateMaxScroll();
    });
  } catch (error) {
    console.error('Error fetching galleries:', error);
    useToastNotification().add({
      id: 'gallery-error',
      title: t('common.error'),
      description: t('gallery.fetchError'),
      color: 'red'
    });
    galleries.value = [];
    hasError.value = true;
  } finally {
    isLoading.value = false;
  }
};

// Lấy danh sách categories có type là gallery
const fetchCategories = async () => {
  try {
    const result = await trpc.category.byType.query({ 
      type: 'gallery',
      locale: locale.value 
    });

    categories.value = result.map(cat => ({
      id: cat.id,
      name: cat.translations?.find(t => t.locale === locale.value)?.name || 'Unknown'
    }));

    // Nếu có ít nhất một category, chọn category đầu tiên và fetch galleries
    if (categories.value.length > 0) {
      selectedCategoryId.value = categories.value[0].id;
      fetchGalleries();
    } else {
      // Trường hợp không có category
      galleries.value = [];
    }
  } catch (error) {
    console.error('Error fetching categories:', error);
    useToastNotification().add({
      id: 'category-error',
      title: t('common.error'),
      description: t('category.fetchError'),
      color: 'red'
    });
  }
};

// Fetch videos
const fetchVideos = async () => {
  try {
    isVideoLoading.value = true;
    hasVideoError.value = false;
    const result = await trpc.hero.getHeroVideos.query({});
    videos.value = result as VideoIntro[];
  } catch (error) {
    console.error('Error fetching videos:', error);
    useToastNotification().add({
      id: 'video-error',
      title: t('common.error'),
      description: t('gallery.fetchVideoError'),
      color: 'red'
    });
    videos.value = [];
    hasVideoError.value = true;
  } finally {
    isVideoLoading.value = false;
  }
};

// Tạo danh sách phẳng các items từ 3 rows
const createFlatGalleryList = (): Gallery[] => {
  if (galleries.value.length === 0) {
    return [];
  }
  
  // Tạo một bản sao của galleries để tránh tham chiếu
  return [...galleries.value].map((item, index) => ({
    ...item,
    width: getItemWidth(index)
  }));
};

// Lightbox methods
const openLightbox = (rowIndex: number, itemIndex: number) => {
  // Kiểm tra nếu galleries không có dữ liệu
  if (galleries.value.length === 0) {
    console.error('Cannot open lightbox: No galleries available');
    return;
  }
  
  // Tính toán chỉ mục trong danh sách phẳng
  const itemsPerRow = Math.ceil(galleries.value.length / 3);
  const flatIndex = rowIndex * itemsPerRow + itemIndex;
  
  // Đảm bảo chỉ mục hợp lệ
  if (flatIndex >= allGalleryItems.value.length) {
    console.error('Invalid index:', flatIndex, 'total items:', allGalleryItems.value.length);
    return;
  }
  
  lightboxIndex.value = flatIndex;
  isLightboxOpen.value = true;
  
  // Disable body scroll
  document.body.style.overflow = 'hidden';
};

const closeLightbox = () => {
  isLightboxOpen.value = false;
  
  // Enable body scroll
  document.body.style.overflow = '';
};

const showNextImage = () => {
  if (allGalleryItems.value.length === 0) return;
  lightboxIndex.value = (lightboxIndex.value + 1) % allGalleryItems.value.length;
};

const showPreviousImage = () => {
  if (allGalleryItems.value.length === 0) return;
  lightboxIndex.value = (lightboxIndex.value - 1 + allGalleryItems.value.length) % allGalleryItems.value.length;
};

const handleLightboxKeydown = (e: KeyboardEvent) => {
  if (!isLightboxOpen.value) return;
  
  if (e.key === 'Escape') {
    closeLightbox();
  } else if (e.key === 'ArrowRight') {
    showNextImage();
  } else if (e.key === 'ArrowLeft') {
    showPreviousImage();
  }
};

// Touch handlers for swipe functionality
const handleTouchStart = (e: TouchEvent) => {
  touchStartX.value = e.touches[0].clientX;
};

const handleTouchEnd = (e: TouchEvent) => {
  touchEndX.value = e.changedTouches[0].clientX;
  handleSwipe();
};

const handleSwipe = () => {
  const swipeThreshold = 50; // Minimum distance to detect swipe
  const swipeDistance = touchEndX.value - touchStartX.value;
  
  if (Math.abs(swipeDistance) < swipeThreshold) return;
  
  if (swipeDistance > 0) {
    // Swipe right (show previous)
    showPreviousImage();
  } else {
    // Swipe left (show next)
    showNextImage();
  }
};

onMounted(() => {
  fetchCategories();
  fetchVideos();
  
  // Khởi tạo danh sách ảnh cho lightbox
  nextTick(() => {
    allGalleryItems.value = createFlatGalleryList();
  });
  
  if (galleryContainer.value) {
    // Initialize ResizeObserver
    resizeObserver = new ResizeObserver(() => {
      updateMaxScroll();
    });
    resizeObserver.observe(galleryContainer.value);
    
    // Add scroll event listener
    galleryContainer.value.addEventListener('scroll', onScroll);
  }
  
  // Add key event listener for lightbox
  window.addEventListener('keydown', handleLightboxKeydown);
});

onUnmounted(() => {
  if (resizeObserver) {
    resizeObserver.disconnect();
  }
  if (galleryContainer.value) {
    galleryContainer.value.removeEventListener('scroll', onScroll);
  }
  
  // Restore body overflow when component is unmounted
  document.body.style.overflow = '';
  
  // Remove lightbox event listener
  window.removeEventListener('keydown', handleLightboxKeydown);
});
</script>

<style lang="scss" scoped>
.category-header {
  position: relative;

  @media (max-width: 640px) {
    text-align: left !important;
    
    h1.mobile-title {
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
  min-height: 300px;
  padding: 0 48px;
}

.gallery-container {
  position: relative;
  overflow-x: auto;
  overflow-y: hidden;
  scroll-behavior: smooth;
  cursor: grab;
  margin: 0;
  padding: 0;
  width: 100%;
  
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
  padding: 0 48px;
}

.gallery-grid {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding-right: 48px; // Add padding to ensure last items are reachable
}

.gallery-row {
  display: flex;
  gap: 16px;
  min-height: 250px;
  
  .gallery-item {
    flex: none;
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
  }
}

// Video gallery styles
.video-gallery-container {
  padding: 0 24px;
}

.video-card {
  @apply transform transition-all duration-300;
  
  &:hover {
    @apply -translate-y-1;
  }
  
  iframe {
    aspect-ratio: 16/9;
    width: 100%;
    height: 100%;
    border-radius: 0.5rem;
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
  opacity: 1;
  pointer-events: auto;
  
  &.left-button {
    left: 0;
  }
  
  &.right-button {
    right: 0;
  }
  
  &:hover {
    transform: translateY(-50%) scale(1.1);
  }
  
  &.hidden {
    opacity: 0;
    pointer-events: none;
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

// PhotoSwipe 5 overrides
:deep(.pswp) {
  --pswp-bg: rgba(0, 0, 0, 0.85);
  
  img {
    object-fit: contain !important;
    border-radius: 8px;
    max-height: 90vh !important;
    max-width: 90vw !important;
  }
  
  .pswp__container {
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .pswp__button {
    color: white;
    background-color: rgba(0, 0, 0, 0.5);
    border-radius: 50%;
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
}

/* Lightbox Styles */
.lightbox-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.lightbox-container {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.lightbox-image-container {
  max-width: 90%;
  max-height: 90%;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.lightbox-image {
  max-width: 100%;
  max-height: calc(100vh - 150px);
  object-fit: contain;
  border-radius: 4px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5);
}

.lightbox-caption {
  margin-top: 16px;
  color: white;
  text-align: center;
  width: 100%;
  padding: 0 16px;
}

.lightbox-title {
  font-size: 1.25rem;
  font-weight: bold;
  margin-bottom: 4px;
}

.lightbox-description {
  font-size: 1rem;
  opacity: 0.8;
}

.lightbox-close-btn {
  position: absolute;
  top: 16px;
  right: 16px;
  color: white;
  background-color: rgba(0, 0, 0, 0.5);
  border-radius: 50%;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s;
  border: none;
  cursor: pointer;
  z-index: 1;
}

.lightbox-close-btn:hover {
  background-color: rgba(255, 255, 255, 0.2);
  transform: scale(1.1);
}

.lightbox-nav-btn {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  color: white;
  background-color: rgba(0, 0, 0, 0.5);
  border-radius: 50%;
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s;
  border: none;
  cursor: pointer;
  z-index: 1;
}

.lightbox-prev-btn {
  left: 16px;
}

.lightbox-next-btn {
  right: 16px;
}

.lightbox-nav-btn:hover {
  background-color: rgba(255, 255, 255, 0.2);
  transform: translateY(-50%) scale(1.1);
}
</style> 
