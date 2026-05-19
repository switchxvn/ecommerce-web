<script setup lang="ts">
import { ref, onMounted, computed, watch } from "vue";
import { useLocalization } from "../composables/useLocalization";
import { useTrpc } from '~/composables/useTrpc';
import { defineAsyncComponent, markRaw } from 'vue';
import type { Component } from 'vue';

// Định nghĩa type cho components
type ComponentType = Component;
type ComponentRegistry = Record<string, ComponentType>;

// Register components using defineAsyncComponent
const registeredComponents = {
  // About components
  'AboutHeroSection': defineAsyncComponent(() => import("../components/sections/about/AboutHeroSection.vue")),
  'AboutMilestoneSection': defineAsyncComponent(() => import("../components/sections/about/AboutMilestoneSection.vue")),
  'AboutTeamSection': defineAsyncComponent(() => import("../components/sections/about/AboutTeamSection.vue")),
  
  // Tourism components
  'TourismHeroSection': defineAsyncComponent(() => import("../components/sections/about/tourism/TourismHeroSection.vue")),
  'TourismFeaturesSection': defineAsyncComponent(() => import("../components/sections/about/tourism/TourismFeaturesSection.vue")),
  'TourismCulturalSection': defineAsyncComponent(() => import("../components/sections/about/tourism/TourismCulturalSection.vue")),
  'TourismGallerySection': defineAsyncComponent(() => import("../components/sections/about/tourism/TourismGallerySection.vue")),
} as ComponentRegistry;

// Resolve component function
const resolveComponent = (section: any): ComponentType | null => {
  if (!section?.type && !section?.componentName) {
    console.warn('Invalid section configuration');
    return null;
  }

  // First try componentName if specified
  if (section.componentName && registeredComponents[section.componentName]) {
    return markRaw(registeredComponents[section.componentName]);
  }

  // Then try type mapping
  const typeToComponentName: Record<string, keyof typeof registeredComponents> = {
    'hero': 'AboutHeroSection',
    'milestone': 'AboutMilestoneSection',
    'team': 'AboutTeamSection',
    
    // Tourism section types mapping
    'tourism_hero': 'TourismHeroSection',
    'tourism_features': 'TourismFeaturesSection', 
    'tourism_cultural': 'TourismCulturalSection',
    'tourism_gallery': 'TourismGallerySection'
  };

  const componentName = typeToComponentName[section.type];
  if (componentName && registeredComponents[componentName]) {
    return markRaw(registeredComponents[componentName]);
  }

  console.warn(`No component found for section type: ${section.type}`);
  return null;
};

const { t, locale } = useLocalization();
const trpc = useTrpc();

// Fetch data using tRPC
const sections = ref<any[]>([]);
const isLoading = ref(true);
const error = ref<string | null>(null);

// Helper function to get translation by locale
const getTranslation = (translations: any[] | undefined, fallback: any) => {
  if (!translations || !Array.isArray(translations) || translations.length === 0) return fallback;
  const translation = translations.find(t => t?.locale === locale.value);
  return translation || translations.find(t => t?.locale === 'en') || fallback;
};

// Computed properties for translated content
const translatedSections = computed(() => {
  if (!sections.value) return [];
  
  return sections.value.map(section => {
    if (!section) return null;
    const translation = getTranslation(section.translations, {});
    return {
      ...section,
      title: translation?.title || section.title,
      subtitle: translation?.subtitle || '',
      content: translation?.content || '',
      data: translation?.data || {}
    };
  }).filter(Boolean);
});

// Helper function to get team members from section data
const teamMembers = computed(() => {
  const teamSection = translatedSections.value.find(section => section.type === 'team');
  if (!teamSection || !teamSection.settings || !teamSection.settings.teamMembers) return [];
  return teamSection.settings.teamMembers;
});

// Helper function to get milestones from section data
const milestones = computed(() => {
  const milestoneSection = translatedSections.value.find(section => section.type === 'milestone');
  if (!milestoneSection || !milestoneSection.settings || !milestoneSection.settings.milestones) return [];
  return milestoneSection.settings.milestones;
});

// Helper function to get hero section
const heroSection = computed(() => {
  return translatedSections.value.find(section => section.type === 'hero');
});

const fetchData = async () => {
  try {
    isLoading.value = true;
    error.value = null;

    const data = await trpc.about.getActiveSections.query(locale.value);

    if (!data || data.length === 0) {
      error.value = 'No active about sections found';
      return;
    }

    sections.value = data;

  } catch (e) {
    console.error('Error fetching about sections:', e);
    error.value = 'Failed to load about sections';
  } finally {
    isLoading.value = false;
  }
};

onMounted(() => {
  fetchData();
});

// Watch for locale changes and refetch data
watch(locale, () => {
  fetchData();
});
</script>

<template>
  <div class="about w-full bg-gray-50">
    <div v-if="isLoading" class="container mx-auto space-y-10 py-10 px-4">
      <HeroSkeleton />
      <CardGridSkeleton :item-count="3" :columns="3" />
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
