<script setup lang="ts">
withDefaults(defineProps<{
  centered?: boolean;
  showSubtitle?: boolean;
  showAction?: boolean;
}>(), {
  centered: false,
  showSubtitle: true,
  showAction: false,
});
</script>

<template>
  <div
    class="flex gap-4"
    :class="centered ? 'flex-col items-center text-center' : 'items-start justify-between'"
  >
    <div class="space-y-3" :class="centered ? 'w-full max-w-2xl' : 'flex-1 max-w-xl'">
      <USkeleton class="h-4 w-24 rounded-full" />
      <USkeleton class="h-8 w-full max-w-md rounded-full" />
      <USkeleton v-if="showSubtitle" class="h-4 w-full max-w-lg rounded-full" />
      <USkeleton v-if="showSubtitle" class="h-4 w-4/5 max-w-md rounded-full" />
    </div>

    <USkeleton
      v-if="showAction"
      class="hidden h-11 w-32 rounded-full md:block"
    />
  </div>
</template>
