<script setup lang="ts">
import type { DropdownItem } from '@nuxt/ui/dist/runtime/types'
import { useUserStore } from '@/stores/useUserStore'
import { 
  Moon, 
  Sun, 
  ChevronDown,
} from 'lucide-vue-next'
import { ref, computed, inject, onMounted, watch, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
// @ts-ignore
import { navigateTo, useColorMode, useHead } from '#imports'
import { useI18n } from 'vue-i18n'
import { useAuth } from '@/composables/useAuth'
import { useLocalization } from '@/composables/useLocalization'
import SidebarNavigation from '@/components/common/SidebarNavigation.vue'
import LanguageSwitcher from '@/components/common/LanguageSwitcher.vue'

const colorMode = useColorMode()
const isDark = computed(() => colorMode.value === 'dark')
const userStore = useUserStore()
const { checkAuth, logout } = useAuth()
const route = useRoute()
const router = useRouter()
const currentPath = ref(route.path)
const { t } = useI18n()

// Computed for reactivity
const isUserLoaded = computed(() => userStore.isAuthenticated && !!userStore.user)
const currentUser = computed(() => userStore.user)

// Localization
const { locale, locales, currentLocale, switchLanguage } = useLocalization()

// Try to get injected page title from child components
const injectedTitle = inject('pageTitle', ref(''))

// Get current section from route
const getCurrentSection = () => {
  const path = currentPath.value
  // If we have an injected title from a child component, use it
  if (injectedTitle.value) return injectedTitle.value
  
  // Handle specific cases
  if (path.includes('/users/create')) return 'Create User'
  if (path.includes('/users/edit/')) return 'Edit User'
  if (path.includes('/roles/create')) return 'Create Role'
  if (path.includes('/roles/edit/')) return 'Edit Role'
  if (path.includes('/products/create')) return 'Create Product'
  if (path.includes('/products/edit/')) return 'Edit Product'
  if (path.includes('/reviews/add')) return 'Add Review'
  if (path.includes('/reviews/edit/')) return 'Edit Review'
  
  return 'Admin Dashboard'
}

// Dynamic page title based on current route with SSR support
const pageTitle = computed(() => {
  const section = getCurrentSection()
  const adminPageSuffix = t('common.adminPageSuffix')
  
  if (section.includes(adminPageSuffix)) return section
  
  return section !== 'Dashboard' ? `${section} ${adminPageSuffix}` : `Dashboard ${adminPageSuffix}`
})

// Set page title with SSR support
useHead(() => ({
  title: pageTitle.value
}))

// Watch for route changes
onMounted(async () => {
  currentPath.value = route.path
  
  try {
    console.log('🏠 Layout: Starting authentication verification')
    const isAuthenticated = await checkAuth()
    
    if (!isAuthenticated) {
      console.log('❌ Layout: Authentication failed, redirecting to login')
      navigateTo('/auth/login', { replace: true })
      return
    } else {
      console.log('✅ Layout: Authentication successful, user loaded')
    }
  } catch (error) {
    console.error('❌ Layout: Authentication check failed:', error)
    navigateTo('/auth/login', { replace: true })
    return
  }
  
  router.afterEach((to) => {
    currentPath.value = to.path
  })
})

const handleLogout = async () => {
  try {
    await logout()
  } catch (error) {
    console.error('Logout failed:', error)
  }
}

const userMenuItems: DropdownItem[][] = [[
  { 
    label: 'Profile', 
    icon: 'i-heroicons-user-circle',
    to: '/profile'
  },
  { 
    label: 'Logout', 
    icon: 'i-heroicons-arrow-right-on-rectangle',
    click: handleLogout
  }
]]

// User menu dropdown state
const isUserMenuOpen = ref(false)
const userMenuRef = ref<HTMLElement | null>(null)
const userDropdownButtonRef = ref<HTMLElement | null>(null)

const handleClickOutside = (event: MouseEvent) => {
  if (userDropdownButtonRef.value && userDropdownButtonRef.value.contains(event.target as Node)) {
    return
  }
  
  if (userMenuRef.value && !userMenuRef.value.contains(event.target as Node)) {
    isUserMenuOpen.value = false
  }
}

const toggleUserMenu = (event: MouseEvent) => {
  event.stopPropagation()
  isUserMenuOpen.value = !isUserMenuOpen.value
}

// Locale dropdown state
const isLocaleMenuOpen = ref(false)
const localeMenuRef = ref<HTMLElement | null>(null)
const localeDropdownButtonRef = ref<HTMLElement | null>(null)

const handleLocaleClickOutside = (event: MouseEvent) => {
  if (localeDropdownButtonRef.value && localeDropdownButtonRef.value.contains(event.target as Node)) {
    return
  }
  
  if (localeMenuRef.value && !localeMenuRef.value.contains(event.target as Node)) {
    isLocaleMenuOpen.value = false
  }
}

const toggleLocaleMenu = (event: MouseEvent) => {
  event.stopPropagation()
  isLocaleMenuOpen.value = !isLocaleMenuOpen.value
}

const handleLocaleChange = (localeCode: string) => {
  switchLanguage(localeCode)
  isLocaleMenuOpen.value = false
}

// Event listeners for dropdowns
watch(isUserMenuOpen, (newVal) => {
  if (newVal) {
    setTimeout(() => {
      window.addEventListener('click', handleClickOutside)
    }, 0)
  } else {
    window.removeEventListener('click', handleClickOutside)
  }
})

watch(isLocaleMenuOpen, (newVal) => {
  if (newVal) {
    setTimeout(() => {
      window.addEventListener('click', handleLocaleClickOutside)
    }, 0)
  } else {
    window.removeEventListener('click', handleLocaleClickOutside)
  }
})

onUnmounted(() => {
  window.removeEventListener('click', handleClickOutside)
  window.removeEventListener('click', handleLocaleClickOutside)
})
</script>

<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900 overflow-hidden flex flex-col">
    <!-- Header -->
    <header class="bg-white dark:bg-gray-800 shadow sticky top-0 z-10 h-16">
      <div class="flex items-center justify-between px-4 py-2 h-full">
        <div class="flex items-center">
          <NuxtLink to="/" class="flex items-center text-gray-800 dark:text-white">
            <span class="text-xl font-semibold ml-2">Admin Dashboard</span>
          </NuxtLink>
        </div>
        
        <div class="flex items-center gap-2 relative">
          <!-- Language Switcher -->
          <LanguageSwitcher />
          
          <!-- Color Mode Toggle -->
          <UButton 
            icon
            color="gray" 
            variant="ghost" 
            aria-label="Toggle color mode"
            @click="colorMode = colorMode === 'dark' ? 'light' : 'dark'"
          >
            <template #leading>
              <component :is="isDark ? Sun : Moon" class="w-5 h-5" />
            </template>
          </UButton>
          
          <!-- User Menu -->
          <UDropdown :items="userMenuItems" :open="isUserMenuOpen" :popper="{ placement: 'bottom-end', offsetDistance: 8 }">
            <div 
              class="flex items-center cursor-pointer"
              ref="userDropdownButtonRef"
              @click="toggleUserMenu"
            >
              <!-- User info with loading state -->
              <div v-if="userStore.user" class="flex items-center">
                <div class="relative">
                  <div class="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center uppercase">
                    {{ userStore.avatarInitial }}
                  </div>
                  <span class="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-green-500 border-2 border-white"></span>
                </div>
                <div class="ml-2 hidden sm:block">
                  <div class="text-sm font-medium text-gray-700 dark:text-gray-200">
                    {{ userStore.displayName }}
                    <span v-if="userStore.isSuperAdmin" class="ml-1 text-xs px-1.5 py-0.5 bg-amber-100 text-amber-800 rounded-full">SUPER</span>
                  </div>
                  <div class="text-xs text-gray-500 dark:text-gray-400">{{ userStore.user?.email || '' }}</div>
                </div>
              </div>
              <!-- Loading state -->
              <div v-else class="flex items-center">
                <div class="w-8 h-8 rounded-full bg-gray-300 animate-pulse"></div>
                <div class="ml-2 hidden sm:block">
                  <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-1 w-20"></div>
                  <div class="h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-24"></div>
                </div>
              </div>
              <ChevronDown class="w-4 h-4 ml-1 text-gray-500" />
            </div>
          </UDropdown>
        </div>
      </div>
    </header>
    
    <!-- Main Content -->
    <div class="flex flex-1 overflow-hidden">
      <!-- Sidebar -->
      <aside class="w-64 bg-white dark:bg-gray-800 shadow-lg overflow-y-auto hidden md:block flex-shrink-0">
        <div class="py-4">
          <div class="px-4 mb-4">
            <span class="text-xs uppercase font-semibold text-gray-500 dark:text-gray-400">{{ t('Main Navigation') }}</span>
          </div>
          
          <!-- Navigation Links -->
          <nav>
            <SidebarNavigation />
          </nav>
        </div>
      </aside>
      
      <!-- Content Area -->
      <main class="flex-grow p-6 overflow-y-auto">
        <div class="container mx-auto">
          <slot />
        </div>
      </main>
    </div>
  </div>
</template>

<style scoped>
/* Remove router-link-active styling */

/* Smooth loading transitions */
.user-info-container {
  transition: all 0.2s ease-in-out;
}

/* Prevent flash of unstyled content */
.header-loading {
  opacity: 0;
  animation: fadeIn 0.3s ease-in-out forwards;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
</style> 
