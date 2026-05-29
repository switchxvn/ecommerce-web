<script setup lang="ts">
import { useHead } from '#imports';
import { useAsyncData } from 'nuxt/app';
import type { Component } from 'vue';
import { useRoute } from 'vue-router';
import { useLocalization } from '../composables/useLocalization';
import { useReviews } from '../composables/useReviews';
import { useTrpc } from '../composables/useTrpc';
import { computed, onMounted, ref } from 'vue';
import { PageType } from '@ew/shared';

// Import các component section
import ReviewFormSection from '../components/sections/ReviewFormSection.vue';
import ReviewGallerySection from '../components/sections/ReviewGallerySection.vue';
import ReviewHeroSection from '../components/sections/ReviewHeroSection.vue';
import ReviewListSection from '../components/sections/ReviewListSection.vue';
import ReviewStatisticsSection from '../components/sections/ReviewStatisticsSection.vue';
import Loader from '../components/ui/Loader.vue';

// Define section type
type SectionType = 'review_hero' | 'review_statistics' | 'review_list' | 'review_form' | 'review_gallery';

// Define section interface
interface ThemeSection {
  id: number;
  type: SectionType;
  componentName: string;
  title: string;
  order: number;
  isActive: boolean;
  settings: Record<string, any>;
}

// Define component map type
type ComponentMap = {
  [K in SectionType]: Component;
}

const route = useRoute();
const trpc = useTrpc();
const { t, locale } = useLocalization();

// Khởi tạo dữ liệu từ useReviews
const {
  seoData,
  setupInitialData,
  isLoading: reviewsLoading
} = useReviews();

// Theo dõi trạng thái khởi tạo
const isLoading = ref(true);
const hasError = ref(false);
const errorMessage = ref('');
const themeSections = ref<ThemeSection[]>([]);

// Fetch theme sections from API
const fetchThemeSections = async () => {
  try {
    // Gọi API với pageType được hỗ trợ
    const result = await trpc.theme.getActiveTheme.query();
    
    // Extract sections from various possible response formats
    let extractedSections = [];
    
    if (result?.sections) {
      extractedSections = result.sections;
    } else if (result?.data?.sections) {
      extractedSections = result.data.sections;
    } else if (result?.result?.sections) {
      extractedSections = result.result.sections;
    } else if (result?.result?.data?.sections) {
      extractedSections = result.result.data.sections;
    }
    
    if (Array.isArray(extractedSections) && extractedSections.length > 0) {
      // Lọc chỉ giữ lại các sections phù hợp với trang reviews
      const reviewSections = extractedSections.filter(section => 
        section.type.startsWith('review_') || 
        section.pageType === 'reviews_page'
      );
      
      if (reviewSections.length > 0) {
        themeSections.value = reviewSections;
        return true;
      } else {
        themeSections.value = defaultSections;
        return false;
      }
    } else {
      themeSections.value = defaultSections;
      return false;
    }
  } catch (error) {
    console.error('[Theme API] Error fetching theme sections:', error);
    themeSections.value = defaultSections;
    return false;
  }
};

// Fetch SEO data
useAsyncData('reviews-seo', async () => {
  return useTrpc().seo.getSeoByPath.query('/reviews');
}, {
  server: true,
  lazy: false
});

// Set page meta
useHead({
  title: t('reviews.title'),
  meta: [
    { name: 'title', content: t('reviews.title') },
    { property: 'og:title', content: t('reviews.title') },
    { name: 'description', content: t('reviews.description') },
    { property: 'og:description', content: t('reviews.description') }
  ]
});

