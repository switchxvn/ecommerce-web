<script setup lang="ts">
import { useLocalization } from '../composables/useLocalization';
import { useTrpc } from '../composables/useTrpc';
import { computed, ref, reactive, onMounted } from '../composables/useVueComposables';
import { useRouter } from 'vue-router';
import { useNotificationToast } from '../composables/useNotificationToast';
import { Star } from 'lucide-vue-next';
import { ReviewStatus } from '@ew/shared';
import Loader from './ui/Loader.vue';
import { useReviews } from '../composables/useReviews';

const props = withDefaults(defineProps<{
  reviewSuccess?: boolean;
  postSubmitAction?: 'reset' | 'redirect' | 'none';
  redirectUrl?: string;
  showServiceType?: boolean;
  showProfession?: boolean;
  showVisitDate?: boolean;
  showCard?: boolean;
  showFormTitle?: boolean;
}>(), {
  reviewSuccess: false,
  postSubmitAction: 'reset',
  redirectUrl: '/reviews',
  showServiceType: true,
  showProfession: true,
  showVisitDate: true,
  showCard: false,
  showFormTitle: false,
});

const emit = defineEmits<{
  (e: 'success', review: any): void;
  (e: 'error', error: any): void;
}>();

const router = useRouter();
const { t, locale } = useLocalization();
const trpc = useTrpc();
const toast = useNotificationToast();

const formData = reactive({
  authorName: '',
  authorAvatar: '',
  profession: '',
  rating: 5,
  serviceTypeId: 0,
  visitDate: '',
  title: '',
  content: '',
});

const formErrors = reactive({
  authorName: '',
  rating: '',
  content: '',
  serviceTypeId: '',
});

const isSubmitting = ref(false);
const isSubmitSuccess = ref(props.reviewSuccess);
const uploadProgress = ref(0);
const isUploading = ref(false);
const showImagePreview = ref(false);

// Create computed for current locale
const currentLocale = computed(() => {
  return typeof locale === 'object' && 'value' in locale ? locale.value : 'en';
});

// Load service types
const serviceTypes = ref<any[]>([]);

const loadServiceTypes = async () => {
  try {
    const response = await trpc.review.getServiceTypes.query({ locale: currentLocale.value });
    serviceTypes.value = response as any[];
  } catch (error) {
    console.error('Error loading service types:', error);
   
  }
};

// Get service type name with better locale handling
const getServiceTypeName = (serviceType: any) => {
  if (!serviceType) return '';
  
  // Try to find a translation matching the current locale
  const translation = serviceType.translations.find((t: any) => t.locale === currentLocale.value);
  
  // If found, return the name
  if (translation?.name) return translation.name;
  
  // If not found but there are translations, return the first one
  if (serviceType.translations.length > 0) return serviceType.translations[0].name;
  
  // Fallback to slug as last resort
  return serviceType.slug ? t(`reviews.serviceTypes.${serviceType.slug}`) : '';
};

// Load service types on mounted
onMounted(() => {
  loadServiceTypes();
});

// Xử lý upload ảnh đại diện
const fileInputRef = ref<HTMLInputElement | null>(null);
const avatarFile = ref<File | null>(null);

const triggerFileInput = () => {
  if (fileInputRef.value) {
    fileInputRef.value.click();
  }
};

const onFileSelected = async (event: Event) => {
  const input = event.target as HTMLInputElement;
  
  if (input.files && input.files.length > 0) {
    const file = input.files[0];
    
    // Kiểm tra loại file
    if (!file.type.startsWith('image/')) {
      toast.error(t('reviews.onlyImageAllowed'));
      return;
    }
    
    // Kiểm tra kích thước file (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error(t('reviews.imageSizeLimit'));
      return;
    }
    
    avatarFile.value = file;
    uploadImage(file);
  }
};

