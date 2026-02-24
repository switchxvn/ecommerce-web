<!-- StyledNewsSection.vue -->
<script setup lang="ts">
import { ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useTrpc } from '~/composables/useTrpc';
import { useLocalization } from '~/composables/useLocalization';
import { Swiper, SwiperSlide } from 'swiper/vue';
import { Navigation, Pagination, Autoplay } from 'swiper/modules';
import { ArrowRight } from 'lucide-vue-next';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import PostCard from '~/components/ui/card/PostCard.vue';
import type { Post } from '@ew/shared';

interface PostTranslation {
  id: number;
  title: string;
  content: string;
  locale: string;
  slug: string;
  postId: number;
  createdAt: string;
  updatedAt: string;
}

interface Author {
  id: number;
  email: string;
  username: string;
  isEmailVerified: boolean;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
  profile?: {
    id: number;
    firstName: string | null;
    lastName: string | null;
    phoneNumber: string | null;
    phoneCode: string | null;
    address?: {
      city: string | null;
      state: string | null;
      street: string | null;
      country: string | null;
      zipCode: string | null;
    };
    createdAt: string;
    updatedAt: string;
  };
}

interface PaginatedResponse<T> {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  items: T[];
}

interface Props {
  section: {
    id: number;
    type: string;
    title: string;
    order: number;
    pageType: string;
    componentName?: string;
    settings: Record<string, any>;
    isActive: boolean;
  };
  config: {
    title: string;
    layout: 'grid' | 'slider';
    maxItems: number;
    showButton: boolean;
    buttonText: string;
    buttonStyle: 'solid' | 'outline' | 'soft' | 'ghost' | 'link';
    gap: string;
    slidesPerView: {
      desktop: number;
      tablet: number;
      mobile: number;
    };
    autoplay: boolean;
    interval: number;
    showDots: boolean;
    showArrows: boolean;
    displayMode: 'grid' | 'slider';
    fontSize: {
      title: string;
      description?: string;
    };
    useUppercase: boolean;
    colors: {
      title: string;
      description?: string;
    };
    alignment?: {
      header: string;
      content: string;
      container: string;
    };
    postIds?: number[];
    categoryIds?: number[];
  };
}

const props = withDefaults(defineProps<Props>(), {
  section: () => ({
    id: 0,
    type: '',
    title: '',
    order: 0,
    pageType: '',
    settings: {},
    isActive: true
  }),
  config: () => ({
    title: 'Tin tức mới nhất',
    layout: 'grid',
    maxItems: 8,
    showButton: true,
    buttonText: 'Xem tất cả',
    buttonStyle: 'solid',
    gap: '1rem',
    slidesPerView: {
      desktop: 4,
      tablet: 2,
      mobile: 1
    },
    autoplay: true,
    interval: 5000,
    showDots: true,
    showArrows: true,
    displayMode: 'grid',
    fontSize: {
      title: 'text-2xl',
      description: 'text-base'
    },
    useUppercase: true,
    colors: {
      title: 'text-gray-900 dark:text-white',
      description: 'text-gray-600 dark:text-gray-400'
    },
    alignment: {
      header: 'justify-between',
      content: 'text-left',
      container: 'items-start'
    }
  })
});

const { t } = useI18n();
const { t: localT, locale } = useLocalization();
const trpc = useTrpc();

const isLoading = ref(false);
const error = ref<string | null>(null);
const latestPosts = ref<Post[]>([]);

// Tạo ID duy nhất cho mỗi section
const sectionId = computed(() => `news-section-${props.section.id}`);

const swiperOptions = computed(() => ({
  modules: [Navigation, Pagination, Autoplay],
  slidesPerView: 1,
  spaceBetween: 24,
  navigation: {
    nextEl: `.${sectionId.value}-next`,
    prevEl: `.${sectionId.value}-prev`,
  },
  pagination: {
    el: `.${sectionId.value}-pagination`,
    clickable: true,
  },
  breakpoints: {
    640: {
      slidesPerView: props.config?.slidesPerView?.mobile || 1,
    },
    1024: {
      slidesPerView: props.config?.slidesPerView?.tablet || 2,
    },
    1280: {
      slidesPerView: props.config?.slidesPerView?.desktop || 4,
    },
  },
}));

// Fetch latest posts
async function fetchLatestPosts() {
  isLoading.value = true;
  error.value = null;
  try {
    let result;
    
    // Ưu tiên lấy theo postIds hoặc categoryIds nếu có
    if (props.config.postIds?.length || props.config.categoryIds?.length) {
      result = await trpc.post.byIdsAndCategories.query({
        postIds: props.config.postIds,
        categoryIds: props.config.categoryIds,
        locale: locale.value,
        limit: props.config.maxItems
      });
    } else {
      // Nếu không có, lấy bài viết mới nhất
      result = await trpc.post.byLocale.query({ locale: locale.value });
    }
    
    // Kiểm tra và xử lý response
    if (!result) {
      latestPosts.value = [];
      return;
    }

    // Kiểm tra cấu trúc response mới (PaginatedResponse)
    if ('items' in result && Array.isArray(result.items)) {
      latestPosts.value = result.items.slice(0, props.config.maxItems) as Post[];
    } 
    // Kiểm tra cấu trúc response cũ (Array)
    else if (Array.isArray(result)) {
      latestPosts.value = result.slice(0, props.config.maxItems) as Post[];
    } else {
      console.error('Unexpected response format:', result);
      latestPosts.value = [];
    }
  } catch (err: any) {
    console.error("Failed to fetch latest posts:", err);
    error.value = err.message || localT('errors.failed_to_load_posts');
    latestPosts.value = [];
  } finally {
    isLoading.value = false;
  }
}

// Fetch posts on mount
fetchLatestPosts();

