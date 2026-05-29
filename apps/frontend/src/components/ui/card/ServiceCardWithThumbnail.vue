<script setup lang="ts">
import { computed } from 'vue';
import type { Service } from '../../../types/service';

const props = defineProps<{
  service: Service;
  locale: string;
}>();

const translation = computed(() => {
  return props.service.translations.find(t => t.locale === props.locale) || props.service.translations[0];
});

const thumbnailUrl = computed(() => {
  if (!props.service.thumbnail) return null;
  return props.service.thumbnail;
});

const handleImageError = (payload: string | Event) => {
  const imgElement = payload instanceof Event ? (payload.target as HTMLImageElement) : null;
  if (imgElement) {
    imgElement.src = '@/default-image.jpg';
  }
};
</script>

<template>
  <NuxtLink
    :to="`/services/${translation.slug}`"
    class="group relative flex flex-col overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm transition-all hover:shadow-lg dark:border-gray-800 dark:bg-gray-900"
  >
    <!-- Thumbnail -->
    <div class="relative aspect-[4/3] w-full overflow-hidden bg-gray-100 dark:bg-gray-800">
      <div v-if="!thumbnailUrl" class="flex h-full items-center justify-center">
        <div :class="`i-lucide-${service.icon}`" class="h-16 w-16 text-gray-400 dark:text-gray-600" />
      </div>
      <NuxtImg
        v-else
        :src="thumbnailUrl"
        :alt="translation.title"
        class="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
        loading="lazy"
        format="webp"
        quality="80"
        fit="cover"
        placeholder
      />
    </div>

    <!-- Badges -->
    <div class="absolute left-2 top-2 z-10 flex gap-1">
      <span
        v-if="service.isNew"
        class="inline-flex items-center rounded-full bg-green-500/90 px-2 py-1 text-xs font-medium text-white shadow-sm ring-1 ring-inset ring-white/15 backdrop-blur-sm dark:bg-green-500/85"
      >
        {{ $t('common.new') }}
      </span>
      <span
        v-if="service.isFeatured"
        class="inline-flex items-center rounded-full bg-amber-500/90 px-2 py-1 text-xs font-medium text-white shadow-sm ring-1 ring-inset ring-white/15 backdrop-blur-sm dark:bg-amber-400/90"
      >
        {{ $t('common.featured') }}
      </span>
    </div>

    <!-- Content -->
    <div class="flex flex-1 flex-col p-4">
      <h3 class="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
        {{ translation.title }}
      </h3>
      <p class="mb-4 flex-1 text-sm text-gray-600 dark:text-gray-400">
        {{ translation.shortDescription }}
      </p>
      <div class="flex items-center justify-between">
        <span class="text-sm font-medium text-primary-600 dark:text-primary-400">
          {{ $t('common.learnMore') }}
        </span>
        <div class="i-heroicons-arrow-right-20-solid h-5 w-5 text-primary-600 transition-transform group-hover:translate-x-1 dark:text-primary-400" />
      </div>
    </div>
  </NuxtLink>
</template>

<style scoped>
.aspect-w-16 {
  position: relative;
  padding-bottom: 56.25%; /* 16:9 Aspect Ratio */
}

.aspect-w-16 > * {
  position: absolute;
  height: 100%;
  width: 100%;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
}
</style> 
