import { ref, reactive, computed } from 'vue';
import { useTrpc } from './useTrpc';
import { TRPCClientError } from '@trpc/client';

// Lưu trữ cài đặt toàn cục để tránh gọi API nhiều lần
const globalSettings = reactive<Record<string, any>>({});
const isInitialized = ref(false);
const isGlobalLoading = ref(false);
let pendingPublicSettingsRequest: Promise<any> | null = null;

interface Logo {
  light: string;
  dark: string;
}

interface Settings {
  logo: Logo;
  siteName: string;
  showLanguageSwitcher: boolean;
  showThemeToggle: boolean;
  showCart: boolean;
  slogan?: {
    text: string;
    subText: string;
    additionalText?: string;
  };
  hotlines?: {
    sales?: {
      text: string;
      number: string;
      backgroundColor?: string;
      textColor?: string;
    };
    support?: {
      text: string;
      number: string;
      backgroundColor?: string;
      textColor?: string;
    };
  };
  navigation?: {
    textColor?: string;
    activeTextColor?: string;
  };
  darkMode?: {
    menuBackgroundColor?: string;
  };
  menuBackgroundColor?: string;
  hotline: string;
  operatingHours: string;
}

/**
 * Composable để quản lý và truy cập các cài đặt hệ thống
 * @returns Các phương thức và thuộc tính để làm việc với settings
 */
export function useSettings() {
  const trpc = useTrpc();
  const settings = ref<Settings | null>(null);
  const isLoading = ref(false);
  const error = ref<Error | null>(null);

  /**
   * Lấy tất cả các cài đặt công khai và lưu vào bộ nhớ cache
   */
  const fetchPublicSettings = async (forceRefresh = false) => {
    // Nếu đã khởi tạo và không yêu cầu refresh, trả về kết quả từ cache
    if (isInitialized.value && !forceRefresh) {
      settings.value = { ...settings.value, ...globalSettings };
      return settings.value;
    }
    
    // Nếu đang tải, không gọi API lại
    if (isGlobalLoading.value) {
      return pendingPublicSettingsRequest || { ...settings.value, ...globalSettings };
    }

    pendingPublicSettingsRequest = (async () => {
      isLoading.value = true;
      isGlobalLoading.value = true;
      error.value = null;
      // Gọi API tRPC
      const data = await trpc.settings.getPublicSettings.query();
      
      // Lưu vào bộ nhớ cache
      settings.value = { ...settings.value, ...data };
      
      // Cập nhật globalSettings
      data.forEach((setting: any) => {
        if (setting.key) {
          globalSettings[setting.key] = setting;
        }
      });
      
      isInitialized.value = true;
      return { ...settings.value, ...globalSettings };
    })().catch((err) => {
      if (err instanceof TRPCClientError) {
        error.value = err.message;
      } else {
        error.value = 'Đã xảy ra lỗi khi tải cài đặt';
      }
      console.error('Error fetching public settings:', err);
      return { ...settings.value, ...globalSettings };
    }).finally(() => {
      isLoading.value = false;
      isGlobalLoading.value = false;
      pendingPublicSettingsRequest = null;
    });

    return pendingPublicSettingsRequest;
  };
  
  /**
   * Lấy cài đặt công khai theo key
   * @param key Key của cài đặt cần lấy
   * @returns Giá trị của cài đặt hoặc null nếu không tìm thấy
   */
  const getPublicSettingByKey = async (key: string) => {
    // Nếu chưa khởi tạo, gọi fetchPublicSettings trước
    if (!isInitialized.value) {
      await fetchPublicSettings();
    }
    
    // Kiểm tra xem có trong cache không
    if (globalSettings[key]) {
      return globalSettings[key];
    }
    
    try {
      isLoading.value = true;
      error.value = null;
      // Gọi API tRPC
      const setting = await trpc.settings.getPublicSettingByKey.query(key);
      
      // Lưu vào cache
      if (setting && setting.key) {
        globalSettings[setting.key] = setting;
      }
      
      return setting;
    } catch (err) {
      if (err instanceof TRPCClientError) {
        error.value = err.message;
      } else {
        error.value = `Đã xảy ra lỗi khi tải cài đặt với key ${key}`;
      }
      console.error(`Error fetching public setting with key ${key}:`, err);
      return null;
    } finally {
      isLoading.value = false;
    }
  };
  
  /**
   * Lấy giá trị của cài đặt công khai theo key
   * @param key Key của cài đặt cần lấy
   * @returns Giá trị của cài đặt hoặc giá trị mặc định nếu không tìm thấy
   */
  const getPublicSettingValueByKey = async (key: string, defaultValue: string = '') => {
    try {
      if (!isInitialized.value) {
        await fetchPublicSettings();
      }

      // Kiểm tra xem có trong cache không
      if (globalSettings[key]) {
        return globalSettings[key].value || defaultValue;
      }
      
      const setting = await getPublicSettingByKey(key);
      const value = setting ? setting.value : defaultValue;

      return value;
    } catch (err) {
      console.error(`Error getting value for setting ${key}:`, err);
      return defaultValue;
    }
  };
  
  /**
   * Kiểm tra xem cài đặt có giá trị là true hay không
   * @param key Key của cài đặt cần kiểm tra
   * @param defaultValue Giá trị mặc định nếu không tìm thấy cài đặt
   * @returns true nếu giá trị là 'true', false nếu không
   */
  const isSettingEnabled = async (key: string, defaultValue: boolean = false) => {
    try {
      const value = await getPublicSettingValueByKey(key, defaultValue ? 'true' : 'false');
      const enabled = value.toLowerCase() === 'true';

      return enabled;
    } catch (err) {
      console.error(`Error checking if setting ${key} is enabled:`, err);
      return defaultValue;
    }
  };
  
  /**
   * Kiểm tra xem có cho phép thêm vào giỏ hàng hay không
   * @returns true nếu cho phép, false nếu không
   */
  const isAddToCartEnabled = async () => {
    const enabled = await isSettingEnabled('enable_add_to_cart', true); // Mặc định là true
    return enabled;
  };
  
  // Khởi tạo settings nếu chưa được khởi tạo
  if (process.client && !isInitialized.value && !isGlobalLoading.value) {
    fetchPublicSettings();
  }
  
  return {
    settings,
    isLoading,
    error,
    fetchPublicSettings,
    getPublicSettingByKey,
    getPublicSettingValueByKey,
    isSettingEnabled,
    isAddToCartEnabled,
    isInitialized,
  };
}
