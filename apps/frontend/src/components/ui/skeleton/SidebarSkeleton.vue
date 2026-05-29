<script setup lang="ts">
withDefaults(defineProps<{
  sectionCount?: number;
  itemsPerSection?: number;
}>(), {
  sectionCount: 3,
  itemsPerSection: 5,
});
</script>

<template>
  <div class="space-y-6">
    <section
      v-for="section in sectionCount"
      :key="section"
      data-testid="sidebar-skeleton-section"
      class="rounded-3xl border border-gray-200/80 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900"
    >
      <div class="space-y-4">
        <USkeleton class="h-6 w-1/2 rounded-full" />
        <div class="space-y-3">
          <USkeleton
            v-for="item in itemsPerSection"
            :key="item"
            class="h-4 w-full rounded-full"
          />
        </div>
      </div>
    </section>
  </div>
</template>
