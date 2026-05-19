<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from "vue";
import { useMenuItems } from '../../composables/useMenuItems';
import type { MenuItem, MenuColumn } from '@ew/shared';
import Icon from './Icon.vue';

// Props cho component
interface NavbarProps {
  logo?: string;
  hotline?: string;
}


// Scroll behavior
const isScrolled = ref(false);
const lastScrollPosition = ref(0);
const isNavbarVisible = ref(true);

// Menu items from composable
const { menuItems, isLoading, error, fetchMenuItems } = useMenuItems();

// Process menu items for display
interface ProcessedMenuItem extends MenuItem {
  megaMenuColumns: MenuColumn[];
}

const processedMenuItems = computed<ProcessedMenuItem[]>(() => {
  return menuItems.value
    .filter(item => item.isActive !== false)
    .sort((a, b) => (a.order || 0) - (b.order || 0))
    .map(item => ({
      ...item,
      href: item.href || '#',
      hasMegaMenu: Boolean(item.hasMegaMenu),
      megaMenuColumns: item.megaMenuColumns || []
    }));
});

// Active mega menu
const activeMegaMenu = ref<number | null>(null);
const megaMenuTimeout = ref<number | null>(null);

const showMegaMenu = (index: number) => {
  if (megaMenuTimeout.value) {
    clearTimeout(megaMenuTimeout.value);
    megaMenuTimeout.value = null;
  }
  activeMegaMenu.value = index;
};

const hideMegaMenu = () => {
  megaMenuTimeout.value = window.setTimeout(() => {
    activeMegaMenu.value = null;
  }, 300);
};

const keepMegaMenu = () => {
  if (megaMenuTimeout.value) {
    clearTimeout(megaMenuTimeout.value);
    megaMenuTimeout.value = null;
  }
};

// Mobile menu state
const isMobileMenuOpen = ref(false);

const toggleMobileMenu = () => {
  isMobileMenuOpen.value = !isMobileMenuOpen.value;
};

// Scroll handler
const handleScroll = () => {
  const currentScrollPosition = window.scrollY;
  isScrolled.value = currentScrollPosition > 50;

  if (currentScrollPosition < 0) return;

  if (currentScrollPosition > lastScrollPosition.value + 50) {
    isNavbarVisible.value = false;
  } else if (currentScrollPosition < lastScrollPosition.value - 10) {
    isNavbarVisible.value = true;
  }

  lastScrollPosition.value = currentScrollPosition;
};

// Computed classes for navbar
const navbarClasses = computed(() => ({
  "shadow-md": isScrolled.value,
  "bg-background/95 backdrop-blur-sm": isScrolled.value,
  "bg-background": !isScrolled.value,
  "translate-y-0 opacity-100": isNavbarVisible.value,
  "-translate-y-full opacity-0": !isNavbarVisible.value,
}));

// Lifecycle hooks
onMounted(() => {
  window.addEventListener("scroll", handleScroll);
  fetchMenuItems();
});

onUnmounted(() => {
  window.removeEventListener("scroll", handleScroll);
});
</script>

