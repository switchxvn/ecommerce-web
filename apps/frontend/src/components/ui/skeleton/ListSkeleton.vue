<script setup lang="ts">
withDefaults(defineProps<{
  itemCount?: number;
  showThumbnail?: boolean;
  showMeta?: boolean;
}>(), {
  itemCount: 4,
  showThumbnail: true,
  showMeta: true,
});
</script>

<template>
  <div class="space-y-4">
    <div
      v-for="item in itemCount"
      :key="item"
      data-testid="list-skeleton-item"
      class="flex items-start gap-4 rounded-2xl border border-gray-200/80 bg-white p-4 dark:border-gray-800 dark:bg-gray-900"
    >
      <USkeleton
        v-if="showThumbnail"
        class="h-20 w-20 flex-shrink-0 rounded-2xl"
      />

      <div class="min-w-0 flex-1 space-y-3">
        <USkeleton v-if="showMeta" class="h-4 w-24 rounded-full" />
        <USkeleton class="h-5 w-5/6 rounded-full" />
        <USkeleton class="h-4 w-full rounded-full" />
        <USkeleton class="h-4 w-2/3 rounded-full" />
      </div>
    </div>
  </div>
</template>
