<script setup lang="ts">
withDefaults(defineProps<{
  itemCount?: number;
  showHeader?: boolean;
}>(), {
  itemCount: 4,
  showHeader: false,
});
</script>

<template>
  <div class="space-y-8">
    <SectionHeaderSkeleton v-if="showHeader" centered show-action />

    <div class="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
      <div
        v-for="item in itemCount"
        :key="item"
        data-testid="carousel-skeleton-item"
        class="space-y-4 rounded-[1.75rem] border border-gray-200/80 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900"
      >
        <USkeleton class="h-56 w-full rounded-[1.5rem]" />
        <USkeleton class="h-5 w-1/3 rounded-full" />
        <USkeleton class="h-6 w-4/5 rounded-full" />
        <USkeleton class="h-4 w-full rounded-full" />
      </div>
    </div>
  </div>
</template>
