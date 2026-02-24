,<script setup lang="ts">
import { ref, computed, provide, onMounted, watch } from 'vue'
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
  ArrowLeft, 
  Save, 
  Plus, 
  Edit, 
  Trash2,
  Globe,
  Building,
  Phone,
  Mail,
  MapPin
} from 'lucide-vue-next'

const { t } = useI18n()
const { isSuperAdmin, hasPermission } = usePermissions()
const { 
  isLoading, 
  error, 
  settings, 
  getSettingsByGroup, 
  createSetting, 
  updateSettingByKey, 
  deleteSetting,
  clearError 
} = useAdminSettings()
const userStore = useUserStore()

// Provide page title for layout
provide('pageTitle', ref(t('settings.general.title')))

// Permission checking state
const isLoadingPermissions = ref(true)
const hasPermissionAccess = ref(false)

// Watch for user data changes and check permissions
watch(() => userStore.user, (user) => {
  if (user) {
    // Check permissions once user data is available
    hasPermissionAccess.value = isSuperAdmin.value || hasPermission('MANAGE_SETTINGS')
    isLoadingPermissions.value = false
    
    if (!hasPermissionAccess.value) {
      console.log('User does not have permission to access general settings')
      navigateTo('/settings')
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

// Local state
const generalSettings = ref<any[]>([])
const isLoadingSettings = ref(false)
const showCreateModal = ref(false)
const editingSettingKey = ref<string | null>(null)
const editingValue = ref('')

// Form for creating new setting
const createForm = ref({
  key: '',
  value: '',
  description: '',
  is_public: false
})

// Predefined general settings structure
const generalSettingsTemplate = [
  {
    category: t('settings.general.siteInformation'),
    icon: Building,
    settings: [
      { key: 'site_name', label: t('settings.general.siteName'), description: 'The name of your website', type: 'text', placeholder: 'My Website' },
      { key: 'site_description', label: t('settings.general.siteDescription'), description: 'Brief description of your website', type: 'textarea', placeholder: 'A brief description...' },
      { key: 'site_keywords', label: t('settings.general.siteKeywords'), description: 'SEO keywords separated by commas', type: 'text', placeholder: 'keyword1, keyword2, keyword3' },
      { key: 'site_logo_url', label: t('settings.general.siteLogoUrl'), description: 'URL to your site logo', type: 'url', placeholder: 'https://example.com/logo.png' }
    ]
  },
  {
    category: t('settings.general.contactInformation'),
    icon: Phone,
    settings: [
      { key: 'contact_email', label: t('settings.general.contactEmail'), description: 'Primary contact email address', type: 'email', placeholder: 'contact@example.com' },
      { key: 'contact_phone', label: t('settings.general.contactPhone'), description: 'Primary contact phone number', type: 'tel', placeholder: '+1 234 567 8900' },
      { key: 'contact_address', label: t('settings.general.contactAddress'), description: 'Physical business address', type: 'textarea', placeholder: '123 Main St, City, Country' },
      { key: 'support_email', label: t('settings.general.supportEmail'), description: 'Support team email address', type: 'email', placeholder: 'support@example.com' },
      { key: 'enable_quick_purchase', label: t('settings.general.quickPurchase'), description: t('settings.general.quickPurchaseDescription'), type: 'toggle', defaultValue: 'false', isPublic: true }
    ]
  },
  {
    category: t('settings.general.regionalSettings'),
    icon: Globe,
    settings: [
      { key: 'default_language', label: t('settings.general.defaultLanguage'), description: 'Default language for the site', type: 'select', options: [
        { value: 'en', label: 'English' },
        { value: 'vi', label: 'Vietnamese' },
        { value: 'fr', label: 'French' },
        { value: 'es', label: 'Spanish' }
      ]},
      { key: 'default_timezone', label: t('settings.general.defaultTimezone'), description: 'Default timezone for the application', type: 'select', options: [
        { value: 'UTC', label: 'UTC' },
        { value: 'Asia/Ho_Chi_Minh', label: 'Ho Chi Minh City (UTC+7)' },
        { value: 'America/New_York', label: 'New York (UTC-5)' },
        { value: 'Europe/London', label: 'London (UTC+0)' }
      ]},
      { key: 'default_currency', label: t('settings.general.defaultCurrency'), description: 'Default currency for prices', type: 'select', options: [
        { value: 'USD', label: 'US Dollar (USD)' },
        { value: 'VND', label: 'Vietnamese Dong (VND)' },
        { value: 'EUR', label: 'Euro (EUR)' },
        { value: 'GBP', label: 'British Pound (GBP)' }
      ]},
      { key: 'date_format', label: t('settings.general.dateFormat'), description: 'Default date format', type: 'select', options: [
        { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY' },
        { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY' },
        { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD' }
      ]}
    ]
  }
]

// Get settings organized by category
const organizedSettings = computed(() => {
  return generalSettingsTemplate.map(category => ({
    ...category,
    settings: category.settings.map(template => {
      const existingSetting = generalSettings.value.find(s => s.key === template.key)
      return {
        ...template,
        value: existingSetting?.value ?? template.defaultValue ?? '',
        id: existingSetting?.id ?? null,
        exists: !!existingSetting
      }
    })
  }))
})

const getTemplateSettingByKey = (key: string) => {
  for (const category of generalSettingsTemplate) {
    const setting = category.settings.find((item: any) => item.key === key)
    if (setting) return setting
  }
  return null
}

// Start inline editing
const startEdit = (settingKey: string, currentValue: string) => {
  editingSettingKey.value = settingKey
  editingValue.value = currentValue
}

// Cancel editing
const cancelEdit = () => {
  editingSettingKey.value = null
  editingValue.value = ''
}

// Save inline edit
const saveEdit = async (settingKey: string) => {
  try {
    await updateSettingByKey(settingKey, editingValue.value)
    cancelEdit()
    await loadGeneralSettings()
  } catch (error) {
    console.error('Failed to save setting:', error)
  }
}

// Save state for feedback
const savingStates = ref<Record<string, boolean>>({})
const savedStates = ref<Record<string, boolean>>({})
const isSavingAll = ref(false)

// Save all settings
const saveAllSettings = async () => {
  try {
    isSavingAll.value = true
    
    // Get all current form values and save them
    const promises = organizedSettings.value.flatMap(category => 
      category.settings.map(async setting => {
        const input = document.querySelector(`input[data-setting-key="${setting.key}"], textarea[data-setting-key="${setting.key}"], select[data-setting-key="${setting.key}"]`) as HTMLInputElement
        if (input && input.value !== setting.value) {
          await saveSettingValue(setting.key, input.value, setting.description)
        }
      })
    )
    
    await Promise.all(promises)
    
  } catch (error) {
    console.error('Failed to save all settings:', error)
  } finally {
    isSavingAll.value = false
  }
}

// Create or update setting
const saveSettingValue = async (settingKey: string, value: string, description: string) => {
  try {
    savingStates.value[settingKey] = true
    savedStates.value[settingKey] = false
    
    const existingSetting = generalSettings.value.find(s => s.key === settingKey)
    const templateSetting = getTemplateSettingByKey(settingKey)
    const isPublic = templateSetting?.isPublic ?? false
    
    if (existingSetting) {
      await updateSettingByKey(settingKey, value)
    } else {
      await createSetting({
        key: settingKey,
        value,
        group: 'general',
        description,
        is_public: isPublic
      })
    }
    
    await loadGeneralSettings()
    
    // Show saved feedback
    savedStates.value[settingKey] = true
    setTimeout(() => {
      savedStates.value[settingKey] = false
    }, 2000)
    
  } catch (error) {
    console.error('Failed to save setting:', error)
  } finally {
    savingStates.value[settingKey] = false
  }
}

// Load general settings
const loadGeneralSettings = async () => {
  try {
    isLoadingSettings.value = true
    const settings = await getSettingsByGroup('general')
    generalSettings.value = settings || []
  } catch (error) {
    console.error('Failed to load general settings:', error)
  } finally {
    isLoadingSettings.value = false
  }
}

// Create new custom setting
const createCustomSetting = async () => {
  try {
    await createSetting({
      ...createForm.value,
      group: 'general'
    })
    
    showCreateModal.value = false
    createForm.value = {
      key: '',
      value: '',
      description: '',
      is_public: false
    }
    
    await loadGeneralSettings()
  } catch (error) {
    console.error('Failed to create setting:', error)
  }
}

// Delete setting
const deleteSetting_ = async (settingId: number) => {
  if (confirm('Are you sure you want to delete this setting?')) {
    try {
      await deleteSetting(settingId)
      await loadGeneralSettings()
    } catch (error) {
      console.error('Failed to delete setting:', error)
    }
  }
}

// Permission checks
const canEdit = computed(() => isSuperAdmin.value || hasPermission('MANAGE_SETTINGS'))

onMounted(async () => {
  // Ensure user data is loaded
  if (!userStore.user && !userStore.isLoading) {
    try {
      await userStore.fetchUser()
    } catch (error) {
      console.error('Failed to fetch user in general settings:', error)
    }
  }
  
  // Load settings data
  await loadGeneralSettings()
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
          <UButton 
            to="/settings" 
            variant="ghost" 
            icon="i-lucide-arrow-left"
            size="sm"
          >
            Back
          </UButton>
          <Settings class="h-8 w-8 text-blue-600 dark:text-blue-400" />
          <div>
            <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
              {{ t('settings.general.title', 'General Settings') }}
            </h1>
            <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {{ t('settings.general.description', 'Configure basic site information and preferences') }}
            </p>
          </div>
        </div>
        
        <div class="flex items-center space-x-2">
          <UButton 
            @click="saveAllSettings"
            color="green"
            icon="i-lucide-save"
            :loading="isSavingAll"
          >
            {{ t('settings.save_all', 'Save All') }}
          </UButton>
          
          <UButton 
            @click="showCreateModal = true"
            color="blue"
            icon="i-lucide-plus"
          >
            {{ t('settings.add_custom', 'Add Custom Setting') }}
          </UButton>
        </div>
      </div>
    </div>

    <!-- Error Message -->
    <UAlert 
      v-if="error" 
      color="red" 
      variant="soft" 
      :title="t('common.error', 'Error')"
      :description="error"
      :close-button="{ icon: 'i-lucide-x', color: 'gray', variant: 'link', padded: false }"
      @close="clearError"
    />

    <!-- Loading State -->
    <div v-if="isLoadingSettings" class="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
      <div class="flex items-center justify-center py-8">
        <UIcon name="i-lucide-loader-2" class="h-6 w-6 animate-spin text-blue-600" />
        <span class="ml-2 text-gray-600 dark:text-gray-400">
          {{ t('common.loading', 'Loading settings...') }}
        </span>
      </div>
    </div>

    <!-- Settings Categories -->
    <div v-else class="space-y-6">
      <div 
        v-for="category in organizedSettings" 
        :key="category.category"
        class="bg-white dark:bg-gray-800 shadow rounded-lg"
      >
        <!-- Category Header -->
        <div class="border-b border-gray-200 dark:border-gray-700 px-6 py-4">
          <div class="flex items-center space-x-3">
            <div class="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
              <component :is="category.icon" class="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 class="text-lg font-medium text-gray-900 dark:text-white">
                {{ category.category }}
              </h3>
            </div>
          </div>
        </div>

        <!-- Settings List -->
        <div class="divide-y divide-gray-200 dark:divide-gray-700">
          <div 
            v-for="setting in category.settings" 
            :key="setting.key"
            class="p-6"
          >
            <div class="flex items-start justify-between">
              <!-- Setting Info -->
              <div class="flex-1 min-w-0 mr-4">
                <div class="flex items-center space-x-2 mb-1">
                  <h4 class="text-sm font-medium text-gray-900 dark:text-white">
                    {{ setting.label }}
                  </h4>
                  <UBadge 
                    v-if="!setting.exists"
                    color="orange"
                    variant="soft"
                    size="xs"
                  >
                    Not Set
                  </UBadge>
                  
                  <!-- Saving/Saved indicators -->
                  <UBadge 
                    v-if="savingStates[setting.key]"
                    color="blue"
                    variant="soft"
                    size="xs"
                  >
                    <UIcon name="i-lucide-loader-2" class="h-3 w-3 animate-spin mr-1" />
                    Saving...
                  </UBadge>
                  
                  <UBadge 
                    v-else-if="savedStates[setting.key]"
                    color="green"
                    variant="soft"
                    size="xs"
                  >
                    <UIcon name="i-lucide-check" class="h-3 w-3 mr-1" />
                    Saved
                  </UBadge>
                </div>
                
                <p class="text-xs text-gray-600 dark:text-gray-400 mb-3">
                  {{ setting.description }}
                </p>

                <!-- Input Field -->
                <div class="max-w-md">
                  <!-- Text/Email/URL/Tel Input -->
                  <UInput
                    v-if="['text', 'email', 'url', 'tel'].includes(setting.type)"
                    :model-value="setting.value"
                    :type="setting.type"
                    :placeholder="setting.placeholder"
                    :data-setting-key="setting.key"
                    @blur="(e) => saveSettingValue(setting.key, e.target.value, setting.description)"
                  />
                  
                  <!-- Textarea -->
                  <UTextarea
                    v-else-if="setting.type === 'textarea'"
                    :model-value="setting.value"
                    :placeholder="setting.placeholder"
                    :data-setting-key="setting.key"
                    @blur="(e) => saveSettingValue(setting.key, e.target.value, setting.description)"
                  />
                  
                  <!-- Select -->
                  <USelect
                    v-else-if="setting.type === 'select'"
                    :model-value="setting.value"
                    :options="setting.options"
                    option-attribute="label"
                    value-attribute="value"
                    :data-setting-key="setting.key"
                    @update:model-value="(value) => saveSettingValue(setting.key, value, setting.description)"
                  />

                  <div
                    v-else-if="setting.type === 'toggle'"
                    class="flex items-center gap-3"
                  >
                    <UToggle
                      :model-value="setting.value === 'true'"
                      @update:model-value="(value: boolean) => saveSettingValue(setting.key, value ? 'true' : 'false', setting.description)"
                    />
                    <span class="text-sm text-gray-600 dark:text-gray-400">
                      {{ setting.value === 'true' ? (t('common.active') || 'Bật') : (t('common.inactive') || 'Tắt') }}
                    </span>
                  </div>
                </div>
              </div>

              <!-- Actions -->
              <div v-if="setting.exists && canEdit" class="flex items-center space-x-2">
                <UButton 
                  size="xs"
                  color="red"
                  variant="soft"
                  icon="i-lucide-trash-2"
                  @click="deleteSetting_(setting.id)"
                >
                  Delete
                </UButton>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Custom Settings -->
      <div class="bg-white dark:bg-gray-800 shadow rounded-lg">
        <div class="border-b border-gray-200 dark:border-gray-700 px-6 py-4">
          <h3 class="text-lg font-medium text-gray-900 dark:text-white">
            Custom Settings
          </h3>
          <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Additional custom settings for this category
          </p>
        </div>

        <div class="p-6">
          <!-- Custom settings from database that aren't in template -->
          <template v-if="generalSettings.filter(s => !generalSettingsTemplate.some(cat => cat.settings.some(template => template.key === s.key))).length > 0">
            <div class="space-y-4">
              <div 
                v-for="setting in generalSettings.filter(s => !generalSettingsTemplate.some(cat => cat.settings.some(template => template.key === s.key)))" 
                :key="setting.id"
                class="flex items-start justify-between border border-gray-200 dark:border-gray-700 rounded-lg p-4"
              >
                <div class="flex-1 min-w-0 mr-4">
                  <h4 class="text-sm font-medium text-gray-900 dark:text-white mb-1">
                    {{ setting.key }}
                  </h4>
                  <p v-if="setting.description" class="text-xs text-gray-600 dark:text-gray-400 mb-2">
                    {{ setting.description }}
                  </p>
                  
                  <!-- Inline Edit -->
                  <div v-if="editingSettingKey === setting.key" class="flex items-center space-x-2">
                    <UInput
                      v-model="editingValue"
                      size="sm"
                      class="flex-1"
                    />
                    <UButton 
                      size="xs" 
                      color="green" 
                      icon="i-lucide-save"
                      @click="saveEdit(setting.key)"
                    />
                    <UButton 
                      size="xs" 
                      color="gray" 
                      variant="soft"
                      icon="i-lucide-x"
                      @click="cancelEdit"
                    />
                  </div>
                  
                  <div v-else class="text-sm text-gray-700 dark:text-gray-300">
                    <span class="font-mono bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-xs">
                      {{ setting.value }}
                    </span>
                  </div>
                </div>

                <div v-if="canEdit" class="flex items-center space-x-2">
                  <UButton 
                    size="xs"
                    color="blue"
                    variant="soft"
                    icon="i-lucide-edit"
                    @click="startEdit(setting.key, setting.value)"
                    :disabled="editingSettingKey === setting.key"
                  >
                    Edit
                  </UButton>
                  
                  <UButton 
                    size="xs"
                    color="red"
                    variant="soft"
                    icon="i-lucide-trash-2"
                    @click="deleteSetting_(setting.id)"
                  >
                    Delete
                  </UButton>
                </div>
              </div>
            </div>
          </template>

          <div v-else class="text-center py-8 text-gray-500 dark:text-gray-400">
            <Settings class="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p class="text-sm">No custom settings found</p>
            <p class="text-xs">Click "Add Custom Setting" to create one</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Create Custom Setting Modal -->
    <UModal v-model="showCreateModal">
      <UCard>
        <template #header>
          <h3 class="text-lg font-semibold">
            {{ t('settings.create_custom', 'Create Custom Setting') }}
          </h3>
        </template>

        <form @submit.prevent="createCustomSetting" class="space-y-4">
          <UFormGroup label="Setting Key" required>
            <UInput
              v-model="createForm.key"
              placeholder="custom_setting_key"
              required
            />
            <template #help>
              <span class="text-xs text-gray-500">Use lowercase letters, numbers, and underscores only</span>
            </template>
          </UFormGroup>

          <UFormGroup label="Value" required>
            <UTextarea
              v-model="createForm.value"
              placeholder="Setting value"
              required
            />
          </UFormGroup>

          <UFormGroup label="Description">
            <UTextarea
              v-model="createForm.description"
              placeholder="Description of this setting"
            />
          </UFormGroup>

          <UFormGroup>
            <UCheckbox
              v-model="createForm.is_public"
              label="Make this setting publicly accessible"
            />
          </UFormGroup>
        </form>

        <template #footer>
          <div class="flex justify-end space-x-2">
            <UButton 
              variant="outline" 
              @click="showCreateModal = false"
            >
              {{ t('common.cancel', 'Cancel') }}
            </UButton>
            <UButton 
              color="blue"
              :loading="isLoading"
              @click="createCustomSetting"
            >
              {{ t('common.create', 'Create') }}
            </UButton>
          </div>
        </template>
      </UCard>
    </UModal>
    </template>

    <!-- Access Denied Fallback -->
    <div v-else class="bg-white dark:bg-gray-800 shadow rounded-lg p-8 text-center">
      <Settings class="h-12 w-12 text-gray-400 mx-auto mb-4" />
      <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">
        {{ t('settings.access_denied', 'Access Denied') }}
      </h3>
      <p class="text-sm text-gray-600 dark:text-gray-400 max-w-md mx-auto">
        {{ t('settings.access_denied_message', 'You don\'t have sufficient permissions to access these settings.') }}
      </p>
      <UButton 
        to="/settings" 
        variant="outline" 
        class="mt-4"
      >
        {{ t('common.back_to_settings', 'Back to Settings') }}
      </UButton>
    </div>
  </div>
</template> 
