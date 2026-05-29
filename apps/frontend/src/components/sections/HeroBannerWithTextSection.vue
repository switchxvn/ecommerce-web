# <script setup lang="ts">
import { computed } from 'vue';
import { useDarkMode } from '~/composables/useDarkMode';
import { useCssColorValue } from '~/composables/useColorUtils';

interface HeroBannerConfig {
  layout: "split-columns";
  textColumnWidth: string;
  imageColumnWidth: string;
  description: string;
  buttonText?: string;
  buttonLink?: string;
  backgroundColor?: string;
  textColor?: string;
  border?: {
    width: string;
    style: string;
    color: string;
    radius: string;
  };
  darkMode?: {
    backgroundColor?: string;
    textColor?: string;
    accentColor?: string;
    buttonStyle?: {
      backgroundColor?: string;
      textColor?: string;
    };
  };
  buttonStyle?: {
    padding: string;
    fontSize: string;
    fontWeight: string;
    backgroundColor?: string;
    textColor?: string;
  };
  image: {
    url: string;
    alt: string;
    objectFit: string;
    borderRadius: string;
  };
}

const props = defineProps<{
  config?: HeroBannerConfig;
}>();

const { isDark } = useDarkMode();
const { processColorValue } = useCssColorValue();

const sectionClasses = computed(() => {
  const baseClasses = ['hero-banner-with-text', 'py-16', 'transition-colors', 'duration-300'];
  
  if (props.config) {
    if (isDark.value && props.config.darkMode?.backgroundColor) {
      baseClasses.push('dark:bg-opacity-100');
      baseClasses.push(`dark:${props.config.darkMode.backgroundColor}`);
    } else {
      baseClasses.push(props.config.backgroundColor || 'bg-white dark:bg-gray-900');
    }
  } else {
    baseClasses.push('bg-white dark:bg-gray-900');
  }
  
  return baseClasses.join(' ');
});

const currentBorderStyles = computed(() => {
  if (!props.config?.border) return {};

  const borderColor = isDark.value && props.config.darkMode?.accentColor
    ? processColorValue(props.config.darkMode.accentColor)
    : processColorValue(props.config.border.color);

  return {
    border: `${props.config.border.width} ${props.config.border.style} ${borderColor}`,
    borderRadius: props.config.border.radius,
    padding: "3rem",
  };
});

const getButtonStyles = (config: HeroBannerConfig) => {
  if (!config.buttonStyle) return {};

  interface ButtonStyles {
    padding: string;
    fontSize: string;
    fontWeight: string;
    backgroundColor?: string;
    color?: string;
  }

  const buttonStyles: ButtonStyles = {
    padding: config.buttonStyle.padding,
    fontSize: config.buttonStyle.fontSize,
    fontWeight: config.buttonStyle.fontWeight,
  };

  if (isDark.value && config.darkMode?.buttonStyle) {
    return {
      ...buttonStyles,
      backgroundColor: processColorValue(config.darkMode.buttonStyle.backgroundColor || ''),
      color: processColorValue(config.darkMode.buttonStyle.textColor || ''),
    };
  }

  if (config.buttonStyle.backgroundColor) {
    buttonStyles.backgroundColor = processColorValue(config.buttonStyle.backgroundColor);
  }
  if (config.buttonStyle.textColor) {
    buttonStyles.color = processColorValue(config.buttonStyle.textColor);
  }

  return buttonStyles;
};
</script>

<template>
  <section v-if="config" :class="sectionClasses">
    <div class="container mx-auto px-4">
      <div class="flex flex-col md:flex-row gap-8">
        <!-- Text Column -->
        <div 
          :style="{ 
            width: config.textColumnWidth || '60%',
            ...currentBorderStyles
          }" 
          class="prose dark:prose-invert max-w-none flex-shrink-0 bg-white dark:bg-gray-800 shadow-lg flex flex-col rounded-2xl relative"
        >
          <div class="p-8 md:p-12 flex flex-col h-full">
            <div class="flex-1 overflow-y-auto relative pr-4 scrollbar-thin min-h-0">
              <div v-html="config.description" class="prose-lg"></div>
            </div>
            
            <!-- Button -->
            <UButton
              v-if="config.buttonText && config.buttonLink"
              :to="config.buttonLink"
              color="primary"
              variant="solid"
              class="mt-8 inline-flex items-center justify-center text-base font-medium transition-all duration-300 hover:transform hover:scale-105 uppercase"
              :style="getButtonStyles(config)"
            >
              {{ config.buttonText }}
            </UButton>
          </div>
        </div>

        <!-- Image Column -->
        <div 
          :style="{ width: config.imageColumnWidth || '40%' }" 
          class="relative flex-shrink-0"
        >
          <div class="h-[400px] rounded-2xl overflow-hidden shadow-xl">
            <img
              :src="config.image.url"
              :alt="config.image.alt"
              :style="{
                objectFit: config.image.objectFit,
                borderRadius: config.image.borderRadius
              }"
              class="w-full h-full"
            />
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style>
.hero-banner-with-text {
  @apply bg-gray-50 dark:bg-gray-900;
}

.hero-banner-with-text :deep(.prose) {
  --tw-prose-body: var(--text);
  --tw-prose-headings: var(--text);
  --tw-prose-links: var(--primary);
}

.hero-banner-with-text .scrollbar-thin {
  scrollbar-width: thin;
  scrollbar-color: theme('colors.gray.300') theme('colors.gray.100');
}

.hero-banner-with-text .scrollbar-thin::-webkit-scrollbar {
  width: 6px;
}

.hero-banner-with-text .scrollbar-thin::-webkit-scrollbar-track {
  background: theme('colors.gray.100');
  border-radius: 3px;
}

.hero-banner-with-text .scrollbar-thin::-webkit-scrollbar-thumb {
  background-color: theme('colors.gray.300');
  border-radius: 3px;
}

.dark .hero-banner-with-text .scrollbar-thin::-webkit-scrollbar-track {
  background: theme('colors.gray.700');
}

.dark .hero-banner-with-text .scrollbar-thin::-webkit-scrollbar-thumb {
  background-color: theme('colors.gray.600');
}

.hero-banner-with-text :deep(.prose h1) {
  @apply text-4xl font-bold mb-6;
}

.hero-banner-with-text :deep(.prose h2) {
  @apply text-3xl font-semibold mb-4;
}

.hero-banner-with-text :deep(.prose p) {
  @apply mb-4 text-lg leading-relaxed;
}

.dark .hero-banner-with-text :deep(.prose) {
  --tw-prose-body: var(--text);
  --tw-prose-headings: var(--text);
  --tw-prose-links: var(--primary);
}

/* Make columns stack on mobile */
@media (max-width: 768px) {
  .hero-banner-with-text .flex-col {
    @apply gap-4;
  }
  
  .hero-banner-with-text [style*="width"] {
    width: 100% !important;
  }

  .hero-banner-with-text .p-8 {
    @apply p-6;
  }

  .hero-banner-with-text .md\:p-12 {
    @apply p-6;
  }
}
</style> 
