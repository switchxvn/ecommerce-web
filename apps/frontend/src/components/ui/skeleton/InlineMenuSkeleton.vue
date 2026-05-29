<script setup lang="ts">
withDefaults(defineProps<{
  itemCount?: number;
  mobile?: boolean;
}>(), {
  itemCount: 5,
  mobile: false,
});
</script>

<template>
  <div
    class="gap-3"
    :class="mobile ? 'flex flex-col px-3 py-2' : 'hidden md:flex md:items-center'"
  >
    <USkeleton
      v-for="item in itemCount"
      :key="item"
      :class="mobile ? 'h-10 w-full rounded-xl' : 'h-5 w-20 rounded-full'"
    />
  </div>
</template>
