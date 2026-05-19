<script setup lang="ts">
import { computed, defineAsyncComponent, ref, h, nextTick, watch } from "vue";
import { useElementVisibility, useMediaQuery } from '@vueuse/core';
import { useLocalization } from "~/composables/useLocalization";
import { useTrpc } from "~/composables/useTrpc";
import { useRoute, useRouter } from "vue-router";
import AppImage from "~/components/ui/AppImage.vue";
import TableOfContents from "~/components/common/TableOfContents.vue";
import { formatFullProductContent } from "~/utils/contentFormatter";
import { useAsyncData } from 'nuxt/app';
import { useNotification } from "~/composables/useNotification";
import AddToCartButton from "~/components/cart/AddToCartButton.vue";
import Breadcrumb from "~/components/common/Breadcrumb.vue";
import { usePageSeo } from '~/composables/usePageSeo';
import { 
  ArrowDown,
  Check, 
  Share, 
  Facebook, 
  Twitter, 
  Linkedin, 
  Mail, 
  Link, 
  Video,
  AlertTriangle,
  AlertCircle,
  Tag,
  LayoutGrid,
  FileText,
  Settings,
  Ticket,
  Calendar,
  Clock,
  MapPin,
  Info,
  ListOrdered,
  Users,
  BadgeDollarSign,
  CreditCard,
  Shield,
  ArrowRight,
  Minus,
  Plus
} from 'lucide-vue-next';
import { useProductVariants } from '~/composables/useProduct';
import { formatPrice } from '@ew/shared';
import type { Product } from '@ew/shared';
import { useProductDetail } from '~/composables/useProductDetail';
import { DatePicker } from 'v-calendar';
import 'v-calendar/style.css';
import { useTicketBooking } from '~/composables/useTicketBooking';
import { useTierPricing } from "~/composables/useTierPricing";
import { buildProductSchema, resolveSeoCanonicalUrl } from '~/utils/seo';
import { resolveTicketMobileAction } from '~/utils/ticketDetailMobile';
import { getCategoryDetailRoute } from '~/utils/routes';
const CrossSellProducts = defineAsyncComponent(() => import('~/components/product/CrossSellProducts.vue'));
const ProductSpecifications = defineAsyncComponent(() => import('~/components/product/ProductSpecifications.vue'));
const ProductDetailSidebar = defineAsyncComponent(() => import('~/components/product/ProductDetailSidebar.vue'));
const PriceRequestModal = defineAsyncComponent(() => import('~/components/product/PriceRequestModal.vue'));
const GlobalModal = defineAsyncComponent(() => import('~/components/ui/GlobalModal.vue'));
const TierPricingTable = defineAsyncComponent(() => import('~/components/product/TierPricingTable.vue'));

