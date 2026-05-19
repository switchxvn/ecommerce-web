<script setup lang="ts">
import { useLocalization } from '../../composables/useLocalization';
import { useReviews } from '../../composables/useReviews';
import { useRoute } from 'vue-router';
import { ref, computed, onMounted } from 'vue';
import { useTrpc } from '../../composables/useTrpc';
import Pagination from '../common/Pagination.vue';
import Loader from '../ui/Loader.vue';
import { Swiper, SwiperSlide } from 'swiper/vue';
import { Navigation, Pagination as SwiperPagination, Zoom } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import 'swiper/css/zoom';

// Props cho section này
const props = defineProps({
  section: {
    type: Object,
    required: true
  }
});

const route = useRoute();
const { t, locale } = useLocalization();
const trpc = useTrpc();

// Lấy settings từ section
const settings = props.section.settings || {};

// Default values
const backgroundColor = settings.backgroundColor || 'bg-white dark:bg-gray-800';
const textColor = settings.textColor || 'text-gray-900 dark:text-white';
const borderColor = settings.borderColor || 'border-gray-200 dark:border-gray-700';
const shadowLevel = settings.shadowLevel || 'shadow-sm';
const padding = settings.padding || 'p-4';
const gridColumns = settings.gridColumns || { mobile: 1, tablet: 2, desktop: 3 };
const showRating = settings.showRating !== undefined ? settings.showRating : true;
const showDate = settings.showDate !== undefined ? settings.showDate : true;
const showServiceType = settings.showServiceType !== undefined ? settings.showServiceType : true;
const showProfession = settings.showProfession !== undefined ? settings.showProfession : true;
const showPagination = settings.showPagination !== undefined ? settings.showPagination : true;

// Lấy data từ useReviews composable
const {
  reviews,
  isLoading,
  pagination,
  filters,
  serviceTypes,
  selectedReview,
  showModal,
  expandedContents,
  currentLocale,
  
  // Methods
  applyFilters,
  clearFilters,
  goToPage,
  formatDate,
  getStars,
  getServiceTypeName,
  openAvatarModal,
  closeAvatarModal,
  toggleContent,
  isContentExpanded,
  contentNeedsExpansion,
  loadReviews
} = useReviews();

// Kiểm tra mount và tự động tải dữ liệu nếu cần
onMounted(async () => {
  if (!reviews.value || reviews.value.length === 0) {
    await loadReviews();
  }
});

// Swiper options
const swiperOptions = {
  modules: [Navigation, SwiperPagination, Zoom],
  navigation: {
    nextEl: '.swiper-button-next',
    prevEl: '.swiper-button-prev',
  },
  pagination: {
    el: '.swiper-pagination',
    clickable: true
  },
  zoom: true,
  loop: false,
  centeredSlides: true
};

// Tạo dynamic class cho grid columns
const gridClass = computed(() => {
  return {
    'grid-cols-1': true,
    [`md:grid-cols-${gridColumns.tablet}`]: gridColumns.tablet > 1,
    [`lg:grid-cols-${gridColumns.desktop}`]: gridColumns.desktop > 1
  };
});
</script>

