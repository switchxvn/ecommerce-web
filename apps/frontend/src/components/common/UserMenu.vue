<script setup lang="ts">
import { ref, computed } from 'vue';
import { useAuth } from '~/composables/useAuth';
import Icon from '../ui/Icon.vue';
import { AUTH_ROUTE_PATHS } from '~/utils/routes';

const { user } = useAuth();
const isOpen = ref(false);

const userDisplayName = computed(() => {
  if (!user.value) return '';
  return user.value.profile?.firstName || user.value.email?.split('@')[0] || '';
});

const toggleMenu = () => {
  isOpen.value = !isOpen.value;
};

const closeMenu = () => {
  isOpen.value = false;
};
</script>

<template>
  <div class="relative">
    <!-- User Menu Button -->
    <button
      class="flex items-center gap-2 text-neutral-700 dark:text-neutral-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
      @click="toggleMenu"
    >
      <Icon name="User" class="h-5 w-5" />
      <span class="text-sm font-medium">{{ userDisplayName || 'Đăng nhập' }}</span>
      <Icon
        name="ChevronDown"
        class="h-4 w-4 transition-transform duration-200"
        :class="{ 'rotate-180': isOpen }"
      />
    </button>

    <!-- Dropdown Menu -->
    <Transition
      enter-active-class="transition duration-100 ease-out"
      enter-from-class="transform scale-95 opacity-0"
      enter-to-class="transform scale-100 opacity-100"
      leave-active-class="transition duration-75 ease-out"
      leave-from-class="transform scale-100 opacity-100"
      leave-to-class="transform scale-95 opacity-0"
    >
      <div
        v-if="isOpen"
        class="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white dark:bg-neutral-800 ring-1 ring-black ring-opacity-5 z-50"
      >
        <div class="py-1" role="menu">
          <!-- Not Logged In -->
          <template v-if="!user">
            <NuxtLink
              :to="AUTH_ROUTE_PATHS.login"
              class="block px-4 py-2 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700"
              role="menuitem"
              @click="closeMenu"
            >
              Đăng nhập
            </NuxtLink>
            <NuxtLink
              :to="AUTH_ROUTE_PATHS.register"
              class="block px-4 py-2 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700"
              role="menuitem"
              @click="closeMenu"
            >
              Đăng ký
            </NuxtLink>
          </template>

          <!-- Logged In -->
          <template v-else>
            <NuxtLink
              :to="AUTH_ROUTE_PATHS.dashboard"
              class="block px-4 py-2 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700"
              role="menuitem"
              @click="closeMenu"
            >
              Dashboard
            </NuxtLink>
            <NuxtLink
              :to="AUTH_ROUTE_PATHS.dashboard"
              class="block px-4 py-2 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700"
              role="menuitem"
              @click="closeMenu"
            >
              Đơn hàng của tôi
            </NuxtLink>
            <button
              class="w-full text-left px-4 py-2 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700"
              role="menuitem"
              @click="closeMenu"
            >
              Đăng xuất
            </button>
          </template>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.router-link-active {
  @apply text-primary-600 dark:text-primary-400;
}
</style> 
