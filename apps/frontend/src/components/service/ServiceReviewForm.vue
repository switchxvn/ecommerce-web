<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import { Star } from 'lucide-vue-next';
import { useLocalization } from '~/composables/useLocalization';
import { useTrpc } from '~/composables/useTrpc';

const props = defineProps<{
  serviceId: number;
  locale?: string;
}>();

const emit = defineEmits<{
  (e: 'success', review: any): void;
  (e: 'error', error: unknown): void;
}>();

const { t, locale } = useLocalization();
const trpc = useTrpc();
const tr = (key: string, fallback: string) => t(key) || fallback;

const inputRef = ref<HTMLInputElement | null>(null);
const isSubmitting = ref(false);
const formData = reactive({
  authorName: '',
  profession: '',
  rating: 5,
  title: '',
  content: '',
});

const formErrors = reactive({
  authorName: '',
  rating: '',
  title: '',
  content: '',
});

const currentLocale = computed(() => props.locale || locale.value);
const displayRating = ref(0);

const resetErrors = () => {
  formErrors.authorName = '';
  formErrors.rating = '';
  formErrors.title = '';
  formErrors.content = '';
};

const validateForm = () => {
  resetErrors();
  let isValid = true;

  if (!formData.authorName.trim()) {
    formErrors.authorName = tr('validation.required', 'Bat buoc');
    isValid = false;
  } else if (formData.authorName.trim().length < 2) {
    formErrors.authorName = tr('validation.minLength', 'Toi thieu {min} ky tu').replace('{min}', '2');
    isValid = false;
  }

  if (!formData.rating || formData.rating < 1 || formData.rating > 5) {
    formErrors.rating = tr('validation.required', 'Bat buoc');
    isValid = false;
  }

  if (!formData.title.trim()) {
    formErrors.title = tr('validation.required', 'Bat buoc');
    isValid = false;
  } else if (formData.title.trim().length < 4) {
    formErrors.title = tr('validation.minLength', 'Toi thieu {min} ky tu').replace('{min}', '4');
    isValid = false;
  }

  if (!formData.content.trim()) {
    formErrors.content = tr('validation.required', 'Bat buoc');
    isValid = false;
  } else if (formData.content.trim().length < 10) {
    formErrors.content = tr('validation.minLength', 'Toi thieu {min} ky tu').replace('{min}', '10');
    isValid = false;
  }

  return isValid;
};

const setRating = (rating: number) => {
  formData.rating = rating;
};

const getRatingLabel = (rating: number): string => {
  switch (rating) {
    case 5:
      return tr('reviews.ratingExcellent', 'Xuat sac');
    case 4:
      return tr('reviews.ratingGood', 'Tot');
    case 3:
      return tr('reviews.ratingAverage', 'Trung binh');
    case 2:
      return tr('reviews.ratingPoor', 'Kem');
    case 1:
      return tr('reviews.ratingBad', 'Rat kem');
    default:
      return '';
  }
};

const resetForm = () => {
  formData.authorName = '';
  formData.profession = '';
  formData.rating = 5;
  formData.title = '';
  formData.content = '';
  displayRating.value = 0;
  resetErrors();
};

const focusFirstField = () => {
  inputRef.value?.focus();
};

const submitForm = async () => {
  if (!validateForm()) {
    return;
  }

  isSubmitting.value = true;

  try {
    const response = await trpc.review.submitReview.mutate({
      authorName: formData.authorName.trim(),
      profession: formData.profession.trim() || undefined,
      rating: formData.rating,
      serviceId: props.serviceId,
      translations: [
        {
          locale: currentLocale.value,
          title: formData.title.trim(),
          content: formData.content.trim(),
        },
      ],
    });

    resetForm();
    emit('success', response);
  } catch (error) {
    emit('error', error);
  } finally {
    isSubmitting.value = false;
  }
};

defineExpose({
  focusFirstField,
});
</script>

