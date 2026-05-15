<script setup lang="ts">
// Auto-imported by Nuxt 3;
import { ref, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useTrpc } from '../composables/useTrpc';
import { useTheme } from '../composables/useTheme';
import { PageType } from '@ew/shared';
// Import components
import CombinedNavbar from '../components/ui/CombinedNavbar.vue';
import Footer from '../components/ui/Footer.vue';
import TourismFooter from '../components/ui/TourismFooter.vue';
import BackToTop from '~/components/ui/BackToTop.vue';
import FloatingPhoneSupport from '~/components/ui/FloatingPhoneSupport.vue';
import FloatingZaloSupport from '~/components/ui/FloatingZaloSupport.vue';
import FloatingMessengerSupport from '~/components/ui/FloatingMessengerSupport.vue';
import SimpleNavbar from '~/components/ui/SimpleNavbar.vue';
import MaintenancePage from '~/components/MaintenancePage.vue';

const router = useRouter();
const trpc = useTrpc();
const { getActiveTheme } = useTheme();

const user = ref<any>(null);
const isLoading = ref(false);
const isDarkMode = ref(false);
const theme = ref<any>({ sections: [] }); // Initialize with empty sections
const footer = ref<any>(null);
const isMaintenanceMode = ref(false);

// GTM Configuration
const gtmConfig = useState('gtm-id', () => null);
const shouldLoadTracking = ref(false);

// Reactive head configuration with GTM
useHead(() => {
  const scripts = [];
  const noscripts = [];
  
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
  
  return {
    script: scripts,
    noscript: noscripts
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

// Kiểm tra dark mode với defensive programming
const checkDarkMode = () => {
  if (process.client) {
    isDarkMode.value = document?.documentElement?.classList?.contains('dark') ?? false;
    
    // Thêm class vào body để đảm bảo dark mode được áp dụng đúng cách
    if (isDarkMode.value) {
      document?.body?.classList?.add('dark-mode');
    } else {
      document?.body?.classList?.remove('dark-mode');
    }
  }
};

onMounted(async () => {
  if (process.client) {
    const deferLoad = () => {
      shouldLoadTracking.value = true;
    };

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
        console.error('Failed to validate token:', error);
        handleLogout();
      }
    }
    
    // Lấy theme và navbar section với error handling
    try {
      const activeTheme = await getActiveTheme({ pageType: PageType.COMMON });
      if (activeTheme) {
        theme.value = activeTheme;
      }
    } catch (error) {
      console.error('Failed to load theme:', error);
    }
    
    // Fetch footer data
    try {
      const activeFooter = await trpc.footer.getActiveFooter.query();
      if (activeFooter) {
        footer.value = activeFooter;
      }
    } catch (error) {
      console.error('Failed to load footer:', error);
    }
    
    // Kiểm tra dark mode
    checkDarkMode();
    
  } catch (error) {
    console.error('Error in layout setup:', error);
  } finally {
    isLoading.value = false;
  }
});

// Theo dõi thay đổi của isDarkMode
watch(isDarkMode, () => {
  // Cập nhật style khi dark mode thay đổi
  if (typeof document !== 'undefined') {
    if (isDarkMode.value) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
  }
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
    router.push('/login');
  } catch (error) {
    console.error('Logout failed:', error);
  }
}
</script>

<template>
  <div class="min-h-screen flex flex-col">
    <template v-if="isLoading">
      <div class="flex justify-center items-center min-h-screen">
        <Loader size="lg" />
      </div>
    </template>
    <template v-else>
      <!-- Header -->
      <template v-if="theme?.sections">
        <component 
          v-for="section in theme.sections" 
          :key="section.id"
          v-show="section.isActive"
          :is="resolveComponent(section)"
          :settings="section.settings"
          :user="user"
          :isLoading="isLoading"
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
      <BackToTop />
      <FloatingPhoneSupport />
      <FloatingZaloSupport />
      <FloatingMessengerSupport />
    </template>
  </div>
</template>

<style>
/* Đảm bảo dark mode được áp dụng đúng cách */
body.dark-mode {
  background-color: #111827 !important;
  color: #f9fafb !important;
}

body.dark-mode .footer {
  background-color: #111827 !important;
  color: #f9fafb !important;
  border-color: #374151 !important;
}

body.dark-mode .footer__title {
  color: #f9fafb !important;
}

body.dark-mode .footer__link {
  color: #9ca3af !important;
}

body.dark-mode .footer__link:hover {
  color: #60a5fa !important;
}

body.dark-mode .footer__text {
  color: #9ca3af !important;
}

body.dark-mode .footer__copyright {
  border-color: #374151 !important;
  color: #9ca3af !important;
}
</style>

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