// Định nghĩa interface cho PriceRequest
interface PriceRequest {
  id: number;
  productId: number;
  productName: string;
  variantId?: number;
  variantName?: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  message: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

const { t, locale } = useLocalization();
const route = useRoute();
const router = useRouter();
const siteUrl = useRuntimeConfig().public.siteUrl;

// Sử dụng composable useProductDetail
const {
  productData,
  isLoading,
  error,
  refresh,
  currentLocale,
  productTitle,
  productContent,
  productShortDescription,
  productContentId,
  formattedProductContent,
  hasVideoReview,
  tabs: originalTabs,
  shareUrl,
  shareTitle,
  shareDescription,
  shareImage,
  canonicalUrl,
  activeTab,
  isPriceRequestModalOpen,
  selectedAttributes,
  productAttributes,
  matchingVariant,
  variantPrice,
  hasRequiredAttributes,
  isAttributeValueAvailable,
  minVariantPrice,
  shouldShowFromPrice,
  shouldShowPriceRequest,
  canAddToCart: baseCanAddToCart,
  displayPrice,
  displayComparePrice,
  getProductForCart,
  handleSelectAttribute,
  openPriceRequestModal,
  closePriceRequestModal,
  handlePriceRequestSuccess,
  shareToFacebook,
  shareToTwitter,
  shareToLinkedIn,
  shareViaEmail,
  copyProductLink,
  getTabIcon: originalGetTabIcon
} = useProductDetail();

// Add new refs for date selection
const selectedDate = ref<Date | null>(null);
const selectedQuantity = ref(1);
const selectedVariant = ref<any>(null);
const indexedVariants = ref<any[]>([]);
const variantCounts = ref<Record<number, number>>({});
const buyBoxRef = ref<HTMLElement | null>(null);
const isMobileViewport = useMediaQuery('(max-width: 1023px)');
const isBuyBoxVisible = useElementVisibility(buyBoxRef);

const masks = {
  input: 'DD/MM/YYYY',
  data: 'YYYY-MM-DD'
};

// Fix disabled dates configuration
const disabledDates = computed(() => {
  const dates = [];
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  // Add all dates from the past up to yesterday
  let currentDate = new Date(0); // Start from epoch
  while (currentDate <= yesterday) {
    dates.push(new Date(currentDate));
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return dates;
});

// Initialize variants when product data changes
watch(() => productData.value, (newProduct) => {
  if (newProduct?.variants && newProduct.variants.length > 0) {
    indexedVariants.value = newProduct.variants.map((variant, index) => ({
      ...variant,
      _index: index,
    }));

    // Initialize count for each variant to 0
    indexedVariants.value.forEach((variant) => {
      variantCounts.value[variant.id] = 0;
    });
  } else {
    indexedVariants.value = [];
  }
}, { immediate: true });

// Get variant name by locale
const getVariantName = (variant: any) => {
  if (variant.translations && variant.translations.length > 0) {
    return variant.translations.find((t: any) => t.locale === currentLocale.value)?.name || 
           variant.translations[0]?.name || 
           "Vé mặc định";
  }
  return variant.name || "Vé mặc định";
};

const getVariantPrice = (variant: any) => {
  return variant.price || 0;
};

const getVariantCount = (variant: any): number => {
  return variantCounts.value[variant.id] || 0;
};

const decreaseVariantCount = (variant: any) => {
  if (variantCounts.value[variant.id] > 0) {
    variantCounts.value[variant.id]--;
  }
};

const increaseVariantCount = (variant: any) => {
  const currentCount = variantCounts.value[variant.id] || 0;
  if (currentCount < 10) { // Maximum 10 tickets per variant
    variantCounts.value[variant.id] = currentCount + 1;
  }
};

// Original total without discount
const originalTotal = ref(0);
const discountedTotal = ref(0);

// Calculate total price based on selected variants
const calculateTotal = computed(() => {
  if (!productData.value) return formatPrice(discountedTotal.value || 0);
  return formatPrice(discountedTotal.value || 0);
});

// Update the total when variants change
const updateTotals = async () => {
  if (!productData.value) {
    originalTotal.value = 0;
    discountedTotal.value = 0;
    return;
  }

  // Calculate original total
  let total = 0;
  Object.entries(variantCounts.value).forEach(([variantId, count]) => {
    const variant = indexedVariants.value.find((v) => v.id === Number(variantId));
    if (variant && count > 0) {
      total += getVariantPrice(variant) * count;
    }
  });
  
  originalTotal.value = total;
  
  // Apply discount if applicable
  if (totalTickets.value > 0) {
    const { getDiscountForQuantity } = useTierPricing();
    const discountPercent = await getDiscountForQuantity(productData.value.id, null, totalTickets.value);
    if (discountPercent > 0) {
      total = total * (1 - discountPercent / 100);
    }
  }
  
  discountedTotal.value = total;
};

const totalTickets = computed(() => {
  return Object.values(variantCounts.value).reduce((sum, count) => sum + count, 0);
});

const trustHighlights = computed(() => [
  t('tickets.instantDelivery') || 'Nhận vé nhanh',
  t('tickets.secureCheckout') || 'Thanh toán an toàn',
  t('tickets.supportAvailable') || 'Hỗ trợ khi cần',
]);

const mobileActionMode = computed(() =>
  resolveTicketMobileAction({
    isMobile: isMobileViewport.value,
    buyBoxInView: isBuyBoxVisible.value,
    hasProduct: !!productData.value,
    hasCartProduct: !!getProductForCart.value,
    totalTickets: totalTickets.value,
    hasSelectedDate: selectedDate.value !== null,
    shouldShowPriceRequest: shouldShowPriceRequest.value,
  }),
);

const scrollToBuyBox = () => {
  buyBoxRef.value?.scrollIntoView({
    behavior: 'smooth',
    block: 'start',
  });
};

// Watch for quantity changes to update totals
watch(variantCounts, async () => {
  await updateTotals();
}, { deep: true });

// Watch for selectedDate changes to update totals
watch(selectedDate, async () => {
  await updateTotals();
});

// Initialize updateTotals on mount
onMounted(async () => {
  await updateTotals();
});

// Extend base canAddToCart with date validation for tickets
const canAddToCart = computed(() => {
  const baseCanAdd = baseCanAddToCart.value;
  if (productData.value?.type === 'TICKET') {
    return baseCanAdd && selectedDate.value !== null && totalTickets.value > 0;
  }
  return baseCanAdd;
});

// Định nghĩa alias cho URL tiếng Việt (nếu cần)
definePageMeta({
  layout: "default",
});

const ticketSlugByLocale = computed(() => ({
  vi: productData.value?.translations?.find((translation: any) => translation.locale === 'vi')?.slug,
  en: productData.value?.translations?.find((translation: any) => translation.locale === 'en')?.slug,
}));

const homeLabel = computed(() => (currentLocale.value === 'en' ? 'Home' : 'Trang chủ'));
const ticketsLabel = computed(() => (currentLocale.value === 'en' ? 'Tickets' : 'Vé tham quan'));

const resolvedCanonicalUrl = computed(() =>
  resolveSeoCanonicalUrl({
    siteUrl,
    currentPath: route.path,
    locale: currentLocale.value === 'en' ? 'en' : 'vi',
    routeKey: 'ticket-detail',
    slugByLocale: ticketSlugByLocale.value,
    candidate:
      productData.value?.canonicalUrl ||
      productData.value?.translations?.find((translation: any) => translation.locale === currentLocale.value)?.canonicalUrl ||
      null,
  }),
);

usePageSeo({
  title: computed(() => productData.value?.metaTitle || productTitle.value || 'Chi tiết vé'),
  description: computed(() => productData.value?.metaDescription || productShortDescription.value || ''),
  keywords: computed(() => productData.value?.metaKeywords || ''),
  ogTitle: computed(() => productData.value?.ogTitle || productTitle.value || ''),
  ogDescription: computed(() => productData.value?.ogDescription || productData.value?.metaDescription || productShortDescription.value || ''),
  image: computed(() => productData.value?.ogImage || productData.value?.thumbnail || ''),
  ogType: 'product',
  canonicalUrl: computed(() => productData.value?.canonicalUrl || productData.value?.translations?.find((translation: any) => translation.locale === currentLocale.value)?.canonicalUrl || null),
  currentPath: computed(() => route.path),
  locale: computed(() => (currentLocale.value === 'en' ? 'en' : 'vi')),
  routeKey: 'ticket-detail',
  slugByLocale: ticketSlugByLocale,
  breadcrumbs: computed(() => [
    { name: homeLabel.value, item: '/' },
    { name: ticketsLabel.value, item: '/tickets' },
    { name: productTitle.value || 'Ticket' },
  ]),
  schemas: computed(() => [
    buildProductSchema({
      name: productTitle.value || 'Ticket',
      description: productShortDescription.value || '',
      url: resolvedCanonicalUrl.value,
      image: productData.value?.ogImage || productData.value?.thumbnail || '',
      price: productData.value?.price ?? minVariantPrice.value ?? null,
    }),
  ]),
});

// Theo dõi thay đổi của activeTab để cập nhật lại TableOfContents
watch(activeTab, (newTab, oldTab) => {
  if (newTab === "description") {
    // Đợi DOM cập nhật xong
    nextTick(() => {
      // Đợi thêm một chút để đảm bảo transition đã hoàn thành
      setTimeout(() => {
        // Kích hoạt lại TableOfContents
        const event = new Event("tab-changed");
        window.dispatchEvent(event);

        // Đảm bảo nội dung đã được render
        const contentElement = document.querySelector(`#${productContentId.value}`);
        if (contentElement) {
          // Kích hoạt MutationObserver
          const observer = new MutationObserver(() => {
            window.dispatchEvent(new Event("tab-changed"));
          });

          observer.observe(contentElement, {
            childList: true,
            subtree: true,
            characterData: true,
          });

          // Cleanup sau 1 giây
          setTimeout(() => {
            observer.disconnect();
          }, 1000);
        }
      }, 300);
    });
  }
});

const tabs = computed(() => [
  {
    id: 'description',
    label: t('tickets.description') || 'Mô tả',
  },
  {
    id: 'video',
    label: t('tickets.videoReview') || 'Video review',
    badge: hasVideoReview.value ? { label: 'New' } : undefined,
  },
]);

const getTabIcon = (tabId: string) => {
  switch (tabId) {
    case 'description':
      return FileText;
    case 'video':
      return Video;
    default:
      return null;
  }
};

// Add to script setup
const { saveBookingData } = useTicketBooking();

// Update handleSubmit method
const handleSubmit = async () => {
  if (!productData.value || !selectedDate.value) return;

  // Make sure discounted total is updated
  await updateTotals();

  // Get active variants (quantity > 0)
  const activeVariants = Object.entries(variantCounts.value)
    .filter(([_, count]) => count > 0)
    .map(([variantId, count]) => {
      const variant = indexedVariants.value.find(v => v.id === Number(variantId));
      return {
        id: Number(variantId),
        name: getVariantName(variant),
        quantity: count,
        unitPrice: getVariantPrice(variant),
        totalPrice: getVariantPrice(variant) * count
      };
    });

  if (activeVariants.length === 0) return;

  // Save booking data with discounted total and original amount
  saveBookingData({
    productId: productData.value.id,
    productName: productTitle.value,
    date: selectedDate.value,
    variants: activeVariants,
    totalAmount: discountedTotal.value,
    originalAmount: originalTotal.value
  });

  // Navigate to checkout
  router.push('/checkout/ticket');
};
</script>

<template>
  <div class="ticket-detail min-h-screen bg-gray-50 dark:bg-gray-900">
    <div class="container mx-auto px-4 py-8">
      <!-- Breadcrumb -->
      <div class="mb-6">
        <Breadcrumb
          :items="[
            { label: t('tickets.title'), to: '/tickets' },
            { label: productTitle },
          ]"
          variant="transparent"
          class="text-sm md:text-base"
        />
      </div>

