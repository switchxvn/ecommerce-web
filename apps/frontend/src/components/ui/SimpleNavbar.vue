<!-- Simple Navbar without Logo and Hotline sections -->
<script setup lang="ts">
import { ref, watch, nextTick, onMounted, onUnmounted, computed } from 'vue';
import { useNow, useDateFormat, onClickOutside } from '@vueuse/core';
import { useFeatureFlags } from '~/composables/useFeatureFlags';
import { useLocalization } from '~/composables/useLocalization';
import { useLogo } from '~/composables/useLogo';
import { useNavbar } from '~/composables/useNavbar';
import { useNavMenu } from '~/composables/useNavMenu';
import { useNavbarSettings } from '~/composables/useNavbarSettings';
import { useNavbarFeatures } from '~/composables/useNavbarFeatures';
import { useDarkMode } from '~/composables/useDarkMode';
import { useIcon } from '~/composables/useIcon';
import { useCssColorValue } from '~/composables/useColorUtils';
import { useSkeletonGate } from '~/composables/useSkeletonGate';
import { Phone, User, LogIn, UserCircle, LogOut, Settings, Globe, Moon, Clock } from 'lucide-vue-next';
import type { MenuItem, TopMenuItem } from '~/types/navbar';
import { defineAsyncComponent, markRaw } from 'vue';
import type { Component } from 'vue';
import { useAuth } from '@/composables/useAuth';
import { useTrpc } from '@/composables/useTrpc';
import CurrentDateTime from '~/components/common/CurrentDateTime.vue';
import { getBookingRoute } from '~/utils/routes';

// Register components using defineAsyncComponent
const registeredComponents = {
  'LanguageSwitcher': defineAsyncComponent(() => import('~/components/common/LanguageSwitcher.vue')),
  'ThemeToggle': defineAsyncComponent(() => import('~/components/common/ThemeToggle.vue')),
  'CartIcon': defineAsyncComponent(() => import('~/components/cart/CartIcon.vue')),
  'MegaMenu': defineAsyncComponent(() => import('~/components/menu/MegaMenu.vue')),
  'MobileMegaMenu': defineAsyncComponent(() => import('~/components/menu/MobileMegaMenu.vue')),
  'Icon': defineAsyncComponent(() => import('~/components/ui/Icon.vue')),
  'CurrentDateTime': defineAsyncComponent(() => import('~/components/common/CurrentDateTime.vue'))
} as Record<string, Component>;

// Function to resolve component
const resolveComponent = (item: TopMenuItem): Component | null => {
  if (!item?.type || !item?.component) {
    console.warn('Invalid component configuration');
    return null;
  }

  const componentName = item.component.split('/').pop()?.replace('.vue', '');
  if (componentName && registeredComponents[componentName]) {
    return markRaw(registeredComponents[componentName]);
  }

  console.warn(`No component found for: ${item.component}`);
  return null;
};

// Props cho component
interface NavbarProps {
  settings?: {
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

    // Top menu settings with new column structure
    topMenu?: {
      leftColumn?: {
        items: TopMenuItem[];
        width?: string;
        alignment?: 'start' | 'center' | 'end';
      };
      centerColumn?: {
        items: TopMenuItem[];
        width?: string;
        alignment?: 'start' | 'center' | 'end';
      };
      rightColumn?: {
        items: TopMenuItem[];
        width?: string;
        alignment?: 'start' | 'center' | 'end';
      };
    };

    // Update button settings
    bookingButton?: {
      text: string;
      href: string;
      phoneNumbers: {
        label: string;
        number: string;
      }[];
      backgroundColor?: string;
      textColor?: string;
    };
    
    // Add phone button settings
    phoneButton?: {
      text: string;
      numbers: {
        label: string;
        number: string;
        textColor?: string;
        backgroundColor?: string;
      }[];
      backgroundColor?: string;
      textColor?: string;
    };
  };
}

// Define types for top menu items
interface TopMenuItem {
  type: 'component' | 'link' | 'text' | 'divider';
  component?: string;
  settings?: Record<string, any>;
  href?: string;
  label?: string;
  content?: string;
  textColor?: string;
  hoverColor?: string;
  isTranslated?: boolean;
  icon?: string;
  color?: string;
}

const props = withDefaults(defineProps<NavbarProps>(), {
  settings: () => ({
    menuBackgroundColor: "#ffffff",
    textColor: "#000000",
    borderColor: "#e5e7eb",
    menuAlignment: "center",
    showLanguageSwitcher: true,
    showThemeToggle: true,
    showCart: true,
    mobileMenuBreakpoint: "md",
    darkMode: {
      menuBackgroundColor: "#171717",
      textColor: "#ffffff",
      borderColor: "#404040"
    },
    navigation: {
      textColor: "var(--tertiary-500)",
      fontWeight: "semibold",
      activeTextColor: "var(--primary-500)"
    },
    bookingButton: {
      text: "Đặt vé ngay",
      href: "/dat-ve",
      phoneNumbers: [
        {
          label: "Hotline",
          number: "1900 1234"
        }
      ],
      backgroundColor: "rgb(var(--color-primary-500))",
      textColor: "#ffffff"
    },
    phoneButton: {
      text: "Hotline",
      numbers: [
        {
          label: "Hotline",
          number: "1900 1234",
          textColor: "#ffffff",
          backgroundColor: "rgb(var(--color-primary-500))"
        }
      ],
      backgroundColor: "rgb(var(--color-primary-500))",
      textColor: "#ffffff"
    }
  })
});

// Dark mode
const { isDark } = useDarkMode();

// Feature flags
const { isFeatureEnabled } = useFeatureFlags();
const isCartEnabled = ref<boolean | null>(null);
const isLoadingFeatureFlag = ref(true);

// Localization
const { locale, t } = useLocalization();
const bookingRoute = computed(() => props.settings?.bookingButton?.href || getBookingRoute(locale.value));

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
  updateBodyPadding
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
  getParentMenuLeftOffset
} = useNavMenu();

// Settings
const navbarSettings = useNavbarSettings(props.settings);
const { settings, menuBackgroundColor, textColor, borderColor, navigationTextColor, navigationActiveTextColor } = navbarSettings;

// Time
const now = useNow();
const formattedTime = useDateFormat(now, 'HH:mm:ss - DD/MM/YYYY');

// Thêm biến để kiểm soát hiển thị thời gian
const showTimeOnTopBar = computed(() => {
  if (typeof window !== 'undefined') {
    return window.innerWidth >= 1400; // Tăng breakpoint để ẩn time ở màn hình nhỏ
  }
  return true;
});

// Thêm biến kiểm soát hiển thị top menu dạng hamburger
const showTopMenuHamburger = computed(() => {
  if (typeof window !== 'undefined') {
    return window.innerWidth < 1400; // Tăng breakpoint để hiển thị hamburger menu ở 1320px
  }
  return false;
});

// Thêm biến kiểm soát hiển thị/ẩn dropdown của top menu hamburger
const isTopMenuDropdownOpen = ref(false);

// Hàm toggle dropdown top menu
const toggleTopMenuDropdown = () => {
  isTopMenuDropdownOpen.value = !isTopMenuDropdownOpen.value;
};

// Đóng dropdown khi click ra ngoài
const topMenuDropdownRef = ref<HTMLElement | null>(null);
const topMenuButtonRef = ref<HTMLElement | null>(null);

// Features (Time and Cart)
const { checkCartFeatureFlag } = useNavbarFeatures();

// Logo
const { currentLogoUrl, logo, isLoading: isLoadingLogo } = useLogo();
const { shouldShowSkeleton } = useSkeletonGate();

// Mobile Logo - tạo một instance mới của useLogo riêng cho mobile
const mobileLogo = ref<any>(null);
const mobileLogoUrl = ref<string | null>(null);
const isLoadingMobileLogo = ref(false);

// Fetch mobile logo
const fetchMobileLogo = async () => {
  try {
    isLoadingMobileLogo.value = true;
    const mobileTrpc = useTrpc();
    const result = await mobileTrpc.logo.getActiveLogo.query({ type: 'main_mobile' });
    mobileLogo.value = result;
    
    // Xác định URL dựa trên dark mode
    const { isDark } = useDarkMode();
    mobileLogoUrl.value = isDark.value ? result.darkModeUrl : result.lightModeUrl;

    // Watch thay đổi dark mode để cập nhật URL logo mobile
    watch(() => isDark.value, (newValue) => {
      if (mobileLogo.value) {
        mobileLogoUrl.value = newValue ? mobileLogo.value.darkModeUrl : mobileLogo.value.lightModeUrl;
      }
    });
  } catch (err) {
    console.error('Error fetching mobile logo:', err);
    // Fallback to main logo if mobile logo fails
    mobileLogoUrl.value = currentLogoUrl.value;
  } finally {
    isLoadingMobileLogo.value = false;
  }
};