// Watch for locale changes
watch(locale, () => {
  fetchLatestPosts();
});
</script>

<template>
  <section class="latest-posts-section py-12">
    <div class="container mx-auto px-4">
      <!-- Section Header -->
      <div class="mb-8 bg-primary-600 dark:bg-primary-500 rounded-lg">
        <div class="container mx-auto px-4">
          <div class="flex items-center justify-between gap-4 py-3">
            <div class="w-32 hidden sm:block"><!-- Spacer to help with centering --></div>
            <div class="category-header flex-1 text-center">
              <h2 
                class="inline-flex items-center px-4 py-2 mobile-title"
                :class="[
                  'text-2xl sm:text-3xl',
                  'font-bold text-white',
                  config.useUppercase ? 'uppercase' : ''
                ]"
              >
                {{ config.title }}
              </h2>
            </div>
            <div class="w-32 flex justify-end">
              <NuxtLink
                to="/bai-viet"
                class="mobile-view-all inline-flex items-center justify-center px-4 py-2 text-xs sm:text-lg font-semibold uppercase tracking-wider text-white hover:text-primary-100 transition-colors duration-200 whitespace-nowrap"
              >
                {{ t("news.viewAll") }}
                <ArrowRight class="ml-1 h-3 w-3 sm:h-5 sm:w-5" aria-hidden="true" />
              </NuxtLink>
            </div>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="isLoading" class="flex justify-center items-center py-12">
        <Loader size="lg" />
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="text-center text-red-500 py-8">
        {{ error }}
      </div>

      <!-- No Posts State -->
      <div v-else-if="latestPosts.length === 0" class="text-center py-8">
        {{ t("news.no_posts") }}
      </div>

      <!-- Posts Display -->
      <template v-else>
        <!-- Grid Layout -->
        <div v-if="config.displayMode === 'grid'"
             class="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
             :class="[`gap-${config.gap || '6'}`]">
          <template v-for="(post, index) in latestPosts" :key="post.id">
            <PostCard v-if="index < (config.maxItems || 8)"
                     :post="post"
                     class="w-full" />
          </template>
        </div>

        <!-- Slider Layout -->
        <div v-else class="swiper-outer-container">
          <div class="swiper-container">
            <Swiper v-bind="swiperOptions" class="news-posts-swiper">
              <SwiperSlide v-for="post in latestPosts" 
                          :key="post.id"
                          class="!h-auto">
                <PostCard :post="post" />
              </SwiperSlide>
            </Swiper>
          </div>

          <!-- Navigation -->
          <div :class="[`${sectionId}-prev`, 'swiper-button-prev', '!z-10']"></div>
          <div :class="[`${sectionId}-next`, 'swiper-button-next', '!z-10']"></div>
          
          <!-- Pagination -->
          <div class="flex justify-center w-full">
            <div :class="[`${sectionId}-pagination`, 'mt-6', 'flex justify-center']"></div>
          </div>
        </div>
      </template>
    </div>
  </section>
</template>

<style lang="scss" scoped>
.latest-posts-section {
  @media (max-width: 640px) {
    overflow-x: hidden;
  }

  .category-header {
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

  .mobile-view-all {
    @media (max-width: 640px) {
      font-size: 0.75rem !important;
      line-height: 1rem !important;
      padding: 0.25rem 0.75rem !important;
      font-weight: 500 !important;
      letter-spacing: 0.025em !important;
    }
  }

  .swiper-outer-container {
    position: relative;
    width: 100%;
    overflow: visible;
    
    @media (max-width: 640px) {
      padding: 0;
    }

  }

  .swiper-container {
    overflow: hidden;
    position: relative;
    width: 100%;
    padding: 0 16px;

    @media (min-width: 641px) {
      padding: 0;
    }
  }

  :deep() {
    .news-posts-swiper {
      .swiper-wrapper {
        display: flex;
        align-items: stretch;
      }

      .swiper-slide {
        height: auto;
        display: flex;
        width: 100%;
      }
    }

    .swiper-button-next,
    .swiper-button-prev {
      position: absolute;
      top: 50%;
      transform: translateY(-50%);
      width: 40px;
      height: 40px;
      margin-top: -20px;
      background: white;
      border-radius: 50%;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      cursor: pointer;
      z-index: 10;
      
      // Hiển thị navigation trên cả màn hình và đảm bảo nằm trong container
      @media (max-width: 640px) {
        width: 30px;
        height: 30px;
        margin-top: -15px;
      }
      
      // Đặt vị trí nút prev và next để nằm gọn trong container
      &.swiper-button-prev {
        left: 20px;
        
        @media (max-width: 640px) {
          left: 16px;
        }
      }
      
      &.swiper-button-next {
        right: 20px;
        
        @media (max-width: 640px) {
          right: 16px;
        }
      }
      
      &::after {
        font-size: 1.2rem;
        font-weight: bold;
        color: var(--primary);
        
        @media (max-width: 640px) {
          font-size: 0.9rem;
        }
      }
      
      &:hover {
        background-color: var(--primary);
        &::after {
          color: white;
        }
      }
      
      &.swiper-button-disabled {
        opacity: 0.5;
        cursor: not-allowed;
        
        &:hover {
          background-color: white;
          &::after {
            color: var(--primary);
          }
        }
      }
    }

    .swiper-pagination {
      position: relative;
      bottom: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      margin-top: 1rem;
      width: 100%;
      
      .swiper-pagination-bullet {
        width: 8px;
        height: 8px;
        margin: 0;
        background-color: rgb(var(--gray-400));
        opacity: 1;
        transition: all 0.3s ease;
        
        &-active {
          transform: scale(1.2);
          background-color: rgb(var(--primary-500));
        }
      }
    }
  }
}
</style> 