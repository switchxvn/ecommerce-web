<script setup lang="ts">
import { useAsyncData } from 'nuxt/app';
import { useRouter } from 'vue-router';
import { useLocalization } from '../composables/useLocalization';
import { useTrpc } from '../composables/useTrpc';
import { computed, ref, watch } from '../composables/useVueComposables';
import type { ReviewStatus } from '@ew/shared';
// Import Swiper components
import { Swiper, SwiperSlide } from 'swiper/vue';
import { Navigation, Pagination, Zoom } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import 'swiper/css/zoom';

interface ReviewTranslation {
  locale: string;
  title?: string;
  content: string;
}

interface ReviewServiceType {
  id: number;
  slug: string;
  translations: {
    locale: string;
    name: string;
  }[];
}

interface Review {
  id: number;
  authorName: string;
  authorAvatar?: string;
  profession?: string;
  rating: number;
  serviceTypeId?: number;
  serviceType?: ReviewServiceType;
  status: ReviewStatus;
  translations: ReviewTranslation[];
}

// Interface for multi-language text props
interface MultiLangText {
  [key: string]: string;
}

// Type for props that can be either string or multi-language object
type TextOrMultiLang = string | MultiLangText;

// Config object from theme section
interface SectionConfig {
  limit?: number;
  sectionTitle?: TextOrMultiLang;
  sectionDescription?: TextOrMultiLang;
  backgroundColor?: string;
  textColor?: string;
  buttonText?: TextOrMultiLang;
  buttonColor?: string;
  [key: string]: any;
}

const props = withDefaults(defineProps<{
  // Trực tiếp từ component props
  limit?: number;
  sectionTitle?: TextOrMultiLang;
  sectionDescription?: TextOrMultiLang;
  backgroundColor?: string;
  textColor?: string;
  buttonText?: TextOrMultiLang;
  buttonColor?: string;
  
  // Từ theme section
  section?: any;
  config?: SectionConfig;
}>(), {
  limit: 6,
  sectionTitle: '',
  sectionDescription: '',
  backgroundColor: 'bg-white dark:bg-gray-900',
  textColor: 'text-gray-900 dark:text-white',
  buttonText: '',
  buttonColor: 'bg-primary-600 hover:bg-primary-700 text-white',
});

const trpc = useTrpc();
const router = useRouter();
const { t, locale } = useLocalization();

// Create computed for current locale
const currentLocale = computed(() => {
  return typeof locale === 'object' && 'value' in locale ? locale.value : 'en';
});

// Get effective props, prioritizing direct props over config
const effectiveProps = computed(() => {
  return {
    limit: props.limit || props.config?.limit || 6,
    sectionTitle: props.sectionTitle || props.config?.sectionTitle || '',
    sectionDescription: props.sectionDescription || props.config?.sectionDescription || '',
    backgroundColor: props.backgroundColor || props.config?.backgroundColor || 'bg-white dark:bg-gray-900',
    textColor: props.textColor || props.config?.textColor || 'text-gray-900 dark:text-white',
    buttonText: props.buttonText || props.config?.buttonText || '',
    buttonColor: props.buttonColor || props.config?.buttonColor || 'bg-primary-600 hover:bg-primary-700 text-white',
  };
});

const reviews = ref<Review[]>([]);
const isLoading = ref(true);
const averageRating = ref<string>('0.0');
const totalReviews = ref<number>(0);

// Selected review for modal
const selectedReview = ref<Review | null>(null);
const showModal = ref(false);
const expandedContents = ref<Record<number, boolean>>({});

