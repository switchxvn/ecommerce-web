import { ref, onMounted, watch, computed } from 'vue';
import { usePreferredDark } from '@vueuse/core';

type ColorMode = 'light' | 'dark' | 'auto';
const STORAGE_KEY = 'color-theme';

export function resolveThemeMode(
  storedMode: string | null | undefined,
  prefersDark: boolean,
): { mode: ColorMode; isDark: boolean } {
  const candidate = storedMode;

  if (candidate === 'dark') {
    return { mode: 'dark', isDark: true };
  }

  if (candidate === 'auto') {
    return { mode: 'auto', isDark: prefersDark };
  }

  return { mode: 'light', isDark: false };
}

export function useDarkMode() {
  const isDark = ref(false);
  const prefersDark = usePreferredDark();
  const isInitialized = ref(false);
  const mode = ref<ColorMode>('light');

  const currentMode = computed(() => mode.value);

  const saveMode = (newMode: ColorMode) => {
    mode.value = newMode;
    localStorage.setItem(STORAGE_KEY, newMode);
  };

  const updateDarkMode = (value: boolean) => {
    isDark.value = value;
    // Cập nhật class cho document
    if (process.client) {
      document.documentElement.classList[value ? 'add' : 'remove']('dark');
    }
  };

  const initializeDarkMode = () => {
    // Đảm bảo chỉ chạy một lần và chỉ ở client-side
    if (isInitialized.value || !process.client) return;

    // Đọc giá trị từ localStorage
    const storedMode = localStorage.getItem(STORAGE_KEY) as ColorMode | null;
    const resolvedMode = resolveThemeMode(storedMode, prefersDark.value);

    mode.value = resolvedMode.mode;
    updateDarkMode(resolvedMode.isDark);

    if (storedMode !== resolvedMode.mode) {
      saveMode(resolvedMode.mode);
    }
    
    isInitialized.value = true;
  };

  const setMode = (newMode: ColorMode) => {
    saveMode(newMode);
    if (newMode === 'auto') {
      updateDarkMode(prefersDark.value);
    } else {
      updateDarkMode(newMode === 'dark');
    }
  };

  // Watch for system preference changes when in auto mode
  watch(prefersDark, (newPrefersDark) => {
    if (isInitialized.value && mode.value === 'auto') {
      updateDarkMode(newPrefersDark);
    }
  });

  // Initialize on client-side only
  onMounted(() => {
    initializeDarkMode();
  });

  return {
    isDark,
    currentMode,
    setMode,
    initializeDarkMode
  };
} 
