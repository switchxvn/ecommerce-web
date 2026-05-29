import * as LucideIcons from 'lucide-vue-next';
import type { Icon as LucideIcon } from 'lucide-vue-next';

// Lấy tất cả tên icon từ Lucide
type LucideIconName = keyof typeof LucideIcons;

/**
 * Chuyển đổi các định dạng khác nhau sang PascalCase cho tên icon
 * @param str Chuỗi cần chuyển đổi (có thể ở dạng kebab-case, snake_case hoặc space separated)
 * @returns Chuỗi ở dạng PascalCase
 */
export const toPascalCase = (str: string): string => {
  if (!str) return '';
  // Xử lý nhiều định dạng: kebab-case, snake_case, space separated
  return str
    .split(/[-_\s]/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join('');
};

// Map MDI icons to Lucide equivalents
const mdiToLucideMap: Record<string, LucideIconName> = {
  'mdi:forklift': 'Truck',
  'mdi:truck-delivery': 'Truck',
  'mdi:tools': 'Wrench',
  'mdi:cog-transfer': 'Settings',
  'mdi:account-hard-hat': 'HardHat',
  'mdi:handshake': 'Handshake',
  // Add more mappings as needed
};

const legacyToLucideMap: Record<string, LucideIconName> = {
  'ph:info': 'Info',
  'ph:shopping-cart': 'ShoppingCart',
  'ph:gear': 'Settings',
  'ph:newspaper': 'Newspaper',
  'ph:envelope': 'Mail',
  'ph:facebook-logo': 'Facebook',
  'ph:twitter-logo': 'Twitter',
  'ph:linkedin-logo': 'Linkedin',
  'ph:youtube-logo': 'Youtube',
  'i-heroicons-currency-dollar': 'BadgeDollarSign',
  'i-heroicons-phone': 'Phone',
  'i-heroicons-arrow-down': 'ArrowDown',
  'i-heroicons-arrow-right': 'ArrowRight',
};

// Cache for icon name conversions
const iconNameCache = new Map<string, LucideIconName>();

/**
 * Lấy tên icon chính xác từ thư viện Lucide
 * @param iconName Tên icon (có thể ở nhiều định dạng khác nhau)
 * @returns Tên icon chính xác từ thư viện Lucide hoặc icon mặc định nếu không tìm thấy
 */
export const getIconName = (iconName: string | null | undefined): LucideIconName => {
  if (!iconName) {
    return 'HelpCircle';
  }

  // Check cache first
  const cachedName = iconNameCache.get(iconName);
  if (cachedName) {
    return cachedName;
  }

  const mappedLegacyIcon = legacyToLucideMap[iconName];
  if (mappedLegacyIcon) {
    iconNameCache.set(iconName, mappedLegacyIcon);
    return mappedLegacyIcon;
  }

  // Check if it's an MDI icon
  if (iconName.startsWith('mdi:')) {
    const lucideIcon = mdiToLucideMap[iconName];
    if (lucideIcon) {
      iconNameCache.set(iconName, lucideIcon);
      return lucideIcon;
    }
    // If no mapping found, try to convert the MDI name to Lucide format
    iconName = iconName.split(':')[1];
  }

  // Loại bỏ tiền tố provider cũ và phần mở rộng file nếu có
  const cleanName = iconName
    .replace(/^i-[^-]+-/, '')
    .replace(/^[a-z]+:/, '')
    .replace(/\.[^/.]+$/, '');

  // Thử khớp trực tiếp trước
  if (LucideIcons[cleanName as LucideIconName]) {
    iconNameCache.set(iconName, cleanName as LucideIconName);
    return cleanName as LucideIconName;
  }

  // Thử chuyển đổi sang PascalCase
  const pascalCaseName = toPascalCase(cleanName);

  if (LucideIcons[pascalCaseName as LucideIconName]) {
    iconNameCache.set(iconName, pascalCaseName as LucideIconName);
    return pascalCaseName as LucideIconName;
  }

  // Fallback to default icon
  iconNameCache.set(iconName, 'HelpCircle');
  return 'HelpCircle';
}; 
