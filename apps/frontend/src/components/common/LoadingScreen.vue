<script setup lang="ts">
defineProps<{
  isLoading: boolean;
}>();
</script>

<template>
  <Transition
    enter-active-class="transition duration-200 ease-out"
    enter-from-class="translate-y-1 opacity-0"
    enter-to-class="translate-y-0 opacity-100"
    leave-active-class="transition duration-150 ease-in"
    leave-from-class="translate-y-0 opacity-100"
    leave-to-class="translate-y-1 opacity-0"
  >
    <div
      v-if="isLoading"
      aria-live="polite"
      aria-busy="true"
      class="fixed inset-0 z-[9999] flex items-center justify-center bg-neutral-50 dark:bg-neutral-900"
    >
      <div class="flex flex-col items-center gap-4">
        <div class="h-12 w-12 animate-spin rounded-full border-4 border-primary-500 border-t-transparent"></div>
        <p class="text-lg font-medium text-neutral-900 dark:text-neutral-50">Loading...</p>
      </div>
    </div>
  </Transition>
</template> 
