<script setup lang="ts">
withDefaults(defineProps<{
  showMedia?: boolean;
  showActions?: boolean;
  overlayCard?: boolean;
}>(), {
  showMedia: true,
  showActions: true,
  overlayCard: false,
});
</script>

<template>
  <section class="relative overflow-hidden rounded-[2rem] border border-gray-200/80 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900 lg:p-10">
    <div class="grid items-center gap-8 lg:grid-cols-[1.1fr_0.9fr]">
      <div class="space-y-5">
        <USkeleton class="h-5 w-28 rounded-full" />
        <USkeleton class="h-10 w-full max-w-2xl rounded-full" />
        <USkeleton class="h-10 w-4/5 max-w-xl rounded-full" />
        <USkeleton class="h-5 w-full max-w-2xl rounded-full" />
        <USkeleton class="h-5 w-5/6 max-w-xl rounded-full" />

        <div v-if="showActions" class="flex flex-wrap gap-3 pt-2">
          <USkeleton class="h-12 w-36 rounded-full" />
          <USkeleton class="h-12 w-32 rounded-full" />
        </div>
      </div>

      <div v-if="showMedia" class="relative">
        <USkeleton class="h-[340px] w-full rounded-[1.75rem] lg:h-[420px]" />
        <div
          v-if="overlayCard"
          class="absolute bottom-5 left-5 right-5 rounded-3xl border border-white/50 bg-white/85 p-5 backdrop-blur dark:border-gray-700 dark:bg-gray-900/85"
        >
          <USkeleton class="h-5 w-2/5 rounded-full" />
          <USkeleton class="mt-3 h-4 w-full rounded-full" />
          <USkeleton class="mt-2 h-4 w-4/5 rounded-full" />
        </div>
      </div>
    </div>
  </section>
</template>