const uploadImage = async (file: File) => {
  try {
    isUploading.value = true;
    uploadProgress.value = 0;
    
    // Import useUpload động để tránh lỗi biên dịch
    // Nếu không tìm thấy module, sẽ hiển thị lỗi cho người dùng
    try {
      const { useUpload } = await import('../composables/useUpload');
      const { uploadFile } = useUpload();
      
      const result = await uploadFile({
        file,
        folder: 'avatars',
        onProgress: (percent: number) => {
          uploadProgress.value = percent;
        }
      });
      
      formData.authorAvatar = result.url;
      showImagePreview.value = true;
      
      toast.success(t('reviews.imageUploadSuccess'));
    } catch (importError) {
      console.error('Error importing upload module:', importError);
      toast.error('Upload module not available');
      isUploading.value = false;
    }
  } catch (error) {
    console.error('Error uploading image:', error);
    toast.error(t('reviews.imageUploadError'));
  } finally {
    isUploading.value = false;
  }
};

const removeImage = () => {
  formData.authorAvatar = '';
  avatarFile.value = null;
  showImagePreview.value = false;
  
  // Reset file input
  if (fileInputRef.value) {
    fileInputRef.value.value = '';
  }
};

// Xác thực form
const validateForm = () => {
  let isValid = true;
  
  // Reset errors
  Object.keys(formErrors).forEach(key => {
    formErrors[key as keyof typeof formErrors] = '';
  });

  // Validate author name
  if (!formData.authorName.trim()) {
    formErrors.authorName = t('validation.required');
    isValid = false;
  } else if (formData.authorName.length < 2) {
    formErrors.authorName = t('validation.minLength').replace('{min}', '2');
    isValid = false;
  }

  // Validate rating
  if (!formData.rating) {
    formErrors.rating = t('validation.required');
    isValid = false;
  }

  // Validate service type
  if (!formData.serviceTypeId) {
    formErrors.serviceTypeId = t('validation.required');
    isValid = false;
  }

  // Validate content
  if (!formData.content.trim()) {
    formErrors.content = t('validation.required');
    isValid = false;
  } else if (formData.content.length < 10) {
    formErrors.content = t('validation.minLength').replace('{min}', '10');
    isValid = false;
  }

  return isValid;
};

const submitForm = async () => {
  if (!validateForm()) {
    return;
  }

  isSubmitting.value = true;

  try {
    const reviewData = {
      authorName: formData.authorName,
      authorAvatar: formData.authorAvatar || undefined,
      rating: formData.rating,
      serviceTypeId: formData.serviceTypeId,
      visitDate: formData.visitDate ? new Date(formData.visitDate).toISOString() : undefined,
      translations: [
        {
          locale: locale.value,
          title: formData.title || undefined,
          content: formData.content,
        },
      ],
    };

    const response = await trpc.review.submitReview.mutate(reviewData);

    isSubmitSuccess.value = true;
    emit('success', response);
    
    toast.success(t('reviews.reviewSubmitSuccess'));

    // Handle post-submit action
    if (props.postSubmitAction === 'reset') {
      resetForm();
    } else if (props.postSubmitAction === 'redirect' && props.redirectUrl) {
      router.push(props.redirectUrl);
    }
  } catch (error) {
    console.error('Error submitting review:', error);
    emit('error', error);
    toast.error(t('reviews.reviewSubmitError'));
  } finally {
    isSubmitting.value = false;
  }
};

const resetForm = () => {
  formData.authorName = '';
  formData.authorAvatar = '';
  formData.rating = 5;
  formData.serviceTypeId = 0;
  formData.visitDate = '';
  formData.title = '';
  formData.content = '';
  isSubmitSuccess.value = false;
  avatarFile.value = null;
  showImagePreview.value = false;
  
  // Reset file input
  if (fileInputRef.value) {
    fileInputRef.value.value = '';
  }
};

// For star rating
const hoverRating = ref(0);
const setRating = (rating: number) => {
  formData.rating = rating;
};
const setHoverRating = (rating: number) => {
  hoverRating.value = rating;
};
const clearHoverRating = () => {
  hoverRating.value = 0;
};
const displayRating = computed(() => hoverRating.value || formData.rating);

