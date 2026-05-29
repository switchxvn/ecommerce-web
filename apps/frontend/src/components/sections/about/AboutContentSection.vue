<script setup lang="ts">
import { computed } from 'vue';

interface HighlightItem {
  title: string;
  description?: string;
}

interface Props {
  settings: {
    imageUrl?: string;
    imageAlt?: string;
    imagePosition?: 'left' | 'right';
    backgroundColor?: string;
    textColor?: string;
    padding?: string;
    highlights?: HighlightItem[];
  };
  translations: {
    title: string;
    subtitle?: string;
    content?: string;
    data?: {
      eyebrow?: string;
      imageAlt?: string;
      highlights?: HighlightItem[];
    };
  };
}

const props = withDefaults(defineProps<Props>(), {
  settings: () => ({}),
  translations: () => ({ title: '' }),
});

const sectionClasses = computed(() => [
  'w-full',
  props.settings.backgroundColor || 'bg-white',
  props.settings.textColor || 'text-slate-900',
]);

const sectionSpacing = computed(() => props.settings.padding || 'py-16 lg:py-20');

const imageOnLeft = computed(() => props.settings.imagePosition === 'left');

const imageAlt = computed(() =>
  props.translations.data?.imageAlt ||
  props.settings.imageAlt ||
  props.translations.title,
);

const highlights = computed(
  () => props.translations.data?.highlights || props.settings.highlights || [],
);
</script>

<template>
  <section :class="sectionClasses">
    <div class="container mx-auto px-4" :class="sectionSpacing">
      <div
        class="grid items-start gap-10 lg:grid-cols-[1.05fr_0.95fr]"
        :class="{ 'lg:[&>*:first-child]:order-2 lg:[&>*:last-child]:order-1': imageOnLeft }"
      >
        <div class="space-y-6">
          <p
            v-if="translations.data?.eyebrow"
            class="text-sm font-semibold uppercase tracking-[0.24em] text-primary"
          >
            {{ translations.data.eyebrow }}
          </p>

          <div class="space-y-4">
            <h2 class="text-3xl font-bold tracking-tight md:text-4xl">
              {{ translations.title }}
            </h2>
            <p
              v-if="translations.subtitle"
              class="max-w-3xl text-lg leading-8 text-slate-600"
            >
              {{ translations.subtitle }}
            </p>
          </div>

          <div
            v-if="translations.content"
            class="prose prose-slate max-w-none leading-8 prose-headings:text-slate-950 prose-p:text-slate-700 prose-strong:text-slate-950"
            v-html="translations.content"
          />

          <div
            v-if="highlights.length"
            class="grid gap-4 sm:grid-cols-2"
          >
            <article
              v-for="highlight in highlights"
              :key="highlight.title"
              class="rounded-3xl border border-slate-200 bg-slate-50 p-5"
            >
              <h3 class="text-base font-semibold text-slate-950">
                {{ highlight.title }}
              </h3>
              <p
                v-if="highlight.description"
                class="mt-2 text-sm leading-6 text-slate-600"
              >
                {{ highlight.description }}
              </p>
            </article>
          </div>
        </div>

        <div
          v-if="settings.imageUrl"
          class="overflow-hidden rounded-[2rem] border border-slate-200 bg-slate-100 shadow-sm"
        >
          <img
            :src="settings.imageUrl"
            :alt="imageAlt"
            class="h-full min-h-[320px] w-full object-cover"
            loading="lazy"
          />
        </div>
      </div>
    </div>
  </section>
</template>
