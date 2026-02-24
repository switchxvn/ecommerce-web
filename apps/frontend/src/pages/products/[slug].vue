<script setup lang="ts">
import { ProductType } from '@ew/shared';
import { useHead } from '@unhead/vue';
import {
  AlertCircle,
  AlertTriangle,
  Calendar,
  Check,
  Clock,
  Facebook,
  Info,
  LayoutGrid,
  Link,
  Linkedin,
  ListOrdered,
  Mail,
  MapPin,
  Tag,
  Ticket,
  Twitter
} from 'lucide-vue-next';
import { DatePicker } from 'v-calendar';
import 'v-calendar/style.css';
import { computed, nextTick, ref, unref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import AddToCartButton from "~/components/cart/AddToCartButton.vue";
import Breadcrumb from "~/components/common/Breadcrumb.vue";
import TableOfContents from "~/components/common/TableOfContents.vue";
import CrossSellProducts from "~/components/product/CrossSellProducts.vue";
import PriceRequestModal from "~/components/product/PriceRequestModal.vue";
import QuickPurchaseModal from "~/components/product/QuickPurchaseModal.vue";
import ProductDetailSidebar from "~/components/product/ProductDetailSidebar.vue";
import ProductSpecifications from "~/components/product/ProductSpecifications.vue";
import GlobalModal from "~/components/ui/GlobalModal.vue";
import LazyImage from "~/components/ui/LazyImage.vue";
import { useLocalization } from "~/composables/useLocalization";
import { useProductDetail } from '~/composables/useProductDetail';
import { useCart } from "~/composables/useCart";
import { useSettings } from "~/composables/useSettings";
import TierPricingTable from "~/components/product/TierPricingTable.vue";

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
  tabs,
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
  canBuyNow,
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
  getTabIcon
} = useProductDetail();

const { getPublicSettingValueByKey } = useSettings();
const quickPurchaseEnabled = ref(false);

try {
  const quickPurchaseSetting = await getPublicSettingValueByKey('enable_quick_purchase', 'false');
  quickPurchaseEnabled.value = quickPurchaseSetting === 'true';
} catch (error) {
  console.error('Failed to load quick purchase setting:', error);
}

// Add new refs for date selection
const selectedDate = ref<Date | null>(null);

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

// Extend base canAddToCart with date validation for tickets
const canAddToCart = computed(() => {
  const baseCanAdd = baseCanAddToCart.value;
  if (productData.value?.type === ProductType.TICKET) {
    return baseCanAdd && selectedDate.value !== null;
  }
  return baseCanAdd;
});

// Định nghĩa alias cho URL tiếng Việt (nếu cần)
definePageMeta({
  layout: "default",
});

const productQuantity = ref(1);
const isQuickPurchaseModalOpen = ref(false);

// Handle Buy Now - add to cart and redirect to checkout
const handleBuyNow = async () => {
  if (!canBuyNow.value || !getProductForCart.value) return;
  
  const { addToCart } = useCart();
  const cartItem = {
    productId: productData.value!.id,
    variantId: matchingVariant.value?.id,
    quantity: 1,
    metadata: {
      variantName: matchingVariant.value ? Object.entries(selectedAttributes.value).map(([attributeId, valueId]) => {
        const attribute = productAttributes.value.find(attr => attr.id === Number(attributeId));
        const value = attribute?.values.find(val => val.id === Number(valueId));
        return value?.displayValue;
      }).join(' - ') : undefined,
      sku: matchingVariant.value?.sku || productData.value!.sku
    }
  };
  
  try {
    await addToCart(cartItem);
    // Redirect to checkout immediately
    await router.push('/checkout');
  } catch (error) {
    console.error('Error in buy now:', error);
  }
};

const openQuickPurchaseModal = () => {
  if (!quickPurchaseEnabled.value) return;
  isQuickPurchaseModalOpen.value = true;
};

const closeQuickPurchaseModal = () => {
  isQuickPurchaseModalOpen.value = false;
};