      <div v-if="isLoading" class="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <DetailPageSkeleton />
      </div>

      <div
        v-else-if="error"
        class="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 text-center"
      >
        <AlertCircle class="mx-auto mb-4 h-16 w-16 text-red-500" />
        <h2 class="mb-2 text-2xl font-bold">{{ t("tickets.error") || "Lỗi" }}</h2>
        <p class="mb-6 text-gray-600 dark:text-gray-400">
          {{
            error.message ||
            t("tickets.errorDescription") ||
            "Có lỗi xảy ra khi tải thông tin vé"
          }}
        </p>
        <UButton @click="refresh" color="primary" class="mr-2">
          {{ t("tickets.tryAgain") || "Thử lại" }}
        </UButton>
        <UButton to="/tickets" color="gray">
          {{ t("tickets.backToTickets") || "Quay lại danh sách vé" }}
        </UButton>
      </div>

      <div v-else-if="productData" class="ticket-content space-y-6 lg:space-y-8">
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <div class="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:gap-8">
            <div class="ticket-images bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
              <AppImage
                :src="productData.thumbnail || ''"
                :alt="productTitle"
                fallbackSrc="/images/default-image.jpg"
                sizes="(max-width: 768px) 100vw, 50vw"
                :priority="true"
                loading="eager"
                fetchpriority="high"
                width="1200"
                height="900"
                customClass="h-auto w-full rounded-lg"
              />

