<!-- Clone from NavbarWithTheme.vue but remove logo section -->
<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, nextTick } from "vue";
import { useMenuItems } from "~/composables/useMenuItems";
import type { MenuItem } from "@ew/shared";
import Icon from "./Icon.vue";
import ThemeToggle from "~/components/common/ThemeToggle.vue";
import LanguageSwitcher from "~/components/common/LanguageSwitcher.vue";
import CartIcon from "~/components/cart/CartIcon.vue";
import { useRoute } from "vue-router";
import { useFeatureFlags } from "~/composables/useFeatureFlags";
import { useLocalization } from "~/composables/useLocalization";

// Props cho component
interface NavbarProps {
  settings?: {
    backgroundColor?: string;
    textColor?: string;
    borderColor?: string;
    menuAlignment?: string;
    showLanguageSwitcher?: boolean;
    showThemeToggle?: boolean;
    showCart?: boolean;
    mobileMenuBreakpoint?: string;
  };
}

const props = withDefaults(defineProps<NavbarProps>(), {
  settings: () => ({
    backgroundColor: "",
    textColor: "",
    borderColor: "",
    menuAlignment: "center",
    showLanguageSwitcher: true,
    showThemeToggle: true,
    showCart: true,
    mobileMenuBreakpoint: "md"
  })
});

// Lấy route hiện tại
const route = useRoute();

// Feature flags
const { isFeatureEnabled } = useFeatureFlags();
const isCartEnabled = ref<boolean | null>(null);
const isLoadingFeatureFlag = ref(true);

// Localization
const { locale } = useLocalization();

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

// Định nghĩa interface cho translations
interface Translation {
  id: number;
  locale: string;
  label: string;
  menuItemId: number;
  createdAt: string;
  updatedAt: string;
}

// Định nghĩa interface cho translatable item
interface TranslatableItem {
  label: string;
  defaultLocale: string;
  translations?: Translation[];
}

// Định nghĩa interface cho menu column với translations
interface MenuColumn {
  title: string;
  titleTranslations?: Translation[];
  items: MenuColumnItem[];
}

// Định nghĩa interface cho menu column item
interface MenuColumnItem extends TranslatableItem {
  href: string;
}

// Định nghĩa interface cho menu item với translations
interface MenuItemWithTranslations extends MenuItem, TranslatableItem {
  id: number;
  megaMenuColumns?: {
    title: string;
    titleTranslations?: Translation[];
    items: {
      href: string;
      label: string;
      translations?: Translation[];
    }[];
  }[];
}

// Định nghĩa interface cho menu item đã được xử lý
interface ProcessedMenuItem extends MenuItemWithTranslations {
  megaMenuColumns: MenuColumn[];
  href: string;
  hasMegaMenu: boolean;
}

// Process menu items with translations
const processedMenuItems = computed(() => {
  return menuItems.value
    .filter((item) => item.isActive !== false)
    .sort((a, b) => (a.order || 0) - (b.order || 0))
    .map((item) => ({
      ...item,
      href: item.href || "#",
      hasMegaMenu: Boolean(item.hasMegaMenu),
      label: getTranslation(item, locale.value),
      megaMenuColumns: (item.megaMenuColumns || []).map((column) => ({
        title: getColumnTitleTranslation(column, locale.value),
        items: column.items.map((subItem) => ({
          href: subItem.href || "#",
          label: getTranslation(subItem, locale.value)
        }))
      }))
    }));
});

// Hàm lấy bản dịch theo ngôn ngữ
const getTranslation = (item: any, targetLocale: string) => {
  if (!item.translations || item.translations.length === 0) {
    return item.label;
  }

  const translation = item.translations.find((t: any) => t.locale === targetLocale);
  if (translation) {
    return translation.label;
  }

  const defaultTranslation = item.translations.find(
    (t: any) => t.locale === item.defaultLocale
  );
  if (defaultTranslation) {
    return defaultTranslation.label;
  }

  return item.label;
};

// Hàm lấy bản dịch cho tiêu đề menu
const getColumnTitleTranslation = (column: any, targetLocale: string) => {
  if (!column.titleTranslations || column.titleTranslations.length === 0) {
    return column.title;
  }

  const translation = column.titleTranslations.find((t: any) => t.locale === targetLocale);
  return translation?.label || column.title;
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

  // Always keep navbar visible
  isNavbarVisible.value = true;
};

