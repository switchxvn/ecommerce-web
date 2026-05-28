<template>
  <div class="min-h-screen bg-slate-50">
    <div class="flex-1 overflow-y-auto">
      <form @submit.prevent="handleSubmit(false)" class="space-y-6">
        <!-- Header -->
        <PageHeader
          :title="t('categories.createCategory')"
          :description="t('categories.description')"
        >
          <template #actions>
            <!-- Language Switcher -->
            <div class="language-switcher relative">
              <button 
                type="button"
                @click.stop="isLanguageOpen = !isLanguageOpen"
                class="inline-flex items-center gap-2 h-10 px-4 py-2 rounded-md text-sm font-medium bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
              >
                <div class="w-5 h-5 flex items-center justify-center">
                  <img 
                    v-if="selectedLanguage"
                    :src="`/images/flag/${languages.find(l => l.code === selectedLanguage)?.flagCode.toLowerCase()}.svg`"
                    :alt="`${languages.find(l => l.code === selectedLanguage)?.nativeName} flag`"
                    class="w-5 h-5 rounded-sm object-cover"
                    @error="onFlagImageError"
                  />
                </div>
                <span>{{ languages.find(l => l.code === selectedLanguage)?.nativeName || t('components.common.languageSwitcher.selectLanguage') }}</span>
                <ChevronDownIcon 
                  class="h-4 w-4 transition-transform"
                  :class="{ 'rotate-180': isLanguageOpen }"
                />
              </button>

              <!-- Dropdown menu -->
              <div 
                v-if="isLanguageOpen" 
                class="absolute z-50 mt-1 min-w-[240px] rounded-md shadow-lg bg-white ring-1 ring-black/5 focus:outline-none"
              >
                <div class="py-1">
                  <button
                    type="button"
                    v-for="lang in languages"
                    :key="lang.code"
                    @click="selectedLanguage = lang.code; isLanguageOpen = false"
                    class="flex items-center w-full h-10 px-4 py-2 text-sm text-left text-slate-700 hover:bg-slate-100 transition-colors whitespace-nowrap"
                    :class="{ 'bg-slate-50': selectedLanguage === lang.code }"
                  >
                    <div class="w-5 h-5 flex-shrink-0 flex items-center justify-center mr-2">
                      <img 
                        :src="`/images/flag/${lang.flagCode.toLowerCase()}.svg`"
                        :alt="`${lang.nativeName} flag`"
                        class="w-5 h-5 rounded-sm object-cover"
                        @error="onFlagImageError"
                      />
                    </div>
                    <span class="truncate">{{ lang.nativeName }}</span>
                    <span v-if="lang.code === defaultLanguage" class="ml-1 text-xs text-slate-500 flex-shrink-0">(Default)</span>
                    <CheckIcon
                      v-if="selectedLanguage === lang.code"
                      class="h-4 w-4 ml-auto flex-shrink-0 text-primary"
                    />
                  </button>
                </div>
              </div>
            </div>

            <NuxtLink 
              to="/categories" 
              class="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-slate-200 bg-white hover:bg-slate-100 h-10 px-4 py-2"
            >
              <XIcon class="w-4 h-4 mr-2" />
              {{ t('actions.cancel') }}
            </NuxtLink>
            
            <button 
              type="button"
              @click.prevent="handleSubmit(true)" 
              :disabled="loading"
              class="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-white border border-slate-200 text-slate-900 hover:bg-slate-100 h-10 px-4 py-2"
            >
              <SaveIcon class="w-4 h-4 mr-2" />
              {{ loading ? t('messages.loading') : t('actions.save') + ' & ' + t('actions.add') }}
            </button>

            <button 
              type="submit"
              :disabled="loading"
              class="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-white hover:bg-primary/90 h-10 px-4 py-2"
            >
              <SaveAllIcon class="w-4 h-4 mr-2" />
              {{ loading ? t('messages.loading') : t('actions.save') }}
            </button>
          </template>
        </PageHeader>

        <!-- Tabs -->
        <nav class="flex items-center space-x-1 rounded-lg bg-white border border-slate-200 p-1 w-fit">
          <button
            type="button"
            v-for="tab in tabs"
            :key="tab.id"
            @click="currentTab = tab.id"
            class="flex items-center justify-center gap-2 rounded-md px-4 py-2.5 text-sm font-medium transition-all relative"
            :class="{
              'bg-primary text-white': currentTab === tab.id,
              'text-slate-600 hover:text-slate-900 hover:bg-slate-50': currentTab !== tab.id
            }"
          >
            <component :is="tab.icon" class="w-4 h-4" />
            {{ tab.name }}
          </button>
        </nav>

        <div class="grid gap-6">
          <!-- Basic Info Tab -->
          <div v-show="currentTab === 'basic'" class="grid grid-cols-1 gap-6 bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <div class="space-y-4">
              <h2 class="text-lg font-medium text-gray-900 dark:text-white">{{ t('categories.basicInfo') }}</h2>
              
              <div class="grid grid-cols-2 gap-4">
                <UFormGroup :label="t('categories.name')" required :error="errors.name">
                  <UInput
                    v-model="form.name"
                    name="name"
                    :placeholder="t('categories.namePlaceholder')"
                    required
                    :error="!!errors.name"
                  />
                </UFormGroup>

                <UFormGroup :label="t('categories.type')" required :error="errors.type">
                  <USelect
                    v-model="form.type"
                    :options="[
                      { label: 'News', value: 'news' },
                      { label: 'Product', value: 'product' },
                      { label: 'Both', value: 'both' },
                      { label: 'Gallery', value: 'gallery' }
                    ]"
                    option-attribute="label"
                    required
                    :error="!!errors.type"
                  />
                </UFormGroup>

                <IconSelector
                  v-model="form.icon"
                  :error="errors.icon"
                />
              </div>

              <div v-if="showPriceRangeFields" class="grid grid-cols-1 gap-4 md:grid-cols-2">
                <UFormGroup label="Giá từ">
                  <UInput
                    v-model.number="form.priceRangeMin"
                    type="number"
                    min="0"
                    placeholder="190000000"
                  />
                </UFormGroup>

                <UFormGroup label="Giá đến" :error="errors.priceRangeMax">
                  <UInput
                    v-model.number="form.priceRangeMax"
                    type="number"
                    min="0"
                    placeholder="495000000"
                  />
                </UFormGroup>
              </div>

              <UFormGroup :label="t('categories.slug')" required :error="errors.slug">
                <div class="flex gap-2">
                  <UInput
                    v-model="currentTranslation.slug"
                    :placeholder="t('categories.slugPlaceholder')"
                    required
                    :error="!!errors.slug"
                    class="flex-1"
                  />
                  <UButton
                    type="button"
                    variant="soft"
                    color="gray"
                    @click="generateSlug"
                    class="flex-shrink-0"
                    :title="t('categories.generateSlug')"
                  >
                    <WandIcon class="w-4 h-4" />
                  </UButton>
                </div>
              </UFormGroup>

              <UFormGroup :label="t('categories.description')">
                <UTextarea
                  v-model="currentTranslation.description"
                  :placeholder="t('categories.descriptionPlaceholder')"
                  rows="4"
                />
              </UFormGroup>
            </div>
          </div>

          <div v-show="currentTab === 'seo'" class="grid grid-cols-1 gap-6">
            <CategorySEO
              v-model:meta-title="currentTranslation.metaTitle"
              v-model:meta-description="currentTranslation.metaDescription"
              v-model:meta-keywords="currentTranslation.metaKeywords"
              v-model:og-title="currentTranslation.ogTitle"
              v-model:og-description="currentTranslation.ogDescription"
              v-model:og-image="currentTranslation.ogImage"
            />
          </div>

          <!-- Settings Tab -->
          <div v-show="currentTab === 'settings'" class="grid grid-cols-1 gap-6 bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <div class="space-y-4">
              <h2 class="text-lg font-medium text-gray-900 dark:text-white">{{ t('categories.settings') }}</h2>
              
              <UFormGroup>
                <UCheckbox
                  v-model="form.active"
                  :label="t('categories.isActive')"
                  :help="t('categories.activeHelp')"
                />
              </UFormGroup>
            </div>
          </div>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch, computed } from 'vue'