// Thiết lập meta tags
useHead({
  title: unref(computed(() => productData.value?.metaTitle || productTitle.value || "Chi tiết sản phẩm")),
  meta: [
    {
      name: "description",
      content: unref(computed(() => productData.value?.metaDescription || productShortDescription.value || "")),
    },
    { 
      name: "keywords", 
      content: unref(computed(() => productData.value?.metaKeywords || "")),
    },
    // Open Graph
    {
      property: "og:title",
      content: unref(computed(() => productData.value?.ogTitle || productTitle.value || "")),
    },
    {
      property: "og:description",
      content: unref(computed(() => 
        productData.value?.ogDescription ||
        productData.value?.metaDescription ||
        productShortDescription.value ||
        ""
      )),
    },
    {
      property: "og:image",
      content: unref(computed(() => productData.value?.ogImage || productData.value?.thumbnail || "")),
    },
    { 
      property: "og:url", 
      content: unref(computed(() => canonicalUrl.value)),
    },
    { 
      property: "og:type", 
      content: "product",
    },
    // Twitter Card
    { 
      name: "twitter:card", 
      content: "summary_large_image",
    },  
    {
      name: "twitter:title",
      content: unref(computed(() => productData.value?.ogTitle || productTitle.value || "")),
    },
    {
      name: "twitter:description",
      content: unref(computed(() => productData.value?.ogDescription || productShortDescription.value || "")),
    },
    {
      name: "twitter:image",
      content: unref(computed(() => productData.value?.ogImage || productData.value?.thumbnail || "")),
    },
  ],
  link: [
    { 
      rel: "canonical", 
      href: unref(computed(() => canonicalUrl.value)),
    },
  ],
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
</script>

<template>
  <div class="product-detail min-h-screen bg-gray-50 dark:bg-gray-900">
    <div class="container mx-auto px-4 py-8">
      <!-- Breadcrumb -->
      <div class="mb-6">
        <Breadcrumb
          :items="[
            { label: t('products.title'), to: '/products' },
            { label: productTitle },
          ]"
        />
      </div>

      <div v-if="isLoading" class="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <USkeleton class="mb-4 h-8 w-2/3" />
        <div class="grid grid-cols-1 gap-8 md:grid-cols-2">
          <USkeleton class="h-96 w-full rounded-lg" />
          <div>
            <USkeleton class="mb-4 h-6 w-1/3" />
            <USkeleton class="mb-4 h-6 w-1/4" />
            <USkeleton class="mb-6 h-24 w-full" />
            <USkeleton class="mb-4 h-10 w-full" />
          </div>
        </div>
      </div>

      <div
        v-else-if="error"
        class="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 text-center"
      >
        <AlertCircle class="mx-auto mb-4 h-16 w-16 text-red-500" />
        <h2 class="mb-2 text-2xl font-bold">{{ t("products.error") || "Lỗi" }}</h2>
        <p class="mb-6 text-gray-600 dark:text-gray-400">
          {{
            error.message ||
            t("products.errorDescription") ||
            "Có lỗi xảy ra khi tải thông tin sản phẩm"
          }}
        </p>
        <UButton @click="refresh" color="primary" class="mr-2">
          {{ t("products.tryAgain") || "Thử lại" }}
        </UButton>
        <UButton to="/products" color="gray">
          {{ t("products.backToProducts") || "Quay lại danh sách sản phẩm" }}
        </UButton>
      </div>

      <div v-else-if="productData" class="product-content space-y-8">
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <!-- Phần thông tin sản phẩm -->
          <div class="grid grid-cols-1 gap-8 md:grid-cols-2">
            <!-- Product Images -->
            <div class="product-images bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
              <LazyImage
                :src="productData.thumbnail || ''"
                :alt="productTitle"
                fallbackSrc="/images/default-image.jpg"
                customClass="h-auto w-full rounded-lg"
              />

              <!-- Gallery slider -->
              <div
                v-if="productData.gallery && productData.gallery.length > 0"
                class="mt-4 grid grid-cols-4 gap-2"
              >
                <LazyImage
                  v-for="(image, index) in productData.gallery"
                  :key="index"
                  :src="image"
                  :alt="`${productTitle} - ${index + 1}`"
                  fallbackSrc="/images/default-image.jpg"
                  customClass="h-20 w-full cursor-pointer rounded-md"
                />
              </div>

              <!-- Thông tin bổ sung cho vé -->
              <div v-if="productData.type === ProductType.TICKET" class="mt-4 space-y-4">
                <!-- Các lưu ý quan trọng -->
                <div class="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                  <h3 class="text-base font-medium text-gray-900 dark:text-white mb-2 flex items-center">
                    <AlertCircle class="w-5 h-5 mr-2 text-amber-500" />
                    {{ t("products.ticketNotes") || "Lưu ý quan trọng" }}
                  </h3>
                  <ul class="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                    <li class="flex items-start">
                      <Check class="w-4 h-4 mr-2 text-green-500 mt-0.5 flex-shrink-0" />
                      {{ t("products.ticketNote1") || "Vé có giá trị trong ngày tham quan" }}
                    </li>
                    <li class="flex items-start">
                      <Check class="w-4 h-4 mr-2 text-green-500 mt-0.5 flex-shrink-0" />
                      {{ t("products.ticketNote2") || "Vui lòng mang theo CMND/CCCD khi sử dụng vé" }}
                    </li>
                    <li class="flex items-start">
                      <Check class="w-4 h-4 mr-2 text-green-500 mt-0.5 flex-shrink-0" />
                      {{ t("products.ticketNote3") || "Trẻ em dưới 3 tuổi được miễn phí vé vào cổng" }}
                    </li>
                  </ul>
                </div>

                <!-- Quy trình sử dụng vé -->
                <div class="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                  <h3 class="text-base font-medium text-gray-900 dark:text-white mb-3 flex items-center">
                    <ListOrdered class="w-5 h-5 mr-2 text-primary-500" />
                    {{ t("products.ticketProcess") || "Quy trình sử dụng vé" }}
                  </h3>
                  <div class="relative">
                    <!-- Timeline line -->
                    <div class="absolute left-2.5 top-0 h-full w-[2px] bg-gray-200 dark:bg-gray-700"></div>
                    
                    <ul class="relative space-y-6">
                      <li class="flex items-start">
                        <div class="flex-shrink-0 relative">
                          <div class="flex h-6 w-6 items-center justify-center rounded-full border-2 border-primary-500 bg-white dark:bg-gray-800 text-primary-600 text-sm font-medium">1</div>
                        </div>
                        <div class="ml-4 flex-grow">
                          <h4 class="text-sm font-medium text-gray-900 dark:text-white">
                            {{ t("products.ticketStep1") || "Đặt vé trực tuyến" }}
                          </h4>
                          <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
                            {{ t("products.ticketStep1Desc") || "Chọn loại vé và thanh toán" }}
                          </p>
                        </div>
                      </li>

                      <li class="flex items-start">
                        <div class="flex-shrink-0 relative">
                          <div class="flex h-6 w-6 items-center justify-center rounded-full border-2 border-primary-500 bg-white dark:bg-gray-800 text-primary-600 text-sm font-medium">2</div>
                        </div>
                        <div class="ml-4 flex-grow">
                          <h4 class="text-sm font-medium text-gray-900 dark:text-white">
                            {{ t("products.ticketStep2") || "Nhận mã vé" }}
                          </h4>
                          <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
                            {{ t("products.ticketStep2Desc") || "Qua email hoặc tin nhắn SMS" }}
                          </p>
                        </div>
                      </li>

                      <li class="flex items-start">
                        <div class="flex-shrink-0 relative">
                          <div class="flex h-6 w-6 items-center justify-center rounded-full border-2 border-primary-500 bg-white dark:bg-gray-800 text-primary-600 text-sm font-medium">3</div>
                        </div>
                        <div class="ml-4 flex-grow">
                          <h4 class="text-sm font-medium text-gray-900 dark:text-white">
                            {{ t("products.ticketStep3") || "Sử dụng vé" }}
                          </h4>
                          <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
                            {{ t("products.ticketStep3Desc") || "Xuất trình mã vé tại cổng" }}
                          </p>
                        </div>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <!-- Product Info -->
            <div class="product-info bg-white dark:bg-gray-800 rounded-lg p-6">
              <!-- Ticket Type Badge -->
              <div v-if="productData.type === ProductType.TICKET" class="mb-4">
                <UBadge color="purple" variant="solid" class="text-sm font-medium">
                  <Ticket class="w-4 h-4 mr-1" />
                  {{ t("products.ticketType") || "Vé" }}
                </UBadge>
              </div>

              <div
                v-if="productData.isNew || productData.isSale || productData.isFeatured"
                class="mb-4 flex flex-wrap gap-2"
              >
                <UBadge v-if="productData.isNew" color="blue" variant="solid">Mới</UBadge>
                <UBadge v-if="productData.isSale" color="red" variant="solid"
                  >Giảm giá</UBadge
                >
                <UBadge v-if="productData.isFeatured" color="amber" variant="solid"
                  >Nổi bật</UBadge
                >
              </div>

              <h1 class="mb-2 text-3xl font-bold text-gray-900 dark:text-white">
                {{ productTitle }}
              </h1>

              <div
                v-if="productData.sku"
                class="mb-4 text-sm text-gray-600 dark:text-gray-400"
              >
                SKU: {{ productData.sku }}
              </div>

              <!-- Hiển thị danh mục sản phẩm -->
              <div
                v-if="productData.categories && productData.categories.length > 0"
                class="mb-5"
              >
                <div class="category-title text-base font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <LayoutGrid class="inline-block mr-1 h-5 w-5 text-primary-500" />
                  {{ t("products.categories") || "Danh mục:" }}
                </div>
                <div class="flex flex-wrap gap-2">
                  <UBadge
                    v-for="category in productData.categories"
                    :key="category.id"
                    size="lg"
                    class="category-badge cursor-pointer hover:bg-primary-100 dark:hover:bg-primary-800 transition-colors"
                    @click="router.push(`/categories/${category.translations?.[0]?.slug || ''}`)"
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

              <!-- Product Variants -->
              <div v-if="productData?.type === ProductType.TICKET" class="mb-6">
                <div class="text-base font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {{ t("products.departureDate") }}
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
                        :placeholder="t('products.selectDepartureDate')"
                        class="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none dark:bg-gray-800"
                        readonly
                      />
                    </template>
                  </DatePicker>
                  <div v-if="selectedDate" class="text-sm text-gray-600 dark:text-gray-400">
                    {{ t("products.selectedDate") }}: {{ selectedDate.toLocaleDateString(currentLocale) }}
                  </div>
                </div>
              </div>

              <!-- Product Variants -->
              <div v-if="productAttributes.length > 0" class="mb-6 space-y-4">
                <div 
                  v-for="attribute in productAttributes" 
                  :key="attribute.id" 
                  class="attribute-group"
                >
                  <div class="text-base font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {{ attribute.displayName }}
                    <span v-if="attribute.required" class="text-red-500">*</span>
                  </div>
                  
                  <div class="flex flex-wrap gap-2">
                    <button
                      v-for="value in attribute.values"
                      :key="value.id"
                      @click="handleSelectAttribute(attribute.id, value.id)"
                      :class="[
                        'attribute-value-btn min-w-[120px]',
                        'relative flex items-center justify-between gap-2 p-3 rounded-lg transition-all',
                        selectedAttributes[attribute.id] === value.id
                          ? 'bg-primary-500 text-white dark:bg-primary-600'
                          : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-primary-300 hover:bg-primary-50 dark:hover:bg-gray-700',
                        !isAttributeValueAvailable(attribute.id, value.id)
                          ? 'opacity-50 cursor-not-allowed'
                          : 'cursor-pointer'
                      ]"
                      :disabled="!isAttributeValueAvailable(attribute.id, value.id)"
                    >
                      <div class="flex items-center gap-2 flex-1">
                        <!-- Thumbnail nếu có -->
                        <LazyImage
                          v-if="value.thumbnail"
                          :src="value.thumbnail"
                          :alt="value.displayValue"
                          class="w-10 h-10 rounded-md object-cover"
                          @error="(e) => e.target.style.display = 'none'"
                        />
                        
                        <!-- Value Info -->
                        <span class="text-sm font-medium">
                          {{ value.displayValue }}
                        </span>
                      </div>

                      <!-- Selected Indicator -->
                      <Check
                        v-if="selectedAttributes[attribute.id] === value.id"
                        class="w-5 h-5 text-white flex-shrink-0"
                      />
                    </button>
                  </div>
                </div>

                <!-- Hiển thị thông báo nếu không có variant phù hợp -->
                <div
                  v-if="hasRequiredAttributes && !matchingVariant"
                  class="text-sm text-red-600 dark:text-red-400 mt-2 flex items-center gap-2"
                >
                  <AlertTriangle class="w-4 h-4" />
                  {{ t("products.noMatchingVariant") || "Không có sản phẩm phù hợp với lựa chọn của bạn" }}
                </div>
              </div>

              <!-- Ticket Specific Information -->
              <div v-if="productData.type === ProductType.TICKET" class="mb-6">
                <div class="ticket-info bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <div class="grid grid-cols-2 gap-4">
                    <div class="ticket-info-item">
                      <div class="text-sm text-gray-500 dark:text-gray-400 mb-1">
                        <Calendar class="w-4 h-4 inline-block mr-1" />
                        {{ t("products.ticketDate") || "Ngày sử dụng" }}
                      </div>
                      <div class="font-medium">
                        {{ productData.specifications?.find(spec => spec.name === 'date')?.value || 'Liên hệ để biết thêm' }}
                      </div>
                    </div>
                    <div class="ticket-info-item">
                      <div class="text-sm text-gray-500 dark:text-gray-400 mb-1">
                        <Clock class="w-4 h-4 inline-block mr-1" />
                        {{ t("products.ticketTime") || "Thời gian" }}
                      </div>
                      <div class="font-medium">
                        {{ productData.specifications?.find(spec => spec.name === 'time')?.value || 'Liên hệ để biết thêm' }}
                      </div>
                    </div>
                    <div class="ticket-info-item">
                      <div class="text-sm text-gray-500 dark:text-gray-400 mb-1">
                        <MapPin class="w-4 h-4 inline-block mr-1" />
                        {{ t("products.ticketLocation") || "Địa điểm" }}
                      </div>
                      <div class="font-medium">
                        {{ productData.specifications?.find(spec => spec.name === 'location')?.value || 'Liên hệ để biết thêm' }}
                      </div>
                    </div>
                    <div class="ticket-info-item">
                      <div class="text-sm text-gray-500 dark:text-gray-400 mb-1">
                        <Info class="w-4 h-4 inline-block mr-1" />
                        {{ t("products.ticketValidity") || "Hiệu lực" }}
                      </div>
                      <div class="font-medium">
                        {{ productData.specifications?.find(spec => spec.name === 'validity')?.value || 'Liên hệ để biết thêm' }}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Hiển thị giá -->
              <div class="mb-6 flex items-center gap-3">
                <span class="text-2xl font-bold text-primary-600 dark:text-primary-400">
                  {{ displayPrice }}
                </span>
                <span
                  v-if="displayComparePrice && matchingVariant"
                  class="text-lg text-gray-500 line-through dark:text-gray-400"
                >
                  {{ displayComparePrice }}
                </span>
              </div>

              <!-- Tiered Pricing Table -->
              <TierPricingTable 
                v-if="!hasRequiredAttributes || matchingVariant"
                :productId="!matchingVariant ? productData?.id : null"
                :variantId="matchingVariant?.id || null"
                :quantity="productQuantity"
                :originalPrice="matchingVariant?.price || productData?.price || 0"
                class="mb-6"
              />

              <div
                v-if="productShortDescription"
                class="mb-6 text-gray-700 dark:text-gray-300"
              >
                {{ productShortDescription }}
              </div>

              <!-- Nút chia sẻ mạng xã hội -->
              <div class="mb-6">
                <div class="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  {{ t("products.shareProduct") || "Chia sẻ sản phẩm:" }}
                </div>
                <div class="share-buttons flex flex-wrap gap-2">
                  <div class="tooltip">
                    <UButton
                      color="blue"
                      variant="soft"
                      size="sm"
                      @click="shareToFacebook"
                      class="share-button"
                    >
                      <Facebook class="h-5 w-5" />
                    </UButton>
                    <span class="tooltip-text">{{
                      t("products.shareOnFacebook") || "Chia sẻ lên Facebook"
                    }}</span>
                  </div>

                  <div class="tooltip">
                    <UButton
                      color="sky"
                      variant="soft"
                      size="sm"
                      @click="shareToTwitter"
                      class="share-button"
                    >
                      <Twitter class="h-5 w-5" />
                    </UButton>
                    <span class="tooltip-text">{{
                      t("products.shareOnTwitter") || "Chia sẻ lên Twitter"
                    }}</span>
                  </div>

                  <div class="tooltip">
                    <UButton
                      color="blue"
                      variant="soft"
                      size="sm"
                      @click="shareToLinkedIn"
                      class="share-button"
                    >
                      <Linkedin class="h-5 w-5" />
                    </UButton>
                    <span class="tooltip-text">{{
                      t("products.shareOnLinkedIn") || "Chia sẻ lên LinkedIn"
                    }}</span>
                  </div>

                  <div class="tooltip">
                    <UButton
                      color="emerald"
                      variant="soft"
                      size="sm"
                      @click="shareViaEmail"
                      class="share-button"
                    >
                      <Mail class="h-5 w-5" />
                    </UButton>
                    <span class="tooltip-text">{{
                      t("products.shareViaEmail") || "Chia sẻ qua Email"
                    }}</span>
                  </div>

                  <div class="tooltip">
                    <UButton
                      color="gray"
                      variant="soft"
                      size="sm"
                      @click="copyProductLink"
                      class="share-button"
                    >
                      <Link class="h-5 w-5" />
                    </UButton>
                    <span class="tooltip-text">{{
                      t("products.copyLink") || "Sao chép liên kết"
                    }}</span>
                  </div>
                </div>
              </div>

              <!-- Buttons -->
              <div class="space-y-4">
                <!-- Add to Cart Button -->
                <AddToCartButton
                  v-if="canAddToCart && getProductForCart && !quickPurchaseEnabled"
                  :product="getProductForCart"
                  :buttonText="t('products.addToCart') || 'Thêm vào giỏ hàng'"
                  :showQuantity="!hasRequiredAttributes"
                  buttonClass="w-full bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-lg font-medium text-base transition-colors duration-200 flex items-center justify-center gap-2"
                />

                <UButton
                  v-if="quickPurchaseEnabled"
                  color="primary"
                  variant="outline"
                  size="lg"
                  block
                  class="border-primary-600 text-primary-600 hover:bg-primary-50 dark:border-primary-500 dark:text-primary-300 font-medium py-3 text-base"
                  @click="openQuickPurchaseModal"
                >
                  {{ t("products.quickPurchase") || "Mua hàng nhanh" }}
                </UButton>

                <!-- Buy Now Button -->
                <UButton
                  v-if="canBuyNow && getProductForCart && !quickPurchaseEnabled"
                  color="orange"
                  size="lg"
                  block
                  class="bg-orange-600 hover:bg-orange-700 dark:bg-orange-500 dark:hover:bg-orange-600 text-white font-medium py-3 text-base"
                  @click="handleBuyNow"
                >
                  <template #leading>
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
                    </svg>
                  </template>
                  {{ t("products.buyNow") || "Mua ngay" }}
                </UButton>

                <!-- Price Request Button -->
                <UButton
                  v-if="shouldShowPriceRequest"
                  color="primary"
                  size="lg"
                  block
                  icon="i-heroicons-currency-dollar"
                  class="mb-4 bg-primary-600 hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-600 text-white font-medium py-3 text-base"
                  @click="openPriceRequestModal"
                >
                  {{ t("products.requestPrice") || "Yêu cầu báo giá" }}
                </UButton>

                <!-- Contact Button when product is not available -->
                <UButton
                  v-if="!canAddToCart && !shouldShowPriceRequest"
                  color="gray"
                  size="lg"
                  block
                  icon="i-heroicons-phone"
                  class="bg-gray-500 hover:bg-gray-600 text-white font-medium py-3 text-base"
                  @click="$router.push('/contact')"
                >
                  {{ t("products.contact") || "Liên hệ" }}
                </UButton>
              </div>
            </div>
          </div>
        </div>

        <!-- Phần mô tả sản phẩm và sidebar -->
        <div class="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <!-- Phần mô tả sản phẩm và tabs -->
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

            <!-- Product Description and Video Review Tabs -->
            <div
              v-if="productContent || productData.videoReview || productData.id"
              class="product-tabs bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden"
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
                      class="prose prose-lg max-w-none dark:prose-invert product-content-wrapper"
                      v-html="formattedProductContent"
                    ></div>
                  </div>

                  <!-- Specifications Tab Content -->
                  <div
                    v-else-if="activeTab === 'specifications'"
                    :key="'specifications'"
                    class="tab-content-inner"
                  >
                    <ProductSpecifications
                      v-if="productData.id"
                      :productId="productData.id"
                      :locale="currentLocale"
                    />
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
                            t("products.noVideoAvailable") ||
                            "Chưa có video review cho sản phẩm này"
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
            {{ t("products.relatedProducts") || "Sản phẩm bạn có thể thích" }}
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

        <QuickPurchaseModal
          v-if="productData"
          :is-open="isQuickPurchaseModalOpen"
          :product-id="productData.id"
          :product-name="productTitle"
          @close="closeQuickPurchaseModal"
          @success="closeQuickPurchaseModal"
        />
      </div>

      <div v-else class="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 text-center">
        <AlertTriangle class="mx-auto mb-4 h-16 w-16 text-amber-500" />
        <h2 class="mb-2 text-2xl font-bold">{{ t("products.notFound") }}</h2>
        <p class="mb-6 text-gray-600 dark:text-gray-400">
          {{ t("products.notFoundDescription") }}
        </p>
        <UButton to="/products" color="primary">
          {{ t("products.backToProducts") }}
        </UButton>
      </div>
    </div>
  </div>
</template>

<style src="~/assets/styles/components/product-detail.scss" scoped />
