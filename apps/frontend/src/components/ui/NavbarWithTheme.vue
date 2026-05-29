<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, nextTick } from "vue";
import { useMenuItems } from "~/composables/useMenuItems";
import type { MenuItem as BaseMenuItem } from "@ew/shared";
import Icon from "./Icon.vue";
import ThemeToggle from "~/components/common/ThemeToggle.vue";
import LanguageSwitcher from "~/components/common/LanguageSwitcher.vue";
import CartIcon from "~/components/cart/CartIcon.vue";
import { useRoute } from "vue-router";
import { useFeatureFlags } from "~/composables/useFeatureFlags";
import { useLocalization } from "~/composables/useLocalization";
import { useLogo } from "~/composables/useLogo";

// Props cho component
interface NavbarProps {
  hotline?: string;
}

const props = withDefaults(defineProps<NavbarProps>(), {
  hotline: "0917 001 254",
});

// Lấy route hiện tại
const route = useRoute();

// Feature flags
const { isFeatureEnabled } = useFeatureFlags();
const isCartEnabled = ref<boolean | null>(null);
const isLoadingFeatureFlag = ref(true);

// Localization
const { locale } = useLocalization();

// Logo
const { currentLogoUrl, logo, isLoading: isLoadingLogo } = useLogo();

// Kiểm tra feature flag enable_add_to_cart
const checkCartFeatureFlag = async () => {
  try {
    isLoadingFeatureFlag.value = true;
    isCartEnabled.value = await isFeatureEnabled("enable_add_to_cart", true);
  } catch (err) {
    console.error("Error checking cart feature flag:", err);
    isCartEnabled.value = false;
  } finally {
    isLoadingFeatureFlag.value = false;
  }
};

// Scroll behavior
const isScrolled = ref(false);
const lastScrollPosition = ref(0);
const isNavbarVisible = ref(true);

// Menu items from composable
const { menuItems, isLoading, error, fetchMenuItems } = useMenuItems();

// Update interfaces
interface Translation {
  id?: number;
  locale: string;
  label: string;
  href: string;
  menuItemId?: number;
  createdAt?: string;
  updatedAt?: string;
}

interface MenuItem extends BaseMenuItem {
  translations: Translation[];
  defaultLocale?: string;
}

interface MenuColumn {
  title: string;
  items: {
    href: string;
    label: string;
  }[];
}

interface ProcessedMenuItem extends MenuItem {
  megaMenuColumns: MenuColumn[];
  href: string;
  hasMegaMenu: boolean;
  label: string;
}

const processedMenuItems = computed<ProcessedMenuItem[]>(() => {
  // Get parent menu items first
  const parentMenuItems = menuItems.value
    .filter(item => !item.parentId && item.isActive !== false)
    .sort((a, b) => (a.order || 0) - (b.order || 0));

  // Process each parent menu item
  return parentMenuItems.map(item => {
    const menuItem = item as MenuItem;
    // Get child menu items
    const childItems = menuItems.value
      .filter(child => child.parentId === item.id && child.isActive !== false)
      .sort((a, b) => (a.order || 0) - (b.order || 0));

    // Check if this menu item has children (mega menu)
    const hasMegaMenu = childItems.length > 0;

    // Get translation for current item
    const currentTranslation = menuItem.translations?.find(t => t.locale === locale.value) || 
      menuItem.translations?.[0];

    // Group child items into columns (3 items per column)
    const itemsPerColumn = 3;
    const megaMenuColumns = hasMegaMenu ? Array.from({ length: Math.ceil(childItems.length / itemsPerColumn) }, (_, columnIndex) => {
      const startIndex = columnIndex * itemsPerColumn;
      const columnItems = childItems.slice(startIndex, startIndex + itemsPerColumn);
      return {
        title: getTranslation(menuItem, locale.value), // Use parent item's label as column title
        items: columnItems.map(child => {
          const childTranslation = child.translations?.find(t => t.locale === locale.value) || 
            child.translations?.[0];
          return {
            href: childTranslation?.href || "#",
            label: getTranslation(child, locale.value)
          };
        })
      };
    }) : [];

    return {
      ...menuItem,
      href: currentTranslation?.href || "#",
      hasMegaMenu,
      megaMenuColumns,
      label: getTranslation(menuItem, locale.value)
    } as ProcessedMenuItem;
  });
});

