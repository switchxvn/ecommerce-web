<!-- Kết hợp NavbarWithLogoHotline và NavbarWithoutLogo -->
<script setup lang="ts">
import { ref, watch, nextTick, onMounted, computed, onBeforeUnmount } from "vue";
import { useNow, useDateFormat } from "@vueuse/core";
import { useFeatureFlags } from "~/composables/useFeatureFlags";
import { useLocalization } from "~/composables/useLocalization";
import { useLogo } from "~/composables/useLogo";
import { useNavbar } from "~/composables/useNavbar";
import { useNavMenu } from "~/composables/useNavMenu";
import { useNavbarSettings } from "~/composables/useNavbarSettings";
import { useNavbarFeatures } from "~/composables/useNavbarFeatures";
import { useDarkMode } from "~/composables/useDarkMode";
import { useSkeletonGate } from '~/composables/useSkeletonGate';
import Icon from "./Icon.vue";
import ThemeToggle from "~/components/common/ThemeToggle.vue";
import LanguageSwitcher from "~/components/common/LanguageSwitcher.vue";
import CartIcon from "~/components/cart/CartIcon.vue";
import MegaMenu from "~/components/menu/MegaMenu.vue";
import MobileMegaMenu from "~/components/menu/MobileMegaMenu.vue";
import { processColorValue } from '~/utils/color';

// Props cho component
interface NavbarProps {
  settings?: {
    // Header section settings
    headerBackgroundColor?: string;
    slogan?: {
      text: string;
      subText: string;
      additionalText: string;
      fontSize: string;
      fontWeight: string;
    };
    hotlines?: {
      sales: {
        text: string;
        number: string;
        textColor?: string;
        backgroundColor?: string;
      };
      support: {
        text: string;
        number: string;
        textColor?: string;
        backgroundColor?: string;
      };
    };

    // Menu section settings
    menuBackgroundColor?: string;
    textColor?: string;
    borderColor?: string;
    menuAlignment?: string;

    // Global settings
    showLanguageSwitcher?: boolean;
    showThemeToggle?: boolean;
    showCart?: boolean;
    mobileMenuBreakpoint?: string;

    // Dark mode settings
    darkMode?: {
      headerBackgroundColor?: string;
      menuBackgroundColor?: string;
      textColor?: string;
      borderColor?: string;
    };

    // Navigation settings
    navigation?: {
      textColor?: string;
      fontWeight?: string;
      activeTextColor?: string;
    };

    // Top menu settings
    topMenu?: {
      links: {
        label: string;
        href: string;
        textColor: string;
        hoverColor: string;
        isTranslated: boolean;
      }[];
    };
  };
}

const props = withDefaults(defineProps<NavbarProps>(), {
  settings: () => ({
    headerBackgroundColor: "#ffffff",
    slogan: {
      text: "XE NÂNG MGA FORKLIFT LẮP RÁP SKD TẠI VIỆT NAM",
      subText: "ĐỘNG CƠ ISUZU NHẬP KHẨU NỘI ĐỊA TỪ NHẬT BẢN",
      additionalText: "BÁN VÀ CHO THUÊ GIÁ TỐT NHẤT",
      fontSize: "lg",
      fontWeight: "bold",
    },
    hotlines: {
      sales: {
        text: "Mua hàng",
        number: "0901.20.30.70",
      },
      support: {
        text: "Hỗ trợ kỹ thuật",
        number: "028.3620.80.81",
      },
    },
    menuBackgroundColor: "#ffffff",
    textColor: "#000000",
    borderColor: "#e5e7eb",
    menuAlignment: "center",
    showLanguageSwitcher: true,
    showThemeToggle: true,
    showCart: true,
    mobileMenuBreakpoint: "md",
  }),
});

// Dark mode
const { isDark } = useDarkMode();

// Feature flags
const { isFeatureEnabled } = useFeatureFlags();
const isCartEnabled = ref<boolean | null>(null);
const isLoadingFeatureFlag = ref(true);

// Localization
const { locale, t: translate } = useLocalization();

