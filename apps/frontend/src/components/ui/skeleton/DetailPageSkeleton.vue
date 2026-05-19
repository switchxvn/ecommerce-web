<script setup lang="ts">
withDefaults(defineProps<{
  showSidebar?: boolean;
  showGallery?: boolean;
  showMeta?: boolean;
}>(), {
  showSidebar: true,
  showGallery: true,
  showMeta: true,
});
</script>

<template>
  <div class="space-y-8">
    <USkeleton class="h-4 w-56 rounded-full" />

    <div class="grid gap-8" :class="showSidebar ? 'lg:grid-cols-[minmax(0,1fr)_320px]' : 'grid-cols-1'">
      <div class="space-y-6 rounded-[2rem] border border-gray-200/80 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900 lg:p-8">
        <div v-if="showGallery" class="grid gap-4 lg:grid-cols-[minmax(0,1fr)_112px]">
          <USkeleton class="h-[320px] w-full rounded-[1.5rem] lg:h-[440px]" />
          <div class="grid grid-cols-4 gap-3 lg:grid-cols-1">
            <USkeleton
              v-for="item in 4"
              :key="item"
              class="h-20 w-full rounded-2xl"
            />
          </div>
        </div>

        <div class="space-y-4">
          <USkeleton class="h-10 w-5/6 rounded-full" />
          <div v-if="showMeta" class="flex flex-wrap gap-3">
            <USkeleton class="h-5 w-24 rounded-full" />
            <USkeleton class="h-5 w-32 rounded-full" />
            <USkeleton class="h-5 w-28 rounded-full" />
          </div>
          <USkeleton class="h-6 w-40 rounded-full" />
          <USkeleton class="h-4 w-full rounded-full" />
          <USkeleton class="h-4 w-full rounded-full" />
          <USkeleton class="h-4 w-4/5 rounded-full" />
          <USkeleton class="h-12 w-44 rounded-full" />
        </div>
      </div>

      <SidebarSkeleton v-if="showSidebar" :section-count="2" :items-per-section="4" />
    </div>
  </div>
</template>
