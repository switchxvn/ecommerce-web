import { ref, watch, computed } from 'vue';
import { useTrpc } from './useTrpc';
import { useDarkMode } from './useDarkMode';
import { PageType, ThemeSectionTranslation } from '@ew/shared';
import type { inferRouterOutputs } from '@trpc/server';
import type { AppRouter } from '../types/trpc';

type RouterOutput = inferRouterOutputs<AppRouter>;
type ThemeOutput = RouterOutput['theme']['getActiveTheme'];

type ColorShades = {
  '50': string;
  '100': string;
  '200': string;
  '300': string;
  '400': string;
  '500': string;
  '600': string;
  '700': string;
  '800': string;
  '900': string;
};

type ColorMode = {
  primary: ColorShades;
  secondary: ColorShades;
  tertiary: ColorShades;
  yellow?: ColorShades;
};

interface ThemeColors {
  light: ColorMode;
  dark: ColorMode;
}

interface ThemeSection {
  id: number;
  type: string;
  title: string;
  order: number;
  pageType: PageType;
  componentName?: string;
  settings: Record<string, any>;
  isActive: boolean;
  translations?: ThemeSectionTranslation[];
}

interface Theme {
  id: number;
  name: string;
  isActive: boolean;
  sections?: ThemeSection[];
  colors?: ThemeColors;
  createdAt: string;
  updatedAt: string;
}

// Default theme colors as fallback
const defaultColors: ThemeColors = {
  light: {
    primary: {
      '50': '#fff7e6',
      '100': '#ffe9b3',
      '200': '#ffdb80',
      '300': '#ffcd4d',
      '400': '#fec02a',
      '500': '#feb914', // Main color
      '600': '#e6a912',
      '700': '#cc960f',
      '800': '#b3840d',
      '900': '#99710b'
    },
    secondary: {
      '50': '#f8fafc',
      '100': '#f1f5f9',
      '200': '#e2e8f0',
      '300': '#cbd5e1',
      '400': '#94a3b8',
      '500': '#64748b',
      '600': '#475569',
      '700': '#334155',
      '800': '#1e293b',
      '900': '#0f172a'
    },
    tertiary: {
      '50': '#f8fafc',
      '100': '#f1f5f9',
      '200': '#e2e8f0',
      '300': '#cbd5e1',
      '400': '#94a3b8',
      '500': '#64748b',
      '600': '#475569',
      '700': '#334155',
      '800': '#1e293b',
      '900': '#0f172a'
    },
    yellow: {
      '50': '#fffde7',
      '100': '#fff9c4',
      '200': '#fff59d',
      '300': '#fff176',
      '400': '#ffee58',
      '500': '#ffeb3b',
      '600': '#fdd835',
      '700': '#fbc02d',
      '800': '#f9a825',
      '900': '#f57f17'
    }
  },
  dark: {
    primary: {
      '50': '#fff7e6',
      '100': '#ffe9b3',
      '200': '#ffdb80',
      '300': '#ffcd4d',
      '400': '#fec02a',
      '500': '#cc960f', // Darker version for dark mode
      '600': '#b3840d',
      '700': '#997109',
      '800': '#805f08',
      '900': '#664c06'
    },
    secondary: {
      '50': '#f8fafc',
      '100': '#f1f5f9',
      '200': '#e2e8f0',
      '300': '#cbd5e1',
      '400': '#94a3b8',
      '500': '#64748b',
      '600': '#475569',
      '700': '#334155',
      '800': '#1e293b',
      '900': '#0f172a'
    },
    tertiary: {
      '50': '#f8fafc',
      '100': '#f1f5f9',
      '200': '#e2e8f0',
      '300': '#cbd5e1',
      '400': '#94a3b8',
      '500': '#64748b',
      '600': '#475569',
      '700': '#334155',
      '800': '#1e293b',
      '900': '#0f172a'
    },
    yellow: {
      '50': '#fffde7',
      '100': '#fff9c4',
      '200': '#fff59d',
      '300': '#fff176',
      '400': '#ffee58',
      '500': '#ffeb3b',
      '600': '#fdd835',
      '700': '#fbc02d',
      '800': '#f9a825',
      '900': '#f57f17'
    }
  }
};

const activeTheme = ref<Theme | null>(null);
let initialized = false;