              <div
                v-if="productData.gallery && productData.gallery.length > 0"
                class="mt-4 grid grid-cols-4 gap-2"
              >
                <AppImage
                  v-for="(image, index) in productData.gallery"
                  :key="index"
                  :src="image"
                  :alt="`${productTitle} - ${index + 1}`"
                  fallbackSrc="/images/default-image.jpg"
                  sizes="(max-width: 768px) 25vw, 12vw"
                  loading="lazy"
                  fetchpriority="low"
                  width="320"
                  height="240"
                  customClass="h-20 w-full cursor-pointer rounded-md"
                />
              </div>
            </div>

            <div class="ticket-info bg-white dark:bg-gray-800 rounded-lg p-6">
              <div class="mb-3">
                <UBadge color="purple" variant="solid" class="text-sm font-medium">
                  <Ticket class="w-4 h-4 mr-1" />
                  {{ t("tickets.ticketType") || "Vé" }}
                </UBadge>
              </div>

              <div
                v-if="productData.isNew || productData.isSale || productData.isFeatured"
                class="mb-4 flex flex-wrap gap-2"
              >
                <UBadge v-if="productData.isNew" color="blue" variant="solid">{{ t("tickets.new") || "Mới" }}</UBadge>
                <UBadge v-if="productData.isSale" color="red" variant="solid">{{ t("tickets.sale") || "Giảm giá" }}</UBadge>
                <UBadge v-if="productData.isFeatured" color="amber" variant="solid">{{ t("tickets.featured") || "Nổi bật" }}</UBadge>
              </div>

              <h1 class="mb-2 text-2xl font-bold leading-tight text-gray-900 dark:text-white md:text-3xl">
                {{ productTitle }}
              </h1>

              <div class="mb-4 flex flex-wrap gap-2">
                <span
                  v-for="highlight in trustHighlights"
                  :key="highlight"
                  class="inline-flex items-center rounded-full bg-primary-50 px-3 py-1 text-xs font-medium text-primary-700 dark:bg-primary-900/30 dark:text-primary-200"
                >
                  <Check class="mr-1.5 h-3.5 w-3.5" />
                  {{ highlight }}
                </span>
              </div>

              <div
                v-if="productData.sku"
                class="mb-4 text-sm text-gray-600 dark:text-gray-400"
              >
                SKU: {{ productData.sku }}
              </div>

              <div
                v-if="productData.categories && productData.categories.length > 0"
                class="mb-5"
              >
                <div class="category-title text-base font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <LayoutGrid class="inline-block mr-1 h-5 w-5 text-primary-500" />
                  {{ t("tickets.categories") || "Danh mục:" }}
                </div>
                <div class="flex flex-wrap gap-2">
                  <UBadge
                    v-for="category in productData.categories"
                    :key="category.id"
                    size="lg"
                    class="category-badge cursor-pointer hover:bg-primary-100 dark:hover:bg-primary-800 transition-colors"
                    @click="router.push(getCategoryDetailRoute(category.translations?.[0]?.slug || '', locale.value))"
                  >
                    <template #default>
                      <div class="flex items-center gap-1">
                        <Tag class="h-4 w-4" />
                        <span class="text-sm font-medium">{{ category.translations?.[0]?.name || '' }}</span>
                      </div>
                    </template>
                  </UBadge>
                </div>
              </div>

