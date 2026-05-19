<script setup lang="ts">
import { onMounted, computed, ref, nextTick, watch } from 'vue';
import { useFooter } from '~/composables/useFooter';
import { useDarkMode } from '~/composables/useDarkMode';
import { MapPin, Phone, Mail } from 'lucide-vue-next';
import type { Footer } from '~/interfaces/footer.interface';
import PhotoSwipe from 'photoswipe';
import 'photoswipe/style.css';
import FooterStatistics from './FooterStatistics.vue';

const isDev = ref(process.env.NODE_ENV === 'development');
const isImageModalOpen = ref(false);
const selectedImage = ref<{ url: string; alt: string } | null>(null);

const {
  activeFooter,
  isLoading,
  error,
  fetchActiveFooter,
} = useFooter();

const { isDark } = useDarkMode();

// Tính toán style dựa trên theme từ API
const footerStyle = computed(() => {
  // Bỏ qua giá trị từ API và áp dụng cứng màu đỏ
  return {
    backgroundColor: '#f02d2d',
    background: 'linear-gradient(180deg, #e53e3e 0%, #dc2626 100%)'
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

// Hàm mở PhotoSwipe
const openPhotoSwipe = (imageUrl: string, imageAlt: string) => {
  // Tạo một image object để lấy kích thước thật của ảnh
  const img = new Image();
  img.onload = () => {
    const pswp = new PhotoSwipe({
      dataSource: [{
        src: imageUrl,
        alt: imageAlt,
        width: img.naturalWidth,
        height: img.naturalHeight
      }],
      pswpModule: PhotoSwipe
    });
    pswp.init();
  };
  img.src = imageUrl;
};

// Thêm hàm xử lý hover cho thẻ di động
const addHoverBackground = (event: MouseEvent) => {
  const target = event.currentTarget as HTMLElement;
  target.style.backgroundColor = '#b91c1c';
};

const removeHoverBackground = (event: MouseEvent) => {
  const target = event.currentTarget as HTMLElement;
  target.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
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
  <div>
    <footer v-if="activeFooter" class="tourism-footer relative" style="background: linear-gradient(180deg, #e53e3e 0%, #dc2626 100%) !important;">
      <!-- Statistics Section -->
      <FooterStatistics />
      
      <!-- Main Content -->
      <div class="main-content flex-1">
        <div class="container mx-auto px-4 py-16 relative">
          <div class="grid grid-cols-1 md:grid-cols-12 gap-8">
            <!-- Company Info Section -->
            <div class="col-span-1 md:col-span-4 backdrop-blur-sm rounded-xl p-6" style="background-color: rgba(255, 255, 255, 0.05);">
              <div class="company-brand mb-6">
                <img :src="activeFooter.logoUrl" :alt="activeFooter.logoAlt" class="h-20 mb-4 object-contain" />
                <h3 class="text-3xl font-extrabold mb-3 bg-gradient-to-r from-white to-white/90 bg-clip-text">
                  {{ activeFooter.companyInfo.name }}
                </h3>
                <div class="company-details space-y-2 text-sm text-white/80">
                  <p>{{ activeFooter.companyInfo.registration }}</p>
                  <p v-if="activeFooter.companyInfo.tax_number">{{ activeFooter.companyInfo.tax_number }}</p>
                  <p v-if="activeFooter.companyInfo.business_license">{{ activeFooter.companyInfo.business_license }}</p>
                </div>
              </div>

              <!-- Vertical Company Image -->
              <div v-if="activeFooter.settings?.verticalImage" class="vertical-image-container mt-6">
                <img 
                  :src="activeFooter.settings.verticalImage.url" 
                  :alt="activeFooter.settings.verticalImage.alt"
                  class="w-full h-auto rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105 cursor-pointer"
                  @click="() => {
                    if (activeFooter?.settings?.verticalImage) {
                      openPhotoSwipe(
                        activeFooter.settings.verticalImage.url,
                        activeFooter.settings.verticalImage.alt
                      );
                    }
                  }"
                />
              </div>

              <!-- Certifications with enhanced styling -->
              <div v-if="activeFooter.companyInfo.certifications?.length" 
                   class="certifications flex items-center space-x-4 mt-6">
                <div v-for="cert in activeFooter.companyInfo.certifications" 
                     :key="cert.image" 
                     class="certification-item hover:scale-105 transition-all duration-300">
                  <img :src="cert.image" :alt="cert.alt || ''" class="h-12 filter brightness-110" />
                  <span v-if="cert.text" class="text-xs mt-1 text-white/70">{{ cert.text }}</span>
                </div>
              </div>
            </div>

            <!-- Quick Links & Contact Section -->
            <div class="col-span-1 md:col-span-4 backdrop-blur-sm rounded-xl p-6" style="background-color: rgba(255, 255, 255, 0.05);">
              <!-- Quick Links -->
              <div class="quick-links mb-8">
                <h4 class="section-title">Liên Kết Nhanh</h4>
                <ul class="space-y-4 mt-6">
                  <li v-for="link in activeFooter?.quickLinks" :key="link.url">
                    <NuxtLink :to="link.url" 
                             class="quick-link group flex items-center space-x-3 p-3 rounded-lg transition-all duration-300"
                             style="background-color: rgba(255, 255, 255, 0.1);"
                             @mouseover="addHoverBackground"
                             @mouseout="removeHoverBackground">
                      <Icon
                        :name="link.icon || 'Link'"
                        class="w-6 h-6 text-white group-hover:text-white transition-colors duration-300"
                      />
                      <span class="text-lg font-bold text-white group-hover:text-white transition-colors duration-300">{{ link.label }}</span>
                    </NuxtLink>
                  </li>
                </ul>
              </div>

              <!-- Contact Info -->
              <div v-for="(address, index) in activeFooter?.addresses" :key="index" class="contact-info">
                <h4 class="section-title">{{ address.title }}</h4>
                <div class="space-y-4 mt-6">
                  <p class="flex items-start space-x-3 group p-3">
                    <MapPin class="w-6 h-6 mt-1 flex-shrink-0 text-white" />
                    <span class="text-lg font-bold text-white">{{ address.location }}</span>
                  </p>
                  
                  <div v-for="(phone, phoneIndex) in address.phone" :key="'phone-'+phoneIndex">
                    <a :href="'tel:' + phone.number" 
                       class="contact-link group flex items-center space-x-3 p-3 rounded-lg transition-all duration-300"
                       style="background-color: rgba(255, 255, 255, 0.1);"
                       @mouseover="addHoverBackground"
                       @mouseout="removeHoverBackground">
                      <Phone class="w-6 h-6 text-white group-hover:text-white transition-colors duration-300" />
                      <span class="text-lg font-bold text-white group-hover:text-white transition-colors duration-300">{{ phone.number }}</span>
                    </a>
                  </div>

                  <div v-for="(email, emailIndex) in address.email" :key="'email-'+emailIndex">
                    <a :href="'mailto:' + email.address" 
                       class="contact-link group flex items-center space-x-3 p-3 rounded-lg transition-all duration-300"
                       style="background-color: rgba(255, 255, 255, 0.1);"
                       @mouseover="addHoverBackground"
                       @mouseout="removeHoverBackground">
                      <Mail class="w-6 h-6 text-white group-hover:text-white transition-colors duration-300" />
                      <span class="text-lg font-bold text-white group-hover:text-white transition-colors duration-300">{{ email.address }}</span>
                    </a>
                  </div>
                </div>
              </div>
            </div>

            <!-- Map & Social Section -->
            <div class="col-span-1 md:col-span-4 backdrop-blur-sm rounded-xl p-6 space-y-6" style="background-color: rgba(255, 255, 255, 0.05);">
              <!-- Branch Info -->
              <div v-if="activeFooter.branchInfo" class="branch-section mb-6">
                <h4 class="section-title">Chi Nhánh</h4>
                <div class="space-y-4 mt-6">
                  <div v-for="(branch, index) in activeFooter.branchInfo" 
                       :key="index" 
                       class="branch-card p-4 rounded-lg transition-all duration-300 transform hover:-translate-y-1"
                       style="background-color: rgba(255, 255, 255, 0.1);"
                       @mouseover="addHoverBackground"
                       @mouseout="removeHoverBackground">
                    <h5 class="text-lg font-semibold mb-2 text-white">{{ branch.title }}</h5>
                    <p class="text-base text-white">{{ branch.address }}</p>
                  </div>
                </div>
              </div>

              <!-- Map with enhanced container -->
              <div v-if="activeFooter.mapUrl" 
                   class="map-container rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 mb-6">
                <iframe
                  :src="activeFooter.mapUrl + '&zoom=15&style=feature:all|element:labels.text.fill|color:0x000000|saturation:36|lightness:40&style=feature:all|element:labels.text.stroke|visibility:off&style=feature:administrative|element:geometry.stroke|color:0xdc2626|weight:1&style=feature:landscape|element:geometry.fill|color:0xfecaca&style=feature:poi|element:geometry.fill|color:0xfee2e2&style=feature:road|element:geometry.fill|color:0xffffff&style=feature:road|element:geometry.stroke|color:0xdc2626|weight:0.5&style=feature:water|element:geometry.fill|color:0xfca5a5'"
                  width="100%"
                  height="200"
                  style="border:0;"
                  allowfullscreen
                  loading="lazy"
                  referrerpolicy="no-referrer-when-downgrade"
                  class="transition-all duration-500"
                >
                </iframe>
              </div>

              <!-- Facebook Fanpage -->
              <div v-if="activeFooter.fanpageUrl" class="facebook-container rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 mb-6">
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
                      <a :href="activeFooter.fanpageUrl" class="text-white">{{ activeFooter.companyInfo.name }}</a>
                    </blockquote>
                  </div>
                </ClientOnly>
              </div>

              <!-- Social Icons -->
              <div class="social-icons flex space-x-6 justify-center pt-4">
                <a v-for="icon in activeFooter.socialIcons" 
                   :key="icon.name" 
                   :href="icon.url" 
                   target="_blank"
                   rel="noopener noreferrer"
                   class="social-icon-link p-4 rounded-full transform hover:scale-110 transition-all duration-300"
                   style="background-color: rgba(255, 255, 255, 0.1);"
                   @mouseover="addHoverBackground"
                   @mouseout="removeHoverBackground">
                  <Icon :name="icon.icon" class="w-7 h-7 text-white" />
                </a>
              </div>
            </div>
          </div>
        </div>

        <!-- Wave Background -->
        <div class="waves-decoration relative h-40 mt-auto overflow-hidden">
          <svg class="waves" xmlns="http://www.w3.org/2000/svg" viewBox="0 24 150 28" preserveAspectRatio="none">
            <defs>
              <path id="wave-path" d="M-160 44c30 0 58-18 88-18s 58 18 88 18 58-18 88-18 58 18 88 18 v44h-352z" />
            </defs>
            <g class="wave-parallax1">
              <use href="#wave-path" x="50" y="3" fill="rgba(255,255,255,0.1)" />
            </g>
            <g class="wave-parallax2">
              <use href="#wave-path" x="50" y="0" fill="rgba(255,255,255,0.2)" />
            </g>
            <g class="wave-parallax3">
              <use href="#wave-path" x="50" y="9" fill="rgba(255,255,255,0.3)" />
            </g>
            <g class="wave-parallax4">
              <use href="#wave-path" x="50" y="6" fill="rgba(255,255,255,0.4)" />
            </g>
          </svg>
        </div>
      </div>

      <!-- Copyright Section -->
      <div class="copyright-section w-full" style="background-color: #9a1c1c !important;">
        <div class="container mx-auto px-4 py-4">
          <div class="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <p class="text-sm text-white/80">{{ activeFooter.copyrightStyle?.text }}</p>
          </div>
        </div>
      </div>
    </footer>

    <!-- Loading State -->
    <div v-else-if="isLoading" class="tourism-footer-loading animate-pulse" style="background: linear-gradient(180deg, #e53e3e 0%, #dc2626 100%) !important;">
      <div class="container mx-auto px-4 py-12">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div v-for="i in 3" :key="i" class="h-48 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
        </div>
      </div>
    </div>

    <!-- Error State -->
    <div v-if="error && isDev" class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-xl relative" role="alert">
      <strong class="font-bold">Error:</strong>
      <span class="block sm:inline"> {{ error }}</span>
    </div>

    <!-- Image Modal -->
    <UModal v-model="isImageModalOpen" :ui="{ 
      wrapper: 'flex min-h-screen items-center justify-center',
      container: 'w-screen h-screen flex items-center justify-center',
      base: 'relative overflow-hidden',
      background: 'bg-black/90',
      rounded: 'rounded-none',
      padding: 'p-0',
      width: 'max-w-full',
      height: 'max-h-full',
      close: 'absolute top-4 right-4 text-white hover:text-gray-300 z-50'
    }">
      <div class="relative w-full h-full flex items-center justify-center p-4">
        <img 
          v-if="selectedImage"
          :src="selectedImage.url" 
          :alt="selectedImage.alt"
          class="max-w-full max-h-full object-contain"
        />
      </div>
    </UModal>
  </div>
</template>

<style scoped>
.tourism-footer {
  @apply text-white overflow-hidden flex flex-col;
  min-height: 500px;
}

.main-content {
  @apply flex flex-col flex-1;
}

.waves-decoration {
  @apply relative w-full;
  transform: translateY(2px);
}

.waves {
  @apply w-full h-full block;
  min-width: 2000px;
}

.wave-parallax1 use {
  animation: wave-move 40s cubic-bezier(.55,.5,.45,.5) infinite;
}

.wave-parallax2 use {
  animation: wave-move 30s cubic-bezier(.55,.5,.45,.5) infinite;
}

.wave-parallax3 use {
  animation: wave-move 20s cubic-bezier(.55,.5,.45,.5) infinite;
}

.wave-parallax4 use {
  animation: wave-move 15s cubic-bezier(.55,.5,.45,.5) infinite;
}

@keyframes wave-move {
  0% {
    transform: translate3d(-90px, 0, 0);
  }
  50% {
    transform: translate3d(-45px, 0, 0);
  }
  100% {
    transform: translate3d(85px, 0, 0);
  }
}

/* Adjust existing styles to work with new background */
.quick-link, .contact-link, .branch-card, .certification-item {
  @apply backdrop-blur-sm;
  background: rgba(255, 255, 255, 0.1) !important;
}

.social-icon-link {
  @apply shadow-lg hover:shadow-xl backdrop-blur-sm;
  background: rgba(255, 255, 255, 0.1) !important;
}

.social-icon-link:hover {
  background: transparent;
}

/* Make sure content sections have proper contrast */
.col-span-1 {
  @apply relative;
}

/* Enhance loading state */
.tourism-footer-loading {
  @apply min-h-[500px];
}

.section-title {
  @apply text-2xl font-black tracking-wide mb-2 relative uppercase;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.1);
  font-size: 1.6em; /* Tăng kích thước cho section title */
  font-weight: 900;
  
  @media (min-width: 768px) {
    font-size: 1.7em; /* Tăng kích thước cho desktop */
  }
}

.section-title::after {
  content: '';
  @apply absolute bottom-0 left-0 w-16 h-1 bg-white/30 rounded-full mt-2;
  transform: translateY(8px);
}

/* Giữ nguyên kích thước cho các heading khác */
h3, h4, h5 {
  letter-spacing: 0.02em;
  @apply font-extrabold uppercase;
  font-size: 0.85em;
  font-weight: 900;
  
  @media (min-width: 768px) {
    font-size: 1em;
  }
}

.company-brand h3 {
  text-shadow: 3px 3px 6px rgba(0, 0, 0, 0.15);
  font-size: 1.3em;
  font-weight: 900;
}

.quick-link, .contact-link {
  @apply text-white hover:text-white transform hover:translate-x-1 font-black;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.1);
  font-size: 0.9em;
  font-weight: 950;
  
  @media (min-width: 768px) {
    font-size: 1.1em;
  }
}