export function useTheme() {
  const trpc = useTrpc();
  const { isDark, setMode, initializeDarkMode } = useDarkMode();
  
  const getActiveTheme = async (options?: { pageType?: PageType }): Promise<Theme | null> => {
    try {
      const theme = await trpc.theme.getActiveTheme.query(options);
      return theme as Theme;
    } catch (error) {
      console.error('Failed to fetch active theme:', error);
      return null;
    }
  };

  // Lấy tất cả section của một theme theo locale
  const getThemeSections = async (themeId: number, locale?: string): Promise<ThemeSection[]> => {
    try {
      const sections = await trpc.theme.getSections.query({
        themeId,
        locale
      });
      return sections as ThemeSection[];
    } catch (error) {
      console.error(`Failed to fetch theme sections for theme ${themeId}:`, error);
      return [];
    }
  };

  // Lấy tất cả section của một page type theo locale
  const getPageSections = async (themeId: number, pageType: PageType, locale?: string): Promise<ThemeSection[]> => {
    try {
      const sections = await trpc.theme.getPageSections.query({
        themeId,
        pageType,
        locale
      });
      return sections as ThemeSection[];
    } catch (error) {
      console.error(`Failed to fetch page sections for theme ${themeId}:`, error);
      return [];
    }
  };

  // Lấy một section cụ thể theo locale
  const getSection = async (themeId: number, sectionId: number, locale?: string): Promise<ThemeSection | null> => {
    try {
      const section = await trpc.theme.getSection.query({
        themeId,
        sectionId,
        locale
      });
      return section as ThemeSection;
    } catch (error) {
      console.error(`Failed to fetch section ${sectionId}:`, error);
      return null;
    }
  };

  const updateCssVariables = (themeColors: ThemeColors) => {
    // Skip updating CSS variables during SSR
    if (process.server) return;

    const mode = isDark.value ? 'dark' : 'light';
    const currentColors = themeColors[mode];

    try {
      // Helper function to convert hex to RGB
      const hexToRgb = (hex: string) => {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? 
          `${parseInt(result[1], 16)} ${parseInt(result[2], 16)} ${parseInt(result[3], 16)}` : 
          null;
      };

      // Update primary colors
      Object.entries(currentColors.primary).forEach(([shade, color]) => {
        const rgb = hexToRgb(color);
        if (rgb) {
          document.documentElement.style.setProperty(`--color-primary-${shade}`, rgb);
          // Thêm biến CSS trực tiếp cho Tailwind
          document.documentElement.style.setProperty(`--primary-${shade}`, rgb);
        }
      });

      // Update secondary colors
      Object.entries(currentColors.secondary).forEach(([shade, color]) => {
        const rgb = hexToRgb(color);
        if (rgb) document.documentElement.style.setProperty(`--color-secondary-${shade}`, rgb);
      });

      // Update tertiary colors
      Object.entries(currentColors.tertiary).forEach(([shade, color]) => {
        const rgb = hexToRgb(color);
        if (rgb) document.documentElement.style.setProperty(`--color-tertiary-${shade}`, rgb);
      });

      // Update yellow colors if available
      if (currentColors.yellow) {
        Object.entries(currentColors.yellow).forEach(([shade, color]) => {
          const rgb = hexToRgb(color);
          if (rgb) {
            document.documentElement.style.setProperty(`--color-yellow-${shade}`, rgb);
            // Thêm biến CSS trực tiếp cho Tailwind
            document.documentElement.style.setProperty(`--yellow-${shade}`, rgb);
          }
        });
        // Cập nhật biến yellow mặc định
        document.documentElement.style.setProperty('--yellow', currentColors.yellow['500']);
      }

      // Update semantic colors based on theme colors
      const updateSemanticColor = (name: string, color: string) => {
        const rgb = hexToRgb(color);
        if (rgb) document.documentElement.style.setProperty(`--${name}`, rgb);
      };

      // Background and foreground
      updateSemanticColor('background', isDark.value ? currentColors.secondary['900'] : '#ffffff');
      updateSemanticColor('foreground', isDark.value ? currentColors.secondary['50'] : currentColors.secondary['900']);
      
      // Card
      updateSemanticColor('card', isDark.value ? currentColors.secondary['800'] : '#ffffff');
      updateSemanticColor('card-foreground', isDark.value ? currentColors.secondary['50'] : currentColors.secondary['900']);
      
      // Popover
      updateSemanticColor('popover', isDark.value ? currentColors.secondary['800'] : '#ffffff');
      updateSemanticColor('popover-foreground', isDark.value ? currentColors.secondary['50'] : currentColors.secondary['900']);
      
      // Primary
      updateSemanticColor('primary', currentColors.primary['500']);
      updateSemanticColor('primary-foreground', isDark.value ? currentColors.secondary['900'] : '#ffffff');
      
      
      // Secondary
      updateSemanticColor('secondary', currentColors.secondary['200']);
      updateSemanticColor('secondary-foreground', currentColors.secondary['900']);
      // Muted
      updateSemanticColor('muted', isDark.value ? currentColors.secondary['800'] : currentColors.secondary['100']);
      updateSemanticColor('muted-foreground', isDark.value ? currentColors.secondary['400'] : currentColors.secondary['500']);
      
      // Accent
      updateSemanticColor('accent', isDark.value ? currentColors.secondary['800'] : currentColors.secondary['100']);
      updateSemanticColor('accent-foreground', currentColors.primary['900']);
      
      // Border and Input
      updateSemanticColor('border', isDark.value ? currentColors.secondary['800'] : currentColors.secondary['200']);
      updateSemanticColor('input', isDark.value ? currentColors.secondary['800'] : currentColors.secondary['200']);
      updateSemanticColor('ring', currentColors.primary['500']);

      // Set CSS color variables for direct HEX values
      updateSemanticColor('primary-hex', currentColors.primary['500']);
      updateSemanticColor('primary-hex-dark', currentColors.primary['600']);
      updateSemanticColor('primary-hex-light', currentColors.primary['400']);

    } catch (error) {
      console.error('Error updating CSS variables:', error);
    }
  };

  const initializeTheme = async () => {
    if (initialized || process.server) return;

    try {
      // Resolve dark mode from the shared source of truth before applying theme colors.
      initializeDarkMode();
      
      // Then load the theme
      const theme = await getActiveTheme();
      activeTheme.value = theme;
      
      if (theme && theme.colors) {
        updateCssVariables(theme.colors);
      }
      
      initialized = true;
    } catch (error) {
      console.error('Failed to initialize theme:', error);
    }
  };

  // Watch for changes to dark mode and update CSS
  watch(isDark, () => {
    if (activeTheme.value && activeTheme.value.colors) {
      updateCssVariables(activeTheme.value.colors);
    }
  });

  // Initialize the theme on client side
  if (process.client) {
    initializeTheme();
  }

  return {
    activeTheme,
    getActiveTheme,
    getThemeSections,
    getPageSections,
    getSection,
    updateCssVariables,
    isDark,
    setMode,
    initializeTheme
  };
} 