              <section
                ref="buyBoxRef"
                class="ticket-buy-box mb-6 rounded-2xl border border-primary-100 bg-gradient-to-br from-primary-50 via-white to-white p-4 shadow-sm dark:border-primary-900/40 dark:from-gray-800 dark:via-gray-800 dark:to-gray-900"
              >
                <div class="mb-4 flex items-start justify-between gap-4">
                  <div>
                    <div class="text-sm font-medium uppercase tracking-[0.16em] text-primary-600 dark:text-primary-300">
                      {{ t("tickets.bookingSummary") || "Đặt vé ngay" }}
                    </div>
                    <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">
                      {{ t("tickets.bookingSummaryHint") || "Chọn loại vé và ngày sử dụng để giữ chỗ nhanh hơn." }}
                    </p>
                  </div>
                  <div class="shrink-0 rounded-xl bg-white/80 px-3 py-2 text-right shadow-sm ring-1 ring-primary-100 dark:bg-gray-900/80 dark:ring-primary-900/30">
                    <div class="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                      {{ t("tickets.total") || "Tổng tiền" }}
                    </div>
                    <div v-if="discountedTotal < originalTotal" class="flex flex-col items-end">
                      <div class="text-xl font-semibold text-primary-600 dark:text-primary-400">
                        {{ formatPrice(discountedTotal) }}
                      </div>
                      <div class="text-xs text-gray-500 line-through">
                        {{ formatPrice(originalTotal) }}
                      </div>
                    </div>
                    <div v-else class="text-xl font-semibold text-primary-600 dark:text-primary-400">
                      {{ calculateTotal }}
                    </div>
                    <div class="mt-1 text-xs text-gray-600 dark:text-gray-400">
                      {{ totalTickets }} {{ t("tickets.ticketCount") || "vé" }}
                    </div>
                  </div>
                </div>

                <div class="mb-5 rounded-xl bg-white/80 p-4 ring-1 ring-gray-100 dark:bg-gray-800/80 dark:ring-gray-700">
                  <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div class="ticket-info-item">
                      <div class="text-sm text-gray-500 dark:text-gray-400 mb-1">
                        <Calendar class="w-4 h-4 inline-block mr-1" />
                        {{ t("tickets.ticketDate") || "Ngày sử dụng" }}
                      </div>
                      <div class="font-medium">
                        {{ productData.specifications?.find(spec => spec.name === 'date')?.value || 'Liên hệ để biết thêm' }}
                      </div>
                    </div>
                    <div class="ticket-info-item">
                      <div class="text-sm text-gray-500 dark:text-gray-400 mb-1">
                        <Clock class="w-4 h-4 inline-block mr-1" />
                        {{ t("tickets.ticketTime") || "Thời gian" }}
                      </div>
                      <div class="font-medium">
                        {{ productData.specifications?.find(spec => spec.name === 'time')?.value || 'Liên hệ để biết thêm' }}
                      </div>
                    </div>
                    <div class="ticket-info-item">
                      <div class="text-sm text-gray-500 dark:text-gray-400 mb-1">
                        <MapPin class="w-4 h-4 inline-block mr-1" />
                        {{ t("tickets.ticketLocation") || "Địa điểm" }}
                      </div>
                      <div class="font-medium">
                        {{ productData.specifications?.find(spec => spec.name === 'location')?.value || 'Liên hệ để biết thêm' }}
                      </div>
                    </div>
                    <div class="ticket-info-item">
                      <div class="text-sm text-gray-500 dark:text-gray-400 mb-1">
                        <Info class="w-4 h-4 inline-block mr-1" />
                        {{ t("tickets.ticketValidity") || "Hiệu lực" }}
                      </div>
                      <div class="font-medium">
                        {{ productData.specifications?.find(spec => spec.name === 'validity')?.value || 'Liên hệ để biết thêm' }}
                      </div>
                    </div>
                  </div>
                </div>

                <div v-if="indexedVariants.length" class="mb-5">
                  <div class="space-y-2">
                    <label class="block font-medium text-gray-700 dark:text-gray-300">
                      {{ t("tickets.ticketType") || "Loại vé" }}
                    </label>
                    <div class="space-y-3">
                      <div
                        v-for="(variant, index) in indexedVariants"
                        :key="index"
                        class="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-800"
                      >
                        <div class="flex flex-col">
                          <span class="font-medium text-gray-900 dark:text-gray-100">{{
                            getVariantName(variant)
                          }}</span>
                          <span class="text-sm text-gray-600 dark:text-gray-400">{{
                            formatPrice(getVariantPrice(variant))
                          }}</span>
                        </div>
                        <div class="flex items-center">
                          <button
                            type="button"
                            class="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                            :disabled="getVariantCount(variant) <= 0"
                            @click="decreaseVariantCount(variant)"
                          >
                            <Minus class="w-5 h-5" />
                          </button>
                          <span
                            class="w-12 text-center text-lg font-medium text-gray-900 dark:text-gray-100"
                          >
                            {{ getVariantCount(variant) }}
                          </span>
                          <button
                            type="button"
                            class="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                            :disabled="getVariantCount(variant) >= 10"
                            @click="increaseVariantCount(variant)"
                          >
                            <Plus class="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div class="mb-5">
                  <div class="text-base font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                    <Calendar class="w-5 h-5" />
                    {{ t("tickets.departureDate") || "Ngày sử dụng" }}
                    <span class="text-red-500">*</span>
                  </div>
                  <div class="space-y-4">
                    <DatePicker
                      v-model="selectedDate"
                      :min-date="new Date()"
                      :masks="masks"
                      :disabled-dates="disabledDates"
                      class="w-full [&_.vc-highlight-base-start]:!bg-primary-500 [&_.vc-highlight-base-start]:!text-white [&_.vc-disabled]:!opacity-25 [&_.vc-disabled]:!cursor-not-allowed"
                    >
                      <template #default="{ inputValue, inputEvents }">
                        <input
                          :value="inputValue"
                          v-on="inputEvents"
                          :placeholder="t('tickets.selectDepartureDate') || 'Chọn ngày sử dụng'"
                          class="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none dark:bg-gray-800"
                          readonly
                        />
                      </template>
                    </DatePicker>
                    <div v-if="selectedDate" class="text-sm text-gray-600 dark:text-gray-400">
                      {{ t("tickets.selectedDate") || "Ngày đã chọn" }}: {{ selectedDate.toLocaleDateString(currentLocale) }}
                    </div>
                  </div>
                </div>

