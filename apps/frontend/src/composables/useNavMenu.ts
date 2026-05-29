import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { useLocalization } from '~/composables/useLocalization';
import { useMenuItems } from '~/composables/useMenuItems';

interface MenuItemTranslation {
  id?: number;
  label: string;
  href: string;
  locale: string;
  menuItemId?: number;
}

interface MenuItem {
  id: number;
  defaultLocale: string;
  icon?: string | null;
  order: number;
  level: number;
  isActive: boolean;
  parentId: number | null;
  translations: MenuItemTranslation[];
  children?: MenuItem[];
  createdAt: string;
  updatedAt: string;
}

export const useNavMenu = () => {
  const route = useRoute();
  const { locale } = useLocalization();
  const { menuItems, isLoading, error, fetchMenuItems } = useMenuItems();

  const getTranslation = (item: MenuItem, targetLocale: string) => {
    if (!item.translations || item.translations.length === 0) {
      return item.label;
    }

    const translation = item.translations.find((t) => t.locale === targetLocale);
    if (translation) {
      return translation.label;
    }

    const defaultTranslation = item.translations.find(
      (t) => t.locale === item.defaultLocale
    );
    if (defaultTranslation) {
      return defaultTranslation.label;
    }

    return item.label;
  };

  const processedMenuItems = computed(() => {
    if (!menuItems.value || menuItems.value.length === 0) {
      return [];
    }

    const parentItems = (menuItems.value as MenuItem[])
      .filter(item => item.level === 0 && item.isActive !== false)
      .sort((a, b) => (a.order || 0) - (b.order || 0));

    return parentItems.map(item => ({
      ...item,
      href: item.translations?.find(t => t.locale === locale.value)?.href || 
            item.translations?.[0]?.href || "#",
      label: getTranslation(item, locale.value)
    }));
  });

  const isMenuActive = (href: string) => {
    if (href === "/") {
      return route.path === "/";
    }
    return href !== "/" && route.path.startsWith(href);
  };

  const getColumnTitleTranslation = (column: any, targetLocale: string) => {
    if (!column.titleTranslations || column.titleTranslations.length === 0) {
      return column.title;
    }

    const translation = column.titleTranslations.find((t: any) => t.locale === targetLocale);
    return translation?.label || column.title;
  };

  const getParentMenuLeftOffset = (menuId: string) => {
    const menuElement = document.querySelector(`[data-menu-id="${menuId}"]`);
    const container = document.querySelector('.navigation-section .container');
    
    if (!menuElement || !container) return 0;
    
    const menuRect = menuElement.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();
    
    const menuCenterX = menuRect.left + (menuRect.width / 2);
    return menuCenterX - containerRect.left;
  };

  return {
    menuItems,
    isLoading,
    error,
    fetchMenuItems,
    processedMenuItems,
    isMenuActive,
    getColumnTitleTranslation,
    getParentMenuLeftOffset
  };
};
