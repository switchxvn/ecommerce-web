<script setup lang="ts">
import { onMounted, computed, ref, nextTick, watch } from 'vue';
import { useFooter } from '~/composables/useFooter';
import { useDarkMode } from '~/composables/useDarkMode';
import type { Footer } from '~/interfaces/footer.interface';
import FooterStatistics from './FooterStatistics.vue';
import { resolveFooterContactIcon } from '~/utils/footerContactIcon';

// Kiểm tra môi trường phát triển
const isDev = ref(process.env.NODE_ENV === 'development');

// Sử dụng composable useFooter để lấy dữ liệu từ API
const {
  activeFooter,
  isLoading,
  error,
  fetchActiveFooter,
} = useFooter();

const { isDark } = useDarkMode();

// Tính toán style dựa trên theme từ API
const footerStyle = computed(() => {
  if (!activeFooter.value) return {};
  
  return {
    backgroundColor: isDark.value 
      ? activeFooter.value.backgroundDarkColor 
      : activeFooter.value.backgroundLightColor,
  };
});

// Thêm type definitions cho Facebook SDK
declare global {
  interface Window {
    fbAsyncInit: () => void;
    FB: {
      init: (params: { xfbml: boolean; version: string; appId?: string }) => void;
      XFBML: {
        parse: () => void;
      };
    };
  }
}

// Khởi tạo Facebook SDK
const initFacebookSDK = async () => {
  if (!document.getElementById('fb-root')) {
    const fbRoot = document.createElement('div');
    fbRoot.id = 'fb-root';
    document.body.appendChild(fbRoot);
  }

  if (window.FB) return;

  const existingScript = document.getElementById('facebook-jssdk') as HTMLScriptElement | null;
  if (existingScript) {
    if (window.FB) return;
    await new Promise<void>((resolve) => {
      existingScript.addEventListener('load', () => resolve(), { once: true });
      existingScript.addEventListener('error', () => resolve(), { once: true });
    });
    return;
  }

  await new Promise<void>((resolve) => {
    const script = document.createElement('script');
    script.id = 'facebook-jssdk';
    script.src = 'https://connect.facebook.net/vi_VN/sdk.js#xfbml=1&version=v22.0';
    script.async = true;
    script.defer = true;
    script.crossOrigin = 'anonymous';
    script.onload = () => resolve();
    script.onerror = () => resolve();
    document.head.appendChild(script);
  });
};

// Khởi tạo lại Facebook plugin
const reloadFacebookPlugin = () => {
  if (window.FB) {
    window.FB.XFBML.parse();
  }
};

onMounted(async () => {
  try {
    await fetchActiveFooter();
    if (activeFooter.value?.fanpageUrl) {
      await nextTick();
      await initFacebookSDK();
      setTimeout(() => reloadFacebookPlugin(), 100);
    }
  } catch (err) {
    console.error('Error in Footer component:', err);
  }
});

watch(
  () => activeFooter.value?.fanpageUrl,
  async (fanpageUrl) => {
    if (!fanpageUrl) return;
    await nextTick();
    await initFacebookSDK();
    setTimeout(() => reloadFacebookPlugin(), 100);
  }
);
</script>

