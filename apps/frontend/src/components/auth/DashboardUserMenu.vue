<template>
  <div class="relative">
    <button
      type="button"
      class="flex items-center gap-3 text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
      @click="isOpen = !isOpen"
    >
      <span class="sr-only">Open user menu</span>
      <div class="relative w-10 h-10 overflow-hidden bg-gray-100 dark:bg-neutral-700 rounded-full ring-2 ring-white dark:ring-neutral-600">
        <img
          v-if="user?.avatar"
          :src="user.avatar"
          :alt="userDisplayName"
          class="w-full h-full object-cover"
        />
        <svg
          v-else
          class="absolute w-full h-full text-gray-400"
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            d="M12 12C14.2091 12 16 10.2091 16 8C16 5.79086 14.2091 4 12 4C9.79086 4 8 5.79086 8 8C8 10.2091 9.79086 12 12 12Z"
          />
          <path
            d="M12 14C8.13401 14 5 17.134 5 21H19C19 17.134 15.866 14 12 14Z"
          />
        </svg>
      </div>
      <div class="hidden md:block text-left">
        <div class="text-sm font-medium text-gray-900 dark:text-white">
          {{ userDisplayName }}
        </div>
        <div class="text-xs text-gray-500 dark:text-gray-400">
          {{ user?.email }}
        </div>
      </div>
    </button>

    <!-- Dropdown menu -->
    <div
      v-if="isOpen"
      class="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white dark:bg-neutral-800 py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none divide-y divide-gray-100 dark:divide-neutral-700"
      role="menu"
      aria-orientation="vertical"
      aria-labelledby="user-menu-button"
      tabindex="-1"
      @click.outside="isOpen = false"
    >
      <!-- User Info in Dropdown -->
      <div class="px-4 py-2 border-b border-neutral-200 dark:border-neutral-700">
        <div class="text-sm font-medium text-neutral-900 dark:text-white">
          {{ userDisplayName }}
        </div>
        <div class="text-xs text-neutral-500 dark:text-neutral-400">
          {{ user?.email }}
        </div>
      </div>

      <div class="py-1">
        <NuxtLink
          to="/dashboard"
          class="group flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-neutral-700"
          role="menuitem"
          @click="isOpen = false"
        >
          <UserCircle class="mr-3 h-4 w-4 text-gray-400 group-hover:text-gray-500" />
          Dashboard
        </NuxtLink>
        <NuxtLink
          to="/dashboard"
          class="group flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-neutral-700"
          role="menuitem"
          @click="isOpen = false"
        >
          <Settings class="mr-3 h-4 w-4 text-gray-400 group-hover:text-gray-500" />
          Cài đặt
        </NuxtLink>
      </div>

      <div class="py-1">
        <button
          class="group flex w-full items-center px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
          role="menuitem"
          @click="handleLogout"
        >
          <LogOut class="mr-3 h-4 w-4 text-red-400 group-hover:text-red-500" />
          Đăng xuất
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useAuth } from '@/composables/useAuth';
import { useRouter } from 'vue-router';
import {
  UserCircle,
  Settings,
  LogOut
} from 'lucide-vue-next';

const router = useRouter();
const { user, logout, checkAuth } = useAuth();
const isOpen = ref(false);

const userDisplayName = computed(() => {
  if (!user.value) return '';
  return user.value.profile?.firstName || user.value.email;
});

onMounted(() => {
  // Check auth state when component mounts
  checkAuth();
});

const handleLogout = async () => {
  try {
    await logout();
    isOpen.value = false;
    router.push('/auth/login');
  } catch (error) {
    console.error('Logout failed:', error);
  }
};
</script> 