// Swiper options
const swiperOptions = {
  modules: [Navigation, Pagination, Zoom],
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

// Get featured reviews
const { data: featuredReviews, pending } = useAsyncData(
  'featured-reviews',
  () => trpc.review.featured.query({ 
    limit: effectiveProps.value.limit,
    locale: currentLocale.value 
  }),
  {
    watch: [currentLocale, effectiveProps],
    transform: (data) => {
      reviews.value = data as Review[];
      isLoading.value = false;
      return data;
    }
  }
);

// Get average rating
useAsyncData(
  'reviews-stats',
  () => trpc.review.getAverageRating.query({}),
  {
    watch: [currentLocale],
    transform: (data: any) => {
      if (data) {
        averageRating.value = data.averageRating;
        totalReviews.value = data.totalReviews;
      }
      return data;
    }
  }
);

// Get stars array
const getStars = (rating: number) => {
  return Array.from({ length: 5 }, (_, i) => i < rating);
};

// Handle view all reviews click
const viewAllReviews = () => {
  router.push('/reviews');
};

// Calculate if any reviews exist
const hasReviews = computed(() => reviews.value?.length > 0);

// Helper function to get localized text from props
const getLocalizedText = (text: TextOrMultiLang, fallbackKey: string): string => {
  // Trường hợp text là object
  if (text && typeof text === 'object') {
    // Thử lấy theo locale hiện tại
    const localizedText = text[currentLocale.value];
    if (localizedText) {
      return localizedText;
    }
    
    // Fallback sang tiếng Anh
    if (text['en']) {
      return text['en'];
    }
    
    // Lấy giá trị đầu tiên nếu không có locale phù hợp
    const firstKey = Object.keys(text)[0];
    if (firstKey) {
      return text[firstKey];
    }
  }
  
  // Trường hợp text là string
  if (typeof text === 'string' && text.trim()) {
    return text;
  }
  
  // Fallback to translation
  return t(fallbackKey);
};

// Get formatted section title 
const formattedTitle = computed(() => {
  const title = getLocalizedText(effectiveProps.value.sectionTitle, 'reviews.featuredReviewsTitle');
  return title;
});

// Get formatted section description
const formattedDescription = computed(() => {
  const desc = getLocalizedText(effectiveProps.value.sectionDescription, 'reviews.featuredReviewsDescription');
  return desc;
});

// Get formatted button text
const formattedButtonText = computed(() => {
  const btnText = getLocalizedText(effectiveProps.value.buttonText, 'reviews.viewAllReviews');
  return btnText;
});

// Helper function to get service type name based on locale
const getServiceTypeName = (serviceType?: ReviewServiceType) => {
  if (!serviceType) return '';
  const translation = serviceType.translations.find(t => t.locale === currentLocale.value);
  return translation?.name || serviceType.translations[0]?.name || '';
};

// Open avatar modal
const openAvatarModal = (review: Review) => {
  selectedReview.value = review;
  showModal.value = true;
  document.body.classList.add('overflow-hidden');
};

// Close avatar modal
const closeAvatarModal = () => {
  showModal.value = false;
  document.body.classList.remove('overflow-hidden');
};

// Toggle content expansion
const toggleContent = (reviewId: number) => {
  expandedContents.value[reviewId] = !expandedContents.value[reviewId];
};

// Check if content is expanded
const isContentExpanded = (reviewId: number) => {
  return !!expandedContents.value[reviewId];
};

// Check if content needs "Read more" button
const contentNeedsExpansion = (content?: string) => {
  return content && content.length > 150;
};
</script>

<template>
  <section :class="effectiveProps.backgroundColor" class="py-12 sm:py-16">
    <div class="container mx-auto px-4">
      <!-- Section header -->
      <div class="text-center max-w-3xl mx-auto mb-10">
        <h2 :class="effectiveProps.textColor" class="text-3xl md:text-4xl font-bold mb-4 uppercase tracking-wider border-b-4 border-primary-500 pb-3 inline-block">
          {{ formattedTitle }}
        </h2>
        <p class="text-primary-500 dark:text-primary-400 text-lg font-medium">
          {{ formattedDescription }}
        </p>
        
        <!-- Rating summary -->
        <div v-if="totalReviews > 0" class="flex flex-col sm:flex-row items-center justify-center mt-6 bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 py-4 sm:py-5 px-4 sm:px-6 lg:px-8 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 mx-auto w-full max-w-[95vw] sm:max-w-md lg:max-w-lg">
          <div class="flex space-x-1 sm:space-x-2 mb-2 sm:mb-0 sm:mr-4 lg:mr-6">
            <svg v-for="i in 5" :key="i" xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8" viewBox="0 0 20 20" fill="currentColor">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" class="text-amber-400" />
            </svg>
          </div>
          
          <span class="font-bold text-3xl sm:text-4xl text-rose-500 dark:text-rose-400 leading-none mb-1 sm:mb-0 sm:mr-3 lg:mr-4">
            {{ averageRating }}
          </span>
          
          <div class="flex flex-col text-center sm:text-left">
            <div class="text-sm sm:text-base font-medium text-gray-700 dark:text-gray-300">
              · {{ totalReviews }} đánh giá
            </div>
          </div>
        </div>
        
        <!-- Nút đánh giá mới (tách rời) -->
        <div class="text-center mt-4">
          <UButton
            size="md"
            :to="'/reviews?page=1#review-form'"
            variant="solid"
            class="bg-primary-500 hover:bg-primary-600 text-white shadow-md"
          >
            {{ t('reviews.writeReview') }}
          </UButton>
        </div>
      </div>
      
      <!-- Loading state -->
      <div v-if="isLoading" class="flex justify-center py-10">
        <Loader size="lg" />
      </div>
      
      <!-- Reviews grid -->
      <div v-else-if="hasReviews" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div 
          v-for="review in reviews" 
          :key="review.id"
          class="bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700 rounded-lg p-4 flex flex-col h-full"
        >
          <!-- Author info -->
          <div class="flex items-start">
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
            
            <div class="flex-1 min-w-0">
              <h3 class="text-base font-medium text-gray-900 dark:text-white truncate">
                {{ review.authorName }}
              </h3>
              <div class="flex items-center mt-1">
                <div class="flex text-primary-300">
                  <template v-for="(isFilled, index) in getStars(review.rating)" :key="`star-${index}`">
                    <i v-if="isFilled" class="i-heroicons-star-solid text-sm"></i>
                    <i v-else class="i-heroicons-star text-sm text-gray-300 dark:text-gray-600"></i>
                  </template>
                </div>
              </div>
            </div>
            
            <!-- Service type badge -->
            <div v-if="review.serviceType" class="ml-2 flex-shrink-0">
              <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                {{ getServiceTypeName(review.serviceType) }}
              </span>
            </div>
          </div>
          
          <!-- Review content -->
          <div class="mt-3 flex-grow">
            <h4 v-if="review.translations[0]?.title" class="font-medium text-gray-900 dark:text-white text-sm mb-1">
              {{ review.translations[0].title }}
            </h4>
            <div class="text-gray-600 dark:text-gray-300 text-sm">
              <p :class="{ 'line-clamp-3': !isContentExpanded(review.id) && contentNeedsExpansion(review.translations[0]?.content) }">
                {{ review.translations[0]?.content }}
              </p>
              <button 
                v-if="contentNeedsExpansion(review.translations[0]?.content)" 
                @click="toggleContent(review.id)"
                class="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 text-xs font-medium mt-1"
              >
                {{ isContentExpanded(review.id) ? t('common.readLess') : t('common.readMore') }}
              </button>
            </div>
          </div>
          
          <!-- Footer -->
          <div v-if="review.profession" class="mt-3 pt-2 border-t border-gray-100 dark:border-gray-700">
            <span class="text-xs text-gray-500 dark:text-gray-400">
              {{ review.profession }}
            </span>
          </div>
        </div>
      </div>
      
      <!-- Empty state -->
      <div v-else class="text-center py-10 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <i class="i-heroicons-chat-bubble-bottom-center-text text-4xl text-gray-400 dark:text-gray-500 mb-3"></i>
        <p class="text-gray-600 dark:text-gray-400 mb-4">
          {{ t('reviews.noFeaturedReviews') }}
        </p>
      </div>
      
      <!-- View all button -->
      <div v-if="hasReviews && formattedButtonText" class="text-center mt-10">
        <UButton
          :class="effectiveProps.buttonColor"
          @click="viewAllReviews"
          size="lg"
          variant="solid"
        >
          {{ formattedButtonText }}
        </UButton>
      </div>
    </div>

    <!-- Avatar Modal -->
    <Teleport to="body">
      <div 
        v-if="showModal && selectedReview" 
        class="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4"
        @click.self="closeAvatarModal"
      >
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-auto">
          <div class="p-4 flex justify-between items-center border-b border-gray-200 dark:border-gray-700">
            <h3 class="text-lg font-medium text-gray-900 dark:text-white">
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
              
              <h4 v-if="selectedReview.translations[0]?.title" class="text-lg font-medium text-gray-900 dark:text-white mb-2">
                {{ selectedReview.translations[0].title }}
              </h4>
              
              <p class="text-gray-600 dark:text-gray-300">
                {{ selectedReview.translations[0]?.content }}
              </p>
              
              <div v-if="selectedReview.profession" class="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                <span class="text-sm text-gray-500 dark:text-gray-400">
                  {{ selectedReview.profession }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </section>
</template>

<style scoped>
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