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
      <div class="flex justify-center items-center min-h-screen">
        <Loader size="lg" />
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
          <ClientOnly>
            <component
              v-if="section.isActive"
              :is="resolveComponent(section)"
              :section="section"
              :config="getSectionConfig(section)"
            />
            <template #fallback>
              <div class="p-4 text-center">
                <Loader />
              </div>
            </template>
          </ClientOnly>
        </template>
      </template>
    </template>
  </div>
</template>

<style lang="scss">
@import "@/assets/styles/components/HomePage.scss";
</style> 