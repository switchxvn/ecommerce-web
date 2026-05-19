<script setup lang="ts">
// Auto-imported by Nuxt 3;
import { computed, ref, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useTrpc } from '../composables/useTrpc';
import { useTheme } from '../composables/useTheme';
import { PageType } from '@ew/shared';
import { AUTH_ROUTE_PATHS } from '../utils/routes';
// Import components
import CombinedNavbar from '../components/ui/CombinedNavbar.vue';
import Footer from '../components/ui/Footer.vue';
import TourismFooter from '../components/ui/TourismFooter.vue';
import BackToTop from '~/components/ui/BackToTop.vue';
import FloatingPhoneSupport from '~/components/ui/FloatingPhoneSupport.vue';
import FloatingZaloSupport from '~/components/ui/FloatingZaloSupport.vue';
import FloatingMessengerSupport from '~/components/ui/FloatingMessengerSupport.vue';
import SimpleNavbar from '~/components/ui/SimpleNavbar.vue';

const router = useRouter();
const trpc = useTrpc();
const { getActiveTheme } = useTheme();

const user = ref<any>(null);
const theme = ref<any>({ sections: [] }); // Initialize with empty sections
const footer = ref<any>(null);
const activeSections = computed(() => {
  const sections = Array.isArray(theme.value?.sections) ? theme.value.sections : [];
  return sections.filter((section: any) => section && section.isActive);
});

const toRgb = (hex?: string) => {
  if (!hex) return null;
  const normalizedHex = hex.trim();
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(normalizedHex);
  if (!result) return null;

  return `${parseInt(result[1], 16)} ${parseInt(result[2], 16)} ${parseInt(result[3], 16)}`;
};

