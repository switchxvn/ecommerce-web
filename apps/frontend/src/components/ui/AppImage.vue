<template>
  <div class="lazy-image-container relative" :style="containerStyle">
    <div
      v-if="isLoading && !hasError"
      class="absolute inset-0 bg-gray-200 animate-pulse dark:bg-gray-700"
    />

    <img
      v-if="!hasError && shouldUseNativeImage"
      ref="nativeImageRef"
      :src="src"
      :alt="alt"
      :width="normalizedWidth || undefined"
      :height="normalizedHeight || undefined"
      :loading="resolvedLoading"
      :decoding="decoding"
      :fetchpriority="resolvedFetchPriority"
      class="w-full h-full object-cover transition-opacity duration-300"
      :class="imageClass"
      @load="handleLoad"
      @error="handleError"
    />

    <NuxtImg
      v-else-if="!hasError"
      ref="optimizedImageRef"
      provider="ipx"
      :src="src"
      :alt="alt"
      :width="normalizedWidth"
      :height="normalizedHeight"
      :sizes="sizes"
      :quality="quality"
      :format="format"
      :loading="resolvedLoading"
      :decoding="decoding"
      :fetchpriority="fetchpriority"
      class="w-full h-full object-cover transition-opacity duration-300"
      :class="imageClass"
      @load="handleLoad"
      @error="handleError"
    />

    <img
      v-else
      :src="fallbackSrc"
      :alt="alt"
      :width="normalizedWidth || undefined"
      :height="normalizedHeight || undefined"
      class="w-full h-full object-cover"
      :class="[customClass]"
      loading="lazy"
      decoding="async"
      @error="handleFallbackError"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue';
import type { ComponentPublicInstance } from 'vue';

interface LazyImageProps {
  src: string;
  alt: string;
  fallbackSrc?: string;
  customClass?: string;
  width?: string | number | null;
  height?: string | number | null;
  sizes?: string;
  quality?: number;
  priority?: boolean;
  loading?: 'lazy' | 'eager';
  decoding?: 'async' | 'sync' | 'auto';
  fetchpriority?: 'high' | 'low' | 'auto';
  format?: string;
}

const props = withDefaults(defineProps<LazyImageProps>(), {
  fallbackSrc: '/images/default-image.jpg',
  customClass: '',
  width: null,
  height: null,
  sizes: '100vw',
  quality: 75,
  priority: false,
  loading: 'lazy',
  decoding: 'async',
  fetchpriority: 'auto',
  format: 'avif,webp',
});

const isLoading = ref(true);
const hasError = ref(false);
const nativeImageRef = ref<HTMLImageElement | null>(null);
const optimizedImageRef = ref<ComponentPublicInstance | null>(null);

watch(() => props.src, () => {
  isLoading.value = true;
  hasError.value = false;
});

const normalizedWidth = computed(() => {
  if (props.width === null || props.width === undefined || props.width === '') return null;
  const numeric = Number(props.width);
  return Number.isFinite(numeric) ? numeric : null;
});

const normalizedHeight = computed(() => {
  if (props.height === null || props.height === undefined || props.height === '') return null;
  const numeric = Number(props.height);
  return Number.isFinite(numeric) ? numeric : null;
});

const containerStyle = computed(() => {
  const style: Record<string, string> = {};
  if (typeof props.width === 'string' && props.width) style.width = props.width;
  if (typeof props.height === 'string' && props.height) style.height = props.height;
  return style;
});

const resolvedLoading = computed(() => (props.priority ? 'eager' : props.loading));
const resolvedFetchPriority = computed(() => (props.priority ? 'high' : props.fetchpriority));
const fetchpriority = computed(() => resolvedFetchPriority.value);
const shouldUseNativeImage = computed(() => /^https?:\/\//i.test(props.src));
const imageClass = computed(() => ({
  'opacity-0': isLoading.value,
  'opacity-100': !isLoading.value,
  [props.customClass]: !!props.customClass,
}));

const getRenderedImage = () => {
  if (shouldUseNativeImage.value) {
    return nativeImageRef.value;
  }

  const optimizedRoot = optimizedImageRef.value?.$el as Element | undefined;
  if (!optimizedRoot) return null;

  if (optimizedRoot instanceof HTMLImageElement) {
    return optimizedRoot;
  }

  return optimizedRoot.querySelector('img');
};

const syncImageState = () => {
  const imageElement = getRenderedImage();
  if (!imageElement) return;

  if (imageElement.complete) {
    if (imageElement.naturalWidth > 0) {
      isLoading.value = false;
      hasError.value = false;
      return;
    }

    hasError.value = true;
    isLoading.value = false;
  }
};

const handleLoad = () => {
  isLoading.value = false;
};

const handleError = () => {
  hasError.value = true;
  isLoading.value = false;
};

const handleFallbackError = () => {
  isLoading.value = false;
};

watch(
  () => [props.src, shouldUseNativeImage.value],
  async () => {
    await nextTick();
    syncImageState();
  },
  { flush: 'post' }
);

onMounted(async () => {
  await nextTick();
  syncImageState();
});
</script>

<style scoped>
.lazy-image-container {
  overflow: hidden;
  position: relative;
  min-height: 100px;
}
</style> 
