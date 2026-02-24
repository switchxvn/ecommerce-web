import { ref } from 'vue';
import { useTrpc } from './useTrpc';
import { useTheme } from './useTheme';

interface PriceStyleConfig {
  fontSize?: string | number | null;
  color?: string | null;
  fontWeight?: string | number | null;
}

interface ContactInfoConfig {
  title: string;
  representativeName: string;
  position?: string;
  phoneNumber: string;
  email?: string;
  availability?: string;
  note?: string;
}

interface StyleConfig {
  imageHeight?: number;
  showLabels?: {
    featured: boolean;
    new: boolean;
    sale: boolean;
    discount: boolean;
  };
  labelStyles?: {
    featured: {
      backgroundColor: string;
      textColor: string;
    };
    new: {
      backgroundColor: string;
      textColor: string;
    };
    sale: {
      backgroundColor: string;
      textColor: string;
    };
    discount: {
      backgroundColor: string;
      textColor: string;
    };
  };
  priceStyles?: {
    price?: PriceStyleConfig;
    comparePrice?: PriceStyleConfig;
  };
  contactInfo?: ContactInfoConfig;
}

interface ComponentStyleConfig {
  id: number;
  themeId: number;
  type: string;
  title: string;
  settings: StyleConfig;
  isActive: boolean;
  createdAt: string | Date;
  updatedAt: string | Date;
}

interface ApiConfig {
  id: number;
  themeId: number;
  type: string;
  title: string;
  settings: Record<string, any>;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  theme?: any;
}

// Lưu trữ style configs toàn cục
const styleConfigs = ref<Map<string, ComponentStyleConfig>>(new Map());
let initialized = false;

// Default configs cho từng loại component
const defaultConfigs: Record<string, ComponentStyleConfig> = {
  'ticket-card': {
    id: 0,
    themeId: 1,
    type: 'ticket-card',
    title: 'Ticket Card Style Configuration',
    settings: {
      imageHeight: 400,
      showLabels: {
        featured: true,
        new: true,
        sale: true,
        discount: true
      },
      labelStyles: {
        featured: {
          backgroundColor: '#f59e0b',
          textColor: '#ffffff'
        },
        new: {
          backgroundColor: '#3b82f6',
          textColor: '#ffffff'
        },
        sale: {
          backgroundColor: '#ef4444',
          textColor: '#ffffff'
        },
        discount: {
          backgroundColor: '#ef4444',
          textColor: '#ffffff'
        }
      }
    },
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  'product-card': {
    id: 0,
    themeId: 1,
    type: 'product-card',
    title: 'Product Card Style Configuration',
    settings: {
      imageHeight: 300,
      showLabels: {
        new: true,
        sale: true,
        featured: true,
        discount: true
      },
      labelStyles: {
        featured: {
          backgroundColor: '#4F46E5',
          textColor: '#ffffff'
        },
        new: {
          backgroundColor: '#10B981',
          textColor: '#ffffff'
        },
        sale: {
          backgroundColor: '#EF4444',
          textColor: '#ffffff'
        },
        discount: {
          backgroundColor: '#F59E0B',
          textColor: '#ffffff'
        }
      },
      priceStyles: {
        price: {
          fontSize: null,
          color: null,
          fontWeight: null
        },
        comparePrice: {
          fontSize: null,
          color: null,
          fontWeight: null
        }
      }
    },
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  'product-sidebar-contact': {
    id: 0,
    themeId: 1,
    type: 'product-sidebar-contact',
    title: 'Product Sidebar Contact Information',
    settings: {
      contactInfo: {
        title: 'Tư vấn mua hàng',
        representativeName: 'Nguyễn Văn A',
        position: 'Chuyên viên kinh doanh',
        phoneNumber: '0900 000 000',
        email: 'sales@example.com',
        availability: '8:00 - 21:00, Thứ 2 - Chủ nhật',
        note: 'Liên hệ ngay để được hỗ trợ chi tiết về sản phẩm'
      }
    },
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  }
};

export const useComponentStyles = () => {
  const trpc = useTrpc();

  const getStyleConfig = (type: string): ComponentStyleConfig => {
    return styleConfigs.value.get(type) || defaultConfigs[type];
  };

  const initializeStyles = async () => {
    if (initialized) return;

    try {
      const { getActiveTheme } = useTheme();
      const activeTheme = await getActiveTheme();
      
      if (!activeTheme) {
        throw new Error('No active theme found');
      }

      // Lấy tất cả component styles cho theme hiện tại
      const configs = await trpc.componentStyleConfig.byThemeId.query(activeTheme.id) as ApiConfig[];
      
      // Cập nhật vào map
      configs.forEach(apiConfig => {
        const defaultConfig = defaultConfigs[apiConfig.type];
        if (defaultConfig) {
          // Merge với default config để đảm bảo không thiếu thuộc tính
          styleConfigs.value.set(apiConfig.type, {
            ...apiConfig,
            settings: {
              ...defaultConfig.settings,
              ...apiConfig.settings
            }
          } as ComponentStyleConfig);
        }
      });

      initialized = true;
    } catch (error) {
      console.error('Failed to initialize component styles:', error);
      // Fallback to default configs if API fails
      Object.entries(defaultConfigs).forEach(([type, config]) => {
        styleConfigs.value.set(type, config);
      });
    }
  };

  return {
    getStyleConfig,
    initializeStyles
  };
}; 