// Update getTranslation function
const getTranslation = (item: { translations: Translation[]; defaultLocale?: string }, targetLocale: string): string => {
  if (!item.translations || item.translations.length === 0) {
    return '';
  }

  const translation = item.translations.find((t) => t.locale === targetLocale);
  if (translation) {
    return translation.label;
  }

  // Fallback to default locale if translation not found
  const defaultTranslation = item.translations.find(
    (t) => t.locale === (item.defaultLocale || 'vi')
  );
  if (defaultTranslation) {
    return defaultTranslation.label;
  }

  return item.translations[0]?.label || '';
};

// Kiểm tra xem menu có active không
const isMenuActive = (href: string) => {
  if (href === "/") {
    return route.path === "/";
  }
  return href !== "/" && route.path.startsWith(href);
};

// Active mega menu
const activeMegaMenu = ref<number | null>(null);
const megaMenuTimeout = ref<number | null>(null);

const showMegaMenu = (id: number) => {
  if (megaMenuTimeout.value) {
    clearTimeout(megaMenuTimeout.value);
    megaMenuTimeout.value = null;
  }
  activeMegaMenu.value = id;
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
  "shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),_0_10px_20px_-2px_rgba(0,0,0,0.04)]":
    isScrolled.value,
  "translate-y-0 opacity-100": isNavbarVisible.value,
  "-translate-y-full opacity-0": !isNavbarVisible.value,
}));

const navbarRef = ref<HTMLElement | null>(null);
const navbarHeight = ref(64); // Default height

// Update navbar height when mounted and on resize
const updateNavbarHeight = () => {
  if (navbarRef.value) {
    navbarHeight.value = navbarRef.value.offsetHeight;
  }
};

// Lifecycle hooks
onMounted(() => {
  window.addEventListener("scroll", handleScroll);
  window.addEventListener("resize", updateNavbarHeight);
  fetchMenuItems();
  checkCartFeatureFlag();
  
  // Update navbar height after the component is mounted
  nextTick(() => {
    updateNavbarHeight();
  });
});

onUnmounted(() => {
  window.removeEventListener("scroll", handleScroll);
  window.removeEventListener("resize", updateNavbarHeight);
});

// Watch for locale changes to refetch menu items
watch(locale, () => {
  fetchMenuItems();
});

// Watch for logo changes to update navbar height
watch([logo, isLoadingLogo], () => {
  nextTick(() => {
    updateNavbarHeight();
  });
});
</script>

