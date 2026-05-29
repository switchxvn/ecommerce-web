<script setup lang="ts">
import { computed } from 'vue';
import { useDarkMode } from '~/composables/useDarkMode';
import { useCssColorValue } from '~/composables/useColorUtils';

interface CompanyIntroConfig {
  layout: "left-image" | "right-image" | "full-text";
  title?: string;
  description: string;
  image?: string;
  stats?: Array<{
    id: string;
    value: string;
    label: string;
  }>;
  buttonText?: string;
  buttonLink?: string;
  backgroundColor?: string;
  textColor?: string;
  maxWidth?: string;
  border?: {
    width: string;
    style: string;
    color: string;
    radius: string;
  };
  buttonStyle?: {
    padding: string;
    fontSize: string;
    fontWeight: string;
    backgroundColor?: string;
    textColor?: string;
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
}

const props = defineProps<{
  config?: CompanyIntroConfig;
  titleTag?: string;
}>();

const { isDark } = useDarkMode();
const { processColorValue } = useCssColorValue();

const sectionClasses = computed(() => {
  const baseClasses = ['company-intro', 'py-16', 'transition-colors', 'duration-300'];
  
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

const processedDescription = computed(() => {
  if (!props.config) return "";

  let desc = props.config.description;
  if (isDark.value && props.config.darkMode?.accentColor) {
    desc = desc.replace(/#ff9800/g, processColorValue(props.config.darkMode.accentColor));
  }
  return desc;
});

const extractedHeading = computed(() => {
  const fallback = {
    content: props.config?.title || '',
    style: undefined as string | undefined,
    className: '',
  };

  const description = processedDescription.value;
  if (!description) return fallback;

  const match = description.match(/<h([1-6])([^>]*)>([\s\S]*?)<\/h\1>/i);
  if (!match) return fallback;

  const attributes = match[2] || '';
  const styleMatch = attributes.match(/style=(['"])([\s\S]*?)\1/i);
  const classMatch = attributes.match(/class=(['"])([\s\S]*?)\1/i);

  return {
    content: match[3].trim(),
    style: styleMatch?.[2],
    className: classMatch?.[2] || '',
  };
});

const descriptionWithoutHeading = computed(() => {
  if (!processedDescription.value) return '';
  return processedDescription.value.replace(/<h([1-6])[^>]*>[\s\S]*?<\/h\1>/i, '').trim();
});

const currentBorderStyles = computed(() => {
  if (!props.config?.border) return {};

  const borderColor = isDark.value && props.config.darkMode?.accentColor
    ? processColorValue(props.config.darkMode.accentColor)
    : processColorValue(props.config.border.color);

  return {
    border: `${props.config.border.width} ${props.config.border.style} ${borderColor}`,
    borderRadius: props.config.border.radius,
    padding: "2rem",
  };
});

const getButtonStyles = (config: CompanyIntroConfig) => {
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
  <section
    v-if="config"
    :class="sectionClasses"
  >
    <div class="container mx-auto px-4">
      <!-- Full Text Layout -->
      <div
        v-if="config.layout === 'full-text'"
        :style="currentBorderStyles"
        class="mx-auto"
      >
        <component
          :is="titleTag || 'h2'"
          v-if="extractedHeading.content"
          class="mb-6 text-center text-3xl font-bold md:text-4xl dark:text-white"
          :class="extractedHeading.className"
          :style="extractedHeading.style"
        >
          <span v-html="extractedHeading.content"></span>
        </component>
        <div
          class="prose dark:prose-invert max-w-none mb-8 mx-auto"
          v-html="descriptionWithoutHeading"
        ></div>

        <!-- Stats Grid for full-text layout -->
        <div v-if="config.stats" class="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
          <div v-for="stat in config.stats" :key="stat.id" class="text-center">
            <div class="text-3xl font-bold text-primary dark:text-primary mb-2">
              {{ stat.value }}
            </div>
            <div class="text-sm text-gray-600 dark:text-gray-400">{{ stat.label }}</div>
          </div>
        </div>
        <div class="flex justify-center">
          <!-- CTA Button for full-text layout -->
          <UButton
            v-if="config.buttonText && config.buttonLink"
            :to="config.buttonLink"
            color="primary"
            variant="solid"
            class="mt-4 inline-block mx-auto transition-colors duration-300"
            :style="getButtonStyles(config)"
          >
            {{ config.buttonText }}
          </UButton>
        </div>
      </div>

      <!-- Image Layouts -->
      <div v-else class="flex flex-col md:flex-row items-center gap-8">
        <!-- Image Section -->
        <div
          v-if="config.image"
          :class="[
            'w-full md:w-1/2',
            config.layout === 'right-image' ? 'md:order-2' : '',
          ]"
        >
          <img
            :src="config.image"
            :alt="config.title"
            class="rounded-lg shadow-xl w-full h-auto object-cover"
          />
        </div>

        <!-- Content Section -->
        <div
          :class="[
            'w-full',
            config.image ? 'md:w-1/2' : 'md:w-3/4 mx-auto',
            config.layout === 'right-image' ? 'md:order-1' : '',
          ]"
          :style="currentBorderStyles"
        >
          <component
            :is="titleTag || 'h2'"
            v-if="config.title"
            class="text-3xl md:text-4xl font-bold mb-6 dark:text-white"
          >
            {{ config.title }}
          </component>
          <div
            class="prose dark:prose-invert max-w-none mb-8"
            v-html="processedDescription"
          ></div>

          <!-- Stats Grid -->
          <div v-if="config.stats" class="grid grid-cols-2 gap-6 mb-8">
            <div v-for="stat in config.stats" :key="stat.id" class="text-center">
              <div class="text-3xl font-bold text-primary dark:text-primary mb-2">
                {{ stat.value }}
              </div>
              <div class="text-sm text-gray-600 dark:text-gray-400">{{ stat.label }}</div>
            </div>
          </div>

          <!-- CTA Button -->
          <UButton
            v-if="config.buttonText && config.buttonLink"
            :to="config.buttonLink"
            color="primary"
            variant="solid"
            class="mt-4 inline-block transition-colors duration-300"
            :style="getButtonStyles(config)"
          >
            {{ config.buttonText }}
          </UButton>
        </div>
      </div>
    </div>
  </section>
</template>

<style>
.company-intro :deep(.prose) {
  --tw-prose-body: var(--text);
  --tw-prose-headings: var(--text);
  --tw-prose-links: var(--primary);
}

.dark .company-intro :deep(.prose) {
  --tw-prose-body: var(--text);
  --tw-prose-headings: var(--text);
  --tw-prose-links: var(--primary);
}
</style>