// Tạo mảng sections mặc định thay vì gọi API
const defaultSections: ThemeSection[] = [
  {
    id: 1,
    type: 'review_hero',
    componentName: 'ReviewHeroSection',
    title: 'Review Hero Section',
    order: 1,
    isActive: true,
    settings: {
      title: 'Đánh giá khách hàng',
      description: 'Xem những đánh giá chân thực từ khách hàng của chúng tôi',
      backgroundImage: '',
      backgroundColor: 'bg-primary-50',
      textColor: 'text-gray-900',
      textAlignment: 'center',
      paddingTop: 'py-8 sm:py-16',
      paddingBottom: 'pb-0'
    }
  },
  {
    id: 2,
    type: 'review_statistics',
    componentName: 'ReviewStatisticsSection',
    title: 'Review Statistics Section',
    order: 2,
    isActive: true,
    settings: {
      title: 'Thống kê đánh giá',
      backgroundColor: 'bg-white',
      textColor: 'text-gray-900',
      borderColor: 'border-gray-200',
      shadowLevel: 'shadow-sm',
      padding: 'p-6',
      marginTop: 'mt-0',
      marginBottom: 'mb-0'
    }
  },
  {
    id: 3,
    type: 'review_list',
    componentName: 'ReviewListSection',
    title: 'Review List Section',
    order: 3,
    isActive: true,
    settings: {
      title: 'Danh sách đánh giá',
      backgroundColor: 'bg-white',
      textColor: 'text-gray-900',
      borderColor: 'border-gray-200',
      shadowLevel: 'shadow-sm',
      padding: 'p-4',
      gridColumns: {
        mobile: 1,
        tablet: 2,
        desktop: 3
      },
      showRating: true,
      showDate: true,
      showServiceType: true,
      showProfession: true,
      showPagination: true
    }
  },
  {
    id: 4,
    type: 'review_gallery',
    componentName: 'ReviewGallerySection',
    title: 'Review Gallery Section',
    order: 4,
    isActive: true,
    settings: {
      title: 'KHÁCH HÀNG CHECKIN',
      description: 'Hình ảnh khách hàng tại cửa hàng của chúng tôi',
      backgroundColor: 'bg-gray-50 dark:bg-gray-800',
      textColor: 'text-gray-900 dark:text-white',
      titleColor: 'text-primary-600 dark:text-primary-400',
      borderColor: 'border-gray-200 dark:border-gray-700',
      paddingY: 'py-16',
      useSlider: true,
      sliderPerView: 3,
      sliderAutoplay: true,
      sliderDelay: 3000,
      maxGalleries: 1000,
      columns: 4,
      categoryIds: [], // Không hardcode categoryIds, để truy vấn tất cả gallery từ API
      showTitle: true
    }
  },
  {
    id: 5,
    type: 'review_form',
    componentName: 'ReviewFormSection',
    title: 'Review Form Section',
    order: 5,
    isActive: true,
    settings: {
      title: 'Gửi đánh giá của bạn',
      description: 'Chia sẻ trải nghiệm của bạn với chúng tôi',
      backgroundColor: 'bg-white',
      textColor: 'text-gray-900',
      borderColor: 'border-gray-200',
      shadowLevel: 'shadow-sm',
      padding: 'p-6',
      marginTop: 'mt-8',
      marginBottom: 'mb-16',
      formFields: {
        showServiceType: true,
        showProfession: true,
        showVisitDate: true
      }
    }
  }
];

// Sắp xếp các section theo order
const sortedSections = computed<ThemeSection[]>(() => {
  return [...themeSections.value].sort((a, b) => a.order - b.order);
});

// Load initial data
onMounted(async () => {
  isLoading.value = true;
  hasError.value = false;
  
  try {
    // Fetch theme sections first
    await fetchThemeSections();
    
    // Then load review data
    await setupInitialData();
  } catch (error) {
    hasError.value = true;
    errorMessage.value = error instanceof Error ? error.message : 'Failed to load review data';
  } finally {
    isLoading.value = false;
  }
});

// Map component types to Vue components
const componentMap: ComponentMap = {
  'review_hero': ReviewHeroSection,
  'review_statistics': ReviewStatisticsSection,
  'review_list': ReviewListSection,
  'review_form': ReviewFormSection,
  'review_gallery': ReviewGallerySection
};
</script>

<template>
  <div class="bg-white dark:bg-gray-900">
    <!-- Loading state -->
    <div v-if="isLoading" class="container mx-auto space-y-10 px-4 py-16">
      <HeroSkeleton overlay-card />
      <CardGridSkeleton :item-count="3" :columns="3" />
      <GallerySkeleton :item-count="6" :columns="3" />
    </div>
    
    <!-- Error state -->
    <div v-else-if="hasError" class="container mx-auto px-4 py-20">
      <div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 text-center">
        <i class="i-heroicons-exclamation-triangle text-4xl text-red-500 dark:text-red-400 mb-3"></i>
        <h2 class="text-xl font-medium text-red-800 dark:text-red-300 mb-2">{{ t('common.errorOccurred') }}</h2>
        <p class="text-red-600 dark:text-red-400 mb-4">{{ errorMessage || t('reviews.loadError') }}</p>
        <button 
          @click="() => { isLoading = true; hasError = false; setupInitialData().catch(error => { hasError = true; errorMessage = error instanceof Error ? error.message : 'Failed to load review data'; }).finally(() => { isLoading = false; }) }" 
          class="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors"
        >
          {{ t('common.retry') }}
        </button>
      </div>
    </div>

    <!-- Content when loaded successfully -->
    <template v-else>
      <!-- Render sections -->
      <template v-for="section in sortedSections" :key="section.id">
        <component
          v-if="section.isActive && section.type in componentMap"
          :is="componentMap[section.type]"
          :section="section"
        />
      </template>
    </template>
  </div>
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