import {
  FileTextIcon,
  SettingsIcon,
  XIcon,
  SaveAllIcon,
  ChevronDownIcon,
  CheckIcon,
  SaveIcon,
  WandIcon,
  SearchIcon
} from 'lucide-vue-next'
import { useTrpc } from '../../composables/useTrpc'
import { useCategory } from '../../composables/useCategory'
import PageHeader from '../../components/common/header/PageHeader.vue'
import CategorySEO from '../../components/categories/CategorySEO.vue'
import IconSelector from '../../components/common/IconSelector.vue'
import { useLocalization } from '../../composables/useLocalization'
import { useSiteTitle } from '../../composables/useSiteTitle'
import { createEmptyCategoryTranslation } from '../../utils/categoryTranslation'

// Set page title with i18n support
useSiteTitle('categoriesCreate');

const trpc = useTrpc()
const { t } = useLocalization();

// Use the category composable
const {
  form,
  errors,
  loading,
  currentTranslation,
  selectedLanguage,
  generateSlug,
  createCategory
} = useCategory()

const currentTab = ref('basic')
const isLanguageOpen = ref(false)
const languages = ref<any[]>([])
const defaultLanguage = ref('')

const tabs = [
  { 
    id: 'basic', 
    name: t('categories.basicInfo'), 
    icon: FileTextIcon
  },
  {
    id: 'seo',
    name: t('settings.seo.title'),
    icon: SearchIcon
  },
  { 
    id: 'settings', 
    name: t('categories.settings'), 
    icon: SettingsIcon
  }
]

