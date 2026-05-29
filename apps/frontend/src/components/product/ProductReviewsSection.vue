<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue';
import { MessageSquareQuote, PencilLine, Star } from 'lucide-vue-next';
import { useLocalization } from '~/composables/useLocalization';
import ProductReviewForm from './ProductReviewForm.vue';

interface ReviewTranslation {
  locale: string;
  title?: string;
  content: string;
}

interface ProductReview {
  id: number;
  authorName: string;
  profession?: string;
  rating: number;
  createdAt?: string;
  translations: ReviewTranslation[];
}

const props = defineProps<{
  productId: number;
  reviews: ProductReview[];
  locale?: string;
  averageRating?: number | null;
  totalReviews?: number | null;
}>();

const { t } = useLocalization();
const tr = (key: string, fallback: string) => t(key) || fallback;
const formRef = ref<InstanceType<typeof ProductReviewForm> | null>(null);
const formContainerRef = ref<HTMLElement | null>(null);
const isFormOpen = ref(props.reviews.length === 0);
const submitSuccess = ref(false);
const submitError = ref(false);

watch(
  () => props.reviews.length,
  (count) => {
    if (count === 0) {
      isFormOpen.value = true;
    }
  },
);

const visibleReviews = computed(() => props.reviews.slice(0, 3));
const normalizedTotalReviews = computed(() => props.totalReviews ?? props.reviews.length);
const normalizedAverageRating = computed(() => {
  if (typeof props.averageRating === 'number' && Number.isFinite(props.averageRating)) {
    return props.averageRating;
  }

  if (props.reviews.length === 0) return 0;

  const average = props.reviews.reduce((sum, review) => sum + review.rating, 0) / props.reviews.length;
  return Number(average.toFixed(1));
});

const resolveTranslation = (review: ProductReview) =>
  review.translations.find((translation) => translation.locale === props.locale) ||
  review.translations[0];

