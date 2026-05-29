<script setup lang="ts">
import { ref, computed } from 'vue';
import { useDarkMode } from '~/composables/useDarkMode';
import Icon from '~/components/ui/Icon.vue';
import { onClickOutside } from '@vueuse/core';
import { useLocalization } from '~/composables/useLocalization';

const { t } = useLocalization();
const { isDark, currentMode, setMode } = useDarkMode();
const isOpen = ref(false);
const menuRef = ref<HTMLElement | null>(null);
const translateWithFallback = (key: string, fallback: string) => {
  const translated = t(key);
  return translated && translated.trim() && translated.trim() !== key ? translated : fallback;
};

onClickOutside(menuRef, () => {
  isOpen.value = false;
});

type ThemeMode = 'light' | 'dark' | 'auto';
type IconName = 'Sun' | 'Moon' | 'Monitor' | 'ChevronDown' | 'Check';

interface ThemeModeOption {
  value: ThemeMode;
  label: string;
  icon: IconName;
}

// Define mode configurations
const modeConfigs: { [key in ThemeMode]: { icon: IconName, labelKey: string } } = {
  light: { icon: 'Sun', labelKey: 'theme.light' },
  dark: { icon: 'Moon', labelKey: 'theme.dark' },
  auto: { icon: 'Monitor', labelKey: 'theme.system' }
};

// Make modes reactive using computed
const modes = computed<ThemeModeOption[]>(() => 
  Object.entries(modeConfigs).map(([value, config]) => ({
    value: value as ThemeMode,
    label: translateWithFallback(config.labelKey, value),
    icon: config.icon
  }))
);

const getCurrentIcon = computed(() => {
  if (currentMode.value === 'auto') return modeConfigs.auto.icon;
  return isDark.value ? modeConfigs.dark.icon : modeConfigs.light.icon;
});

const getCurrentLabel = computed(() => {
  const mode = modes.value.find(m => m.value === currentMode.value);
  return mode ? mode.label : translateWithFallback('theme.title', 'Giao diện');
});
</script>

<template>
  <div ref="menuRef" class="relative">
    <button 
      class="inline-flex w-auto items-center justify-between gap-1.5 sm:gap-1 px-3 py-2 sm:px-2 sm:py-1 rounded-md bg-gray-100 hover:bg-gray-200 dark:bg-white/20 dark:hover:bg-white/30 transition-[background] duration-150 text-gray-800 dark:text-white min-h-[40px] sm:min-h-auto min-w-[120px] sm:min-w-auto"
      @click="isOpen = !isOpen"
      :title="translateWithFallback('theme.title', 'Giao diện')"
    >
      <div class="w-4 h-4 sm:w-3.5 sm:h-3.5 flex items-center justify-center flex-shrink-0">
        <Icon
          :name="getCurrentIcon"
          class="h-4 w-4 sm:h-3.5 sm:w-3.5"
        />
      </div>
      <span class="text-sm sm:text-xs font-medium whitespace-nowrap flex-1 text-left">{{ getCurrentLabel }}</span>
      <Icon 
        name="ChevronDown"
        class="h-4 w-4 sm:h-3.5 sm:w-3.5 transition-transform !transition-none flex-shrink-0"
        :class="{ 'rotate-180': isOpen }"
      />
    </button>

    <!-- Dropdown Menu -->
    <div
      v-if="isOpen"
      class="absolute right-0 mt-1 w-full min-w-[160px] sm:w-40 rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black/5 dark:ring-white/10 z-[120]"
    >
      <div class="py-1">
        <button
          v-for="mode in modes"
          :key="mode.value"
          class="flex items-center w-full px-3 py-3 sm:py-1.5 text-sm sm:text-xs text-left text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-[background] duration-150"
          :class="{ 'bg-gray-100 dark:bg-gray-700': currentMode === mode.value }"
          @click="() => { setMode(mode.value); isOpen = false; }"
        >
          <Icon :name="mode.icon" class="h-4 w-4 sm:h-3.5 sm:w-3.5 mr-3 sm:mr-1.5 flex-shrink-0" />
          <span class="flex-1 whitespace-nowrap">{{ mode.label }}</span>
          <Icon
            v-if="currentMode === mode.value"
            name="Check"
            class="h-4 w-4 sm:h-3.5 sm:w-3.5 ml-2 flex-shrink-0"
          />
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Dropdown menu */
.absolute {
  z-index: 1200 !important;
}

/* Mobile responsive improvements */
@media (max-width: 640px) {
  .relative {
    width: 100%;
  }
  
  .absolute {
    left: 0;
    right: 0;
    width: 100% !important;
    min-width: unset !important;
  }
}

/* Disable all transitions when switching between light/dark modes */
:root[class*='dark'] * {
  transition: none !important;
}

/* Only enable transitions for specific properties we want to animate */
.transition-transform {
  transition-property: transform !important;
}

.transition-\[background\] {
  transition-property: background-color !important;
}
</style> 
