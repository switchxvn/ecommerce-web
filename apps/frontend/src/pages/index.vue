<script setup lang="ts">
import { useHomePage } from '../composables/useHomePage';
import { onBeforeUnmount } from 'vue';

const { 
  themeSections, 
  isLoading, 
  error, 
  pageIsMounted,
  resolveComponent,
  cleanup,
  getSectionConfig
} = useHomePage();

// Cleanup khi unmount
onBeforeUnmount(() => {
  cleanup();
});

// SEO được handle tự động bởi middleware global, không cần code thêm
</script>

<template>
  <div class="bg-gray-50 dark:bg-gray-900" v-if="pageIsMounted">
    <template v-if="isLoading">
      <div class="space-y-10 px-4 py-6">
        <HeroSkeleton overlay-card />
        <CardGridSkeleton :item-count="4" :columns="4" />
        <CardGridSkeleton :item-count="3" :columns="3" />
      </div>
    </template>
    <template v-else-if="error">
      <div class="container mx-auto px-4 py-12 text-center">
        {{ error }}
      </div>
    </template>
    <template v-else>
      <template v-if="themeSections && themeSections.length > 0">
        <template v-for="(section, index) in themeSections" :key="`section-${section.id}-${index}`">
          <component
            v-if="section.isActive"
            :is="resolveComponent(section)"
            :section="section"
            :config="getSectionConfig(section)"
          />
        </template>
      </template>
    </template>
  </div>
</template>

<style lang="scss">
@use "@/assets/styles/components/HomePage.scss" as *;
</style> 