<template>
  <header
    ref="navbarRef"
    class="fixed top-0 left-0 right-0 z-50 transition-all duration-300 bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800"
    :class="[
      navbarClasses,
      'navbar' // Add navbar class for SCSS styles
    ]"
  >
    <div class="container mx-auto px-4 relative">
      <div class="flex items-center justify-between py-2">
        <!-- Logo -->
        <div class="flex items-center">
          <NuxtLink to="/" class="flex items-center space-x-2">
            <div 
              class="flex items-center justify-center" 
              :style="logo ? `width: ${logo.width}px; height: ${logo.height}px` : ''"
            >
              <img
                v-if="currentLogoUrl"
                :src="currentLogoUrl"
                :alt="logo?.altText || 'Logo'"
                :width="logo?.width"
                :height="logo?.height"
                class="transition-transform duration-300 hover:scale-110 object-contain w-full h-full"
              />
              <span v-else-if="isLoadingLogo" class="h-8 w-8 animate-pulse bg-neutral-200 dark:bg-neutral-700 rounded"></span>
            </div>
            
          </NuxtLink>
        </div>

        <!-- Desktop Navigation -->
        <nav class="hidden md:flex items-center space-x-6">
          <InlineMenuSkeleton v-if="isLoading" :item-count="4" />
          <div v-else-if="error" class="text-sm text-red-500">{{ error }}</div>
          <template v-else>
            <div
              v-for="item in processedMenuItems"
              :key="item.id"
              class="relative group"
              @mouseenter="item.hasMegaMenu ? showMegaMenu(item.id) : null"
              @mouseleave="item.hasMegaMenu ? hideMegaMenu() : null"
            >
              <a
                :href="item.href"
                class="main-menu-item text-sm uppercase transition-colors py-5 flex items-center space-x-1"
                :class="{ 'menu-active': isMenuActive(item.href) }"
              >
                <span>{{ getTranslation(item, locale) }}</span>
                <Icon
                  v-if="item.hasMegaMenu"
                  name="ChevronDown"
                  class="transition-transform duration-300 group-hover:rotate-180 h-4 w-4"
                />
              </a>

              <!-- Mega Menu -->
              <div
                v-if="item.hasMegaMenu && activeMegaMenu === item.id"
                class="mega-menu absolute top-full left-1/2 w-screen max-w-4xl shadow-lg rounded-b-lg border-t transition-all duration-300 transform origin-top z-50 bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800"
                style="transform: translateX(-50%)"
                @mouseenter="keepMegaMenu"
                @mouseleave="hideMegaMenu"
              >
                <div class="grid grid-cols-3 gap-6 p-6">
                  <div
                    v-for="(column, columnIndex) in item.megaMenuColumns"
                    :key="columnIndex"
                    class="space-y-3"
                  >
                    <h3 class="font-medium text-sm text-neutral-900 dark:text-neutral-100">
                      {{ column.title }}
                    </h3>
                    <ul class="space-y-2">
                      <li
                        v-for="(subItem, subItemIndex) in column.items"
                        :key="subItemIndex"
                        class="block"
                      >
                        <a
                          :href="subItem.href"
                          class="navbar-megamenu-item block py-1.5 px-2 rounded-md text-sm text-neutral-700 hover:text-primary-600 dark:text-neutral-300 dark:hover:text-primary-400"
                          @click="activeMegaMenu = null"
                        >
                          {{ subItem.label }}
                        </a>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </template>
        </nav>

        <!-- Right side actions -->
        <div class="hidden md:flex items-center space-x-4">
          <!-- Language Switcher -->
          <LanguageSwitcher />

          <!-- Theme Toggle -->
          <ThemeToggle />

          <!-- Cart Icon -->
          <CartIcon v-if="isCartEnabled" />

          <!-- Hotline -->
          <a
            :href="`tel:${hotline}`"
            class="flex items-center space-x-2 text-sm text-neutral-700 dark:text-neutral-300"
          >
            <Icon
              name="Phone"
              class="text-primary-600 dark:text-primary-400 h-[18px] w-[18px]"
            />
            <span class="font-medium">{{ hotline }}</span>
          </a>
        </div>

        <!-- Mobile Menu Button and Theme Toggle -->
        <div class="md:hidden flex items-center space-x-2">
          <!-- Cart Icon for Mobile -->
          <CartIcon v-if="isCartEnabled" />

          <ThemeToggle />

          <button
            class="flex items-center text-neutral-700 dark:text-neutral-300"
            @click="toggleMobileMenu"
            aria-label="Toggle Menu"
          >
            <Icon :name="isMobileMenuOpen ? 'X' : 'Menu'" class="h-6 w-6" />
          </button>
        </div>
      </div>
    </div>

    <!-- Mobile Menu -->
    <div
      class="md:hidden bg-white dark:bg-neutral-900 border-t border-neutral-200 dark:border-neutral-800"
      :class="{ hidden: !isMobileMenuOpen }"
    >
      <div class="px-4 py-3 space-y-1">
        <InlineMenuSkeleton v-if="isLoading" :item-count="5" mobile />
        <div v-else-if="error" class="text-sm text-red-500 px-3 py-2">{{ error }}</div>
        <template v-else>
          <a
            v-for="item in processedMenuItems"
            :key="item.id"
            :href="item.href"
            class="mobile-main-menu-item block px-3 py-2 text-base uppercase rounded-md"
            :class="{ 'mobile-menu-active': isMenuActive(item.href) }"
            @click="isMobileMenuOpen = false"
          >
            {{ getTranslation(item, locale) }}
          </a>
        </template>
      </div>
      <div class="px-4 py-3 border-t border-neutral-200 dark:border-neutral-800">
        <!-- Language Switcher in Mobile Menu -->
        <div class="px-3 py-2 mb-2">
          <LanguageSwitcher />
        </div>

        <a
          :href="`tel:${hotline}`"
          class="flex items-center space-x-2 px-3 py-2 text-neutral-700 dark:text-neutral-300"
        >
          <Icon name="Phone" class="text-primary-600 dark:text-primary-400 h-[18px] w-[18px]" />
          <span class="font-medium">{{ hotline }}</span>
        </a>
      </div>
    </div>
  </header>

  <!-- Spacer to prevent content from being hidden under fixed navbar -->
  <div :style="`height: ${navbarHeight}px`"></div>
</template>