const buildThemeCssText = (themeColors?: any) => {
  const lightColors = themeColors?.light;
  const darkColors = themeColors?.dark;

  if (!lightColors || !darkColors) {
    return '';
  }

  const buildModeVariables = (colors: any) => {
    const declarations: string[] = [];

    const assignGroup = (prefix: string, group?: Record<string, string>, includeDirectAlias = false) => {
      if (!group) return;

      Object.entries(group).forEach(([shade, color]) => {
        const rgb = toRgb(color);
        if (!rgb) return;
        declarations.push(`--color-${prefix}-${shade}:${rgb};`);
        declarations.push(`--${prefix}-${shade}:${rgb};`);
      });

      if (includeDirectAlias && group['500']) {
        const baseRgb = toRgb(group['500']);
        if (baseRgb) {
          declarations.push(`--${prefix}:${baseRgb};`);
        }
      }
    };

    assignGroup('primary', colors.primary, true);
    assignGroup('secondary', colors.secondary);
    assignGroup('tertiary', colors.tertiary);
    assignGroup('yellow', colors.yellow, true);

    const primary500 = toRgb(colors.primary?.['500']);
    const secondary50 = toRgb(colors.secondary?.['50']);
    const secondary100 = toRgb(colors.secondary?.['100']);
    const secondary200 = toRgb(colors.secondary?.['200']);
    const secondary400 = toRgb(colors.secondary?.['400']);
    const secondary500 = toRgb(colors.secondary?.['500']);
    const secondary800 = toRgb(colors.secondary?.['800']);
    const secondary900 = toRgb(colors.secondary?.['900']);

    if (primary500) declarations.push(`--primary:${primary500};`);
    if (primary500) declarations.push(`--ring:${primary500};`);

    if (colors === lightColors) {
      declarations.push('--background:255 255 255;');
      declarations.push(`--foreground:${secondary900 || '17 24 39'};`);
      declarations.push('--card:255 255 255;');
      declarations.push(`--card-foreground:${secondary900 || '17 24 39'};`);
      declarations.push('--popover:255 255 255;');
      declarations.push(`--popover-foreground:${secondary900 || '17 24 39'};`);
      declarations.push(`--primary-foreground:255 255 255;`);
      declarations.push(`--secondary:${secondary100 || '243 244 246'};`);
      declarations.push(`--secondary-foreground:${secondary900 || '17 24 39'};`);
      declarations.push(`--muted:${secondary100 || '243 244 246'};`);
      declarations.push(`--muted-foreground:${secondary500 || '107 114 128'};`);
      declarations.push(`--accent:${secondary100 || '243 244 246'};`);
      declarations.push(`--accent-foreground:${secondary900 || '17 24 39'};`);
      declarations.push(`--border:${secondary200 || '229 231 235'};`);
      declarations.push(`--input:${secondary200 || '229 231 235'};`);
      declarations.push(`--footer-bg:${colors.secondary?.['50'] || '#f8fafc'};`);
      declarations.push(`--footer-text:${colors.secondary?.['900'] || '#111827'};`);
      declarations.push(`--footer-border:${colors.secondary?.['200'] || '#e5e7eb'};`);
      declarations.push(`--footer-link:${colors.secondary?.['500'] || '#64748b'};`);
      declarations.push(`--footer-link-hover:${colors.primary?.['500'] || '#1d4ed8'};`);
    } else {
      declarations.push(`--background:${secondary900 || '17 24 39'};`);
      declarations.push(`--foreground:${secondary50 || '249 250 251'};`);
      declarations.push(`--card:${secondary800 || '31 41 55'};`);
      declarations.push(`--card-foreground:${secondary50 || '249 250 251'};`);
      declarations.push(`--popover:${secondary800 || '31 41 55'};`);
      declarations.push(`--popover-foreground:${secondary50 || '249 250 251'};`);
      declarations.push(`--primary-foreground:${secondary900 || '17 24 39'};`);
      declarations.push(`--secondary:${secondary800 || '31 41 55'};`);
      declarations.push(`--secondary-foreground:${secondary50 || '249 250 251'};`);
      declarations.push(`--muted:${secondary800 || '31 41 55'};`);
      declarations.push(`--muted-foreground:${secondary400 || '156 163 175'};`);
      declarations.push(`--accent:${secondary800 || '31 41 55'};`);
      declarations.push(`--accent-foreground:${secondary50 || '249 250 251'};`);
      declarations.push(`--border:${secondary800 || '55 65 81'};`);
      declarations.push(`--input:${secondary800 || '55 65 81'};`);
      declarations.push(`--footer-bg:${colors.secondary?.['900'] || '#111827'};`);
      declarations.push(`--footer-text:${colors.secondary?.['50'] || '#f9fafb'};`);
      declarations.push(`--footer-border:${colors.secondary?.['800'] || '#374151'};`);
      declarations.push(`--footer-link:${colors.secondary?.['400'] || '#9ca3af'};`);
      declarations.push(`--footer-link-hover:${colors.primary?.['500'] || '#60a5fa'};`);
    }

    return declarations.join('');
  };

  return `:root{${buildModeVariables(lightColors)}}html.dark{${buildModeVariables(darkColors)}}`;
};

const themeCssText = computed(() => buildThemeCssText(theme.value?.colors));

// GTM Configuration
const gtmConfig = useState('gtm-id', () => null);
const shouldLoadTracking = ref(false);

// Reactive head configuration with GTM
useHead(() => {
  const scripts = [];
  const noscripts = [];
  const styles = [];
  
  // Add GTM script if ID is available
  if (gtmConfig.value && shouldLoadTracking.value) {
    scripts.push({
      innerHTML: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${gtmConfig.value}');`
    });
    
    noscripts.push({
      innerHTML: `<iframe src="https://www.googletagmanager.com/ns.html?id=${gtmConfig.value}" height="0" width="0" style="display:none;visibility:hidden"></iframe>`
    });
  }

  if (themeCssText.value) {
    styles.push({
      key: 'active-theme-vars',
      innerHTML: themeCssText.value,
    });
  }
  
  return {
    script: scripts,
    noscript: noscripts,
    style: styles,
  };
});

// Register available components
const components = {
  CombinedNavbar,
  SimpleNavbar,
  Footer,
  TourismFooter,
} as const;

// Function to resolve footer component
const resolveFooterComponent = (componentName?: string) => {
  if (!componentName) return Footer;
  return components[componentName as keyof typeof components] || Footer;
};

// Function to get component name based on section type and componentName
const resolveComponent = (section: any) => {
  if (section.componentName && components[section.componentName as keyof typeof components]) {
    const component = components[section.componentName as keyof typeof components];
    return component;
  }
  
  const component = getDefaultComponent(section.type);
  return component;
};