                <div class="flex flex-col gap-4 border-t border-gray-200 pt-4 dark:border-gray-700 sm:flex-row sm:items-center sm:justify-between">
                  <div class="text-gray-700 dark:text-gray-300">
                    <div class="text-sm">{{ t("tickets.total") || "Tổng tiền" }}</div>
                    <div v-if="discountedTotal < originalTotal" class="flex flex-col">
                      <div class="text-2xl font-semibold text-primary-600 dark:text-primary-400">
                        {{ formatPrice(discountedTotal) }}
                      </div>
                      <div class="text-sm text-gray-500 line-through">
                        {{ formatPrice(originalTotal) }}
                      </div>
                    </div>
                    <div v-else class="text-2xl font-semibold text-primary-600 dark:text-primary-400">
                      {{ calculateTotal }}
                    </div>
                    <div class="text-xs mt-1 text-gray-600 dark:text-gray-400">
                      {{ totalTickets }} {{ t("tickets.ticketCount") || "vé" }}
                    </div>
                  </div>

                  <div class="space-y-3 sm:min-w-[240px]">
                    <AddToCartButton
                      v-if="canAddToCart && getProductForCart"
                      :product="getProductForCart"
                      :buttonText="t('tickets.addToCart') || 'Thêm vào giỏ hàng'"
                      :showQuantity="false"
                      buttonClass="flex w-full items-center justify-center rounded-xl bg-primary-600 px-4 py-3 text-base font-semibold text-white transition-colors duration-200 hover:bg-primary-700"
                    />

                    <UButton
                      v-else-if="!shouldShowPriceRequest"
                      color="primary"
                      size="lg"
                      block
                      class="bg-primary-600 hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-600 text-white font-medium py-3 text-base"
                      @click="scrollToBuyBox"
                    >
                      <template #leading>
                        <ArrowDown class="h-5 w-5" />
                      </template>
                      {{ t("tickets.completeSelection") || "Chọn vé để tiếp tục" }}
                    </UButton>

                    <UButton
                      v-if="shouldShowPriceRequest"
                      color="primary"
                      size="lg"
                      block
                      class="bg-primary-600 hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-600 text-white font-medium py-3 text-base"
                      @click="openPriceRequestModal"
                    >
                      <template #leading>
                        <BadgeDollarSign class="h-5 w-5" />
                      </template>
                      {{ t("tickets.requestPrice") || "Yêu cầu báo giá" }}
                    </UButton>
                  </div>
                </div>
              </section>
            </div>
          </div>
        </div>

        <div class="grid grid-cols-1 gap-4 lg:grid-cols-3 lg:gap-6">
          <div class="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
            <h3 class="mb-2 flex items-center text-base font-medium text-gray-900 dark:text-white">
              <AlertCircle class="mr-2 h-5 w-5 text-amber-500" />
              {{ t("tickets.ticketNotes") || "Lưu ý quan trọng" }}
            </h3>
            <ul class="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <li class="flex items-start">
                <Check class="mr-2 mt-0.5 h-4 w-4 shrink-0 text-green-500" />
                {{ t("tickets.ticketNote1") || "Vé có giá trị trong ngày tham quan" }}
              </li>
              <li class="flex items-start">
                <Check class="mr-2 mt-0.5 h-4 w-4 shrink-0 text-green-500" />
                {{ t("tickets.ticketNote2") || "Vui lòng mang theo CMND/CCCD khi sử dụng vé" }}
              </li>
              <li class="flex items-start">
                <Check class="mr-2 mt-0.5 h-4 w-4 shrink-0 text-green-500" />
                {{ t("tickets.ticketNote3") || "Trẻ em dưới 3 tuổi được miễn phí vé vào cổng" }}
              </li>
            </ul>
          </div>

