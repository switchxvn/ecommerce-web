<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useTrpc } from '~/composables/useTrpc'
import { useI18n } from 'vue-i18n'
import { defineAsyncComponent, markRaw } from 'vue'
import type { Component } from 'vue'

// Define component types
type ComponentType = Component
type ComponentRegistry = Record<string, ComponentType>

// Register components using defineAsyncComponent
const registeredComponents = {
  'ContactHeroSection': defineAsyncComponent(() => import("../components/sections/contact/ContactHeroSection.vue")),
  'ContactFormSection': defineAsyncComponent(() => import("../components/sections/contact/ContactFormSection.vue")),
  'ContactBranchSection': defineAsyncComponent(() => import("../components/sections/contact/ContactBranchSection.vue")),
  'BranchContactSection': defineAsyncComponent(() => import("../components/sections/common/BranchContactSection.vue")),
  'ContactFaqSection': defineAsyncComponent(() => import("../components/sections/contact/ContactFaqSection.vue")),
  'ContactMapSection': defineAsyncComponent(() => import("../components/sections/contact/ContactMapSection.vue")),
} as ComponentRegistry

// Resolve component function
const resolveComponent = (section: any): ComponentType | null => {
  if (!section?.type && !section?.componentName) {
    console.warn('Invalid section configuration')
    return null
  }

  // First try componentName if specified
  if (section.componentName && registeredComponents[section.componentName]) {
    return markRaw(registeredComponents[section.componentName])
  }

  // Then try type mapping
  const typeToComponentName: Record<string, keyof typeof registeredComponents> = {
    'hero': 'ContactHeroSection',
    'contact_form': 'ContactFormSection',
    'branch_contact': 'ContactBranchSection',
    'branch_contact_new': 'BranchContactSection',
    'faq': 'ContactFaqSection',
    'map': 'ContactMapSection'
  }

  const componentName = typeToComponentName[section.type]
  if (componentName && registeredComponents[componentName]) {
    return markRaw(registeredComponents[componentName])
  }

  console.warn(`No component found for section type: ${section.type}`)
  return null
}

const trpc = useTrpc()
const { locale } = useI18n()

// State management
const sections = ref<any[]>([])
const isLoading = ref(true)
const error = ref<string | null>(null)

// Helper function to get translation by locale
const getTranslation = (translations: any[] | undefined, fallback: any) => {
  if (!translations || !Array.isArray(translations) || translations.length === 0) return fallback
  const translation = translations.find(t => t?.locale === locale.value)
  return translation || translations.find(t => t?.locale === 'en') || fallback
}

// Computed properties for translated content
const translatedSections = computed(() => {
  if (!sections.value) return []
  
  return sections.value.map(section => {
    if (!section) return null
    const translation = getTranslation(section.translations, {})
    return {
      ...section,
      title: translation?.title || section.title,
      subtitle: translation?.subtitle || '',
      content: translation?.content || '',
      data: translation?.data || {}
    }
  }).filter(Boolean)
})

// Fetch data using tRPC
const fetchData = async () => {
  try {

    isLoading.value = true
    error.value = null

    const data = await trpc.contactSection.getActiveSections.query(locale.value)

    if (!data || data.length === 0) {
      error.value = 'No active contact sections found'
      return
    }

    sections.value = data

  } catch (e) {
    console.error('Error fetching contact sections:', e)
    error.value = 'Failed to load contact sections'
  } finally {
    isLoading.value = false
  }
}

// Watch for locale changes and refetch data
watch(locale, () => {
  fetchData()
})

// Initial fetch
fetchData()
</script>

<template>
  <div class="contact w-full bg-gray-50">
    <div v-if="isLoading" class="container mx-auto space-y-10 py-10 px-4">
      <HeroSkeleton />
      <DetailPageSkeleton :show-gallery="false" />
    </div>

    <div v-else-if="error" class="container mx-auto py-10 px-4">
      <div class="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
        <p class="text-red-600 dark:text-red-400">{{ error }}</p>
      </div>
    </div>

    <template v-else>
      <template v-for="(section, index) in translatedSections" :key="index">
        <ClientOnly>
          <component
            v-if="section.isActive"
            :is="resolveComponent(section)"
            :settings="section.settings"
            :translations="{
              title: section.title,
              subtitle: section.subtitle,
              content: section.content,
              data: section.data
            }"
          />
          <template #fallback>
            <div class="p-4">
              <CardGridSkeleton :item-count="2" :columns="2" />
            </div>
          </template>
        </ClientOnly>
      </template>
    </template>
  </div>
</template> 
