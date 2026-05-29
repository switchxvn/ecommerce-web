<script setup lang="ts">
import { computed } from 'vue';

const props = withDefaults(defineProps<{
  itemCount?: number;
  columns?: number;
  showHeader?: boolean;
  centeredHeader?: boolean;
  showCardMeta?: boolean;
  showCardAction?: boolean;
  showMedia?: boolean;
  mediaHeightClass?: string;
}>(), {
  itemCount: 4,
  columns: 4,
  showHeader: false,
  centeredHeader: false,
  showCardMeta: true,
  showCardAction: true,
  showMedia: true,
  mediaHeightClass: 'h-56',
});

const gridClass = computed(() => {
  const cols = props.columns;
  return {
    'grid-cols-1 sm:grid-cols-2': cols <= 2,
    'grid-cols-1 sm:grid-cols-2 md:grid-cols-3': cols === 3,
    'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4': cols === 4,
    'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5': cols === 5,
    'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6': cols >= 6,
  };
});
</script>

<template>
  <div class="space-y-8">
    <SectionHeaderSkeleton
      v-if="showHeader"
      :centered="centeredHeader"
      show-action
    />

    <div class="grid gap-6" :class="gridClass">
      <div
        v-for="item in itemCount"
        :key="item"
        data-testid="card-grid-skeleton-item"
        class="overflow-hidden rounded-3xl border border-gray-200/80 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900"
      >
        <USkeleton
          v-if="showMedia"
          :class="[mediaHeightClass, 'w-full rounded-2xl']"
        />

        <div class="space-y-3" :class="showMedia ? 'mt-4' : ''">
          <USkeleton v-if="showCardMeta" class="h-4 w-24 rounded-full" />
          <USkeleton class="h-6 w-4/5 rounded-full" />
          <USkeleton class="h-4 w-full rounded-full" />
          <USkeleton class="h-4 w-3/4 rounded-full" />

          <div v-if="showCardAction" class="flex items-center justify-between pt-3">
            <USkeleton class="h-5 w-24 rounded-full" />
            <USkeleton class="h-10 w-28 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
