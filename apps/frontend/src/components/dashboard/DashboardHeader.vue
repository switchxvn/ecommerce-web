<template>
  <header class="bg-white dark:bg-neutral-800 shadow-sm">
    <div class="mx-auto px-4 sm:px-6 lg:px-8 py-2">
      <div class="flex justify-between items-center h-20">
        <!-- Left side - Brand -->
        <div class="flex">
          <NuxtLink to="/dashboard" class="flex items-center">
            <div 
              class="flex items-center justify-center"
              :style="logo ? `width: ${Math.min(logo.width * 1.5, 200)}px; height: ${Math.min(logo.height * 1.5, 60)}px` : ''"
            >
              <img
                v-if="currentLogoUrl"
                :src="currentLogoUrl"
                :alt="logo?.altText || 'Logo'"
                :width="logo?.width"
                :height="logo?.height"
                class="transition-transform duration-300 hover:scale-110 object-contain w-full h-full max-h-[60px]"
              />
              <span
                v-else-if="isLoadingLogo"
                class="h-12 w-12 animate-pulse bg-neutral-200 dark:bg-neutral-700 rounded"
              ></span>
              <span v-else class="text-xl font-bold text-gray-900 dark:text-white">Dashboard</span>
            </div>
          </NuxtLink>
        </div>

        <!-- Right side - User Menu -->
        <div class="flex items-center">
          <DashboardUserMenu />
        </div>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import DashboardUserMenu from '~/components/auth/DashboardUserMenu.vue';
import { useLogo } from '~/composables/useLogo';

// Logo handling
const { currentLogoUrl, logo, isLoading: isLoadingLogo } = useLogo();
</script> 
