<script setup lang="ts">
import { useAsyncData, useRoute, useRuntimeConfig } from 'nuxt/app';
import { computed, defineAsyncComponent, markRaw, watch } from 'vue';
import type { Component } from 'vue';
import { useLocalization } from '../composables/useLocalization';
import { usePageSeo } from '../composables/usePageSeo';
import { useTrpc } from '../composables/useTrpc';
import {
  buildAbsoluteUrl,
  buildOrganizationSchema,
} from '../utils/seo';
import {
  resolveAboutSectionComponentName,
  translateAboutSections,
  type AboutSectionRecord,
} from '../utils/aboutPage';

type ComponentType = Component;
type ComponentRegistry = Record<string, ComponentType>;

const registeredComponents = {
  AboutHeroSection: defineAsyncComponent(() => import('../components/sections/about/AboutHeroSection.vue')),
  AboutContentSection: defineAsyncComponent(() => import('../components/sections/about/AboutContentSection.vue')),
  AboutFeaturesSection: defineAsyncComponent(() => import('../components/sections/about/AboutFeaturesSection.vue')),
  AboutMilestoneSection: defineAsyncComponent(() => import('../components/sections/about/AboutMilestoneSection.vue')),
  AboutTeamSection: defineAsyncComponent(() => import('../components/sections/about/AboutTeamSection.vue')),
  TourismHeroSection: defineAsyncComponent(() => import('../components/sections/about/tourism/TourismHeroSection.vue')),
  TourismFeaturesSection: defineAsyncComponent(() => import('../components/sections/about/tourism/TourismFeaturesSection.vue')),
  TourismCulturalSection: defineAsyncComponent(() => import('../components/sections/about/tourism/TourismCulturalSection.vue')),
  TourismGallerySection: defineAsyncComponent(() => import('../components/sections/about/tourism/TourismGallerySection.vue')),
} as ComponentRegistry;

const resolveComponent = (section: AboutSectionRecord): ComponentType | null => {
  const componentName = resolveAboutSectionComponentName(section);

  if (!componentName || !registeredComponents[componentName]) {
    console.warn(`No component found for about section type: ${section?.type}`);
    return null;
  }

  return markRaw(registeredComponents[componentName]);
};

const { locale } = useLocalization();
const trpc = useTrpc();
const route = useRoute();
const config = useRuntimeConfig();

definePageMeta({
  layout: 'default',
});

const fallbackSeoByLocale = computed(() =>
  locale.value === 'en'
    ? {
        title: 'About MGA Vietnam | Forklifts, spare parts, and technical service',
        description:
          'Learn how MGA Vietnam supports forklift operations with equipment consulting, genuine spare parts, maintenance, and technical service.',
      }
    : {
        title: 'Giới thiệu MGA Vietnam | Xe nâng, phụ tùng và dịch vụ kỹ thuật',
        description:
          'Tìm hiểu MGA Vietnam qua năng lực tư vấn xe nâng, phụ tùng chính hãng, bảo trì kỹ thuật và đồng hành vận hành cho doanh nghiệp.',
      },
);

const { data: sectionsState, pending, error } = await useAsyncData(
  () => `about-sections-${locale.value}`,
  async () => {
    const data = await trpc.about.getActiveSections.query(locale.value);
    return Array.isArray(data) ? data : [];
  },
  {
    watch: [locale],
    default: () => [],
  },
);

const { data: seoDataState } = await useAsyncData(
  () => `seo-about-${locale.value}`,
  () => trpc.seo.getSeoByPath.query(locale.value === 'en' ? '/about' : '/gioi-thieu').catch(() => null),
  {
    watch: [locale],
    default: () => null,
  },
);

const sections = computed<AboutSectionRecord[]>(() => sectionsState.value || []);

const translatedSections = computed(() =>
  translateAboutSections(sections.value, locale.value).filter((section) => section.isActive !== false),
);

const activeHeroSection = computed(() =>
  translatedSections.value.find((section) => section.type === 'hero'),
);

const pageTitle = computed(() => seoDataState.value?.title || fallbackSeoByLocale.value.title);
const pageDescription = computed(
  () => seoDataState.value?.description || fallbackSeoByLocale.value.description,
);
const pageImage = computed(() => {
  const heroImage = activeHeroSection.value?.settings?.heroBackgroundImage;
  const seoImage = seoDataState.value?.ogImage;
  const candidate = seoImage || heroImage || '/images/og-default.jpg';

  return candidate.startsWith('http')
    ? candidate
    : buildAbsoluteUrl(config.public.siteUrl, candidate);
});

const pageCanonical = computed(() => seoDataState.value?.canonicalUrl || null);

usePageSeo({
  title: pageTitle,
  description: pageDescription,
  keywords: computed(() => seoDataState.value?.keywords || ''),
  ogTitle: computed(() => seoDataState.value?.ogTitle || pageTitle.value),
  ogDescription: computed(() => seoDataState.value?.ogDescription || pageDescription.value),
  image: pageImage,
  canonicalUrl: pageCanonical,
  currentPath: computed(() => route.path),
  locale: computed(() => (locale.value === 'en' ? 'en' : 'vi')),
  routeKey: 'about',
  breadcrumbs: computed(() => [
    {
      name: locale.value === 'en' ? 'Home' : 'Trang chu',
      item: '/',
    },
    {
      name: pageTitle.value,
    },
  ]),
  schemas: computed(() => {
    const organizationSchema = buildOrganizationSchema(
      config.public.siteUrl,
      config.public.siteName || 'MGA Vietnam',
      pageImage.value,
    ) as Record<string, unknown>;

    organizationSchema.description = pageDescription.value;

    return [organizationSchema];
  }),
});

const hasSections = computed(() => translatedSections.value.length > 0);

watch(
  () => error.value,
  (value) => {
    if (value) {
      console.error('Error fetching about sections:', value);
    }
  },
);
</script>

<template>
  <div class="about w-full bg-gray-50">
    <div v-if="pending" class="container mx-auto space-y-10 px-4 py-10">
      <HeroSkeleton />
      <CardGridSkeleton :item-count="3" :columns="3" />
    </div>

    <div v-else-if="error" class="container mx-auto px-4 py-10">
      <div class="rounded-lg bg-red-50 p-4 dark:bg-red-900/20">
        <p class="text-red-600 dark:text-red-400">
          Failed to load about sections
        </p>
      </div>
    </div>

    <div v-else-if="!hasSections" class="container mx-auto px-4 py-10">
      <div class="rounded-lg border border-slate-200 bg-white p-6 text-slate-700 shadow-sm">
        No active about sections found.
      </div>
    </div>

    <template v-else>
      <component
        v-for="section in translatedSections"
        :key="section.id || `${section.type}-${section.componentName}`"
        :is="resolveComponent(section)"
        :settings="section.settings || {}"
        :translations="{
          title: section.title,
          subtitle: section.subtitle,
          content: section.content,
          data: section.data,
        }"
      />
    </template>
  </div>
</template>
