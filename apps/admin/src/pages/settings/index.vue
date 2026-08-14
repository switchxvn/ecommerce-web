<script setup lang="ts">
import { ref, computed, provide, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { usePermissions } from '@/composables/usePermissions'
import { useAdminSettings } from '@/composables/useAdminSettings'
import { useUserStore } from '@/stores/useUserStore'

// Add page meta for auth middleware
definePageMeta({
  middleware: ['auth']
})
import { 
  Settings, 
  Globe, 
  Shield, 
  Mail, 
  Languages, 
  Search as SearchIcon,
  Database,
  Palette,
  Bell,
  Users,
  Key,
  Monitor,
  Zap,
  Megaphone
} from 'lucide-vue-next'

const { t } = useI18n()
const { isSuperAdmin, hasPermission } = usePermissions()
const { availableGroups, fetchAllSettings } = useAdminSettings()
const userStore = useUserStore()

// Provide page title for layout
provide('pageTitle', ref('Settings'))

// Permission checking state
const isLoadingPermissions = ref(true)
const hasPermissionAccess = ref(false)

// Watch for user data changes and check permissions
watch(() => userStore.user, (user) => {
  if (user) {
    // Check permissions once user data is available
    hasPermissionAccess.value = isSuperAdmin.value || hasPermission('ACCESS_ADMIN_SETTINGS')
    isLoadingPermissions.value = false
    
    if (!hasPermissionAccess.value) {
      console.log('User does not have permission to access settings')
      navigateTo('/auth/login')
    }
  }
}, { immediate: true })

// Also check if user store is not loading
watch(() => userStore.isLoading, (loading) => {
  if (!loading && !userStore.user) {
    // User finished loading but no user data - redirect to login
    navigateTo('/auth/login')
  }
})

// Settings categories
const settingsCategories = computed(() => [
  {
    title: 'Popup quảng cáo',
    description: 'Quản lý nội dung, lịch hiển thị và trạng thái chiến dịch popup.',
    icon: Megaphone,
    color: 'blue',
    route: '/settings/advertising-popups',
    group: 'advertising-popup',
    permission: 'MANAGE_SETTINGS',
    features: ['Nội dung popup', 'Lịch hiển thị', 'Kích hoạt chiến dịch'],
    count: 0
  },
  {
    title: t('settings.categories.general.title'),
    description: t('settings.categories.general.description'),
    icon: Settings,
    color: 'blue',
    route: '/settings/general',
    group: 'general',
    permission: 'MANAGE_SETTINGS',
    features: [
      t('settings.categories.general.features.siteName'),
      t('settings.categories.general.features.logo'),
      t('settings.categories.general.features.contactInfo'),
      t('settings.categories.general.features.defaultLanguage')
    ],
    count: 0
  },
  {
    title: t('settings.categories.language.title'),
    description: t('settings.categories.language.description'),
    icon: Languages,
    color: 'green',
    route: '/settings/language',
    group: 'language',
    permission: 'MANAGE_LOCALES',
    features: [
      t('settings.categories.language.features.supportedLanguages'),
      t('settings.categories.language.features.defaultLocale'),
      t('settings.categories.language.features.dateFormats'),
      t('settings.categories.language.features.numberFormats')
    ],
    count: 0
  },
  {
    title: t('settings.categories.seo.title'),
    description: t('settings.categories.seo.description'),
    icon: SearchIcon,
    color: 'purple',
    route: '/settings/seo',
    group: 'seo',
    permission: 'MANAGE_SEO',
    features: [
      t('settings.categories.seo.features.metaTags'),
      t('settings.categories.seo.features.openGraph'),
      t('settings.categories.seo.features.sitemap'),
      t('settings.categories.seo.features.analytics')
    ],
    count: 0
  },
  {
    title: t('settings.categories.email.title'),
    description: t('settings.categories.email.description'),
    icon: Mail,
    color: 'orange',
    route: '/settings/email',
    group: 'email',
    permission: 'MANAGE_EMAIL',
    features: [
      t('settings.categories.email.features.smtpSettings'),
      t('settings.categories.email.features.emailTemplates'),
      t('settings.categories.email.features.notificationRules'),
      t('settings.categories.email.features.deliveryStatus')
    ],
    count: 0
  },
  {
    title: t('settings.categories.security.title'),
    description: t('settings.categories.security.description'),
    icon: Shield,
    color: 'red',
    route: '/settings/security',
    group: 'security',
    permission: 'MANAGE_AUTH',
    features: [
      t('settings.categories.security.features.passwordPolicy'),
      t('settings.categories.security.features.twoFactorAuth'),
      t('settings.categories.security.features.sessionManagement'),
      t('settings.categories.security.features.apiKeys')
    ],
    count: 0
  },
  {
    title: t('settings.categories.theme.title'),
    description: t('settings.categories.theme.description'),
    icon: Palette,
    color: 'pink',
    route: '/settings/theme',
    group: 'theme',
    permission: 'MANAGE_THEME',
    features: [
      t('settings.categories.theme.features.colorScheme'),
      t('settings.categories.theme.features.typography'),
      t('settings.categories.theme.features.layoutOptions'),
      t('settings.categories.theme.features.customCss')
    ],
    count: 0
  },
  {
    title: t('settings.categories.users.title'),
    description: t('settings.categories.users.description'),
    icon: Users,
    color: 'indigo',
    route: '/settings/users',
    group: 'user',
    permission: 'MANAGE_USERS',
    features: [
      t('settings.categories.users.features.registrationRules'),
      t('settings.categories.users.features.profileFields'),
      t('settings.categories.users.features.userRoles'),
      t('settings.categories.users.features.permissions')
    ],
    count: 0
  },
  {
    title: t('settings.categories.system.title'),
    description: t('settings.categories.system.description'),
    icon: Monitor,
    color: 'gray',
    route: '/settings/system',
    group: 'system',
    permission: 'MANAGE_SYSTEM',
    features: [
      t('settings.categories.system.features.cacheSettings'),
      t('settings.categories.system.features.databaseConfig'),
      t('settings.categories.system.features.logManagement'),
      t('settings.categories.system.features.backup')
    ],
    count: 0
  },
  {
    title: t('settings.categories.api.title'),
    description: t('settings.categories.api.description'),
    icon: Key,
    color: 'cyan',
    route: '/settings/api',
    group: 'api',
    permission: 'MANAGE_API',
    features: [
      t('settings.categories.api.features.apiKeys'),
      t('settings.categories.api.features.webhooks'),
      t('settings.categories.api.features.externalServices'),
      t('settings.categories.api.features.rateLimiting')
    ],
    count: 0
  },
  {
    title: t('settings.categories.logo.title'),
    description: t('settings.categories.logo.description'),
    icon: Globe,
    color: 'emerald',
    route: '/settings/logo',
    group: 'logo',
    permission: 'MANAGE_LOGO',
    features: [
      t('settings.categories.logo.features.mainLogo'),
      t('settings.categories.logo.features.mobileLogo'),
      t('settings.categories.logo.features.favicon'),
      t('settings.categories.logo.features.darkLightMode')
    ],
    count: 0
  },
  {
    title: t('settings.categories.advanced.title'),
    description: t('settings.categories.advanced.description'),
    icon: Zap,
    color: 'yellow',
    route: '/settings/advanced',
    group: 'advanced',
    permission: 'MANAGE_ADVANCED',
    features: [
      t('settings.categories.advanced.features.debugMode'),
      t('settings.categories.advanced.features.featureFlags'),
      t('settings.categories.advanced.features.customFields'),
      t('settings.categories.advanced.features.scripts')
    ],
    count: 0
  }
])

// Filter categories based on permissions
const accessibleCategories = computed(() => {
  return settingsCategories.value.filter(category => {
    if (isSuperAdmin.value) return true
    return hasPermission(category.permission)
  })
})

// Search functionality
const searchQuery = ref('')
const filteredCategories = computed(() => {
  if (!searchQuery.value) return accessibleCategories.value
  
  const query = searchQuery.value.toLowerCase()
  return accessibleCategories.value.filter(category => 
    category.title.toLowerCase().includes(query) ||
    category.description.toLowerCase().includes(query) ||
    category.features.some(feature => feature.toLowerCase().includes(query))
  )
})

// Color variants for badges
const getColorVariant = (color: string) => {
  const colorMap: Record<string, string> = {
    blue: 'blue',
    green: 'green', 
    purple: 'purple',
    orange: 'orange',
    red: 'red',
    pink: 'pink',
    indigo: 'indigo',
    gray: 'gray',
    cyan: 'cyan',
    yellow: 'yellow'
  }
  return colorMap[color] || 'gray'
}

// Update counts when available groups change
const updateCategoryCounts = () => {
  settingsCategories.value.forEach(category => {
    // This is a placeholder - you might want to fetch actual counts from API
    category.count = Math.floor(Math.random() * 10) + 1
  })
}

onMounted(async () => {
  // Ensure user data is loaded
  if (!userStore.user && !userStore.isLoading) {
    try {
      await userStore.fetchUser()
    } catch (error) {
      console.error('Failed to fetch user in settings:', error)
    }
  }
  
  // Load settings data
  await fetchAllSettings()
  updateCategoryCounts()
})
</script>

<template>
  <div class="space-y-6">
    <!-- Loading State -->
    <div v-if="isLoadingPermissions" class="flex items-center justify-center min-h-screen">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
    </div>

    <!-- Main Content -->
    <template v-else-if="hasPermissionAccess">
    <!-- Header -->
    <div class="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
      <div class="flex items-center justify-between">
        <div class="flex items-center space-x-3">
          <Settings class="h-8 w-8 text-primary-600 dark:text-primary-400" />
          <div>
            <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
              {{ t('settings.title', 'Settings') }}
            </h1>
            <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {{ t('settings.description', 'Manage your system configuration and preferences') }}
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Search -->
    <div class="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
      <div class="max-w-md">
        <UInput
          v-model="searchQuery"
          :placeholder="t('settings.common.searchSettings')"
          icon="i-lucide-search"
          size="lg"
        />
      </div>
    </div>

    <!-- Categories Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <template v-for="category in filteredCategories" :key="category.title">
        <div class="bg-white dark:bg-gray-800 shadow rounded-lg hover:shadow-xl transition-all duration-200 group cursor-pointer border border-transparent hover:border-primary-200 dark:hover:border-primary-700">
          <NuxtLink :to="category.route" class="block p-6 h-full no-underline">
            <!-- Header -->
            <div class="flex items-start justify-between mb-4">
              <div class="flex items-center space-x-3">
                <div :class="`p-3 rounded-lg bg-${category.color}-100 dark:bg-${category.color}-900/20 group-hover:scale-110 transition-transform`">
                  <component :is="category.icon" :class="`h-6 w-6 text-${category.color}-600 dark:text-${category.color}-400`" />
                </div>
                <div class="flex-1 min-w-0">
                  <h3 class="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                    {{ category.title }}
                  </h3>
                </div>
              </div>
              
              <UBadge 
                :color="getColorVariant(category.color)"
                variant="soft" 
                size="sm"
              >
                {{ category.count }} {{ t('settings.common.settings', 'settings') }}
              </UBadge>
            </div>

            <!-- Description -->
            <p class="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
              {{ category.description }}
            </p>

            <!-- Features List -->
            <div class="space-y-2 mb-4">
              <div class="flex flex-wrap gap-1">
                <span 
                  v-for="(feature, index) in category.features.slice(0, 3)" 
                  :key="index"
                  class="inline-block px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded"
                >
                  {{ feature }}
                </span>
                <span 
                  v-if="category.features.length > 3"
                  class="inline-block px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 rounded"
                >
                  +{{ category.features.length - 3 }} more
                </span>
              </div>
            </div>

            <!-- Action -->
            <div class="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
              <span class="text-sm text-gray-500 dark:text-gray-400">
                {{ t('settings.common.manage_category', 'Manage settings') }}
              </span>
              <div class="text-primary-600 dark:text-primary-400 group-hover:translate-x-1 transition-transform">
                <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </NuxtLink>
        </div>
      </template>
    </div>

    <!-- No Results -->
    <div 
      v-if="filteredCategories.length === 0 && searchQuery"
      class="bg-white dark:bg-gray-800 shadow rounded-lg p-8 text-center"
    >
      <SearchIcon class="h-12 w-12 text-gray-400 mx-auto mb-4" />
      <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">
        {{ t('settings.common.no_results', 'No Settings Found') }}
      </h3>
      <p class="text-sm text-gray-600 dark:text-gray-400 max-w-md mx-auto">
        {{ t('settings.common.no_results_message', 'No settings categories match your search. Try a different keyword.') }}
      </p>
      <UButton 
        variant="outline" 
        class="mt-4"
        @click="searchQuery = ''"
      >
        {{ t('settings.common.clear_search', 'Clear Search') }}
      </UButton>
    </div>

    <!-- No Access Message -->
    <div 
      v-if="accessibleCategories.length === 0 && !searchQuery"
      class="bg-white dark:bg-gray-800 shadow rounded-lg p-8 text-center"
    >
      <Shield class="h-12 w-12 text-gray-400 mx-auto mb-4" />
      <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">
        {{ t('settings.access_denied', 'Access Denied') }}
      </h3>
      <p class="text-sm text-gray-600 dark:text-gray-400 max-w-md mx-auto">
        {{ t('settings.access_denied_message', 'You don\'t have sufficient permissions to access the settings. Contact your administrator for access.') }}
      </p>
      <UButton 
        to="/" 
        variant="outline" 
        class="mt-4"
      >
        {{ t('settings.common.back_to_dashboard', 'Back to Dashboard') }}
      </UButton>
    </div>
    </template>

    <!-- Access Denied Fallback -->
    <div v-else class="bg-white dark:bg-gray-800 shadow rounded-lg p-8 text-center">
      <Shield class="h-12 w-12 text-gray-400 mx-auto mb-4" />
      <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">
        {{ t('settings.access_denied', 'Access Denied') }}
      </h3>
      <p class="text-sm text-gray-600 dark:text-gray-400 max-w-md mx-auto">
        {{ t('settings.access_denied_message', 'You don\'t have sufficient permissions to access the settings. Contact your administrator for access.') }}
      </p>
    </div>
  </div>
</template>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.no-underline {
  text-decoration: none !important;
}

.no-underline:hover {
  text-decoration: none !important;
}

a {
  text-decoration: none !important;
}

a:hover {
  text-decoration: none !important;
}
</style>
