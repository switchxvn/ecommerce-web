<script setup lang="ts">
import { useLocalization } from '../../composables/useLocalization';
import { useReviews } from '../../composables/useReviews';
import { computed } from 'vue';

// Props cho section này
const props = defineProps({
  section: {
    type: Object,
    required: true
  }
});

const { t } = useLocalization();

// Lấy data từ useReviews composable
const {
  averageRating,
  totalReviews,
  ratingDistribution,
  getRatingPercentage
} = useReviews();

// Lấy settings từ section
const settings = props.section.settings || {};

// Default values
const backgroundColor = settings.backgroundColor || 'bg-white dark:bg-gray-800';
const textColor = settings.textColor || 'text-gray-900 dark:text-white';
const borderColor = settings.borderColor || 'border-gray-200 dark:border-gray-700';
const shadowLevel = settings.shadowLevel || 'shadow-sm';
const padding = settings.padding || 'p-6';
const marginTop = settings.marginTop || '';
const marginBottom = settings.marginBottom || '';
</script>

<template>
  <div class="container mx-auto px-4 py-10">
    <div :class="[backgroundColor, shadowLevel, 'border rounded-lg', borderColor, padding, marginTop, marginBottom]">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
        <!-- Average rating -->
        <div class="text-center border-b md:border-b-0 md:border-r pb-6 md:pb-0" :class="borderColor">
          <h3 class="text-xl font-medium mb-2" :class="textColor === 'text-gray-900 dark:text-white' ? 'text-gray-700 dark:text-gray-300' : textColor">
            {{ t('reviews.averageRating') }}
          </h3>
          <div class="flex items-center justify-center gap-2">
            <span class="text-4xl font-bold" :class="textColor">{{ averageRating }}</span>
            <div class="flex text-primary-300 text-2xl">
              <i class="i-heroicons-star-solid"></i>
            </div>
          </div>
          <p class="text-gray-500 dark:text-gray-400 mt-1">
            {{ t('reviews.basedOn') }} {{ totalReviews }} {{ t('reviews.reviews') }}
          </p>
        </div>

        <!-- Rating distribution -->
        <div class="col-span-2 pl-0 md:pl-6">
          <h3 class="text-xl font-medium mb-4" :class="textColor === 'text-gray-900 dark:text-white' ? 'text-gray-700 dark:text-gray-300' : textColor">
            {{ t('reviews.ratingDistribution') }}
          </h3>
          <div class="space-y-3">
            <div v-for="i in 5" :key="`rating-${i}`" class="flex items-center">
              <span class="w-8 text-sm" :class="textColor">{{ i }} <i class="i-heroicons-star-solid text-primary-300"></i></span>
              <div class="flex-1 h-4 mx-3 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                <div 
                  class="h-full bg-primary-300" 
                  :style="{ width: `${getRatingPercentage(i)}%` }"
                ></div>
              </div>
              <span class="text-sm text-gray-500 dark:text-gray-400 w-16">
                {{ ratingDistribution[i] }} ({{ Math.round(getRatingPercentage(i)) }}%)
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template> 
