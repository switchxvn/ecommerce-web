<script setup lang="ts">
import { useLocalization } from '~/composables/useLocalization';
import { computed, onMounted, ref, watch } from 'vue';
import { useAsyncData } from '#imports';
import { useLanguageInitializer } from '~/composables/useLanguageInitializer';
import Icon from '~/components/ui/Icon.vue';
import { getLocaleDisplayName, getLocaleFallbackOptions, normalizeLocaleCode } from '~/utils/locale';

const { t, locale, locales, switchLanguage } = useLocalization();
const { initializeOnce, isInitializing } = useLanguageInitializer();

const isOpen = ref(false);
const flagLoaded = ref(false);
const flagLoadError = ref(false);
const translateWithFallback = (key: string, fallback: string) => {
  const translated = t(key);
  return translated && translated.trim() && translated.trim() !== key ? translated : fallback;
};

// Sử dụng useAsyncData để load danh sách ngôn ngữ trong quá trình SSR
const { pending: isLoadingLanguages } = useAsyncData(
  'languages-list',
  () => initializeOnce(),
  {
    server: true,
    lazy: false,
    // Cache kết quả trong 5 phút
    watch: false,
    maxAge: 300
  }
);

// Computed
const availableLocales = computed(() => getLocaleFallbackOptions(locales.value));

// Get current locale display
const currentLocaleDisplay = computed(() => {
  return getLocaleDisplayName(
    normalizeLocaleCode(locale.value, 'vi'),
    availableLocales.value,
    translateWithFallback('language', 'Ngôn ngữ'),
  );
});

// Function to get flag image path
const getFlagPath = (langCode: string) => {
  const lang = availableLocales.value.find(loc => loc.code === langCode);
  const flagCode = lang ? lang.flagCode : langCode;
  return `/images/flag/${flagCode}.svg`;
};

// Preload flag images
const preloadFlags = () => {
  if (!process.client || !locale.value) return;
  
  const currentLang = availableLocales.value.find(loc => loc.code === locale.value);
  if (!currentLang) return;

  const img = new Image();
  img.onload = () => {
    flagLoaded.value = true;
    flagLoadError.value = false;
  };
  img.onerror = () => {
    flagLoadError.value = true;
  };
  img.src = getFlagPath(locale.value);
};

// Toggle dropdown
const toggleDropdown = () => {
  isOpen.value = !isOpen.value;
};

// Close dropdown when clicking outside
const closeDropdown = () => {
  isOpen.value = false;
};

// Handle language selection and save to localStorage
const handleSelectLanguage = async (code: string) => {
  if (code === locale.value) {
    closeDropdown();
    return;
  }

  // Reset flag states before changing language
  flagLoaded.value = false;
  flagLoadError.value = false;
  
  await switchLanguage(code);
  closeDropdown();
  
  // Preload the new flag
  if (process.client) {
    const img = new Image();
    img.onload = () => {
      flagLoaded.value = true;
      flagLoadError.value = false;
    };
    img.onerror = () => {
      flagLoadError.value = true;
    };
    img.src = getFlagPath(code);
  }
};

// Handle click outside
const handleClickOutside = (event: Event) => {
  const target = event.target as HTMLElement;
  if (!target.closest('.language-switcher')) {
    closeDropdown();
  }
};

// Handle image load success
const handleImageLoad = () => {
  flagLoaded.value = true;
  flagLoadError.value = false;
};

// Handle image error
const handleImageError = () => {
  flagLoadError.value = true;
};

// Handle flag image error in dropdown
const handleDropdownImageError = (event: Event) => {
  const target = event.target as HTMLImageElement;
  if (target) {
    target.style.display = 'none';
  }
};

// Watch for locale and locales changes to update flag
watch([locale, locales], () => {
  if (process.client && locale.value && locales.value.length > 0) {
    preloadFlags();
  }
}, { immediate: true });

watch(
  () => locales.value.length,
  async (localeCount) => {
    if (!process.client || localeCount > 0 || isInitializing.value) {
      return;
    }

    await initializeOnce({ force: true });
  },
  { immediate: true },
);

