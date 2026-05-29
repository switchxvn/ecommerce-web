<script setup lang="ts">
import { ref, onMounted } from 'vue'

interface Props {
  src?: string | null
  alt: string
  defaultSrc?: string
  class?: string
}

const props = withDefaults(defineProps<Props>(), {
  defaultSrc: '/images/default-image.jpg',
  class: '',
  src: null
})

const hasError = ref(false)
const isLoading = ref(true)
const currentSrc = ref(props.src || props.defaultSrc)
const imageClass = props.class

const handleError = () => {
  hasError.value = true
  isLoading.value = false
  currentSrc.value = props.defaultSrc
}

const handleLoad = () => {
  isLoading.value = false
}

onMounted(() => {
  // If no source provided, use default image immediately
  if (!props.src) {
    currentSrc.value = props.defaultSrc
    isLoading.value = false
  }
})
</script>

<template>
  <div class="lazy-image-container" :class="{ 'is-loading': isLoading }">
    <img
      :src="currentSrc"
      :alt="alt"
      :class="imageClass"
      @error="handleError"
      @load="handleLoad"
      loading="lazy"
    >
    <div v-if="isLoading" class="lazy-image-loading">
      <div class="lazy-image-spinner"></div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.lazy-image {
  &-container {
    @apply relative w-full h-full;
    
    &.is-loading img {
      @apply opacity-0;
    }
  }

  &-loading {
    @apply absolute inset-0 flex items-center justify-center bg-gray-100;
  }

  &-spinner {
    @apply w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin;
  }
}
</style> 
