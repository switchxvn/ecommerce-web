<script setup lang="ts">
import { computed } from 'vue';

const props = withDefaults(defineProps<{
  itemCount?: number;
  columns?: number;
}>(), {
  itemCount: 6,
  columns: 3,
});

const gridClass = computed(() => ({
  'grid-cols-2 md:grid-cols-3': props.columns === 3,
  'grid-cols-2 md:grid-cols-4': props.columns === 4,
  'grid-cols-2 md:grid-cols-3 xl:grid-cols-5': props.columns >= 5,
}));
</script>

<template>
  <div class="grid gap-4" :class="gridClass">
    <USkeleton
      v-for="item in itemCount"
      :key="item"
      data-testid="gallery-skeleton-item"
      class="h-40 w-full rounded-[1.5rem] md:h-52 xl:h-64"
    />
  </div>
</template>