// Initialize
onMounted(() => {
  if (process.client) {
    document.addEventListener('click', handleClickOutside);
    if (locale.value && locales.value.length > 0) {
      preloadFlags();
    }

    if (!locales.value.length && !isInitializing.value) {
      initializeOnce({ force: true });
    }
  }
});

// Cleanup
onBeforeUnmount(() => {
  if (process.client) {
    document.removeEventListener('click', handleClickOutside);
  }
});
</script>

<template>
  <div class="language-switcher inline-block">
    <button 
      @click.stop="toggleDropdown"
      class="inline-flex items-center justify-between space-x-1.5 sm:space-x-1 px-3 py-2 sm:px-2 sm:py-1 rounded-md bg-gray-100 hover:bg-gray-200 dark:bg-white/20 dark:hover:bg-white/30 transition-[background] duration-150 text-gray-800 dark:text-white min-h-[40px] sm:min-h-auto"
      type="button"
      :title="translateWithFallback('language', 'Ngôn ngữ')"
      :disabled="isLoadingLanguages"
    >
      <div v-if="isLoadingLanguages" class="w-4 h-4 sm:w-3.5 sm:h-3.5 flex items-center justify-center">
        <span class="animate-pulse !transition-none">...</span>
      </div>
      <div v-else class="w-4 h-4 sm:w-3.5 sm:h-3.5 flex items-center justify-center flex-shrink-0">
        <!-- Hiển thị flag khi đã tải xong -->
        <img 
          v-if="locale && !isLoadingLanguages && flagLoaded && !flagLoadError"
          :src="getFlagPath(locale)" 
          :alt="`${currentLocaleDisplay} flag`" 
          class="w-4 h-4 sm:w-3.5 sm:h-3.5 rounded-sm object-cover !transition-none"
          @load="handleImageLoad"
          @error="handleImageError"
        />
        <!-- Hiển thị mã ngôn ngữ khi chưa tải được flag -->
        <span v-else class="text-[11px] sm:text-[10px] font-bold !transition-none">{{ locale?.toUpperCase().substring(0, 2) }}</span>
      </div>
      <span class="text-sm sm:text-xs font-medium !transition-none whitespace-nowrap">{{ currentLocaleDisplay }}</span>
      <Icon 
        name="ChevronDown"
        class="h-4 w-4 sm:h-3.5 sm:w-3.5 transition-transform !transition-none flex-shrink-0"
        :class="{ 'rotate-180': isOpen }"
      />
    </button>

    <!-- Dropdown menu -->
    <div 
      v-if="isOpen" 
      class="absolute z-[120] mt-1 min-w-[160px] sm:min-w-[140px] rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black/5 dark:ring-white/10 focus:outline-none !transition-none"
    >
      <div v-if="isLoadingLanguages" class="py-4 sm:py-3 px-3 text-center text-sm sm:text-xs text-gray-900 dark:text-gray-100 !transition-none">
        <span>Loading...</span>
      </div>
      <div v-else class="py-1">
        <button
          v-for="loc in availableLocales"
          :key="loc.code"
          @click="handleSelectLanguage(loc.code)"
          class="flex items-center w-full px-3 py-2.5 sm:py-1.5 text-sm sm:text-xs text-left text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-[background] duration-150"
          :class="{ 'bg-gray-100 dark:bg-gray-700': locale === loc.code }"
        >
          <div class="w-4 h-4 sm:w-3.5 sm:h-3.5 flex items-center justify-center mr-2 sm:mr-1.5 flex-shrink-0">
            <!-- Hiển thị flag trong dropdown -->
            <img 
              :src="getFlagPath(loc.code)" 
              :alt="`${loc.name} flag`" 
              class="w-4 h-4 sm:w-3.5 sm:h-3.5 rounded-sm object-cover !transition-none"
              @error="handleDropdownImageError"
            />
          </div>
          <span class="!transition-none flex-1">{{ loc.nativeName }}</span>
          <Icon
            v-if="locale === loc.code"
            name="Check"
            class="h-4 w-4 sm:h-3.5 sm:w-3.5 ml-auto flex-shrink-0"
          />
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.language-switcher {
  position: relative;
  display: inline-block;
  width: auto;
}

/* Dropdown menu */
.absolute {
  z-index: 1200 !important;
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