// Add these refs and computed properties
const menuContainerRef = ref<HTMLElement | null>(null);
const menuItemsRefs = ref<HTMLElement[]>([]);
const visibleMenuItems = ref<MenuItem[]>([]);
const hiddenMenuItems = ref<MenuItem[]>([]);
const showMoreMenu = ref(false);
const showDesktopLogoSkeleton = computed(() => shouldShowSkeleton.value || isLoadingLogo.value);
const showMobileLogoSkeleton = computed(() => shouldShowSkeleton.value || isLoadingMobileLogo.value || isLoadingLogo.value);
const showMenuSkeleton = computed(() => shouldShowSkeleton.value || isLoading.value);

// Add method to calculate visible items
const calculateVisibleItems = () => {
  if (!menuContainerRef.value || !processedMenuItems.value) return;

  const containerWidth = menuContainerRef.value.clientWidth;
  const moreButtonWidth = 50; // Increased width buffer for more button
  let availableWidth = containerWidth - moreButtonWidth;
  let totalWidth = 0;
  
  visibleMenuItems.value = [];
  hiddenMenuItems.value = [];

  // Reset refs array
  menuItemsRefs.value = [];

  // Adjust estimation for smaller screens
  const getItemWidth = (item: MenuItem) => {
    let baseWidth = 40; // Base padding and margins
    let charWidth = 10.5; // Default character width
    
    // Adjust character width based on screen size
    if (window.innerWidth <= 1280) {
      charWidth = 8; // Smaller character width for smaller screens
      baseWidth = 30; // Less padding on smaller screens
    }
    
    return (item.label.length * charWidth) +
           baseWidth +
           (item.icon ? 28 : 0) + // Smaller icon size
           (item.children?.length ? 20 : 0) + // Less space for dropdown indicator
           12; // Buffer
  };

  processedMenuItems.value.forEach((item: MenuItem) => {
    const estimatedWidth = getItemWidth(item);

    // Add more item to visible if there's space
    if (totalWidth + estimatedWidth <= availableWidth) {
      visibleMenuItems.value.push(item);
      totalWidth += estimatedWidth;
    } else {
      hiddenMenuItems.value.push(item);
    }
  });

  // Make sure we have at least one visible item
  if (visibleMenuItems.value.length === 0 && hiddenMenuItems.value.length > 0) {
    visibleMenuItems.value.push(hiddenMenuItems.value.shift()!);
  }
};

// Update the resize observer
let resizeObserver: ResizeObserver | null = null;

// Add these refs and handlers
const moreMenuRef = ref<HTMLElement | null>(null);

const { getIconComponent } = useIcon();

// Hàm để gọi điện thoại
const callPhone = (phoneNumber: string) => {
  window.location.href = `tel:${phoneNumber.replace(/\s+/g, '')}`;
};

// Replace with correct auth state properties
const { user, logout, checkAuth } = useAuth();
const showUserDropdown = ref(false);

const isAuthenticated = computed(() => {
  return !!user.value;
});


const userDisplayName = computed(() => {
  if (!user.value) return '';
  return user.value.profile?.firstName || user.value.email;
});


const handleLogout = async () => {
  await logout();
  showUserDropdown.value = false;
};

// Add mobileNavRef
const mobileNavRef = ref<HTMLElement | null>(null);

// Add scrollHandling functionality specifically for mobile
const handleMobileScroll = () => {
  const scrollPosition = window.scrollY;
  isScrolled.value = scrollPosition > 10;
};

onMounted(() => {
  // Check auth state when component mounts
  checkAuth().then(() => {
    const init = async () => {
      try {
        await fetchMenuItems();
        nextTick(() => {
          calculateVisibleItems();
        });
      } catch (err) {
        console.error('Error fetching menu items:', err);
      }
      await checkCartFeatureFlag();
      await fetchMobileLogo();
    };
    
    init();
  });

  // Thêm event listener để kiểm tra kích thước cửa sổ khi thay đổi
  window.addEventListener('resize', () => {
    // Đóng dropdown khi resize
    if (isTopMenuDropdownOpen.value && window.innerWidth >= 1400) {
      isTopMenuDropdownOpen.value = false;
    }
  });

  resizeObserver = new ResizeObserver(() => {
    calculateVisibleItems();
  });

  if (menuContainerRef.value) {
    resizeObserver.observe(menuContainerRef.value);
  }

  if (moreMenuRef.value) {
    onClickOutside(moreMenuRef, () => {
      showMoreMenu.value = false;
    });
  }
  
  // Add scroll event listener for mobile menu
  window.addEventListener('scroll', handleMobileScroll, { passive: true });

  // Thêm click outside handler cho top menu dropdown
  document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
  if (resizeObserver) {
    resizeObserver.disconnect();
  }
  
  // Remove scroll event listener
  window.removeEventListener('scroll', handleMobileScroll);
  
  // Remove click outside handler
  document.removeEventListener('click', handleClickOutside);
});

// Watch for locale changes
watch(locale, () => {
  fetchMenuItems();
});

// Hàm để đóng dropdown khi click ra ngoài
const handleClickOutside = (event: MouseEvent) => {
  if (isTopMenuDropdownOpen.value && 
      topMenuDropdownRef.value && 
      topMenuButtonRef.value && 
      !topMenuDropdownRef.value.contains(event.target as Node) &&
      !topMenuButtonRef.value.contains(event.target as Node)) {
    isTopMenuDropdownOpen.value = false;
  }
};
</script>