// Computed classes for navbar
const navbarClasses = computed(() => ({
  "shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),_0_10px_20px_-2px_rgba(0,0,0,0.04)]": isScrolled.value
}));

const navbarRef = ref<HTMLElement | null>(null);
const navbarHeight = ref(64); // Default height

// Update navbar height when mounted and on resize
const updateNavbarHeight = () => {
  if (navbarRef.value) {
    navbarHeight.value = navbarRef.value.offsetHeight;
  }
};

// Computed styles based on settings
const navbarStyles = computed(() => {
  const styles: Record<string, string> = {};
  
  if (props.settings?.backgroundColor) {
    styles.backgroundColor = props.settings.backgroundColor;
  }
  if (props.settings?.textColor) {
    styles.color = props.settings.textColor;
  }
  if (props.settings?.borderColor) {
    styles.borderColor = props.settings.borderColor;
  }
  
  return styles;
});

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
</script>

<template>
  <header
    ref="navbarRef"
    class="w-full transition-all duration-300 bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800"
    :class="[
      navbarClasses,
      'navbar',
      `text-${props.settings?.menuAlignment || 'center'}`
    ]"
    :style="navbarStyles"
  >
    <div class="container mx-auto px-4 relative">
      <div class="flex items-center justify-between py-2">
        <!-- Desktop Navigation -->
        <nav class="hidden md:flex items-center space-x-6 flex-grow justify-center">
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
              <NuxtLink
                :to="item.href"
                class="main-menu-item text-sm uppercase transition-colors py-5 flex items-center space-x-1"
                :class="{ 'menu-active': isMenuActive(item.href) }"
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
                        <NuxtLink
                          :to="subItem.href"
                          class="navbar-megamenu-item block py-1.5 px-2 rounded-md text-sm text-neutral-700 hover:text-primary-600 dark:text-neutral-300 dark:hover:text-primary-400"
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

        <!-- Right side actions -->
        <div class="hidden md:flex items-center space-x-4">
          <!-- Language Switcher -->
          <LanguageSwitcher v-if="props.settings?.showLanguageSwitcher" />

          <!-- Theme Toggle -->
          <ThemeToggle v-if="props.settings?.showThemeToggle" />

          <!-- Cart Icon -->
          <CartIcon v-if="props.settings?.showCart && isCartEnabled" />
        </div>

        <!-- Mobile Menu Button and Theme Toggle -->
        <div class="md:hidden flex items-center space-x-2">
          <!-- Cart Icon for Mobile -->
          <CartIcon v-if="props.settings?.showCart && isCartEnabled" />

          <ThemeToggle v-if="props.settings?.showThemeToggle" />

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
          <NuxtLink
            v-for="item in processedMenuItems"
            :key="item.id"
            :to="item.href"
            class="mobile-main-menu-item block px-3 py-2 text-base uppercase rounded-md"
            :class="{ 'mobile-menu-active': isMenuActive(item.href) }"
            @click="isMobileMenuOpen = false"
          >
            {{ item.label }}
          </NuxtLink>
        </template>
      </div>
      <div class="px-4 py-3 border-t border-neutral-200 dark:border-neutral-800">
        <!-- Language Switcher in Mobile Menu -->
        <div v-if="props.settings?.showLanguageSwitcher" class="px-3 py-2 mb-2">
          <LanguageSwitcher />
        </div>
      </div>
    </div>
  </header>
</template>

<style scoped>
.navbar {
  /* Add any additional navbar styles here */
  background-color: white;
}

:deep(.dark) .navbar {
  background-color: #111827;
}

.main-menu-item {
  @apply text-neutral-700 dark:text-neutral-300 hover:text-primary-600 dark:hover:text-primary-400;
}

.menu-active {
  @apply text-primary-600 dark:text-primary-400;
}

.mobile-main-menu-item {
  @apply text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800;
}

.mobile-menu-active {
  @apply bg-neutral-100 dark:bg-neutral-800 text-primary-600 dark:text-primary-400;
}
</style>