<template>
  <form class="space-y-5" @submit.prevent="submitForm">
    <div class="grid gap-4 md:grid-cols-2">
      <div>
        <label class="mb-2 block text-sm font-medium text-gray-900 dark:text-white">
          {{ tr('reviews.authorName', 'Ten cua ban') }}
        </label>
        <input
          ref="inputRef"
          v-model="formData.authorName"
          type="text"
          class="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-primary-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
          :placeholder="tr('reviews.authorNamePlaceholder', 'Nhap ten cua ban')"
        />
        <p v-if="formErrors.authorName" class="mt-2 text-sm text-red-600 dark:text-red-400">
          {{ formErrors.authorName }}
        </p>
      </div>

      <div>
        <label class="mb-2 block text-sm font-medium text-gray-900 dark:text-white">
          {{ tr('reviews.professionLabel', 'Nghe nghiep') }}
        </label>
        <input
          v-model="formData.profession"
          type="text"
          class="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-primary-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
          :placeholder="tr('reviews.professionPlaceholder', 'Nhap nghe nghiep cua ban (khong bat buoc)')"
        />
      </div>
    </div>

    <div>
      <label class="mb-2 block text-sm font-medium text-gray-900 dark:text-white">
        {{ tr('reviews.rating', 'Danh gia') }}
      </label>
      <div class="flex items-center gap-2">
        <button
          v-for="star in 5"
          :key="star"
          type="button"
          class="rounded-full p-1 transition hover:scale-105"
          @click="setRating(star)"
          @mouseenter="displayRating = star"
          @mouseleave="displayRating = 0"
        >
          <Star
            class="h-6 w-6"
            :class="(displayRating || formData.rating) >= star ? 'fill-amber-400 text-amber-400' : 'fill-transparent text-gray-300 dark:text-gray-600'"
          />
        </button>
        <span class="ml-2 text-sm text-gray-600 dark:text-gray-300">
          {{ getRatingLabel(displayRating || formData.rating) }}
        </span>
      </div>
      <p v-if="formErrors.rating" class="mt-2 text-sm text-red-600 dark:text-red-400">
        {{ formErrors.rating }}
      </p>
    </div>

    <div>
      <label class="mb-2 block text-sm font-medium text-gray-900 dark:text-white">
        {{ tr('reviews.reviewTitle', 'Tieu de danh gia') }}
      </label>
      <input
        v-model="formData.title"
        type="text"
        class="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-primary-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
        :placeholder="tr('reviews.reviewTitlePlaceholder', 'Tom tat trai nghiem cua ban trong mot cau')"
      />
      <p v-if="formErrors.title" class="mt-2 text-sm text-red-600 dark:text-red-400">
        {{ formErrors.title }}
      </p>
    </div>

    <div>
      <label class="mb-2 block text-sm font-medium text-gray-900 dark:text-white">
        {{ tr('reviews.reviewContent', 'Noi dung danh gia') }}
      </label>
      <textarea
        v-model="formData.content"
        rows="5"
        class="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-primary-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
        :placeholder="tr('reviews.reviewContentPlaceholder', 'Mo ta chi tiet trai nghiem cua ban...')"
      />
      <p v-if="formErrors.content" class="mt-2 text-sm text-red-600 dark:text-red-400">
        {{ formErrors.content }}
      </p>
    </div>

    <div class="flex items-center justify-between gap-4 rounded-2xl bg-primary-50 px-4 py-3 text-sm text-primary-800 dark:bg-primary-950/40 dark:text-primary-200">
      <p>{{ tr('reviews.moderationNotice', 'Danh gia cua ban se duoc hien thi sau khi duoc kiem duyet.') }}</p>
      <UButton type="submit" color="primary" :loading="isSubmitting">
        {{ tr('reviews.submitReview', 'Gui danh gia') }}
      </UButton>
    </div>
  </form>
</template>