<template>
  <div class="navbar-container">
    <!-- Top Menu -->
    <div 
      class="w-full relative hidden lg:block"
      :style="{
        backgroundColor: isDark ? props.settings?.darkMode?.menuBackgroundColor : 'rgb(var(--color-primary-DEFAULT))'
      }"
    >
      <div 
        class="top-menu w-full border-b relative" 
        :style="{
          borderColor: isDark ? props.settings?.darkMode?.borderColor : 'rgb(var(--color-primary-DEFAULT))',
          color: isDark ? props.settings?.darkMode?.textColor : '#ffffff'
        }"
      >
        <!-- Top Menu với chế độ normal và hamburger -->
        <div class="w-full px-3 sm:px-4 lg:px-6 xl:px-8">
          <!-- Hamburger Menu cho màn hình nhỏ (< 1300px) -->
          <div v-if="showTopMenuHamburger" class="flex items-center justify-between h-10 sm:h-12 lg:h-14 xl:h-16 2xl:h-18">
            <!-- Hiển thị CurrentDateTime thay vì logo -->
            <div class="flex-shrink-0 transform scale-90 sm:scale-100 origin-left">
              <CurrentDateTime />
            </div>
            
            <!-- Nút Hamburger và các action khác -->
            <div class="flex items-center gap-3 lg:gap-4">
            
              <!-- Top Menu Hamburger Button -->
              <button 
                ref="topMenuButtonRef"
                class="flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-full hover:bg-white/20 transition-colors duration-300" 
                @click.stop="toggleTopMenuDropdown"
              >
                <Icon :name="isTopMenuDropdownOpen ? 'X' : 'Menu'" class="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </button>
            </div>
            
            <!-- Top Menu Dropdown -->
            <Transition
              enter-active-class="transition ease-out duration-200"
              enter-from-class="transform opacity-0 scale-95"
              enter-to-class="transform opacity-100 scale-100"
              leave-active-class="transition ease-in duration-150"
              leave-from-class="transform opacity-100 scale-100"
              leave-to-class="transform opacity-0 scale-95"
            >
              <div
                v-if="isTopMenuDropdownOpen"
                ref="topMenuDropdownRef"
                class="fixed sm:absolute right-2 top-[40px] sm:top-full mt-1 w-[90vw] sm:w-72 max-w-[350px] rounded-lg shadow-xl py-2 bg-white dark:bg-neutral-800 ring-1 ring-black ring-opacity-5"
                style="z-index: 999 !important;"
              >
                <!-- User Profile Section -->
                <div class="px-3 py-2 border-b border-gray-200 dark:border-gray-700">
                  <!-- Logged in -->
                  <div v-if="isAuthenticated" class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center">
                      <UserCircle class="w-6 h-6 text-primary-600 dark:text-primary-400" />
                    </div>
                    <div class="flex-1">
                      <div class="text-sm font-semibold text-gray-900 dark:text-white">{{ userDisplayName }}</div>
                      <div class="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[180px]">{{ user?.email }}</div>
                    </div>
                  </div>
                  
                  <!-- Not logged in -->
                  <div v-else class="flex flex-col gap-2">
                    <div class="text-sm font-medium text-gray-900 dark:text-white mb-1">Tài khoản</div>
                    <div class="flex gap-2">
                      <NuxtLink 
                        to="/auth/login" 
                        class="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 bg-primary-600 hover:bg-primary-700 text-white text-xs font-medium rounded-md transition-colors"
                        @click="isTopMenuDropdownOpen = false"
                      >
                        <LogIn class="w-3.5 h-3.5" />
                        Đăng nhập
                      </NuxtLink>
                      <NuxtLink 
                        to="/auth/register" 
                        class="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 text-xs font-medium rounded-md transition-colors"
                        @click="isTopMenuDropdownOpen = false"
                      >
                        <UserCircle class="w-3.5 h-3.5" />
                        Đăng ký
                      </NuxtLink>
                    </div>
                  </div>
                </div>

                <div class="mb-1 px-3 pt-2 pb-2 border-b border-gray-200 dark:border-gray-700">
                  <div class="text-sm font-medium text-gray-900 dark:text-white mb-1">Thông tin liên hệ</div>
                  
                  <!-- Hotline -->
                  <div class="flex items-center gap-2 mb-2">
                    <div class="flex-shrink-0 w-8 h-8 rounded-full bg-primary-500/20 dark:bg-primary-700/20 flex items-center justify-center">
                      <Phone class="w-4 h-4 text-primary-600 dark:text-primary-400" />
                    </div>
                    <div>
                      <div class="text-xs font-medium text-gray-600 dark:text-gray-300">Hotline hỗ trợ:</div>
                      <a href="tel:0869519678" class="text-sm font-semibold text-primary-600 dark:text-primary-400 hover:underline">
                        0869.519.678
                      </a>
                    </div>
                  </div>
                  
                  <!-- Thời gian -->
                  <div class="flex items-center gap-2">
                    <div class="flex-shrink-0 w-8 h-8 rounded-full bg-green-500/20 dark:bg-green-700/20 flex items-center justify-center">
                      <Icon name="Clock" class="w-4 h-4 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <div class="text-xs font-medium text-gray-600 dark:text-gray-300">Giờ làm việc:</div>
                      <div class="text-sm font-semibold text-gray-800 dark:text-gray-200">24/7</div>
                    </div>
                  </div>
                </div>

                <!-- Cart Section -->
                <div class="px-2 mb-1">
                  <div class="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 ml-2 mt-1">
                    Giỏ hàng
                  </div>
                  <div class="px-3 py-1.5">
                    <CartIcon class="mobile-top-menu-cart-icon" />
                  </div>
                </div>

                <!-- User Actions for logged in users -->
                <div v-if="isAuthenticated" class="px-2 mb-1">
                  <div class="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 ml-2 mt-1">
                    Quản lý tài khoản
                  </div>
                  <NuxtLink 
                    to="/dashboard" 
                    class="flex items-center gap-2 px-3 py-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300"
                    @click="isTopMenuDropdownOpen = false"
                  >
                    <Settings class="w-4 h-4 text-gray-500 dark:text-gray-400" />
                    Dashboard
                  </NuxtLink>
                  <button 
                    class="w-full flex items-center gap-2 px-3 py-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300"
                    @click="handleLogout(); isTopMenuDropdownOpen = false"
                  >
                    <LogOut class="w-4 h-4 text-gray-500 dark:text-gray-400" />
                    Đăng xuất
                  </button>
                </div>

                <!-- Menu Items -->
                <div class="px-2 max-h-[60vh] overflow-y-auto">
                  <!-- Left Column Items -->
                  <div class="mb-1">
                    <template v-for="(item, index) in props.settings?.topMenu?.leftColumn?.items" :key="`left-${index}`">
                      <div 
                        class="px-3 py-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 mb-1 transition-colors duration-150"
                        v-if="item.type !== 'component' || !item.component || !item.component.includes('CurrentDateTime')"
                      >
                        <component
                          v-if="item.type === 'component' && item.component"
                          :is="resolveComponent(item)"
                          v-bind="item.settings || {}"
                        />
                        
                        <div
                          v-else-if="item.type === 'text'"
                          class="flex items-center gap-2"
                        >
                          <Icon
                            v-if="item.icon"
                            :name="item.icon"
                            class="nav-icon w-4 h-4 text-gray-500 dark:text-gray-400"
                          />
                          <span
                            class="text-sm font-medium text-gray-700 dark:text-gray-300"
                          >
                            {{ item.isTranslated ? t(item.content ?? '') : item.content }}
                          </span>
                        </div>

                        <NuxtLink
                          v-else-if="item.type === 'link'"
                          :to="item.href"
                          class="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400"
                          @click="isTopMenuDropdownOpen = false"
                        >
                          <Icon
                            v-if="item.icon"
                            :name="item.icon"
                            class="nav-icon w-4 h-4 text-gray-500 dark:text-gray-400"
                          />
                          {{ item.isTranslated ? t(item.label ?? '') : item.label }}
                        </NuxtLink>
                      </div>
                    </template>
                  </div>

                  <!-- Center & Right Column Items -->
                  <div>
                    <template v-for="(item, index) in [...(props.settings?.topMenu?.centerColumn?.items || []), ...(props.settings?.topMenu?.rightColumn?.items || [])]" :key="`item-${index}`">
                      <div 
                        class="px-3 py-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 mb-1 transition-colors duration-150"
                        v-if="!(item.type === 'component' && item.component && item.component.includes('CurrentDateTime'))"
                      >
                        <component
                          v-if="item.type === 'component' && item.component"
                          :is="resolveComponent(item)"
                          v-bind="item.settings || {}"
                        />
                        
                        <div
                          v-else-if="item.type === 'text'"
                          class="flex items-center gap-2"
                        >
                          <Icon
                            v-if="item.icon"
                            :name="item.icon"
                            class="nav-icon w-4 h-4 text-gray-500 dark:text-gray-400"
                          />
                          <span
                            class="text-sm font-medium text-gray-700 dark:text-gray-300"
                          >
                            {{ item.isTranslated ? t(item.content ?? '') : item.content }}
                          </span>
                        </div>

                        <NuxtLink
                          v-else-if="item.type === 'link'"
                          :to="item.href"
                          class="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 w-full"
                          @click="isTopMenuDropdownOpen = false"
                        >
                          <Icon
                            v-if="item.icon"
                            :name="item.icon"
                            class="nav-icon w-4 h-4 text-gray-500 dark:text-gray-400"
                          />
                          <span>{{ item.isTranslated ? t(item.label ?? '') : item.label }}</span>
                          <Icon name="ChevronRight" class="ml-auto w-4 h-4 text-gray-400" />
                        </NuxtLink>
                      </div>
                    </template>
                  </div>
                </div>

                <!-- Footer -->
                <div class="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700 px-3">
                  <div class="flex items-center justify-between">
                    <div class="text-xs text-gray-500 dark:text-gray-400">
                      Đang sử dụng tiếng Việt
                    </div>
                    <div class="flex items-center gap-2">
                      <button class="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                        <Icon name="Globe" class="w-4 h-4 text-gray-500 dark:text-gray-400" />
                      </button>
                      <button class="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                        <Icon name="Moon" class="w-4 h-4 text-gray-500 dark:text-gray-400" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </Transition>
          </div>

          <!-- Normal Top Menu cho màn hình lớn (>= 1300px) -->
          <div v-else class="flex items-center h-9 sm:h-10 lg:h-11 xl:h-12 2xl:h-14">
            <!-- Left Column -->
            <div 
              class="flex items-center gap-0.5 sm:gap-1 lg:gap-1.5 xl:gap-2" 
              :style="{
                width: props.settings?.topMenu?.leftColumn?.width || '25%',
                justifyContent: 'flex-start'
              }"
            >
              <template v-for="(item, index) in props.settings?.topMenu?.leftColumn?.items" :key="index">
                <!-- Component Type -->
                <component
                  v-if="item.type === 'component' && item.component"
                  :is="resolveComponent(item)"
                  v-bind="item.settings || {}"
                  :class="item.component.includes('CurrentDateTime') ? 'hidden xl:flex' : ''"
                />
                
                <!-- Text Type with Icon -->
                <div
                  v-else-if="item.type === 'text'"
                  class="flex items-center gap-0.5"
                  :class="{'hidden xl:flex': item.content && (item.content.includes('time') || item.content.includes('Time') || item.content.includes('date') || item.content.includes('Date'))}"
                >
                  <Icon
                    v-if="item.icon"
                    :name="item.icon"
                    class="nav-icon w-2.5 h-2.5 sm:w-3 sm:h-3 lg:w-3 lg:h-3 xl:w-3.5 xl:h-3.5"
                    :style="{ color: item.textColor }"
                  />
                  <span
                    class="text-[10px] sm:text-[11px] lg:text-xs xl:text-sm font-medium whitespace-nowrap"
                    :style="{ color: item.textColor }"
                  >
                    {{ item.isTranslated ? t(item.content ?? '') : item.content }}
                  </span>
                </div>

                <!-- Link Type with Icon -->
                <NuxtLink
                  v-else-if="item.type === 'link'"
                  :to="item.href"
                  class="flex items-center gap-0.5 text-[10px] sm:text-[11px] lg:text-xs xl:text-sm font-[800] uppercase transition-colors duration-300 hover:opacity-90 whitespace-nowrap"
                  :style="{
                    color: item.textColor,
                    '&:hover': {
                      color: item.hoverColor
                    }
                  }"
                >
                  <Icon
                    v-if="item.icon"
                    :name="item.icon"
                    class="nav-icon w-2.5 h-2.5 sm:w-3 sm:h-3 lg:w-3 lg:h-3 xl:w-3.5 xl:h-3.5"
                    :style="{ color: item.textColor }"
                  />
                  {{ item.isTranslated ? t(item.label ?? '') : item.label }}
                </NuxtLink>

                <!-- Divider -->
                <div
                  v-else-if="item.type === 'divider'"
                  class="h-2.5 sm:h-3 lg:h-3.5 xl:h-4 w-[1px] mx-0.5 sm:mx-1"
                  :style="{ backgroundColor: item.color || '#ffffff' }"
                ></div>
              </template>
            </div>
            
            <!-- Center Column -->
            <div 
              class="flex items-center justify-center gap-1 lg:gap-2 xl:gap-4 2xl:gap-6" 
              :style="{
                width: props.settings?.topMenu?.centerColumn?.width || '50%'
              }"
            >
              <template v-for="(item, index) in props.settings?.topMenu?.centerColumn?.items" :key="index">
                <!-- Hiển thị thời gian với điều kiện -->
                <template v-if="item.type === 'component' && item.component && item.component.includes('CurrentDateTime')">
                  <component
                    v-if="showTimeOnTopBar"
                    :is="resolveComponent(item)"
                    v-bind="item.settings || {}"
                  />
                </template>
                
                <!-- Hiển thị text thời gian với điều kiện -->
                <template v-else-if="item.type === 'text' && item.content && (item.content.includes('time') || item.content.includes('Time') || item.content.includes('date') || item.content.includes('Date'))">
                  <div
                    v-if="showTimeOnTopBar"
                    class="flex items-center gap-0.5 sm:gap-1 lg:gap-1"
                  >
                    <Icon
                      v-if="item.icon"
                      :name="item.icon"
                      class="nav-icon w-3 h-3 sm:w-3.5 sm:h-3.5 lg:w-4 lg:h-4 xl:w-4 xl:h-4"
                      :style="{ color: item.textColor }"
                    />
                    <span
                      class="text-[11px] sm:text-xs lg:text-sm xl:text-base 2xl:text-lg font-medium whitespace-nowrap"
                      :style="{ color: item.textColor }"
                    >
                      {{ item.isTranslated ? t(item.content ?? '') : item.content }}
                    </span>
                  </div>
                </template>
                
                <!-- Các phần tử khác hiển thị bình thường -->
                <template v-else>
                  <component
                    v-if="item.type === 'component' && item.component"
                    :is="resolveComponent(item)"
                    v-bind="item.settings || {}"
                  />
                  
                  <div
                    v-else-if="item.type === 'text'"
                    class="flex items-center gap-0.5 sm:gap-1 lg:gap-1"
                  >
                    <Icon
                      v-if="item.icon"
                      :name="item.icon"
                      class="nav-icon w-3 h-3 sm:w-3.5 sm:h-3.5 lg:w-4 lg:h-4 xl:w-4 xl:h-4"
                      :style="{ color: item.textColor }"
                    />
                    <span
                      class="text-[11px] sm:text-xs lg:text-sm xl:text-base 2xl:text-lg font-medium whitespace-nowrap"
                      :style="{ color: item.textColor }"
                    >
                      {{ item.isTranslated ? t(item.content ?? '') : item.content }}
                    </span>
                  </div>

                  <NuxtLink
                    v-else-if="item.type === 'link'"
                    :to="item.href"
                    class="flex items-center gap-0.5 text-[11px] sm:text-xs lg:text-sm xl:text-base 2xl:text-lg font-[800] uppercase transition-colors duration-300 hover:opacity-90 whitespace-nowrap"
                    :style="{
                      color: item.textColor,
                      '&:hover': {
                        color: item.hoverColor
                      }
                    }"
                  >
                    <Icon
                      v-if="item.icon"
                      :name="item.icon"
                      class="nav-icon w-3 h-3 sm:w-3.5 sm:h-3.5 lg:w-4 lg:h-4 xl:w-4 xl:h-4"
                      :style="{ color: item.textColor }"
                    />
                    {{ item.isTranslated ? t(item.label ?? '') : item.label }}
                  </NuxtLink>

                  <div
                    v-else-if="item.type === 'divider'"
                    class="h-3 sm:h-3.5 lg:h-4 xl:h-4 w-[1px] mx-0.5 sm:mx-1 lg:mx-1"
                    :style="{ backgroundColor: item.color || '#ffffff' }"
                  ></div>
                </template>
              </template>
            </div>

            <!-- Right Column -->
            <div 
              class="flex items-center gap-1 lg:gap-1.5 xl:gap-2" 
              :style="{
                width: props.settings?.topMenu?.rightColumn?.width || '25%',
                justifyContent: props.settings?.topMenu?.rightColumn?.alignment === 'center' ? 'center' : 
                              props.settings?.topMenu?.rightColumn?.alignment === 'start' ? 'flex-start' : 'flex-end'
              }"
            >
              <template v-for="(item, index) in props.settings?.topMenu?.rightColumn?.items" :key="index">
                <!-- Component Type -->
                <component
                  v-if="item.type === 'component' && item.component"
                  :is="resolveComponent(item)"
                  v-bind="item.settings || {}"
                  :class="item.component.includes('CurrentDateTime') ? 'hidden xl:flex' : ''"
                />
                
                <!-- Text Type with Icon -->
                <div
                  v-else-if="item.type === 'text'"
                  class="flex items-center gap-0.5 sm:gap-1 lg:gap-1"
                  :class="{'hidden xl:flex': item.content && (item.content.includes('time') || item.content.includes('Time') || item.content.includes('date') || item.content.includes('Date'))}"
                >
                  <Icon
                    v-if="item.icon"
                    :name="item.icon"
                    class="nav-icon w-2.5 h-2.5 sm:w-3 sm:h-3 lg:w-3.5 lg:h-3.5 xl:w-4 xl:h-4"
                    :style="{ color: item.textColor }"
                  />
                  <span
                    class="text-[10px] sm:text-[11px] lg:text-xs xl:text-sm font-medium whitespace-nowrap"
                    :style="{ color: item.textColor }"
                  >
                    {{ item.isTranslated ? t(item.content ?? '') : item.content }}
                  </span>
                </div>

                <!-- Link Type with Icon -->
                <NuxtLink
                  v-else-if="item.type === 'link'"
                  :to="item.href"
                  class="flex items-center gap-0.5 text-[10px] sm:text-[11px] lg:text-xs xl:text-sm font-[800] uppercase transition-colors duration-300 hover:opacity-90 whitespace-nowrap"
                  :style="{
                    color: item.textColor,
                    '&:hover': {
                      color: item.hoverColor
                    }
                  }"
                >
                  <Icon
                    v-if="item.icon"
                    :name="item.icon"
                    class="nav-icon w-2.5 h-2.5 sm:w-3 sm:h-3 lg:w-3.5 lg:h-3.5 xl:w-4 xl:h-4"
                    :style="{ color: item.textColor }"
                  />
                  {{ item.isTranslated ? t(item.label ?? '') : item.label }}
                </NuxtLink>

                <!-- Divider -->
                <div
                  v-else-if="item.type === 'divider'"
                  class="h-2.5 sm:h-3 lg:h-3.5 xl:h-4 w-[1px] mx-0.5 sm:mx-1"
                  :style="{ backgroundColor: item.color || '#ffffff' }"
                ></div>
              </template>

              <!-- Cart Icon -->
              <div class="relative">
                <CartIcon class="top-menu-cart-icon" />
              </div>

              <!-- User Menu -->
              <div class="relative">
                <button
                  class="flex items-center justify-center w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 xl:w-9 xl:h-9 rounded-full hover:bg-white/20 transition-colors duration-300"
                  @click="showUserDropdown = !showUserDropdown"
                >
                  <User class="w-3 h-3 sm:w-3.5 sm:h-3.5 lg:w-4 lg:h-4 xl:w-5 xl:h-5 text-white" />
                </button>

                <!-- User Dropdown -->
                <Transition
                  enter-active-class="transition ease-out duration-200"
                  enter-from-class="transform opacity-0 scale-95"
                  enter-to-class="transform opacity-100 scale-100"
                  leave-active-class="transition ease-in duration-150"
                  leave-from-class="transform opacity-100 scale-100"
                  leave-to-class="transform opacity-0 scale-95"
                >
                  <div
                    v-if="showUserDropdown"
                    class="absolute right-1.5 xs:right-2 mt-0.5 w-28 xs:w-32 lg:w-36 rounded-md shadow-lg py-0.5 xs:py-1 bg-white dark:bg-neutral-800 ring-1 ring-black ring-opacity-5"
                    :style="{ zIndex: 65 }"
                    @click.outside="showUserDropdown = false"
                  >
                    <!-- Not Logged In -->
                    <template v-if="!isAuthenticated">
                      <NuxtLink
                        to="/auth/login"
                        class="flex items-center gap-1 px-1.5 xs:px-2 py-1 xs:py-1.5 text-[10px] xs:text-[11px] text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-700"
                        @click="showUserDropdown = false"
                      >
                        <LogIn class="w-2.5 h-2.5 xs:w-3 xs:h-3" />
                        {{ t('Đăng nhập') }}
                      </NuxtLink>
                      <NuxtLink
                        to="/auth/register"
                        class="flex items-center gap-1 px-1.5 xs:px-2 py-1 xs:py-1.5 text-[10px] xs:text-[11px] text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-700"
                        @click="showUserDropdown = false"
                      >
                        <UserCircle class="w-2.5 h-2.5 xs:w-3 xs:h-3" />
                        {{ t('Đăng ký') }}
                      </NuxtLink>
                    </template>

                    <!-- Logged In -->
                    <template v-else>
                       <!-- User Info -->
                       <div class="px-1.5 xs:px-2 py-1 xs:py-1.5 border-b border-neutral-200 dark:border-neutral-700">
                        <div class="text-[10px] xs:text-[11px] font-medium text-neutral-900 dark:text-white">
                          {{ userDisplayName }}
                        </div>
                        <div class="text-[8px] xs:text-[9px] text-neutral-500 dark:text-neutral-400">
                          {{ user?.email }}
                        </div>
                      </div>
                      <NuxtLink
                        to="/dashboard"
                        class="flex items-center gap-1 px-1.5 xs:px-2 py-1 xs:py-1.5 text-[10px] xs:text-[11px] text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-700"
                        @click="showUserDropdown = false"
                      >
                        <Settings class="w-2.5 h-2.5 xs:w-3 xs:h-3" />
                        {{ t('Dashboard') }}
                      </NuxtLink>
                      <button
                        class="flex items-center gap-1 w-full px-1.5 xs:px-2 py-1 xs:py-1.5 text-[10px] xs:text-[11px] text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-700"
                        @click="handleLogout"
                      >
                        <LogOut class="w-2.5 h-2.5 xs:w-3 xs:h-3" />
                        {{ t('Đăng xuất') }}
                      </button>
                    </template>
                  </div>
                </Transition>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Mobile Navbar - Simple Version -->
    <div 
      ref="mobileNavRef"
      class="w-full fixed lg:hidden border-b"
      :class="{ 'mobile-shadow': isScrolled }"
      :style="{
        backgroundColor: isDark ? props.settings?.darkMode?.menuBackgroundColor : 'rgb(var(--color-primary-500))',
        borderColor: isDark ? props.settings?.darkMode?.borderColor : 'rgb(var(--color-primary-600))',
        top: 0,
        zIndex: 60
      }"
    >
      <div class="w-full px-3 sm:px-4 py-2 sm:py-3">
        <div class="flex items-center justify-between">
          <!-- Mobile Logo -->
          <div class="flex-shrink-0">
            <NuxtLink to="/" class="flex items-center">
              <span
                v-if="showMobileLogoSkeleton"
                class="block h-8 sm:h-10 w-[120px] sm:w-[140px] animate-pulse rounded bg-white/20"
              ></span>
              <img
                v-else-if="mobileLogoUrl"
                :src="mobileLogoUrl"
                :alt="mobileLogo?.altText || 'Logo'"
                class="h-8 sm:h-10 w-auto object-contain max-w-[120px] sm:max-w-[140px]"
              />
            </NuxtLink>
          </div>
          
          <!-- Right Actions -->
          <div class="flex items-center gap-2 sm:gap-3">
            <!-- Cart Icon -->
            <div class="relative">
              <CartIcon class="mobile-navbar-cart-icon" />
            </div>
            
            <!-- Phone Button -->
            <a 
              :href="`tel:${props.settings?.phoneButton?.numbers?.[0]?.number?.replace(/\s+/g, '') || ''}`"
              class="flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/20 hover:bg-white/30 transition-colors duration-300"
            >
              <Phone class="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </a>
            
            <!-- User Button -->
            <button
              class="flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/20 hover:bg-white/30 transition-colors duration-300 relative"
              @click="showUserDropdown = !showUserDropdown"
            >
              <User class="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              <!-- Authenticated indicator -->
              <div v-if="isAuthenticated" class="absolute -top-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
            </button>
            
            <!-- Mobile Menu Button -->
            <button
              class="flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/20 hover:bg-white/30 transition-colors duration-300 ml-1 sm:ml-2"
              @click="toggleMobileMenu"
              aria-label="Toggle Menu"
            >
              <Icon :name="isMobileMenuOpen ? 'X' : 'Menu'" class="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </button>
          </div>
        </div>
      </div>
      
      <!-- User Dropdown for Mobile -->
      <Transition
        enter-active-class="transition ease-out duration-200"
        enter-from-class="transform opacity-0 scale-95"
        enter-to-class="transform opacity-100 scale-100"
        leave-active-class="transition ease-in duration-150"
        leave-from-class="transform opacity-100 scale-100"
        leave-to-class="transform opacity-0 scale-95"
      >
        <div
          v-if="showUserDropdown"
          class="absolute right-1.5 xs:right-2 top-[40px] w-[90vw] max-w-[300px] rounded-md shadow-lg py-2 bg-white dark:bg-neutral-800 ring-1 ring-black ring-opacity-5"
          style="z-index: 999 !important;"
          @click.outside="showUserDropdown = false"
        >
          <!-- Logged in -->
          <div v-if="isAuthenticated" class="px-3 py-2 border-b border-gray-200 dark:border-gray-700">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center">
                <UserCircle class="w-6 h-6 text-primary-600 dark:text-primary-400" />
              </div>
              <div class="flex-1">
                <div class="text-sm font-semibold text-gray-900 dark:text-white">{{ userDisplayName }}</div>
                <div class="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[180px]">{{ user?.email }}</div>
              </div>
            </div>
            
            <div class="mt-2 grid grid-cols-2 gap-2">
              <NuxtLink 
                to="/dashboard" 
                class="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-primary-600 hover:bg-primary-700 text-white text-xs font-medium rounded-md transition-colors"
                @click="showUserDropdown = false"
              >
                <Settings class="w-3.5 h-3.5" />
                Dashboard
              </NuxtLink>
              <button 
                class="flex items-center justify-center gap-1.5 px-3 py-1.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 text-xs font-medium rounded-md transition-colors"
                @click="handleLogout(); showUserDropdown = false"
              >
                <LogOut class="w-3.5 h-3.5" />
                Đăng xuất
              </button>
            </div>
          </div>
          
          <!-- Not Logged In -->
          <div v-else class="px-3 py-2 border-b border-gray-200 dark:border-gray-700">
            <div class="text-sm font-medium text-gray-900 dark:text-white mb-2">Tài khoản</div>
            <div class="grid grid-cols-2 gap-2">
              <NuxtLink 
                to="/auth/login" 
                class="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-primary-600 hover:bg-primary-700 text-white text-xs font-medium rounded-md transition-colors"
                @click="showUserDropdown = false"
              >
                <LogIn class="w-3.5 h-3.5" />
                Đăng nhập
              </NuxtLink>
              <NuxtLink 
                to="/auth/register" 
                class="flex items-center justify-center gap-1.5 px-3 py-1.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 text-xs font-medium rounded-md transition-colors"
                @click="showUserDropdown = false"
              >
                <UserCircle class="w-3.5 h-3.5" />
                Đăng ký
              </NuxtLink>
            </div>
          </div>
          
          <!-- Quick Links -->
          <div class="px-3 py-2">
            <div class="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
              Liên kết nhanh
            </div>
            <a 
              :href="`tel:${props.settings?.phoneButton?.numbers?.[0]?.number?.replace(/\s+/g, '') || ''}`"
              class="flex items-center gap-2 py-1 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400"
            >
              <Phone class="w-4 h-4 text-gray-500 dark:text-gray-400" />
              {{ props.settings?.phoneButton?.numbers?.[0]?.number || 'Hotline' }}
            </a>
          </div>
        </div>
      </Transition>
    </div>

    <!-- Navigation Section for Desktop -->
    <div 
      ref="navWrapperRef"
      class="nav-wrapper w-full h-[70px] lg:h-[80px] xl:h-[90px] hidden lg:block"
      :class="{ 'nav-sticky': isScrolled }"
      :style="{
        backgroundColor: isDark ? props.settings?.darkMode?.menuBackgroundColor : props.settings?.menuBackgroundColor
      }"
    >
      <div class="navigation-section w-full h-full relative">
        <div class="w-full px-4 lg:px-6 xl:px-8 h-full">
          <div class="flex items-center h-full relative">
            <!-- Logo - Left column -->
            <div class="w-[15%] lg:w-[12%] xl:w-[15%] flex justify-start">
              <NuxtLink to="/" class="flex-shrink-0 mr-2 lg:mr-3 xl:mr-8 py-3">
                <div 
                  class="flex items-center justify-center"
                  :style="logo ? `width: ${Math.min(logo.width * 1.5, 200)}px; height: ${Math.min(logo.height * 1.5, 60)}px` : ''"
                >
                  <span
                    v-if="showDesktopLogoSkeleton"
                    class="h-12 w-12 animate-pulse bg-neutral-200 dark:bg-neutral-700 rounded"
                  ></span>
                  <img
                    v-else-if="currentLogoUrl"
                    :src="currentLogoUrl"
                    :alt="logo?.altText || 'Logo'"
                    :width="logo?.width"
                    :height="logo?.height"
                    class="transition-transform duration-300 hover:scale-110 object-contain w-full h-full max-h-[60px] lg:max-h-[45px] xl:max-h-[60px]"
                  />
                </div>
              </NuxtLink>
            </div>

            <!-- Navigation Menu - Center column -->
            <div class="w-[70%] lg:w-[75%] xl:w-[70%] hidden lg:flex h-full">
              <div class="flex items-center justify-between w-full h-full" ref="menuContainerRef">
                <div class="flex items-center justify-between w-full h-full">
                  <InlineMenuSkeleton v-if="showMenuSkeleton" :item-count="5" />
                  <template v-else>
                    <div class="flex items-center justify-between w-full gap-0.5 lg:gap-1 xl:gap-2">
                      <!-- Visible Menu Items -->
                      <div
                        v-for="(item, itemIndex) in visibleMenuItems"
                        :key="item.id"
                        class="relative group h-full flex items-center"
                        :data-menu-id="item.id"
                        :ref="el => { if (el) menuItemsRefs[itemIndex] = el as HTMLElement }"
                        @mouseenter="(e) => { if (item.children?.length) { showMegaMenu(Number(item.id)); } }"
                        @mouseleave="item.children?.length ? hideMegaMenu() : null"
                      >
                        <NuxtLink
                          :to="item.href"
                          class="main-menu-item flex items-center space-x-1 xl:space-x-1.5 whitespace-nowrap h-full px-1 lg:px-1.5 xl:px-2"
                          :class="{ 
                            'menu-active': isMenuActive(item.href),
                            [props.settings?.navigation?.fontWeight || '']: true
                          }"
                        >
                          <Icon
                            v-if="item.icon"
                            :name="item.icon"
                            class="nav-icon w-3 h-3 lg:w-3 lg:h-3 xl:w-3.5 xl:h-3.5"
                            :style="{ 
                              color: isMenuActive(item.href) 
                                ? 'rgb(var(--color-primary-500))'
                                : props.settings?.navigation?.textColor
                            }"
                          />
                          <span 
                            class="text-[0.7rem] md:text-[0.75rem] lg:text-[0.85rem] xl:text-[1.25rem] uppercase font-black" 
                            :style="{ 
                              color: isMenuActive(item.href) 
                                ? 'rgb(var(--color-primary-500))'
                                : props.settings?.navigation?.textColor
                            }"
                          >
                            {{ item.isTranslated ? t(item.label ?? '') : item.label }}
                          </span>
                          <Icon
                            v-if="item.children?.length"
                            name="ChevronDown"
                            class="nav-icon w-2.5 h-2.5 lg:w-3 lg:h-3 xl:w-3.5 xl:h-3.5 transition-transform duration-300 group-hover:rotate-180"
                            :style="{ 
                              color: isMenuActive(item.href) 
                                ? 'rgb(var(--color-primary-500))'
                                : props.settings?.navigation?.textColor
                            }"
                          />
                        </NuxtLink>

                        <!-- Mega Menu -->
                        <Transition name="fade">
                          <MegaMenu
                            v-if="item.children?.length && activeMegaMenu === item.id"
                            :item="item"
                            :is-active="true"
                            :on-close="() => activeMegaMenu = null"
                            @mouseenter="keepMegaMenu"
                            @mouseleave="hideMegaMenu"
                          />
                        </Transition>
                      </div>

                      <!-- More Menu -->
                      <div 
                        v-if="hiddenMenuItems.length > 0"
                        class="more-menu flex-shrink-0 ml-0.5 lg:ml-0.5 xl:ml-1.5"
                        ref="moreMenuRef"
                      >
                        <button 
                          class="flex items-center justify-center space-x-0.5 py-1.5 lg:py-2 xl:py-4 px-1 lg:px-1.5 xl:px-3 hover:bg-white/30 dark:hover:bg-neutral-800 rounded-md"
                          :style="{ color: props.settings?.navigation?.textColor }"
                          @click="showMoreMenu = !showMoreMenu"
                        >
                          <Icon name="MoreHorizontal" class="nav-icon w-3 h-3 lg:w-3.5 lg:h-3.5 xl:w-4.5 xl:h-4.5" />
                        </button>

                        <!-- More Menu Dropdown -->
                        <Transition
                          enter-active-class="transition ease-out duration-200"
                          enter-from-class="transform opacity-0 scale-95"
                          enter-to-class="transform opacity-100 scale-100"
                          leave-active-class="transition ease-in duration-150"
                          leave-from-class="transform opacity-100 scale-100"
                          leave-to-class="transform opacity-0 scale-95"
                        >
                          <div
                            v-show="showMoreMenu"
                            class="more-menu-dropdown"
                          >
                            <div
                              v-for="item in hiddenMenuItems"
                              :key="item.id"
                              class="menu-item"
                              @mouseenter="(e) => { if (item.children?.length) { showMegaMenu(item.id); } }"
                              @mouseleave="item.children?.length ? hideMegaMenu() : null"
                            >
                              <NuxtLink
                                :to="item.href"
                                class="flex items-center space-x-1.5 w-full px-1.5 lg:px-2 py-1 lg:py-1.5 text-xs"
                                :style="{ color: props.settings?.navigation?.textColor }"
                                @click="showMoreMenu = false"
                              >
                                <Icon
                                  v-if="item.icon"
                                  :name="item.icon"
                                  class="nav-icon w-2.5 h-2.5 lg:w-3 lg:h-3"
                                />
                                <span>{{ item.isTranslated ? t(item.label ?? '') : item.label }}</span>
                                <Icon
                                  v-if="item.children?.length"
                                  name="ChevronRight"
                                  class="nav-icon w-2.5 h-2.5 lg:w-3 lg:h-3 ml-auto"
                                />
                              </NuxtLink>

                              <!-- Mega Menu for More Menu Items -->
                              <Transition name="fade">
                                <MegaMenu
                                  v-if="item.children?.length && activeMegaMenu === item.id"
                                  :item="item"
                                  :is-active="true"
                                  :on-close="() => activeMegaMenu = null"
                                  @mouseenter="keepMegaMenu"
                                  @mouseleave="hideMegaMenu"
                                />
                              </Transition>
                            </div>
                          </div>
                        </Transition>
                      </div>
                    </div>
                  </template>
                </div>
              </div>
            </div>

            <!-- Right Actions - Right column -->
            <div class="w-[15%] lg:w-[13%] xl:w-[15%] flex items-center justify-end gap-1 lg:gap-2 xl:gap-4">
              <!-- Combined Book Now Button -->
              <NuxtLink
                :to="bookingRoute"
                class="booking-link hidden lg:flex items-center gap-1 lg:gap-1 xl:gap-1.5 px-0.5 lg:px-1.5 xl:px-3.5 py-0.5 lg:py-0.5 xl:py-1.5 min-h-[30px] lg:min-h-[42px] xl:min-h-[52px] 2xl:min-h-[62px] rounded-full transition-all duration-300 hover:opacity-90"
                :style="{
                  backgroundColor: props.settings?.bookingButton?.backgroundColor || 'rgb(var(--color-primary-500))',
                  color: props.settings?.bookingButton?.textColor || '#ffffff'
                }"
              >
                <div class="relative">
                  <div class="animate-ring absolute -inset-0.5 rounded-full border border-white opacity-75"></div>
                  <div class="relative flex items-center justify-center rounded-full bg-white/20 w-4 lg:w-4 xl:w-12 h-3.5 lg:h-4 xl:h-12">
                    <Phone
                      class="text-white"
                      :size="20"
                      :stroke-width="2.5"
                      aria-hidden="true"
                    />
                  </div>
                </div>
                <div class="flex flex-col items-start py-0.5">
                  <span class="text-[0.65rem] lg:text-[0.7rem] xl:text-lg font-bold leading-none lg:leading-normal whitespace-nowrap">
                    {{ t(props.settings?.bookingButton?.text ?? 'booking.button') }}
                  </span>
                  <div class="flex flex-col">
                    <template v-for="(phone, index) in props.settings?.bookingButton?.phoneNumbers" :key="index">
                      <button 
                        class="text-[6px] lg:text-[7px] xl:text-[12px] leading-tight opacity-90 hover:underline transition-all duration-300"
                        @click.stop="callPhone(phone.number)"
                      >
                        {{ t(phone.label) }}: {{ phone.number }}
                      </button>
                    </template>
                  </div>
                </div>
              </NuxtLink>

                                        <!-- Mobile Menu Button -->
              <button
                class="lg:hidden flex items-center justify-center w-10 h-10 hover:bg-white/30 dark:hover:bg-neutral-800 rounded-full"
                @click="toggleMobileMenu"
                aria-label="Toggle Menu"
              >
                <Icon :name="isMobileMenuOpen ? 'X' : 'Menu'" class="nav-icon w-6 h-6" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Mobile Menu -->
    <Transition name="slide-fade">
      <div
        v-if="isMobileMenuOpen"
        class="mobile-menu-overlay"
        style="z-index: 9999 !important;"
        @click="isMobileMenuOpen = false"
      >
        <div 
          class="mobile-menu-content bg-white dark:bg-neutral-900"
          style="z-index: 10000 !important;"
          @click.stop
        >
          <!-- Mobile Menu Header -->
          <div class="mobile-menu-header flex items-center justify-between px-4 py-3 border-b border-neutral-200 dark:border-neutral-700">
            <NuxtLink to="/" class="flex-shrink-0" @click="isMobileMenuOpen = false">
              <img
                v-if="mobileLogoUrl"
                :src="mobileLogoUrl"
                :alt="mobileLogo?.altText || 'Logo'"
                class="h-8 w-auto object-contain"
              />
            </NuxtLink>
            <button
              class="p-2 text-neutral-700 dark:text-neutral-300 hover:text-primary-600 dark:hover:text-primary-400 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800"
              @click="isMobileMenuOpen = false"
              aria-label="Close Menu"
            >
              <Icon name="X" class="nav-icon w-5 h-5" />
            </button>
          </div>

          <!-- Mobile Call Button & Booking Button -->
          <div class="px-4 py-3 border-b border-neutral-200 dark:border-neutral-700">
            <div class="flex flex-col gap-3">
              <div class="flex items-center gap-3">
                <div class="relative">
                  <div class="animate-ring absolute -inset-0.5 rounded-full border border-primary-500 opacity-75"></div>
                  <div class="relative flex items-center justify-center rounded-full bg-primary-500 w-10 h-10">
                    <Phone class="text-white" :size="16" :stroke-width="2.5" aria-hidden="true" />
                  </div>
                </div>
                <div class="flex flex-col">
                  <span class="text-sm font-bold text-neutral-900 dark:text-white">
                    {{ t(props.settings?.bookingButton?.text ?? 'booking.button') }}
                  </span>
                  <div class="flex flex-col">
                    <template v-for="(phone, index) in props.settings?.bookingButton?.phoneNumbers" :key="index">
                      <button 
                        class="text-xs text-primary-600 dark:text-primary-400 font-medium hover:underline transition-all duration-300 text-left"
                        @click="callPhone(phone.number)"
                      >
                        {{ t(phone.label) }}: {{ phone.number }}
                      </button>
                    </template>
                  </div>
                </div>
              </div>
              <NuxtLink
                :to="bookingRoute"
                class="flex items-center justify-center gap-2 w-full px-4 py-3 bg-primary-500 hover:bg-primary-600 text-white font-medium rounded-full transition-all duration-300 text-sm"
                @click="isMobileMenuOpen = false"
              >
                <Icon name="Calendar" class="w-4 h-4" />
                {{ t('Đặt vé ngay') }}
              </NuxtLink>
            </div>
          </div>

          <div class="px-4 py-4 space-y-4">


            <!-- Language Switcher and Theme Toggle in Mobile Menu -->
            <div class="flex flex-col space-y-3">
              <div v-if="props.settings?.showLanguageSwitcher" class="w-full">
                <LanguageSwitcher />
              </div>
              <div v-if="props.settings?.showThemeToggle" class="w-full">
                <ThemeToggle mode="full" />
              </div>
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
                  class="mobile-main-menu-item flex items-center justify-between px-3 py-3 text-sm font-semibold uppercase rounded-lg"
                  :class="{ 'mobile-menu-active': isMenuActive(item.href) }"
                >
                  <NuxtLink
                    :to="item.href"
                    class="flex-1 flex items-center gap-3"
                    @click="isMobileMenuOpen = false"
                  >
                    <Icon
                      v-if="item.icon"
                      :name="item.icon"
                      class="nav-icon w-5 h-5"
                    />
                    {{ item.label }}
                  </NuxtLink>
                  <button
                    class="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full"
                    @click.stop="toggleMobileMegaMenu(item.id)"
                  >
                    <Icon
                      name="ChevronRight"
                      class="nav-icon w-4 h-4 transition-transform duration-300"
                      :class="{ 'rotate-90': activeMobileMegaMenu === item.id }"
                    />
                  </button>
                </div>

                <!-- Regular Menu Item -->
                <NuxtLink
                  v-else
                  :to="item.href"
                  class="mobile-main-menu-item flex items-center gap-3 px-3 py-3 text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:text-primary-600 dark:hover:text-primary-400 rounded-lg transition-colors duration-300"
                  :class="{ 'text-primary-600 dark:text-primary-400': isMenuActive(item.href) }"
                  @click="isMobileMenuOpen = false"
                >
                  <Icon
                    v-if="item.icon"
                    :name="item.icon"
                    class="nav-icon w-5 h-5"
                  />
                  {{ item.label }}
                </NuxtLink>

                <!-- Mobile Mega Menu Content -->
                <Transition
                  enter-active-class="transition duration-300 ease-out"
                  enter-from-class="transform -translate-y-4 opacity-0"
                  enter-to-class="transform translate-y-0 opacity-100"
                  leave-active-class="transition duration-200 ease-in"
                  leave-from-class="transform translate-y-0 opacity-100"
                  leave-to-class="transform -translate-y-4 opacity-0"
                >
                  <MobileMegaMenu
                    v-if="item.children && item.children.length > 0 && activeMobileMegaMenu === item.id"
                    :item="item"
                    :is-active="isMenuActive(item.href)"
                    :on-close="() => { isMobileMenuOpen = false; activeMobileMegaMenu = null; }"
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