<template>
  <!-- Footer từ API -->
  <div>
    <footer v-if="activeFooter" class="footer text-md" :style="footerStyle">
      <!-- Statistics Section -->
      <FooterStatistics />
      
      <div class="container mx-auto px-4 py-8">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          <!-- Logo and Company Info -->
          <div class="col-span-1">
            <img :src="activeFooter.logoUrl" :alt="activeFooter.logoAlt" class="h-26 mb-4" />
            <div class="company-info mb-4">
              <h3 class="font-bold mb-2 text-lg uppercase" style="color: #FF0000">{{ activeFooter.companyInfo.name }}</h3>
              <p>{{ activeFooter.companyInfo.registration }}</p>
              <p v-if="activeFooter.companyInfo.tax_number">MST: {{ activeFooter.companyInfo.tax_number }}</p>
              <p v-if="activeFooter.companyInfo.business_license">{{ activeFooter.companyInfo.business_license }}</p>
              <p v-if="activeFooter.companyInfo.footer_line">{{ activeFooter.companyInfo.footer_line }}</p>
              
              <!-- Certificates -->
              <div v-if="activeFooter.companyInfo.certifications" class="mt-4 flex items-center space-x-4">
                  <div v-for="cert in activeFooter.companyInfo.certifications" 
                      :key="cert.image" 
                      class="certification">
                    <img :src="cert.image" :alt="cert.alt || ''" class="h-12" />
                    <span v-if="cert.text" class="text-xs mt-1">{{ cert.text }}</span>
                  </div>
              </div>
              
              <!-- Quick Links -->
              <div v-if="activeFooter.settings && activeFooter.settings?.policy_link" class="mt-4">
                <h4 class="font-bold mb-2 text-lg uppercase" style="color: #FF0000">{{ activeFooter.settings.policy_link.title }}</h4>
                <ul class="quick-links-list">
                  <li v-for="link in activeFooter.settings.policy_link.links" :key="link.url" class="mb-2">
                    <a :href="link.url" class="quick-link flex items-center hover:underline">
                      <span>{{ link.label }}</span>
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <!-- Middle Column: Addresses, Map and Facebook -->
          <div class="col-span-1">
            <!-- Addresses -->
            <div v-for="(address, index) in activeFooter.addresses" :key="index" class="mb-4">
              <p v-if="address.title" class="font-semibold text-lg uppercase" style="color: #FF0000">{{ address.title }}</p>
              <p v-if="address.subtitle" class="text-base font-semibold" style="color: #FF0000">{{ address.subtitle }}</p>
              <p class="mt-1">{{ address.location }}</p>
              
              <!-- Contact Information Table -->
              <table class="w-full mt-2">
                <tbody>
                  <!-- Phone numbers -->
                  <template v-if="address.phone && address.phone.length > 0">
                    <tr v-for="(phone, phoneIndex) in address.phone" :key="'phone-'+phoneIndex" class="align-top">
                      <td class="py-1 pr-2 w-[120px]">
                        <span class="text-base font-semibold whitespace-nowrap" style="color: #FF0000">{{ phone.label }}:</span>
                      </td>
                      <td class="py-1">
                        <a :href="'tel:' + phone.number" class="hover:text-primary">{{ phone.number }}</a>
                        <span v-if="phone.contact" class="text-base font-semibold ml-1" style="color: #FF0000">({{ phone.contact }})</span>
                      </td>
                    </tr>
                  </template>
                  
                  <!-- Email addresses -->
                  <template v-if="address.email && address.email.length > 0">
                    <tr v-for="(email, emailIndex) in address.email" :key="'email-'+emailIndex" class="align-top">
                      <td class="py-1 pr-2 w-[120px]">
                        <span class="text-base font-semibold whitespace-nowrap" style="color: #FF0000">{{ email.label }}:</span>
                      </td>
                      <td class="py-1">
                        <a :href="'mailto:' + email.address" class="hover:text-primary">{{ email.address }}</a>
                        <span v-if="email.contact" class="text-base font-semibold ml-1" style="color: #FF0000">({{ email.contact }})</span>
                      </td>
                    </tr>
                  </template>
                </tbody>
              </table>
            </div>

            <!-- Map -->
            <div v-if="activeFooter.mapUrl" class="mt-6 h-[200px]">
              <iframe
                :src="activeFooter.mapUrl"
                width="100%"
                height="100%"
                style="border:0;"
                allowfullscreen
                loading="lazy"
                referrerpolicy="no-referrer-when-downgrade"
              >
              </iframe>
            </div>

            <!-- Facebook -->
            <div v-if="activeFooter.fanpageUrl" class="mt-6 w-full">
              <ClientOnly>
                <div
                  class="fb-page"
                  :data-href="activeFooter.fanpageUrl"
                  data-tabs="timeline"
                  data-width=""
                  data-height="300"
                  data-small-header="true"
                  data-adapt-container-width="true"
                  data-hide-cover="false"
                  data-show-facepile="true"
                >
                  <blockquote :cite="activeFooter.fanpageUrl" class="fb-xfbml-parse-ignore">
                    <a :href="activeFooter.fanpageUrl">{{ activeFooter.companyInfo.name }}</a>
                  </blockquote>
                </div>
              </ClientOnly>
            </div>
          </div>

          <!-- Branch Info -->
          <div class="col-span-1">
            <div v-if="activeFooter.branchInfo" class="space-y-6">
              <div v-for="(branch, index) in activeFooter.branchInfo" :key="index" class="branch-info">
                <h4 class="font-bold text-lg mb-2" style="color: #FF0000">{{ branch.title }}</h4>
                <p v-if="branch.address" class="text-md mb-2">{{ branch.address }}</p>
                
                <div v-for="(contact, contactIndex) in branch.contacts" :key="contactIndex" class="contact-info text-base space-y-1">
                  <div v-if="contact.name || contact.position" class="font-bold" style="color: #FF0000">
                    {{ contact.name }}
                    <span v-if="contact.position" class="text-base font-semibold" style="color: #FF0000">({{ contact.position }})</span>
                  </div>
                  <div v-if="contact.phone" class="flex items-center space-x-2">
                    <component :is="resolveFooterContactIcon('phone')" class="w-4 h-4" />
                    <a :href="'tel:' + contact.phone" class="hover:text-primary">{{ contact.phone }}</a>
                  </div>
                  <div v-if="contact.email" class="flex items-center space-x-2">
                    <component :is="resolveFooterContactIcon('email')" class="w-4 h-4" />
                    <a :href="'mailto:' + contact.email" class="hover:text-primary">{{ contact.email }}</a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>

    <!-- Copyright Section -->
    <div v-if="activeFooter" class="w-full" :style="{
      backgroundColor: isDark 
        ? activeFooter.copyrightStyle?.dark?.backgroundColor || '#1F2937'
        : activeFooter.copyrightStyle?.light?.backgroundColor || '#FFFFFF',
      color: isDark
        ? activeFooter.copyrightStyle?.dark?.textColor || '#F3F4F6'
        : activeFooter.copyrightStyle?.light?.textColor || '#374151'
    }">
      <div class="container mx-auto px-4 py-4 flex justify-between items-center">
        <p v-if="activeFooter.copyrightStyle?.text" class="text-md">
          {{ activeFooter.copyrightStyle.text }}
        </p>
        <div class="flex space-x-4">
          <a v-for="icon in activeFooter.socialIcons" 
             :key="icon.name" 
             :href="icon.url" 
             target="_blank"
             rel="noopener noreferrer"
             class="hover:opacity-80"
             :style="{
               color: isDark
                 ? activeFooter.copyrightStyle?.dark?.textColor || '#F3F4F6'
                 : activeFooter.copyrightStyle?.light?.textColor || '#374151'
             }">
            <Icon :name="icon.icon" class="w-6 h-6" />
          </a>
        </div>
      </div>
    </div>

    <!-- Loading Placeholder -->
    <div v-else-if="isLoading" class="footer-placeholder animate-pulse">
      <div class="container mx-auto px-4 py-8">
        <div class="h-40 bg-gray-200 rounded dark:bg-gray-700"></div>
      </div>
    </div>

    <!-- Error Message - Only visible in development mode -->
    <div v-if="error && isDev" class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative dark:bg-red-900 dark:border-red-700 dark:text-red-100" role="alert">
      <strong class="font-bold">Footer Error:</strong>
      <span class="block sm:inline"> {{ error }}</span>
    </div>
  </div>
