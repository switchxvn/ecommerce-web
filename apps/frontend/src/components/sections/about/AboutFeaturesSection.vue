<script setup lang="ts">
import { computed } from 'vue';

interface FeatureItem {
  title: string;
  description?: string;
}

interface Props {
  settings: {
    backgroundColor?: string;
    textColor?: string;
    padding?: string;
    items?: FeatureItem[];
  };
  translations: {
    title: string;
    subtitle?: string;
    content?: string;
    data?: {
      items?: FeatureItem[];
    };
  };
}

const props = withDefaults(defineProps<Props>(), {
  settings: () => ({}),
  translations: () => ({ title: '' }),
});

const sectionClasses = computed(() => [
  'w-full',
  props.settings.backgroundColor || 'bg-slate-950',
  props.settings.textColor || 'text-white',
]);

const sectionSpacing = computed(() => props.settings.padding || 'py-16 lg:py-20');

const items = computed(() => props.translations.data?.items || props.settings.items || []);
</script>

<template>
  <section :class="sectionClasses">
    <div class="container mx-auto px-4" :class="sectionSpacing">
      <div class="max-w-3xl space-y-4">
        <h2 class="text-3xl font-bold tracking-tight md:text-4xl">
          {{ translations.title }}
        </h2>
        <p
          v-if="translations.subtitle"
          class="text-lg leading-8 text-slate-200"
        >
          {{ translations.subtitle }}
        </p>
        <div
          v-if="translations.content"
          class="prose prose-invert max-w-none leading-8"
          v-html="translations.content"
        />
      </div>

      <div
        v-if="items.length"
        class="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-3"
      >
        <article
          v-for="(item, index) in items"
          :key="item.title"
          class="rounded-[1.75rem] border border-white/10 bg-white/5 p-6 backdrop-blur"
        >
          <div class="text-sm font-semibold uppercase tracking-[0.24em] text-primary-300">
            {{ String(index + 1).padStart(2, '0') }}
          </div>
          <h3 class="mt-4 text-xl font-semibold text-white">
            {{ item.title }}
          </h3>
          <p
            v-if="item.description"
            class="mt-3 text-sm leading-7 text-slate-200"
          >
            {{ item.description }}
          </p>
        </article>
      </div>
    </div>
  </section>
</template>