<style lang="scss" scoped>
.navbar-container {
  position: relative;
  z-index: 50;

  .top-menu {
    position: relative;
    z-index: 50;
    background-color: rgb(var(--color-primary-DEFAULT));

    .w-full.px-8 {
      padding-left: 0.5rem;
      padding-right: 0.5rem;
    }

    @screen sm {
      .w-full.px-8 {
        padding-left: 1rem;
        padding-right: 1rem;
      }
    }

    @screen md {
      .w-full.px-8 {
        padding-left: 2rem;
        padding-right: 2rem;
      }
    }

    .icon {
      width: 1rem;
      height: 1rem;
      flex-shrink: 0;

      @screen md {
        width: 1.25rem;
        height: 1.25rem;
      }
    }
  }

  .fixed-time-width {
    display: inline-block;
    width: 240px;
  }

  .nav-icon {
    flex-shrink: 0;
    width: auto;
    height: auto;
  }

  .main-menu-item {
    position: relative;
    transition-property: color;
    transition-duration: 300ms;
    padding: 0 0.75rem;

    @media (max-width: 1440px) {
      padding: 0 0.5rem;
    }

    @media (max-width: 1280px) {
      padding: 0 0.25rem;
      font-size: 0.9rem;
    }

    @media (max-width: 1180px) {
      padding: 0 0.2rem;
      font-size: 0.85rem;
    }

    &::after {
      content: none;
    }

    span, .icon {
      transition-property: color;
      transition-duration: 300ms;
    }

    &:hover {
      span, .icon {
        color: rgb(var(--color-primary-500)) !important;
      }
    }

    &.menu-active {
      span, .icon {
        color: rgb(var(--color-primary-500)) !important;
      }

      &::after {
        content: none;
      }
    }
  }

  .nav-wrapper {
    position: relative;
    z-index: 40;

    &.nav-sticky {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
      animation: slideDown 0.3s ease-out;
    }
  }

  .navigation-section {
    position: relative;
    
    .container {
      height: 100%;
      
      > div {
        height: 100%;
      }
    }
  }

  .more-menu {
    position: relative;

    &-dropdown {
      position: absolute;
      right: 0;
      margin-top: 0.5rem;
      padding-top: 0.5rem;
      padding-bottom: 0.5rem;
      background-color: white;
      border-radius: 0.375rem;
      box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
      border: 1px solid rgb(229 231 235);
      min-width: 160px;
      max-width: 220px;
      z-index: 1000;

      @media (min-width: 1280px) {
        min-width: 200px;
        max-width: 250px;
      }

      .dark & {
        background-color: rgb(38 38 38);
        border-color: rgb(64 64 64);
      }

      &::before {
        content: '';
        position: absolute;
        top: -0.5rem;
        right: 1.25rem;
        height: 1rem;
        width: 1rem;
        background-color: white;
        border-left: 1px solid rgb(229 231 235);
        border-top: 1px solid rgb(229 231 235);
        transform: rotate(45deg);

        .dark & {
          background-color: rgb(38 38 38);
          border-color: rgb(64 64 64);
        }
      }

      .menu-item {
        display: flex;
        align-items: center;
        justify-content: space-between;
        cursor: pointer;

        &:hover {
          background-color: rgb(243 244 246);
          .dark & {
            background-color: rgb(64 64 64);
          }
        }

        span {
          font-size: 0.875rem;
          
          @media (min-width: 1280px) {
            font-size: 1rem;
          }
        }
      }
    }
  }

  .mobile-menu-overlay {
    position: fixed;
    inset: 0;
    background-color: rgba(0, 0, 0, 0.5);
    backdrop-filter: blur(4px);

    .mobile-menu-content {
      position: fixed;
      top: 0;
      right: 0;
      height: 100%;
      width: 100%;
      max-width: 85%;
      overflow-y: auto;
      box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1);
      animation: slideInRight 0.3s ease-out;

      @media (min-width: 480px) {
        max-width: 320px;
      }
    }
  }

  .mobile-main-menu-item {
    position: relative;

    &:hover {
      background-color: rgb(249 250 251);

      .dark & {
        background-color: rgb(38 38 38);
      }
    }

    &.mobile-menu-active {
      color: rgb(var(--color-primary-500));
      background-color: rgb(239 246 255);

      .dark & {
        background-color: rgba(var(--color-primary-900), 0.2);
      }
    }
  }

  @keyframes ring {
    0% {
      transform: scale(0.8);
      opacity: 0.5;
    }
    100% {
      transform: scale(1.2);
      opacity: 0;
    }
  }

  .animate-ring {
    animation: ring 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite;
  }

  // Add spacer for content below fixed menu
  &::before {
    content: '';
    display: block;
    height: 50px; // Increased for better mobile header
    
    @media (min-width: 640px) {
      height: 56px; // Taller for larger mobile screens
    }
    
    @media (min-width: 1024px) {
      display: none;
    }
  }
}