// Logo
const { currentLogoUrl, logo, isLoading: isLoadingLogo } = useLogo();
const { shouldShowSkeleton } = useSkeletonGate();

// Navbar
const {
  isMobileMenuOpen,
  isScrolled,
  navWrapperRef,
  activeMegaMenu,
  activeMobileMegaMenu,
  toggleMobileMenu,
  toggleMobileMegaMenu,
  showMegaMenu,
  hideMegaMenu,
  keepMegaMenu,
  updateBodyPadding,
} = useNavbar();

// Menu
const {
  menuItems,
  isLoading,
  error,
  fetchMenuItems,
  processedMenuItems,
  isMenuActive,
  getColumnTitleTranslation,
  getParentMenuLeftOffset,
} = useNavMenu();

// Settings
const {
  menuBackgroundColor,
  textColor,
  borderColor,
  navigationTextColor,
  navigationActiveTextColor,
} = useNavbarSettings(props.settings);

// Computed color values
const salesBackgroundColor = computed(
  () => processColorValue(props.settings.hotlines?.sales?.backgroundColor) || "#0EA5E9"
);

const salesTextColor = computed(
  () => processColorValue(props.settings.hotlines?.sales?.textColor) || "#ffffff"
);

const supportBackgroundColor = computed(
  () => processColorValue(props.settings.hotlines?.support?.backgroundColor) || "#0EA5E9"
);

const supportTextColor = computed(
  () => processColorValue(props.settings.hotlines?.support?.textColor) || "#ffffff"
);

const tertiaryBorderColor = computed(() => processColorValue("var(--tertiary-900)"));

const darkModeMenuBackground = computed(
  () => processColorValue(props.settings?.darkMode?.menuBackgroundColor) || "#171717"
);

const lightModeMenuBackground = computed(
  () => processColorValue(props.settings?.menuBackgroundColor) || "#ffffff"
);

const primaryHoverColor = computed(() => processColorValue("var(--primary-400)"));
const showLogoSkeleton = computed(() => shouldShowSkeleton.value || isLoadingLogo.value);
const showMenuSkeleton = computed(() => shouldShowSkeleton.value || isLoading.value);

const getNavLinkColor = (isActive: boolean) => ({
  color: isActive ? navigationActiveTextColor : navigationTextColor,
  "--hover-color": primaryHoverColor.value,
});

// Time
const now = useNow();
const formattedTime = useDateFormat(now, "HH:mm:ss - DD/MM/YYYY");

// Features (Time and Cart)
const { checkCartFeatureFlag } = useNavbarFeatures();

// Thêm ref để kiểm soát mounted state
const isMounted = ref(true);

onMounted(() => {
  const init = async () => {
    try {
      await fetchMenuItems();
    } catch (err) {
      console.error("Error fetching menu items:", err);
    }
    await checkCartFeatureFlag();
  };

  init();
});

// Watch for locale changes
watch(locale, () => {
  fetchMenuItems();
});

// Cải thiện cleanup
onBeforeUnmount(() => {
  isMounted.value = false;
  // Cleanup other resources if needed
});

const translateMenuLabel = (label: string, isTranslated = false) => {
  const normalizedLabel = label.trim().toLowerCase();
  const looksLikeTranslationKey = /^[a-z0-9_.-]+$/.test(normalizedLabel) && normalizedLabel.includes(".");

  if (!isTranslated || !looksLikeTranslationKey) {
    return label;
  }

  const translated = translate(normalizedLabel);
  return translated && translated.trim() && translated.trim() !== normalizedLabel
    ? translated
    : label;
};
</script>

