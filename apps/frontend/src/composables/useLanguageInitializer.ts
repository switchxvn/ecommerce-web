import { ref } from 'vue';
import { useLocalization } from './useLocalization';

// Global state để track việc khởi tạo
const isInitializing = ref(false);
const hasInitialized = ref(false);
let initializationPromise: Promise<{ initialized: boolean }> | null = null;

export function useLanguageInitializer() {
  const { initializeLocalization } = useLocalization();

  const initializeOnce = async (options?: { force?: boolean }) => {
    const shouldForce = options?.force === true;

    // Nếu đã khởi tạo hoặc đang trong quá trình khởi tạo, không làm gì cả
    if (hasInitialized.value && !shouldForce) {
      return { initialized: true };
    }

    if (initializationPromise) {
      return initializationPromise;
    }

    initializationPromise = (async () => {
      isInitializing.value = true;
      await initializeLocalization({ force: shouldForce });
      hasInitialized.value = true;
      return { initialized: true };
    })().finally(() => {
      isInitializing.value = false;
      initializationPromise = null;
    });

    return initializationPromise;
  };

  return {
    initializeOnce,
    isInitializing,
    hasInitialized
  };
} 