          <div class="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
            <h3 class="mb-3 flex items-center text-base font-medium text-gray-900 dark:text-white">
              <ListOrdered class="mr-2 h-5 w-5 text-primary-500" />
              {{ t("tickets.ticketProcess") || "Quy trình sử dụng vé" }}
            </h3>
            <div class="relative">
              <div class="absolute left-2.5 top-0 h-full w-[2px] bg-gray-200 dark:bg-gray-700"></div>
              <ul class="relative space-y-5">
                <li class="flex items-start">
                  <div class="relative shrink-0">
                    <div class="flex h-6 w-6 items-center justify-center rounded-full border-2 border-primary-500 bg-white text-sm font-medium text-primary-600 dark:bg-gray-800">1</div>
                  </div>
                  <div class="ml-4 grow">
                    <h4 class="text-sm font-medium text-gray-900 dark:text-white">
                      {{ t("tickets.ticketStep1") || "Đặt vé trực tuyến" }}
                    </h4>
                    <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      {{ t("tickets.ticketStep1Desc") || "Chọn loại vé và thanh toán" }}
                    </p>
                  </div>
                </li>
                <li class="flex items-start">
                  <div class="relative shrink-0">
                    <div class="flex h-6 w-6 items-center justify-center rounded-full border-2 border-primary-500 bg-white text-sm font-medium text-primary-600 dark:bg-gray-800">2</div>
                  </div>
                  <div class="ml-4 grow">
                    <h4 class="text-sm font-medium text-gray-900 dark:text-white">
                      {{ t("tickets.ticketStep2") || "Nhận mã vé" }}
                    </h4>
                    <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      {{ t("tickets.ticketStep2Desc") || "Qua email hoặc tin nhắn SMS" }}
                    </p>
                  </div>
                </li>
                <li class="flex items-start">
                  <div class="relative shrink-0">
                    <div class="flex h-6 w-6 items-center justify-center rounded-full border-2 border-primary-500 bg-white text-sm font-medium text-primary-600 dark:bg-gray-800">3</div>
                  </div>
                  <div class="ml-4 grow">
                    <h4 class="text-sm font-medium text-gray-900 dark:text-white">
                      {{ t("tickets.ticketStep3") || "Sử dụng vé" }}
                    </h4>
                    <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      {{ t("tickets.ticketStep3Desc") || "Xuất trình mã vé tại cổng" }}
                    </p>
                  </div>
                </li>
              </ul>
            </div>
          </div>

          <div class="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
            <h3 class="mb-3 flex items-center text-base font-medium text-gray-900 dark:text-white">
              <Shield class="mr-2 h-5 w-5 text-green-500" />
              {{ t("tickets.securityGuarantee") || "Cam kết bảo mật" }}
            </h3>
            <ul class="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <li class="flex items-start">
                <Check class="mr-2 mt-0.5 h-4 w-4 shrink-0 text-green-500" />
                {{ t("tickets.securityNote1") || "Thanh toán an toàn qua cổng thanh toán bảo mật" }}
              </li>
              <li class="flex items-start">
                <Check class="mr-2 mt-0.5 h-4 w-4 shrink-0 text-green-500" />
                {{ t("tickets.securityNote2") || "Thông tin cá nhân được bảo vệ theo tiêu chuẩn quốc tế" }}
              </li>
              <li class="flex items-start">
                <Check class="mr-2 mt-0.5 h-4 w-4 shrink-0 text-green-500" />
                {{ t("tickets.securityNote3") || "Hoàn tiền 100% nếu không nhận được vé" }}
              </li>
            </ul>
          </div>
        </div>

        <!-- Phần mô tả vé và sidebar -->
        <div class="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <!-- Phần mô tả vé và tabs -->
          <div class="lg:col-span-2">
            <!-- Table of Contents -->
            <Transition name="fade" mode="out-in">
              <TableOfContents
                v-if="activeTab === 'description'"
                :contentSelector="`#${productContentId}`"
                :offset="100"
                :collapsible="true"
                :defaultCollapsed="false"
                key="table-of-contents"
                class="mb-6"
              />
            </Transition>