// Get rating label based on value
const getRatingLabel = (rating: number): string => {
  switch (rating) {
    case 5:
      return t('reviews.ratingExcellent');
    case 4:
      return t('reviews.ratingGood');
    case 3:
      return t('reviews.ratingAverage');
    case 2:
      return t('reviews.ratingPoor');
    case 1:
      return t('reviews.ratingBad');
    default:
      return '';
  }
};
</script>

<template>
  <div :class="{ 'bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6': showCard }">
    <h3 v-if="showFormTitle" class="text-xl font-bold text-gray-900 dark:text-white mb-6">
      {{ t('reviews.submitReview') }}
    </h3>

    <div v-if="isSubmitSuccess" class="bg-green-50 dark:bg-green-900 text-green-800 dark:text-green-200 p-4 rounded-md mb-6">
      <div class="flex items-center">
        <i class="i-heroicons-check-circle mr-2"></i>
        <h4 class="font-medium">{{ t('reviews.thankYou') }}</h4>
      </div>
      <p class="mt-2">{{ t('reviews.reviewSubmitSuccessDetail') }}</p>
      <p class="mt-2 text-sm text-green-700 dark:text-green-300">
        {{ t('reviews.moderationNotice') }}
      </p>
      <div class="mt-4">
        <UButton color="green" variant="outline" @click="resetForm">
          {{ t('reviews.writeAnotherReview') }}
        </UButton>
      </div>
    </div>

    <form v-else @submit.prevent="submitForm" class="space-y-6">
      <!-- Author Name -->
      <div class="mb-6">
        <label for="authorName" class="block text-gray-700 dark:text-gray-300 font-medium mb-2">
          {{ t('reviews.nameLabel') }} <span class="text-red-500">*</span>
        </label>
        <input
          id="authorName"
          v-model="formData.authorName"
          type="text"
          class="bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md w-full px-4 py-2 text-gray-700 dark:text-gray-200"
          :placeholder="t('reviews.namePlaceholder')"
        />
        <p v-if="formErrors.authorName" class="mt-1 text-sm text-red-600 dark:text-red-400">
          {{ formErrors.authorName }}
        </p>
      </div>

      <!-- Profession input -->
      <div class="mb-6" v-if="showProfession">
        <label for="profession" class="block text-gray-700 dark:text-gray-300 font-medium mb-2">
          {{ t('reviews.professionLabel') }}
        </label>
        <input
          id="profession"
          v-model="formData.profession"
          type="text"
          class="bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md w-full px-4 py-2 text-gray-700 dark:text-gray-200"
          :placeholder="t('reviews.professionPlaceholder')"
        />
      </div>

      <!-- Author Avatar Upload -->
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {{ t('reviews.authorAvatar') }}
        </label>
        
        <!-- Hidden file input -->
        <input
          ref="fileInputRef"
          type="file"
          accept="image/*"
          class="hidden"
          @change="onFileSelected"
        />
        
        <!-- Image preview -->
        <div v-if="showImagePreview && formData.authorAvatar" class="mb-3">
          <div class="relative w-24 h-24 rounded-full overflow-hidden border border-gray-300 dark:border-gray-600">
            <img 
              :src="formData.authorAvatar" 
              :alt="t('reviews.previewAvatar')"
              class="w-full h-full object-cover"
            />
            <button 
              type="button"
              @click="removeImage"
              class="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1 transform translate-x-1/3 -translate-y-1/3 hover:bg-red-600 transition-colors"
              :title="t('reviews.removeImage')"
            >
              <i class="i-heroicons-x-mark w-4 h-4"></i>
            </button>
          </div>
        </div>
        
        <!-- Upload button -->
        <div v-if="!showImagePreview">
          <button
            type="button"
            @click="triggerFileInput"
            class="flex items-center justify-center gap-2 py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
            :disabled="isUploading"
          >
            <i class="i-heroicons-photo"></i>
            {{ t('reviews.uploadAvatar') }}
          </button>
        </div>

        <!-- Upload progress -->
        <div v-if="isUploading" class="mt-2">
          <div class="h-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div 
              class="h-full bg-primary-500 transition-all duration-300 ease-out"
              :style="{ width: `${uploadProgress}%` }"
            ></div>
          </div>
          <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {{ t('reviews.uploading') }}: {{ Math.round(uploadProgress) }}%
          </p>
        </div>
        
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {{ t('reviews.imageRequirements') }}
        </p>
      </div>

      <!-- Rating -->
      <div class="mb-6">
        <label class="block text-gray-700 dark:text-gray-300 font-medium mb-2">
          {{ t('reviews.rating') }} <span class="text-red-500">*</span>
        </label>
        <div class="flex flex-col gap-2">
          <div 
            class="flex items-center space-x-2 text-2xl cursor-pointer"
            @mouseleave="clearHoverRating"
          >
            <div class="flex">
              <span 
                v-for="i in 5" 
                :key="`star-${i}`"
                @click="setRating(i)"
                @mouseenter="setHoverRating(i)"
                class="transition-colors duration-200 hover:scale-110 transform mr-1"
                :aria-label="`${i} stars`"
                role="button"
                tabindex="0"
                @keydown.enter="setRating(i)"
                @keydown.space="setRating(i)"
              >
                <Star 
                  :size="32" 
                  :stroke-width="1.5"
                  class="text-primary-300 dark:text-primary-400"
                  :fill="i <= displayRating ? 'currentColor' : 'none'" 
                  color="currentColor" 
                />
              </span>
            </div>
            
            <span class="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              {{ displayRating }}/5 - 
              <span class="text-primary-500 dark:text-primary-400 font-semibold">
                {{ getRatingLabel(displayRating) }}
              </span>
            </span>
          </div>
        </div>
        <p v-if="formErrors.rating" class="mt-1 text-sm text-red-600 dark:text-red-400">
          {{ formErrors.rating }}
        </p>
      </div>

      <!-- Service Type -->
      <div v-if="showServiceType">
        <label for="serviceType" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {{ t('reviews.serviceType') }} <span class="text-red-500">*</span>
        </label>
        <select
          id="serviceType"
          v-model="formData.serviceTypeId"
          class="bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md w-full px-4 py-2 text-gray-700 dark:text-gray-200"
        >
          <option value="">{{ t('reviews.selectServiceType') }}</option>
          <option 
            v-for="type in serviceTypes" 
            :key="type.id" 
            :value="type.id"
          >
            {{ getServiceTypeName(type) }}
          </option>
        </select>
        <p v-if="formErrors.serviceTypeId" class="mt-1 text-sm text-red-600 dark:text-red-400">
          {{ formErrors.serviceTypeId }}
        </p>
      </div>

      <!-- Visit Date -->
      <div v-if="showVisitDate">
        <label for="visitDate" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {{ t('reviews.visitDate') }}
        </label>
        <input
          id="visitDate"
          v-model="formData.visitDate"
          type="date"
          class="bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md w-full px-4 py-2 text-gray-700 dark:text-gray-200"
        />
      </div>

      <!-- Review Title -->
      <div>
        <label for="title" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {{ t('reviews.reviewTitle') }}
        </label>
        <input
          id="title"
          v-model="formData.title"
          type="text"
          class="bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md w-full px-4 py-2 text-gray-700 dark:text-gray-200"
          :placeholder="t('reviews.reviewTitlePlaceholder')"
        />
      </div>

      <!-- Review Content -->
      <div>
        <label for="content" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {{ t('reviews.reviewContent') }} <span class="text-red-500">*</span>
        </label>
        <textarea
          id="content"
          v-model="formData.content"
          rows="5"
          class="bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md w-full px-4 py-2 text-gray-700 dark:text-gray-200"
          :placeholder="t('reviews.reviewContentPlaceholder')"
        ></textarea>
        <p v-if="formErrors.content" class="mt-1 text-sm text-red-600 dark:text-red-400">
          {{ formErrors.content }}
        </p>
      </div>

      <!-- Submit Button -->
      <div class="flex justify-end">
        <UButton
          type="submit"
          color="primary"
          :loading="isSubmitting"
          :disabled="isSubmitting || isUploading"
        >
          {{ t('reviews.submitReview') }}
        </UButton>
      </div>
    </form>
  </div>
</template> 