</template>

<style scoped>
.footer {
  @apply border-t;
}

.footer__title {
  @apply text-xl font-bold mb-4;
}

.footer__link {
  @apply transition-colors duration-300;
}

.footer__link:hover {
  @apply underline;
}

.footer__item {
  @apply flex items-start;
}

.footer-placeholder {
  @apply w-full border-t;
}

/* Dark mode styles */
html.dark .footer,
.dark-footer {
  @apply bg-gray-900 text-gray-100 border-gray-700;
}

.dark-footer .footer__title {
  @apply text-gray-100;
}

.dark-footer .footer__link {
  @apply text-gray-300;
}

.dark-footer .footer__link:hover {
  @apply text-blue-400;
}

.dark-footer .footer__text {
  @apply text-gray-300;
}

.dark-footer .footer__copyright {
  @apply border-gray-700 text-gray-300;
}

.certification {
  @apply flex flex-col items-center;
}

.branch-info {
  @apply border-b border-gray-200 dark:border-gray-700 pb-4 last:border-b-0;
}

.contact-info {
  @apply mt-2 pl-4 border-l-2 border-gray-200 dark:border-gray-700;
}

.contact-info a {
  @apply hover:text-primary transition-colors duration-200;
}

.quick-links-list {
  @apply pl-2;
}

.quick-link {
  @apply text-sm hover:text-primary transition-colors duration-200;
}
</style>