            <!-- Ticket Description and Video Review Tabs -->
            <div
              v-if="productContent || productData.videoReview || productData.id"
              class="ticket-tabs bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden"
            >
              <div class="border-b border-gray-200 dark:border-gray-700 px-6">
                <div class="flex flex-wrap space-x-4 md:space-x-8">
                  <button
                    v-for="tab in tabs"
                    :key="tab.id"
                    @click="activeTab = tab.id"
                    class="inline-flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm md:text-base uppercase tracking-wide"
                    :class="[
                      activeTab === tab.id
                        ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300',
                    ]"
                  >
                    <component 
                      :is="getTabIcon(tab.id)" 
                      class="h-5 w-5"
                    />
                    {{ tab.label }}
                    <UBadge v-if="tab.badge" color="blue" variant="soft" size="xs">
                      {{ tab.badge.label }}
                    </UBadge>
                  </button>
                </div>
              </div>

              <!-- Tab Content -->
              <div
                class="tab-content p-6 bg-white dark:bg-gray-800 rounded-b-lg shadow-sm border-x border-b border-gray-200 dark:border-gray-700"
              >
                <transition name="tab-fade" mode="out-in">
                  <!-- Description Tab Content -->
                  <div
                    v-if="activeTab === 'description'"
                    :key="'description'"
                    class="tab-content-inner"
                  >
                    <div
                      :id="productContentId"
                      class="prose prose-lg max-w-none dark:prose-invert ticket-content-wrapper"
                      v-html="formattedProductContent"
                    ></div>
                  </div>

                  <!-- Video Review Tab Content -->
                  <div
                    v-else-if="activeTab === 'video'"
                    :key="'video'"
                    class="tab-content-inner"
                  >
                    <div v-if="productData.videoReview" class="video-review-container">
                      <h2
                        v-if="productData.videoTitle"
                        class="mb-4 text-2xl font-bold text-gray-900 dark:text-white"
                      >
                        {{ productData.videoTitle }}
                      </h2>
                      <div
                        class="aspect-w-16 aspect-h-9 mb-6 overflow-hidden rounded-lg shadow-md"
                      >
                        <iframe
                          class="h-full w-full"
                          :src="productData.videoReview"
                          loading="lazy"
                          frameborder="0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowfullscreen
                        ></iframe>
                      </div>
                    </div>
                    <div v-else class="empty-state flex h-64 items-center justify-center">
                      <div class="text-center">
                        <UIcon
                          name="i-heroicons-video"
                          class="mx-auto mb-4 h-16 w-16 text-gray-400"
                        />
                        <p class="text-gray-600 dark:text-gray-400">
                          {{
                            t("tickets.noVideoAvailable") ||
                            "Chưa có video review cho vé này"
                          }}
                        </p>
                      </div>
                    </div>
                  </div>
                </transition>
              </div>
            </div>
          </div>

          <!-- Sidebar -->
          <div class="lg:col-span-1">
            <div class="sticky top-24">
              <ProductDetailSidebar :product="productData" />
            </div>
          </div>
        </div>

        <!-- Cross-Sell Products -->
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <h2 class="text-2xl font-bold text-gray-900 dark:text-white">
            {{ t("tickets.relatedTickets") || "Vé bạn có thể thích" }}
          </h2>
          <CrossSellProducts
            v-if="productData.id"
            :productId="productData.id"
            :limit="4"
          />
        </div>

        <!-- Modal -->
        <GlobalModal :show="isPriceRequestModalOpen" @close="closePriceRequestModal">
          <div class="modal-content">
            <PriceRequestModal
              v-if="productData"
              :is-open="isPriceRequestModalOpen"
              :product-id="productData.id"
              :product-name="productData.translations?.[0]?.title"
              :variant-id="matchingVariant?.id"
              :variant-name="matchingVariant?.sku"
              @success="handlePriceRequestSuccess"
              @close="closePriceRequestModal"
            />
          </div>
        </GlobalModal>

        <Transition name="mobile-bar">
          <div
            v-if="mobileActionMode !== 'hidden'"
            class="mobile-ticket-action-bar fixed inset-x-0 bottom-0 z-40 border-t border-gray-200 bg-white/95 px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-3 shadow-[0_-10px_30px_rgba(15,23,42,0.08)] backdrop-blur lg:hidden dark:border-gray-700 dark:bg-gray-900/95"
          >
            <div class="mx-auto flex max-w-5xl items-center gap-3">
              <div class="min-w-0 flex-1">
                <div class="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  {{ t("tickets.total") || "Tổng tiền" }}
                </div>
                <div class="truncate text-lg font-semibold text-gray-900 dark:text-white">
                  {{ calculateTotal }}
                </div>
                <div class="text-xs text-gray-600 dark:text-gray-400">
                  {{ totalTickets }} {{ t("tickets.ticketCount") || "vé" }}
                </div>
              </div>

              <AddToCartButton
                v-if="mobileActionMode === 'add-to-cart' && getProductForCart"
                :product="getProductForCart"
                :buttonText="t('tickets.addToCart') || 'Thêm vào giỏ hàng'"
                :showQuantity="false"
                buttonClass="flex min-w-[180px] items-center justify-center rounded-xl bg-primary-600 px-4 py-3 text-sm font-semibold text-white transition-colors duration-200 hover:bg-primary-700"
              />

              <UButton
                v-else-if="mobileActionMode === 'request-price'"
                color="primary"
                size="lg"
                class="min-w-[180px] justify-center rounded-xl bg-primary-600 px-4 py-3 text-sm font-semibold text-white hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-600"
                @click="openPriceRequestModal"
              >
                {{ t("tickets.requestPrice") || "Yêu cầu báo giá" }}
              </UButton>

              <UButton
                v-else
                color="primary"
                size="lg"
                class="min-w-[180px] justify-center rounded-xl bg-primary-600 px-4 py-3 text-sm font-semibold text-white hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-600"
                @click="scrollToBuyBox"
              >
                {{ t("tickets.completeSelection") || "Chọn vé để tiếp tục" }}
              </UButton>
            </div>
          </div>
        </Transition>
      </div>

      <div v-else class="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 text-center">
        <AlertTriangle class="mx-auto mb-4 h-16 w-16 text-amber-500" />
        <h2 class="mb-2 text-2xl font-bold">{{ t("tickets.notFound") || "Không tìm thấy vé" }}</h2>
        <p class="mb-6 text-gray-600 dark:text-gray-400">
          {{ t("tickets.notFoundDescription") || "Vé bạn đang tìm kiếm không tồn tại hoặc đã bị xóa" }}
        </p>
        <UButton to="/tickets" color="primary">
          {{ t("tickets.backToTickets") || "Quay lại danh sách vé" }}
        </UButton>
      </div>
    </div>
  </div>
</template>

<style src="~/assets/styles/components/product-detail.scss" scoped /> 