<template>
  <div class="navbar-container" v-if="isMounted">
    <!-- Top Menu - New Section -->
    <div class="top-menu w-full border-b relative">
      <div class="top-menu-bg-layer"></div>
      <div class="container mx-auto">
        <div class="flex items-center justify-between h-12">
          <!-- Current Time -->
          <div class="flex items-center gap-2">
            <Icon name="Clock" class="h-4 w-4 text-neutral-500 dark:text-neutral-400" />
            <span class="text-sm font-medium text-neutral-600 dark:text-neutral-300">
              {{ formattedTime }}
            </span>
          </div>

          <!-- Right Actions -->
          <div class="hidden md:flex items-center gap-2">
            <template v-if="props.settings?.topMenu?.links">
              <template
                v-for="(link, index) in props.settings.topMenu.links"
                :key="index"
              >
                <NuxtLink
                  :to="link.href"
                  class="transition-colors duration-300 font-bold uppercase"
                  :style="{
                    color: link.textColor,
                    '--hover-color': link.hoverColor,
                  }"
                >
                  {{ translateMenuLabel(link.label, link.isTranslated) }}
                </NuxtLink>
                <span
                  v-if="index < props.settings.topMenu.links.length - 1"
                  class="text-neutral-500 dark:text-neutral-400"
                  >|</span
                >
              </template>
            </template>
            <div class="flex-shrink-0">
              <LanguageSwitcher v-if="props.settings?.showLanguageSwitcher" />
            </div>
            <div class="flex-shrink-0">
              <ThemeToggle v-if="props.settings?.showThemeToggle" />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Logo + Hotline Section - Hidden on Mobile -->
    <div class="logo-section w-full border-b hidden md:block">
      <div class="container mx-auto px-4">
        <div class="flex items-center justify-between py-4">
          <!-- Logo -->
          <div class="flex-shrink-0">
            <NuxtLink to="/" class="block">
              <div
                class="flex items-center justify-center"
                :style="logo ? `width: ${logo.width}px; height: ${logo.height}px` : ''"
              >
                <span
                  v-if="showLogoSkeleton"
                  class="h-8 w-24 animate-pulse bg-neutral-200 dark:bg-neutral-700 rounded"
                ></span>
                <img
                  v-else-if="currentLogoUrl"
                  :src="currentLogoUrl"
                  :alt="logo?.altText || 'Logo'"
                  :width="logo?.width"
                  :height="logo?.height"
                  class="transition-transform duration-300 hover:scale-110 object-contain w-full h-full"
                />
              </div>
            </NuxtLink>
          </div>

          <!-- Slogan -->
          <div class="flex flex-col items-center justify-center text-center">
            <template v-if="shouldShowSkeleton">
              <div class="h-6 w-80 animate-pulse rounded bg-neutral-200 dark:bg-neutral-700"></div>
              <div class="mt-2 h-5 w-72 animate-pulse rounded bg-neutral-200 dark:bg-neutral-700"></div>
              <div class="mt-2 h-7 w-64 animate-pulse rounded bg-neutral-200 dark:bg-neutral-700"></div>
            </template>
            <h1 v-else-if="props.settings?.slogan" class="text-xl font-bold text-red-600">
              {{ props.settings.slogan.text }}
            </h1>
            <h4
              v-if="!shouldShowSkeleton && props.settings?.slogan"
              class="text-md font-semibold text-black-600"
            >
              {{ props.settings.slogan.subText }}
            </h4>
            <p
              v-if="!shouldShowSkeleton && props.settings?.slogan?.additionalText"
              class="text-2xl font-bold text-red-600"
            >
              {{ props.settings.slogan.additionalText }}
            </p>
          </div>

          <!-- Hotlines -->
          <div class="flex items-center gap-3">
            <template v-if="shouldShowSkeleton">
              <div class="h-16 w-48 animate-pulse rounded-full bg-neutral-200 dark:bg-neutral-700"></div>
              <div class="h-16 w-48 animate-pulse rounded-full bg-neutral-200 dark:bg-neutral-700"></div>
            </template>

            <!-- Mua hàng -->
            <NuxtLink
              v-else-if="props.settings?.hotlines?.sales"
              :to="`tel:${props.settings.hotlines.sales.number}`"
              class="hotline-button group flex items-center gap-3 px-4 py-2.5 rounded-full border border-neutral-200 hover:border-primary-500 transition-all duration-300 shadow-sm hover:shadow-md"
              :style="{
                backgroundColor: salesBackgroundColor,
                color: salesTextColor,
              }"
            >
              <div class="relative">
                <div
                  class="animate-ring absolute -inset-1 rounded-full border-2 opacity-75"
                  :style="{ borderColor: tertiaryBorderColor }"
                ></div>
                <div
                  class="relative flex items-center justify-center rounded-full bg-white/20 p-2"
                >
                  <Icon name="Phone" class="h-5 w-5" :style="{ color: salesTextColor }" />
                </div>
              </div>
              <div class="flex flex-col">
                <span class="text-sm" :style="{ color: salesTextColor }">
                  {{ props.settings.hotlines.sales.text }}
                </span>
                <span class="text-lg font-bold" :style="{ color: salesTextColor }">
                  {{ props.settings.hotlines.sales.number }}
                </span>
              </div>
            </NuxtLink>

            <!-- Hỗ trợ kỹ thuật -->
            <NuxtLink
              v-if="!shouldShowSkeleton && props.settings?.hotlines?.support"
              :to="`tel:${props.settings.hotlines.support.number}`"
              class="hotline-button group flex items-center gap-3 px-4 py-2.5 rounded-full border border-neutral-200 hover:border-primary-500 transition-all duration-300 shadow-sm hover:shadow-md"
              :style="{
                backgroundColor: supportBackgroundColor,
                color: supportTextColor,
              }"
            >
              <div class="relative">
                <div
                  class="animate-ring absolute -inset-1 rounded-full border-2 opacity-75"
                  :style="{ borderColor: tertiaryBorderColor }"
                ></div>
                <div
                  class="relative flex items-center justify-center rounded-full bg-white/20 p-2"
                >
                  <Icon
                    name="Phone"
                    class="h-5 w-5"
                    :style="{ color: supportTextColor }"
                  />
                </div>
              </div>
              <div class="flex flex-col">
                <span class="text-sm" :style="{ color: supportTextColor }">
                  {{ props.settings.hotlines.support.text }}
                </span>
                <span class="text-lg font-bold" :style="{ color: supportTextColor }">
                  {{ props.settings.hotlines.support.number }}
                </span>
              </div>
            </NuxtLink>
          </div>
        </div>
      </div>
    </div>

    <!-- Navigation Section -->
    <div
      ref="navWrapperRef"
      class="nav-wrapper w-full"
      :class="{ 'nav-sticky': isScrolled }"
    >
      <nav
        class="navigation-section w-full relative"
        :style="{
          backgroundColor: isDark ? darkModeMenuBackground : lightModeMenuBackground,
          borderColor: 'rgb(229, 231, 235)',
        }"
      >
        <div
          class="nav-bg-layer"
          :style="{
            backgroundColor: isDark ? darkModeMenuBackground : lightModeMenuBackground,
          }"
        ></div>
        <div class="container mx-auto px-4">
          <div class="flex items-center justify-between h-full relative">
            <!-- Mobile Logo - Left -->
            <div class="flex-shrink-0 md:hidden">
              <NuxtLink to="/" class="block py-3">
                <div
                  class="mobile-logo flex h-10 w-[140px] items-center justify-start"
                >
                  <span
                    v-if="showLogoSkeleton"
                    class="h-8 w-16 animate-pulse bg-neutral-200 dark:bg-neutral-700 rounded"
                  ></span>
                  <img
                    v-else-if="currentLogoUrl"
                    :src="currentLogoUrl"
                    :alt="logo?.altText || 'Logo'"
                    class="transition-transform duration-300 hover:scale-110 object-contain w-full h-full"
                  />
                </div>
              </NuxtLink>
            </div>

            <!-- Desktop Navigation -->
            <nav class="hidden md:flex items-center space-x-5 flex-grow justify-between">
              <InlineMenuSkeleton
                v-if="showMenuSkeleton"
                :item-count="5"
              />
              <div v-else-if="error" class="text-sm text-red-500">{{ error }}</div>
              <template v-else>
                <div
                  v-for="(item, itemIndex) in processedMenuItems"
                  :key="itemIndex"
                  class="relative group"
                  :data-menu-id="item.id"
                  @mouseenter="
                    (e) => {
                      if (item.children?.length) {
                        showMegaMenu(item.id);
                      }
                    }
                  "
                  @mouseleave="item.children?.length ? hideMegaMenu() : null"
                >
                  <NuxtLink
                    :to="item.href"
                    class="main-menu-item text-[1.05rem] uppercase transition-colors py-5 flex items-center space-x-1"
                    :style="getNavLinkColor(isMenuActive(item.href))"
                    :class="{ 'menu-active': isMenuActive(item.href) }"
                  >
                    <span class="text-[1.05rem] transition-colors duration-300 text-white dark:text-neutral-300 font-bold">
                      {{ item.label }}
                    </span>
                    <Icon
                      v-if="item.children?.length"
                      name="ChevronDown"
                      class="transition-transform duration-300 group-hover:rotate-180 h-4 w-4 text-white dark:text-neutral-300 font-bold"
                      :style="getNavLinkColor(isMenuActive(item.href))"
                    />
                  </NuxtLink>

                  <!-- Mega Menu -->
                  <Transition name="fade">
                    <MegaMenu
                      v-if="item.children?.length && activeMegaMenu === item.id"
                      :item="item"
                      :is-active="true"
                      :on-close="() => (activeMegaMenu = null)"
                      @mouseenter="keepMegaMenu"
                      @mouseleave="hideMegaMenu"
                    />
                  </Transition>
                </div>
              </template>
            </nav>

            <!-- Right side actions -->
            <div class="flex items-center space-x-2">
              <!-- Cart Icon - Desktop Only -->
              <div class="hidden md:block">
                <CartIcon v-if="props.settings?.showCart && isCartEnabled" />
              </div>

              <!-- Mobile Actions -->
              <div class="md:hidden flex items-center gap-2 py-3">
                <!-- User Icon -->
                <NuxtLink
                  to="/auth/login"
                  class="flex items-center justify-center w-10 h-10 text-white hover:bg-primary-400 rounded-full transition-colors"
                >
                  <Icon name="User" class="h-6 w-6" />
                </NuxtLink>

                <!-- Hamburger Menu Button -->
                <button
                  class="flex items-center justify-center w-10 h-10 text-white hover:bg-primary-400 rounded-full transition-colors"
                  @click="toggleMobileMenu"
                  aria-label="Toggle Menu"
                >
                  <Icon :name="isMobileMenuOpen ? 'X' : 'Menu'" class="h-6 w-6" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>
    </div>

    <!-- Mobile Menu -->
    <Transition name="slide-fade">
      <div
        v-if="isMobileMenuOpen"
        class="mobile-menu-overlay"
        @click="isMobileMenuOpen = false"
      >
        <div class="mobile-menu-content bg-white dark:bg-neutral-900" @click.stop>
          <!-- Mobile Menu Header -->
          <div
            class="mobile-menu-header flex items-center justify-between px-4 py-3 border-b border-neutral-200 dark:border-neutral-700"
          >
            <NuxtLink to="/" class="block" @click="isMobileMenuOpen = false">
              <div
                class="flex h-10 w-[160px] items-center justify-start"
              >
                <span
                  v-if="showLogoSkeleton"
                  class="h-6 w-16 animate-pulse bg-neutral-200 dark:bg-neutral-700 rounded"
                ></span>
                <img
                  v-else-if="currentLogoUrl"
                  :src="currentLogoUrl"
                  :alt="logo?.altText || 'Logo'"
                  class="transition-transform duration-300 hover:scale-110 object-contain w-full h-full max-h-[40px]"
                />
              </div>
            </NuxtLink>

            <button
              class="p-2 text-neutral-700 dark:text-neutral-300 hover:text-primary-600 dark:hover:text-primary-400"
              @click="isMobileMenuOpen = false"
              aria-label="Close Menu"
            >
              <Icon name="X" class="h-6 w-6" />
            </button>
          </div>

          <div class="px-4 py-3 space-y-1 bg-white dark:bg-neutral-900">
            <!-- Cart Icon for Mobile -->
            <div v-if="props.settings?.showCart && isCartEnabled" class="mb-4">
              <NuxtLink
                to="/cart"
                class="flex items-center gap-3 px-3 py-2 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-md transition-colors"
                @click="isMobileMenuOpen = false"
              >
                <Icon name="ShoppingCart" class="h-6 w-6" />
                <span class="text-base font-medium">Giỏ hàng</span>
              </NuxtLink>
            </div>

            <!-- Language Switcher and Theme Toggle in Mobile Menu -->
            <div class="flex flex-col space-y-2 px-3 py-2 mb-4">
              <div v-if="props.settings?.showLanguageSwitcher" class="w-full">
                <LanguageSwitcher />
              </div>
              <div v-if="props.settings?.showThemeToggle" class="w-full">
                <ThemeToggle />
              </div>
            </div>

            <!-- Hotlines for Mobile -->
            <div class="space-y-2 mb-4">
              <NuxtLink
                v-if="props.settings?.hotlines?.sales"
                :to="`tel:${props.settings.hotlines.sales.number}`"
                class="mobile-hotline flex items-center gap-2 px-3 py-2 text-primary-600 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800"
              >
                <Icon name="Phone" class="h-5 w-5" />
                <div class="flex flex-col">
                  <span class="text-sm text-neutral-600 dark:text-neutral-400">{{
                    props.settings.hotlines.sales.text
                  }}</span>
                  <span class="font-bold">{{
                    props.settings.hotlines.sales.number
                  }}</span>
                </div>
              </NuxtLink>

              <NuxtLink
                v-if="props.settings?.hotlines?.support"
                :to="`tel:${props.settings.hotlines.support.number}`"
                class="mobile-hotline flex items-center gap-2 px-3 py-2 text-primary-600 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800"
              >
                <Icon name="Phone" class="h-5 w-5" />
                <div class="flex flex-col">
                  <span class="text-sm text-neutral-600 dark:text-neutral-400">{{
                    props.settings.hotlines.support.text
                  }}</span>
                  <span class="font-bold">{{
                    props.settings.hotlines.support.number
                  }}</span>
                </div>
              </NuxtLink>
            </div>

            <!-- Mobile Menu Items with Mega Menu -->
            <div class="space-y-1">
              <div
                v-for="item in processedMenuItems"
                :key="item.id"
                class="mobile-menu-item"
              >
                <!-- Menu Item with Mega Menu -->
                <div
                  v-if="item.children && item.children.length > 0"
                  class="mobile-main-menu-item flex items-center justify-between px-3 py-2 text-base font-semibold uppercase rounded-md"
                  :class="{ 'mobile-menu-active': isMenuActive(item.href) }"
                >
                  <NuxtLink
                    :to="item.href"
                    class="flex-1 block"
                    @click="isMobileMenuOpen = false"
                  >
                    {{ item.label }}
                  </NuxtLink>
                  <button class="p-2 -m-2" @click.stop="toggleMobileMegaMenu(item.id)">
                    <Icon
                      name="ChevronRight"
                      class="h-5 w-5 transition-transform duration-300"
                      :class="{ 'rotate-90': activeMobileMegaMenu === item.id }"
                    />
                  </button>
                </div>

                <!-- Regular Menu Item -->
                <NuxtLink
                  v-else
                  :to="item.href"
                  class="mobile-main-menu-item block px-3 py-2 text-base font-medium text-neutral-700 dark:text-neutral-300 hover:text-primary-600 dark:hover:text-primary-400 rounded-md transition-colors duration-300"
                  :class="{
                    'text-primary-600 dark:text-primary-400': isMenuActive(item.href),
                  }"
                  @click="isMobileMenuOpen = false"
                >
                  {{ item.label }}
                </NuxtLink>

                <!-- Mobile Mega Menu Content -->
                <Transition name="slide-fade">
                  <MobileMegaMenu
                    v-if="
                      item.children &&
                      item.children.length > 0 &&
                      activeMobileMegaMenu === item.id
                    "
                    :item="item"
                    :is-active="isMenuActive(item.href)"
                    :on-close="
                      () => {
                        isMobileMenuOpen = false;
                        activeMobileMegaMenu = null;
                      }
                    "
                  />
                </Transition>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style lang="scss" scoped src="./CombinedNavbar.scss"></style>