.quick-link span, .contact-link span {
  font-size: 0.9em;
  font-weight: 950;
  
  @media (min-width: 768px) {
    font-size: 1.1em;
  }
}

.quick-link .u-icon, .contact-link .u-icon {
  font-size: 0.9em; /* Even smaller base size */
  font-weight: 950;
  
  @media (min-width: 768px) {
    font-size: 1.1em; /* Even smaller desktop size */
  }
}

.quick-link:hover, .contact-link:hover {
  @apply shadow-lg;
}

.branch-card {
  @apply shadow-md hover:shadow-lg backdrop-blur-sm;
  background: rgba(255, 255, 255, 0.1) !important;
}

.branch-card h5 {
  font-size: 0.85em;
  font-weight: 900;
  @apply text-white;
  
  @media (min-width: 768px) {
    font-size: 1em;
  }
}

.branch-card p {
  font-size: 0.85em;
  font-weight: 700;
  @apply text-white;
  
  @media (min-width: 768px) {
    font-size: 1em;
  }
}

.company-details p {
  font-size: 0.85em; /* Even smaller base size */
  font-weight: 700;
  
  @media (min-width: 768px) {
    font-size: 1em; /* Even smaller desktop size */
  }
}

.copyright-section p {
  font-size: 0.8em; /* Even smaller base size */
  font-weight: 700;
  
  @media (min-width: 768px) {
    font-size: 0.95em; /* Even smaller desktop size */
  }
}

/* Remove old Facebook container styling */
.facebook-container {
  @apply shadow-lg hover:shadow-xl transition-all duration-300;
}

/* Increase size for social icons */
.social-icon-link .u-icon {
  font-size: 0.85em; /* Even smaller base size */
  
  @media (min-width: 768px) {
    font-size: 1em; /* Even smaller desktop size */
  }
}

/* Increase size for certification text */
.certification-item span {
  font-size: 0.8em; /* Even smaller base size */
  font-weight: 700;
  
  @media (min-width: 768px) {
    font-size: 0.95em; /* Even smaller desktop size */
  }
}
</style> 