// Function to get default component based on section type
const getDefaultComponent = (type: string) => {
  const typeToComponent: Record<string, any> = {
    'navbar': components.CombinedNavbar,
    'simple_navbar': components.SimpleNavbar,
    'combined_navbar': components.CombinedNavbar
  };
  
  return typeToComponent[type] || components.CombinedNavbar;
};

try {
  const [activeTheme, activeFooter] = await Promise.all([
    getActiveTheme({ pageType: PageType.COMMON }),
    trpc.footer.getActiveFooter.query(),
  ]);

  if (activeTheme) {
    theme.value = activeTheme;
  }

  if (activeFooter) {
    footer.value = activeFooter;
  }
} catch {
  // Keep fallback layout data
}

onMounted(async () => {
  if (process.client) {
    const deferLoad = () => {
      shouldLoadTracking.value = true;
    };

    const loadOnInteraction = () => {
      deferLoad();
      window.removeEventListener('pointerdown', loadOnInteraction);
      window.removeEventListener('keydown', loadOnInteraction);
      window.removeEventListener('touchstart', loadOnInteraction);
      window.removeEventListener('scroll', loadOnInteraction);
    };

    window.addEventListener('pointerdown', loadOnInteraction, { passive: true, once: true });
    window.addEventListener('keydown', loadOnInteraction, { passive: true, once: true });
    window.addEventListener('touchstart', loadOnInteraction, { passive: true, once: true });
    window.addEventListener('scroll', loadOnInteraction, { passive: true, once: true });

    if ('requestIdleCallback' in window) {
      (window as any).requestIdleCallback(deferLoad, { timeout: 4000 });
    } else {
      window.setTimeout(deferLoad, 2500);
    }
  }

  try {
    // Kiểm tra xem người dùng đã đăng nhập chưa
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    
    if (storedUser && token) {
      try {
        user.value = JSON.parse(storedUser);
        const currentUser = await trpc.auth.me.query();
        user.value = currentUser;
      } catch (error) {
        handleLogout();
      }
    }
    
  } catch {}
});

async function handleLogout() {
  try {
    // Gọi tRPC endpoint để đăng xuất
    await trpc.auth.logout.mutate();
    
    // Xóa thông tin người dùng và token khỏi localStorage
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    
    // Reset user state
    user.value = null;
    
    // Chuyển hướng đến trang đăng nhập
    router.push(AUTH_ROUTE_PATHS.login);
  } catch (error) {
    // No-op on logout error
  }
}
</script>

<template>
  <div class="min-h-screen flex flex-col">
    <!-- Header -->
    <template v-if="activeSections.length">
      <component 
        v-for="section in activeSections" 
        :key="section.id"
        :is="resolveComponent(section)"
        :settings="section.settings"
        :user="user"
        @logout="handleLogout"
      />
    </template>

    <!-- Main content -->
    <main class="flex-grow">
      <slot />
    </main>

    <!-- Footer -->
    <component
      v-if="footer"
      :is="resolveFooterComponent(footer.componentName)"
      v-bind="footer"
    />
    <ClientOnly>
      <BackToTop />
      <FloatingPhoneSupport />
      <FloatingZaloSupport />
      <FloatingMessengerSupport />
    </ClientOnly>
  </div>
</template>

<style scoped>
.header-wrapper {
  position: relative;
  display: flex;
  flex-direction: column;
  width: 100%;
}

.navbar-section {
  width: 100%;
  background-color: white;
}

.navbar-with-logo-hotline {
  position: relative;
  z-index: 10;
}

.navbar-without-logo {
  position: sticky;
  top: 0;
  z-index: 20;
  background-color: white;
}

:deep(.dark) .navbar-section {
  background-color: #111827;
}

/* Remove any spacer divs */
:deep(.navbar-section > div[style*="height"]) {
  display: none !important;
}

/* Add shadow when navbar is stuck */
.navbar-without-logo {
  box-shadow: 0 2px 15px -3px rgba(0,0,0,0.07), 0 10px 20px -2px rgba(0,0,0,0.04);
}
</style> 