const showPriceRangeFields = computed(() =>
  form.value.type === 'product' || form.value.type === 'both',
)

onMounted(async () => {
  try {
    const [langs, defaultLang] = await Promise.all([
      trpc.admin.languages.getLanguages.query(),
      trpc.admin.languages.getDefaultLanguage.query()
    ])
    languages.value = langs
    defaultLanguage.value = defaultLang?.code || ''
    selectedLanguage.value = defaultLang?.code || ''

    // Initialize translations for default language
    if (selectedLanguage.value) {
      form.value.translations[selectedLanguage.value] = createEmptyCategoryTranslation()
    }
  } catch (error) {
    console.error('Failed to fetch languages:', error)
  }
  if (process.client) {
    document.addEventListener('click', handleClickOutside);
  }
})

onBeforeUnmount(() => {
  if (process.client) {
    document.removeEventListener('click', handleClickOutside);
  }
})

// Watch for language changes
watch(selectedLanguage, (newLang, oldLang) => {
  if (!newLang) return

  if (oldLang) {
    // Save current content to translations before switching
    form.value.translations[oldLang] = {
      name: form.value.name,
      slug: currentTranslation.value.slug,
      description: currentTranslation.value.description,
      metaTitle: currentTranslation.value.metaTitle,
      metaDescription: currentTranslation.value.metaDescription,
      metaKeywords: currentTranslation.value.metaKeywords,
      ogTitle: currentTranslation.value.ogTitle,
      ogDescription: currentTranslation.value.ogDescription,
      ogImage: currentTranslation.value.ogImage,
      canonicalUrl: currentTranslation.value.canonicalUrl
    }
  }
  
  // Load content for new language
  if (form.value.translations[newLang]) {
    const translation = form.value.translations[newLang]
    form.value.name = translation.name
  } else {
    // Initialize new translation
    form.value.name = ''
    form.value.translations[newLang] = createEmptyCategoryTranslation()
  }
})

const handleSubmit = async (saveAndContinue = false) => {
  await createCategory(saveAndContinue)
}

const handleClickOutside = (event: Event) => {
  const target = event.target as HTMLElement;
  if (!target.closest('.language-switcher')) {
    isLanguageOpen.value = false;
  }
}

const onFlagImageError = (event: Event) => {
  const target = event.target as HTMLImageElement;
  if (target) {
    target.style.display = 'none';
    const parent = target.parentElement;
    if (parent) {
      parent.textContent = selectedLanguage.value?.toUpperCase().slice(0, 2) || '';
      parent.classList.add('bg-primary', 'text-white', 'rounded-sm', 'text-xs', 'font-medium', 'flex', 'items-center', 'justify-center');
    }
  }
};
</script>

<style scoped>
.form-section {
  @apply bg-white rounded-lg p-6 space-y-6 shadow-sm;
}

.section-title {
  @apply text-lg font-medium text-gray-900;
}

.language-switcher {
  position: relative;
  display: inline-block;
  width: auto;
}

/* Dropdown menu */
.absolute {
  z-index: 50 !important;
}
</style> 