<template>
  <div class="container mx-auto px-4 py-8">
    <div class="flex flex-col lg:flex-row gap-8">
      <!-- Filters -->
      <div class="w-full lg:w-1/4">
        <div :class="[backgroundColor, shadowLevel, 'border rounded-lg', borderColor, 'p-6 sticky top-24']">
          <h3 class="text-xl font-medium mb-4" :class="textColor">
            {{ t('reviews.filters') }}
          </h3>
          
          <!-- Sort by filter -->
          <div class="mb-6">
            <label class="block text-sm font-medium mb-2" :class="textColor === 'text-gray-900 dark:text-white' ? 'text-gray-700 dark:text-gray-300' : textColor">
              {{ t('reviews.sortBy') }}
            </label>
            <select 
              v-model="filters.sortBy" 
              :class="[backgroundColor === 'bg-white dark:bg-gray-800' ? 'bg-white dark:bg-gray-700' : backgroundColor, 'border rounded-md py-2 px-3 w-full', borderColor, textColor]"
            >
              <option value="latest">{{ t('reviews.sortLatest') }}</option>
              <option value="highest_rating">{{ t('reviews.sortHighestRating') }}</option>
              <option value="lowest_rating">{{ t('reviews.sortLowestRating') }}</option>
            </select>
          </div>
          
          <!-- Rating filter -->
          <div class="mb-6">
            <label class="block text-sm font-medium mb-2" :class="textColor === 'text-gray-900 dark:text-white' ? 'text-gray-700 dark:text-gray-300' : textColor">
              {{ t('reviews.minimumRating') }}
            </label>
            <div class="flex items-center gap-2">
              <select 
                v-model="filters.minRating" 
                :class="[backgroundColor === 'bg-white dark:bg-gray-800' ? 'bg-white dark:bg-gray-700' : backgroundColor, 'border rounded-md py-2 px-3 w-full', borderColor, textColor]"
              >
                <option :value="0">{{ t('reviews.anyRating') }}</option>
                <option :value="5">5 {{ t('reviews.stars') }}</option>
                <option :value="4">4+ {{ t('reviews.stars') }}</option>
                <option :value="3">3+ {{ t('reviews.stars') }}</option>
                <option :value="2">2+ {{ t('reviews.stars') }}</option>
                <option :value="1">1+ {{ t('reviews.stars') }}</option>
              </select>
            </div>
          </div>
          
          <!-- Service type filter -->
          <div class="mb-6" v-if="serviceTypes.length > 0">
            <label class="block text-sm font-medium mb-2" :class="textColor === 'text-gray-900 dark:text-white' ? 'text-gray-700 dark:text-gray-300' : textColor">
              {{ t('reviews.serviceType') }}
            </label>
            <select 
              v-model="filters.serviceTypeId" 
              :class="[backgroundColor === 'bg-white dark:bg-gray-800' ? 'bg-white dark:bg-gray-700' : backgroundColor, 'border rounded-md py-2 px-3 w-full', borderColor, textColor]"
            >
              <option value="">{{ t('reviews.allServices') }}</option>
              <option v-for="serviceType in serviceTypes" :key="serviceType.id" :value="serviceType.id">
                {{ getServiceTypeName(serviceType) }}
              </option>
            </select>
          </div>
          
          <!-- Filter actions -->
          <div class="flex flex-col gap-2">
            <button 
              @click="applyFilters"
              class="w-full py-2 px-4 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-md transition-colors"
            >
              {{ t('reviews.applyFilters') }}
            </button>
            <button 
              @click="clearFilters"
              class="w-full py-2 px-4 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 font-medium rounded-md transition-colors"
            >
              {{ t('reviews.clearFilters') }}
            </button>
          </div>
        </div>
      </div>
      
      <!-- Reviews list -->
      <div class="w-full lg:w-3/4">
        <div class="mb-4">
          <p :class="textColor === 'text-gray-900 dark:text-white' ? 'text-gray-600 dark:text-gray-400' : textColor">
            {{ t('reviews.showing') }} 
            <span class="font-medium">{{ pagination.total }}</span> 
            {{ t('reviews.reviewsCount') }}
          </p>
        </div>
        
        <!-- Loading state -->
        <div v-if="isLoading" class="py-6">
          <ListSkeleton :item-count="6" />
        </div>
        
        <!-- Empty state -->
        <div v-if="!isLoading && (!reviews || reviews.length === 0)" :class="[backgroundColor, shadowLevel, 'border rounded-lg', borderColor, 'p-8 text-center']">
          <i class="i-heroicons-chat-bubble-bottom-center-text text-5xl text-gray-400 dark:text-gray-500 mb-3"></i>
          <h3 class="text-xl font-medium mb-2" :class="textColor">
            {{ t('reviews.noReviews') }}
          </h3>
          <p class="text-gray-600 dark:text-gray-400">
            {{ t('reviews.tryAdjustingFilters') }}
          </p>
        </div>
        
        <!-- Reviews -->
        <div v-if="!isLoading && reviews && reviews.length > 0" :class="['grid gap-4', gridClass]">
          <div 
            v-for="review in reviews" 
            :key="review.id"
            :class="[backgroundColor, shadowLevel, 'border rounded-lg', borderColor, padding, 'flex flex-col h-full']"
          >
            <div class="flex items-start">
              <!-- Avatar -->
              <div class="mr-3 flex-shrink-0 cursor-pointer" @click="openAvatarModal(review)">
                <div v-if="review.authorAvatar" class="h-10 w-10 rounded-full overflow-hidden hover:ring-2 hover:ring-primary-400 transition">
                  <img :src="review.authorAvatar" :alt="review.authorName" class="h-full w-full object-cover" />
                </div>
                <div v-else class="h-10 w-10 rounded-full bg-primary-100 dark:bg-primary-800 flex items-center justify-center hover:ring-2 hover:ring-primary-400 transition">
                  <span class="text-sm font-medium text-primary-600 dark:text-primary-300">
                    {{ review.authorName.charAt(0).toUpperCase() }}
                  </span>
                </div>
              </div>
              
              <!-- Header Content -->
              <div class="flex-1 min-w-0">
                <h3 class="text-base font-medium truncate" :class="textColor">
                  {{ review.authorName }}
                </h3>
                <div v-if="showRating" class="flex items-center mt-1">
                  <div class="flex text-primary-300">
                    <template v-for="(isFilled, index) in getStars(review.rating)" :key="`star-${index}`">
                      <i v-if="isFilled" class="i-heroicons-star-solid text-sm"></i>
                      <i v-else class="i-heroicons-star text-sm text-gray-300 dark:text-gray-600"></i>
                    </template>
                  </div>
                  <span v-if="showDate" class="ml-2 text-xs text-gray-500 dark:text-gray-400">
                    {{ formatDate(review.createdAt) }}
                  </span>
                </div>
              </div>
              
              <!-- Service type badge -->
              <div v-if="showServiceType && review.serviceType" class="ml-2 flex-shrink-0">
                <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                  {{ getServiceTypeName(review.serviceType) }}
                </span>
              </div>
            </div>
            
            <!-- Review title and content -->
            <div class="mt-3 flex-grow">
              <h4 v-if="review.translations?.[0]?.title" class="font-medium text-sm mb-1" :class="textColor">
                {{ review.translations[0].title }}
              </h4>
              <div class="prose dark:prose-invert prose-sm max-w-none text-sm" :class="textColor === 'text-gray-900 dark:text-white' ? 'text-gray-600 dark:text-gray-300' : ''">
                <p :class="{ 'line-clamp-3': !isContentExpanded(review.id) && contentNeedsExpansion(review.translations?.[0]?.content) }">
                  {{ review.translations?.[0]?.content || '' }}
                </p>
                <button 
                  v-if="contentNeedsExpansion(review.translations?.[0]?.content)" 
                  @click="toggleContent(review.id)"
                  class="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 text-xs font-medium mt-1"
                >
                  {{ isContentExpanded(review.id) ? t('common.readLess') : t('common.readMore') }}
                </button>
              </div>
            </div>
            
            <div v-if="showProfession || review.visitDate" class="flex items-center justify-between mt-3 pt-2 border-t" :class="borderColor">
              <!-- Profession -->
              <span v-if="showProfession && review.profession" class="text-xs text-gray-500 dark:text-gray-400">
                {{ review.profession }}
              </span>
              
              <!-- Visit date -->
              <div v-if="review.visitDate" class="text-xs text-gray-500 dark:text-gray-400">
                <span class="font-medium">{{ t('reviews.visitDate') }}:</span> {{ formatDate(review.visitDate) }}
              </div>
            </div>
          </div>
        </div>
        
        <!-- Pagination -->
        <div v-if="showPagination && pagination.totalPages > 1" class="mt-6 flex justify-center">
          <Pagination
            :modelValue="Number(route.query.page || 1)"
            :total="pagination.total"
            :items-per-page="pagination.limit"
            :max-visible-buttons="5"
            @update:model-value="goToPage"
          />
        </div>
      </div>
    </div>
  </div>

  <!-- Avatar Modal -->
  <Teleport to="body">
    <div 
      v-if="showModal && selectedReview" 
      class="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4"
      @click.self="closeAvatarModal"
    >
      <div :class="[backgroundColor, 'rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-auto']">
        <div class="p-4 flex justify-between items-center border-b" :class="borderColor">
          <h3 class="text-lg font-medium" :class="textColor">
            {{ selectedReview.authorName }}
          </h3>
          <button 
            @click="closeAvatarModal"
            class="text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-400"
          >
            <i class="i-heroicons-x-mark w-6 h-6"></i>
          </button>
        </div>
        
        <div class="relative p-4">
          <swiper v-bind="swiperOptions" class="w-full">
            <swiper-slide>
              <div class="swiper-zoom-container flex items-center justify-center">
                <img 
                  v-if="selectedReview.authorAvatar" 
                  :src="selectedReview.authorAvatar" 
                  :alt="selectedReview.authorName" 
                  class="max-w-full max-h-[60vh] object-contain"
                />
                <div 
                  v-else 
                  class="w-40 h-40 rounded-full bg-primary-100 dark:bg-primary-800 flex items-center justify-center"
                >
                  <span class="text-5xl font-medium text-primary-600 dark:text-primary-300">
                    {{ selectedReview.authorName.charAt(0).toUpperCase() }}
                  </span>
                </div>
              </div>
            </swiper-slide>
            <div class="swiper-button-prev"></div>
            <div class="swiper-button-next"></div>
            <div class="swiper-pagination"></div>
          </swiper>
          
          <div class="mt-6">
            <div class="flex items-center mb-2">
              <div class="flex text-primary-300">
                <template v-for="(isFilled, index) in getStars(selectedReview.rating)" :key="`modal-star-${index}`">
                  <i v-if="isFilled" class="i-heroicons-star-solid"></i>
                  <i v-else class="i-heroicons-star text-gray-300 dark:text-gray-600"></i>
                </template>
              </div>
              <span class="ml-2 text-gray-500 dark:text-gray-400 text-sm">
                {{ selectedReview.rating }}/5
              </span>
            </div>
            
            <h4 v-if="selectedReview.translations?.[0]?.title" class="text-lg font-medium mb-2" :class="textColor">
              {{ selectedReview.translations[0].title }}
            </h4>
            
            <p :class="textColor === 'text-gray-900 dark:text-white' ? 'text-gray-600 dark:text-gray-300' : textColor">
              {{ selectedReview.translations?.[0]?.content || '' }}
            </p>
            
            <div v-if="selectedReview.profession" class="mt-4 pt-4 border-t" :class="borderColor">
              <span class="text-sm text-gray-500 dark:text-gray-400">
                {{ selectedReview.profession }}
              </span>
            </div>
            
            <div v-if="selectedReview.visitDate" class="mt-2 text-sm text-gray-500 dark:text-gray-400">
              <span class="font-medium">{{ t('reviews.visitDate') }}:</span> {{ formatDate(selectedReview.visitDate) }}
            </div>
            
            <div v-if="selectedReview.serviceType" class="mt-4">
              <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                {{ getServiceTypeName(selectedReview.serviceType) }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
/* Swiper styles */
:deep(.swiper-zoom-container) {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
}

:deep(.swiper-button-next),
:deep(.swiper-button-prev) {
  color: theme('colors.primary.600');
}

:deep(.swiper-pagination-bullet-active) {
  background-color: theme('colors.primary.600');
}

@media (prefers-color-scheme: dark) {
  :deep(.swiper-button-next),
  :deep(.swiper-button-prev) {
    color: theme('colors.primary.400');
  }

  :deep(.swiper-pagination-bullet-active) {
    background-color: theme('colors.primary.400');
  }
}
</style> 