@keyframes slideDown {
  from {
    transform: translateY(-100%);
  }
  to {
    transform: translateY(0);
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-fade-enter-active,
.slide-fade-leave-active {
  transition: all 0.3s ease-out;
}

.slide-fade-enter-from {
  opacity: 0;
  transform: translateX(20px);
}

.slide-fade-leave-to {
  opacity: 0;
  transform: translateX(20px);
}

@keyframes slideInRight {
  from {
    transform: translateX(100%);
  }
  to {
    transform: translateX(0);
  }
}

.nav-wrapper-mobile {
  position: relative;
  z-index: 40;

  &.nav-sticky {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
    animation: slideDown 0.3s ease-out;
  }
}

.top-menu-mobile {
  position: relative;
  z-index: 50;
  background-color: rgb(var(--color-primary-DEFAULT));
}

.mobile-shadow {
  box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
  transition: box-shadow 0.3s ease-in-out;
}

/* Navbar Cart Icon Styling */
.navbar-cart-icon {
  position: relative;
  z-index: 60;
}

.navbar-cart-icon .cart-icon-container {
  position: relative;
}

/* Ensure cart preview dropdown appears above other elements */
.navbar-cart-icon .cart-icon-container > div:last-child {
  z-index: 70 !important;
}

/* Adjust cart preview positioning for navbar */
@media (min-width: 1024px) {
  .navbar-cart-icon .cart-icon-container > div:last-child {
    right: -1rem;
  }
}

/* Top Menu Cart Icon Styling */
.top-menu-cart-icon {
  position: relative;
  z-index: 65;
}

.top-menu-cart-icon .cart-icon-container {
  position: relative;
}

.top-menu-cart-icon .cart-icon-container button {
  width: 1.5rem;
  height: 1.5rem;
  padding: 0.25rem;
}

@media (min-width: 640px) {
  .top-menu-cart-icon .cart-icon-container button {
    width: 1.75rem;
    height: 1.75rem;
  }
}

@media (min-width: 1024px) {
  .top-menu-cart-icon .cart-icon-container button {
    width: 2rem;
    height: 2rem;
  }
}

@media (min-width: 1280px) {
  .top-menu-cart-icon .cart-icon-container button {
    width: 2.25rem;
    height: 2.25rem;
  }
}

/* Mobile Top Menu Cart Icon */
.mobile-top-menu-cart-icon {
  position: relative;
}

.mobile-top-menu-cart-icon .cart-icon-container button {
  background-color: transparent;
  color: rgb(75 85 99);
  padding: 0.5rem;
  border-radius: 0.5rem;
  width: 100%;
  justify-content: flex-start;
  gap: 0.75rem;
}

.mobile-top-menu-cart-icon .cart-icon-container button:hover {
  background-color: rgb(243 244 246);
}

.dark .mobile-top-menu-cart-icon .cart-icon-container button {
  color: rgb(209 213 219);
}

.dark .mobile-top-menu-cart-icon .cart-icon-container button:hover {
  background-color: rgb(55 65 81);
}

/* Mobile Navbar Cart Icon */
.mobile-navbar-cart-icon {
  position: relative;
  z-index: 65;
}

.mobile-navbar-cart-icon .cart-icon-container button {
  width: 2.25rem;
  height: 2.25rem;
  padding: 0.5rem;
  border-radius: 50%;
  background-color: rgba(255, 255, 255, 0.2);
  color: white;
  transition: background-color 0.3s ease;
}

.mobile-navbar-cart-icon .cart-icon-container button:hover {
  background-color: rgba(255, 255, 255, 0.3);
}

.mobile-navbar-cart-icon .cart-icon-container button svg {
  width: 1rem;
  height: 1rem;
}

@media (min-width: 640px) {
  .mobile-navbar-cart-icon .cart-icon-container button {
    width: 2.5rem;
    height: 2.5rem;
  }
  
  .mobile-navbar-cart-icon .cart-icon-container button svg {
    width: 1.25rem;
    height: 1.25rem;
  }
}
</style>