<template>
  <header
    class="navbar fixed top-0 left-0 right-0 z-50 transition-all duration-300"
    :class="navbarClasses"
  >
    <div class="container mx-auto px-4 relative">
      <div class="flex h-16 items-center justify-between">
        <!-- Logo -->
        <div class="flex items-center">
          <NuxtLink to="/" class="flex items-center space-x-2">
            <img
              :src="logo"
              alt="Logo"
              class="h-8 w-auto transition-transform duration-300 hover:scale-110"
            />
            <span class="font-bold text-xl hidden sm:inline-block">E-Commerce</span>
          </NuxtLink>
        </div>

        <!-- Desktop Navigation -->
        <nav class="hidden md:flex items-center space-x-6">
          <InlineMenuSkeleton v-if="isLoading" :item-count="4" />
          <div v-else-if="error" class="text-sm text-red-500">{{ error }}</div>
          <template v-else>
            <!-- eslint-disable-next-line vue/valid-v-for -->
            <div
              v-for="(item, index) in processedMenuItems"
              :key="item.id || `menu-item-${index}`"
              class="relative group"
              @mouseenter="item.hasMegaMenu ? showMegaMenu(index) : null"
              @mouseleave="item.hasMegaMenu ? hideMegaMenu() : null"
            >
              <NuxtLink
                :to="item.href"
                class="navbar__link text-sm font-medium py-5 flex items-center space-x-1"
              >
                <span>{{ item.label }}</span>
                <Icon
                  v-if="item.hasMegaMenu"
                  name="ChevronDown"
                  class="transition-transform duration-300 group-hover:rotate-180 h-4 w-4"
                />
              </NuxtLink>

              <!-- Mega Menu -->
              <div
                v-if="item.hasMegaMenu && activeMegaMenu === index"
                class="navbar__megamenu absolute top-full left-1/2 w-screen max-w-4xl shadow-lg rounded-b-lg border-t transition-all duration-300 transform origin-top z-50"
                style="transform: translateX(-50%)"
                @mouseenter="keepMegaMenu"
                @mouseleave="hideMegaMenu"
              >
                <div class="grid grid-cols-3 gap-6 p-6">
                  <div
                    v-for="(column, columnIndex) in item.megaMenuColumns || []"
                    :key="`column-${columnIndex}-${column.title}`"
                    class="space-y-3"
                  >
                    <h3 class="navbar__megamenu-title font-medium text-sm">{{ column.title }}</h3>
                    <ul class="space-y-2">
                      <li 
                        v-for="(subItem, subIndex) in column.items" 
                        :key="`subitem-${subIndex}-${subItem.href}`"
                        class="block"
                      >
                        <NuxtLink
                          :to="subItem.href"
                          class="navbar__megamenu-item block py-1.5 px-2 rounded-md text-sm"
                          @click="activeMegaMenu = null"
                        >
                          {{ subItem.label }}
                        </NuxtLink>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </template>
        </nav>

        <!-- Hotline -->
        <div class="hidden md:flex items-center">
          <a :href="`tel:${hotline}`" class="navbar__link flex items-center space-x-2 text-sm">
            <Icon
              name="Phone"
              class="text-primary h-[18px] w-[18px] dark:text-blue-400"
            />
            <span class="font-medium">{{ hotline }}</span>
          </a>
        </div>

        <!-- Mobile Menu Button -->
        <button
          class="navbar__link md:hidden flex items-center"
          @click="toggleMobileMenu"
          aria-label="Toggle Menu"
        >
          <Icon
            :name="isMobileMenuOpen ? 'X' : 'Menu'"
            class="h-6 w-6"
          />
        </button>
      </div>
    </div>

    <!-- Mobile Menu -->
    <div
      class="navbar__mobile-menu md:hidden"
      :class="{ hidden: !isMobileMenuOpen }"
    >
      <div class="px-4 py-3 space-y-1">
        <InlineMenuSkeleton v-if="isLoading" :item-count="5" mobile />
        <div v-else-if="error" class="text-sm text-red-500 px-3 py-2">{{ error }}</div>
        <template v-else>
          <!-- eslint-disable-next-line vue/valid-v-for -->
          <NuxtLink
            v-for="(item, index) in processedMenuItems"
            :key="item.id || `mobile-menu-${index}`"
            :to="item.href"
            class="navbar__link block px-3 py-2 text-base font-medium rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
            @click="isMobileMenuOpen = false"
          >
            {{ item.label }}
          </NuxtLink>
        </template>
      </div>
      <div class="px-4 py-3 border-t dark:border-gray-700">
        <a :href="`tel:${hotline}`" class="navbar__link flex items-center space-x-2 px-3 py-2">
          <Icon
            name="Phone"
            class="text-primary h-[18px] w-[18px] dark:text-blue-400"
          />
          <span class="font-medium">{{ hotline }}</span>
        </a>
      </div>
    </div>
  </header>

  <!-- Spacer to prevent content from being hidden under fixed navbar -->
  <div class="h-16"></div>
</template>