const formatDate = (date?: string) => {
  if (!date) return '';

  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return '';

  return new Intl.DateTimeFormat(props.locale === 'en' ? 'en-US' : 'vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(parsed);
};

const renderStars = (rating: number) =>
  Array.from({ length: 5 }, (_, index) => index < Math.round(rating));

const openForm = async () => {
  submitSuccess.value = false;
  submitError.value = false;
  isFormOpen.value = true;
  await nextTick();
  if (typeof formContainerRef.value?.scrollIntoView === 'function') {
    formContainerRef.value.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  if (typeof formRef.value?.focusFirstField === 'function') {
    formRef.value.focusFirstField();
  }
};

const handleSubmitSuccess = () => {
  submitSuccess.value = true;
  submitError.value = false;
  isFormOpen.value = false;
};

const handleSubmitError = () => {
  submitError.value = true;
  submitSuccess.value = false;
};
</script>

<template>
  <section class="rounded-[2rem] border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800 md:p-8">
    <div class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-start">
      <div>
        <p class="text-sm font-semibold uppercase tracking-[0.2em] text-primary-600 dark:text-primary-400">
          Customer Voice
        </p>
        <h2 class="mt-2 text-2xl font-bold text-gray-900 dark:text-white">
          {{ tr('reviews.title', 'Đánh giá') }}
        </h2>
        <p class="mt-3 max-w-2xl text-sm leading-6 text-gray-600 dark:text-gray-300">
          Phản hồi thực tế từ khách hàng đã sử dụng sản phẩm để bạn tham khảo trước khi chốt cấu hình phù hợp.
        </p>
      </div>

      <div class="rounded-3xl bg-gray-50 p-5 dark:bg-gray-900/60">
        <div class="flex items-end gap-3">
          <span class="text-4xl font-bold leading-none text-gray-900 dark:text-white">
            {{ normalizedAverageRating.toFixed(1) }}
          </span>
          <span class="pb-1 text-sm text-gray-500 dark:text-gray-400">
            / 5
          </span>
        </div>

        <div class="mt-3 flex items-center gap-1">
          <Star
            v-for="(filled, index) in renderStars(normalizedAverageRating)"
            :key="`summary-star-${index}`"
            class="h-4 w-4"
            :class="filled ? 'fill-amber-400 text-amber-400' : 'fill-transparent text-gray-300 dark:text-gray-600'"
          />
        </div>

        <p class="mt-3 text-sm text-gray-600 dark:text-gray-300">
          {{ tr('reviews.basedOn', 'Dựa trên') }} <strong>{{ normalizedTotalReviews }}</strong> {{ tr('reviews.reviews', 'đánh giá') }}
        </p>

        <UButton
          class="mt-5 w-full justify-center"
          color="primary"
          @click="openForm"
        >
          <template #leading>
            <PencilLine class="h-4 w-4" />
          </template>
          {{ tr('reviews.writeReview', 'Viết đánh giá') }}
        </UButton>
      </div>
    </div>

    <div class="mt-8">
      <div v-if="visibleReviews.length > 0" class="grid gap-4 md:grid-cols-3">
        <article
          v-for="review in visibleReviews"
          :key="review.id"
          data-testid="product-review-card"
          class="flex h-full flex-col rounded-3xl border border-gray-200 bg-gray-50 p-5 transition-colors dark:border-gray-700 dark:bg-gray-900/60"
        >
          <div class="flex items-start justify-between gap-4">
            <div>
              <h3 class="text-base font-semibold text-gray-900 dark:text-white">
                {{ review.authorName }}
              </h3>
              <p v-if="review.profession" class="mt-1 text-xs text-gray-500 dark:text-gray-400">
                {{ review.profession }}
              </p>
              <p v-if="formatDate(review.createdAt)" class="mt-1 text-xs text-gray-500 dark:text-gray-400">
                {{ formatDate(review.createdAt) }}
              </p>
            </div>

            <div class="flex items-center gap-1">
              <Star
                v-for="(filled, index) in renderStars(review.rating)"
                :key="`${review.id}-star-${index}`"
                class="h-4 w-4"
                :class="filled ? 'fill-amber-400 text-amber-400' : 'fill-transparent text-gray-300 dark:text-gray-600'"
              />
            </div>
          </div>

          <h4
            v-if="resolveTranslation(review)?.title"
            class="mt-4 text-sm font-semibold text-gray-900 dark:text-white"
          >
            {{ resolveTranslation(review)?.title }}
          </h4>

          <p class="mt-2 text-sm leading-6 text-gray-600 dark:text-gray-300">
            {{ resolveTranslation(review)?.content }}
          </p>
        </article>
      </div>

      <div
        v-else
        class="rounded-3xl border border-dashed border-gray-300 bg-gray-50 px-6 py-10 text-center dark:border-gray-700 dark:bg-gray-900/40"
        >
        <MessageSquareQuote class="mx-auto h-10 w-10 text-gray-400" />
        <h3 class="mt-4 text-lg font-semibold text-gray-900 dark:text-white">
          {{ tr('reviews.noReviews', 'Không tìm thấy đánh giá nào') }}
        </h3>
        <p class="mt-2 text-sm text-gray-600 dark:text-gray-300">
          Hãy là người đầu tiên chia sẻ trải nghiệm thực tế với sản phẩm này.
        </p>
      </div>
    </div>

    <div ref="formContainerRef" class="mt-8 rounded-[1.75rem] border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900/30 md:p-8">
      <div class="flex items-start justify-between gap-4">
        <div>
          <p class="text-sm font-semibold uppercase tracking-[0.2em] text-primary-600 dark:text-primary-400">
            <PencilLine class="mr-2 inline h-4 w-4" />
            {{ tr('reviews.writeReview', 'Viết đánh giá') }}
          </p>
          <h3 class="mt-2 text-xl font-bold text-gray-900 dark:text-white">
            {{ tr('reviews.shareYourExperience', 'Chia sẻ trải nghiệm của bạn') }}
          </h3>
        </div>

        <UButton
          v-if="!isFormOpen"
          color="primary"
          variant="soft"
          @click="openForm"
        >
          {{ tr('reviews.writeReview', 'Viết đánh giá') }}
        </UButton>
      </div>

      <div
        v-if="submitSuccess"
        data-testid="product-review-success"
        class="mt-5 rounded-2xl border border-green-200 bg-green-50 px-4 py-4 text-green-800 dark:border-green-900 dark:bg-green-950/40 dark:text-green-200"
      >
        <p class="font-medium">{{ tr('reviews.thankYou', 'Cảm ơn bạn!') }}</p>
        <p class="mt-1 text-sm">{{ tr('reviews.reviewSubmitSuccessDetail', 'Đánh giá của bạn đã được gửi thành công!') }}</p>
        <p class="mt-1 text-sm">{{ tr('reviews.moderationNotice', 'Đánh giá của bạn sẽ được hiển thị sau khi được kiểm duyệt.') }}</p>
      </div>

      <div
        v-if="submitError"
        class="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-4 text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200"
      >
        {{ tr('reviews.reviewSubmitError', 'Đã xảy ra lỗi khi gửi đánh giá của bạn. Vui lòng thử lại sau.') }}
      </div>

      <ProductReviewForm
        v-if="isFormOpen"
        ref="formRef"
        class="mt-6"
        :product-id="productId"
        :locale="locale"
        @success="handleSubmitSuccess"
        @error="handleSubmitError"
      />
    </div>
  </section>
</template>
