<script setup lang="ts">
import { computed, ref } from 'vue';
import { ShoppingCart, Ticket, Calendar, MapPin, Clock, Users, Info } from 'lucide-vue-next';
import AppImage from '~/components/ui/AppImage.vue';
import AddToCartButton from '~/components/cart/AddToCartButton.vue';
import VariantSelectionModal from '~/components/modals/VariantSelectionModal.vue';
import { getLocalizedRoute } from '~/utils/routes';
import { useLocalization } from '~/composables/useLocalization';
import { useProduct } from '~/composables/useProduct';
import { useComponentStyles } from '~/composables/useComponentStyles';
import type { Product, ProductTranslation, ProductSpecification } from '@ew/shared';
import { ProductType } from '@ew/shared';

const props = defineProps<{
  product: Product;
  locale?: string;
}>();

const { t } = useLocalization();
const { getTranslationByLocale, formatPrice, calculateDiscountPercentage, getProductUrl } = useProduct();
const { getStyleConfig } = useComponentStyles();

// Lấy style config từ store toàn cục
const styleConfig = computed(() => getStyleConfig('ticket-card'));

const currentLocale = computed(() => props.locale || 'vi');
const translation = computed(() => getTranslationByLocale(props.product, currentLocale.value));
const title = computed(() => translation.value?.title || '');
const shortDescription = computed(() => translation.value?.shortDescription || '');
const productSlug = computed(() => translation.value?.slug || props.product.id.toString());

// Check if product has variants and should show "From" in price
const hasVariants = computed(() => 
  props.product.variants && 
  props.product.variants.length > 0
);

// Calculate minimum price from variants
const minVariantPrice = computed(() => {
  if (!hasVariants.value || !props.product.variants) {
    return props.product.price;
  }
  
  const prices = props.product.variants
    .map((v: any) => v.price)
    .filter((price: number | null | undefined) => price !== null && price !== undefined);
  
  if (prices.length === 0) {
    return props.product.price;
  }
  
  return Math.min(...prices);
});

// Determine if we should show "From" text before price
const shouldShowFromPrice = computed(() => {
  if (!hasVariants.value || !props.product.variants) {
    return false;
  }
  
  const variantPrices = props.product.variants
    .map((v: any) => v.price)
    .filter((price: number | null | undefined) => price !== null && price !== undefined);

  // Show "From" if there are multiple different prices
  return new Set(variantPrices).size > 1;
});

// Format the price with "From" if needed
const displayPrice = computed(() => {
  const priceToDisplay = shouldShowFromPrice.value ? minVariantPrice.value : props.product.price;
  const priceText = formatPrice(priceToDisplay);
  
  if (shouldShowFromPrice.value) {
    return `${t('products.from')} ${priceText}`;
  }
  
  return priceText;
});

// Handle compare price
const displayComparePrice = computed(() => {
  if (!props.product.comparePrice) return null;
  return formatPrice(props.product.comparePrice);
});

const discountPercentage = computed(() => {
  const price = shouldShowFromPrice.value ? minVariantPrice.value : props.product.price;
  const comparePrice = props.product.comparePrice;
  
  if (price === null || price === undefined || comparePrice === null || comparePrice === undefined) {
    return null;
  }
  
  return calculateDiscountPercentage(price, comparePrice);
});

// Thay đổi link để trỏ đến trang chi tiết vé thay vì trang chi tiết sản phẩm
const productLink = computed(() => `/tickets/${productSlug.value}`);

// Style computed properties
const imageStyle = computed(() => ({
  height: `${styleConfig.value?.settings?.imageHeight || 200}px`
}));

const labelStyle = (type: 'featured' | 'new' | 'sale' | 'discount') => ({
  backgroundColor: styleConfig.value?.settings?.labelStyles?.[type]?.backgroundColor || '',
  color: styleConfig.value?.settings?.labelStyles?.[type]?.textColor || ''
});

// Ticket specific specs
const ticketLocation = computed(() => props.product.specifications?.find((spec: ProductSpecification) => spec.name === 'location')?.value || '');
const ticketDate = computed(() => props.product.specifications?.find((spec: ProductSpecification) => spec.name === 'date')?.value || '');
const ticketTime = computed(() => props.product.specifications?.find((spec: ProductSpecification) => spec.name === 'time')?.value || '');
const ticketCapacity = computed(() => props.product.specifications?.find((spec: ProductSpecification) => spec.name === 'capacity')?.value || '');

const otherSpecs = computed(() => {
  if (!props.product.specifications) return [];
  return props.product.specifications.filter(
    spec => !['location', 'date', 'time', 'capacity'].includes(spec.name)
  );
});

// Modal state
const isVariantModalOpen = ref(false);

// Handle add to cart
const handleAddToCart = (variant?: any) => {
  if (hasVariants.value) {
    isVariantModalOpen.value = true;
  } else {
    // Nếu không có variant, thêm trực tiếp vào giỏ hàng
    const productData = {
      id: props.product.id,
      title: title.value,
      price: props.product.price,
      comparePrice: props.product.comparePrice || undefined,
      formattedPrice: displayPrice.value,
      variantId: undefined,
      variantName: undefined,
      sku: props.product.sku || '',
      stock: props.product.stock,
      hasRequiredAttributes: false,
      hasSelectedAllAttributes: true
    };
    
    // Emit event để thêm vào giỏ hàng
    // Bạn cần thêm logic xử lý thêm vào giỏ hàng ở đây

  }
};

// Handle variant selection
const handleVariantSelected = (variant: any) => {
  // Xử lý khi người dùng chọn variant và nhấn thêm vào giỏ hàng
  const productData = {
    id: props.product.id,
    title: title.value,
    price: variant.price,
    comparePrice: variant.comparePrice || undefined,
    formattedPrice: formatPrice(variant.price),
    variantId: variant.id,
    variantName: variant.name,
    sku: variant.sku || props.product.sku || '',
    stock: variant.stock || props.product.stock,
    hasRequiredAttributes: false,
    hasSelectedAllAttributes: true
  };
  
  // Emit event để thêm vào giỏ hàng
  // Bạn cần thêm logic xử lý thêm vào giỏ hàng ở đây
  
};
</script>

<template>
  <div
    v-if="props.product"
    class="ticket-card group relative overflow-hidden rounded-lg border-2 border-purple-200 bg-white shadow-sm transition-all hover:shadow-md dark:border-purple-900 dark:bg-gray-800"
  >
    <!-- Badge: New, Sale, Featured -->
    <div class="absolute left-2 top-2 z-10 flex flex-col gap-1">
      <!-- Ticket Badge -->
      <UBadge
        color="purple"
        variant="solid"
        class="text-xs"
      >
        <Ticket class="w-3 h-3 mr-1" />
        {{ t("tickets.ticketType") }}
      </UBadge>
      
      <UBadge
        v-if="product.isNew && styleConfig?.settings?.showLabels?.new"
        :style="labelStyle('new')"
        variant="solid"
        class="text-xs"
      >
        {{ t("common.new") }}
      </UBadge>
      <UBadge
        v-if="product.isSale && styleConfig?.settings?.showLabels?.sale"
        :style="labelStyle('sale')"
        variant="solid"
        class="text-xs"
      >
        {{ t("common.sale") }}
      </UBadge>
      <UBadge
        v-if="product.isFeatured && styleConfig?.settings?.showLabels?.featured"
        :style="labelStyle('featured')"
        variant="solid"
        class="text-xs"
      >
        {{ t("common.featured") }}
      </UBadge>
    </div>

    <!-- Discount percentage -->
    <div
      v-if="discountPercentage && styleConfig?.settings?.showLabels?.discount"
      class="absolute right-2 top-2 z-10"
    >
      <UBadge :style="labelStyle('discount')" variant="solid" class="text-xs">
        -{{ discountPercentage }}%
      </UBadge>
    </div>

    <!-- Product image -->
    <NuxtLink :to="productLink" class="block overflow-hidden" :style="imageStyle">
      <img
        :src="product.thumbnail || '/images/default-image.jpg'"
        :alt="title"
        class="transition-transform duration-300 group-hover:scale-105 object-cover w-full h-full"
        @error="($event.target as HTMLImageElement).src = '/images/default-image.jpg'"
      />
    </NuxtLink>

    <!-- Ticket info -->
    <div class="ticket-info p-4 flex flex-col">
      <NuxtLink :to="productLink" class="block">
        <h3
          class="ticket-title mb-2 text-lg font-semibold text-gray-900 dark:text-gray-100 line-clamp-2"
        >
          {{ title }}
        </h3>
      </NuxtLink>

      <!-- Short Description -->
      <p v-if="shortDescription" class="ticket-description mb-3 text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
        {{ shortDescription }}
      </p>

      <!-- Ticket Details -->
      <div class="ticket-details mb-3 space-y-2">
        <div v-if="ticketLocation" class="flex items-center text-sm text-gray-600 dark:text-gray-400">
          <MapPin class="w-4 h-4 mr-2 flex-shrink-0" />
          <span class="line-clamp-1">{{ ticketLocation }}</span>
        </div>
        <div v-if="ticketDate" class="flex items-center text-sm text-gray-600 dark:text-gray-400">
          <Calendar class="w-4 h-4 mr-2 flex-shrink-0" />
          <span>{{ ticketDate }}</span>
        </div>
        <div v-if="ticketTime" class="flex items-center text-sm text-gray-600 dark:text-gray-400">
          <Clock class="w-4 h-4 mr-2 flex-shrink-0" />
          <span>{{ ticketTime }}</span>
        </div>
        <div v-if="ticketCapacity" class="flex items-center text-sm text-gray-600 dark:text-gray-400">
          <Users class="w-4 h-4 mr-2 flex-shrink-0" />
          <span>{{ ticketCapacity }}</span>
        </div>
        <div 
          v-for="spec in otherSpecs" 
          :key="spec.name" 
          class="flex items-center text-sm text-gray-600 dark:text-gray-400"
        >
          <Info class="w-4 h-4 mr-2 flex-shrink-0" />
          <span>{{ spec.name }}: {{ spec.value }}</span>
        </div>
      </div>

      <div class="ticket-footer mt-auto flex items-center justify-between">
        <div>
          <div class="flex items-center gap-2">
            <span class="text-lg font-semibold text-primary-600 dark:text-primary-400">
              {{ displayPrice }}
            </span>
            <span
              v-if="displayComparePrice"
              class="text-sm text-gray-500 line-through dark:text-gray-400"
            >
              {{ displayComparePrice }}
            </span>
          </div>
        </div>

        <!-- Nút thêm vào giỏ hàng -->
        <div class="flex items-center">
          <UButton
            color="primary"
            variant="solid"
            class="p-2 flex items-center justify-center rounded-full hover:scale-110 transition-transform duration-200 cart-button-small"
            @click="handleAddToCart"
          >
            <ShoppingCart class="w-5 h-5" />
          </UButton>
        </div>
      </div>
    </div>
  </div>

  <!-- Modal chọn variant -->
  <VariantSelectionModal
    v-if="hasVariants"
    :product="product"
    v-model:isOpen="isVariantModalOpen"
    @add-to-cart="handleVariantSelected"
  />
</template>

<style scoped>
.ticket-card {
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  height: 100%;
  border-color: rgba(168, 85, 247, 0.3);
}

.ticket-card:hover {
  transform: translateY(-5px);
}

/* Đảm bảo chiều cao cố định cho phần thông tin vé */
.ticket-info {
  height: auto;
  min-height: 11rem;
  display: grid;
  grid-template-rows: auto auto 1fr;
}

.ticket-title {
  height: 3rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: normal;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  line-height: 1.5rem;
}

.ticket-details {
  margin-top: 0.25rem;
}

.ticket-footer {
  align-self: end;
  width: 100%;
}

/* CSS cho nút thêm vào giỏ hàng nhỏ */
:deep(.cart-button-small) {
  background: rgb(var(--color-primary-500));
  box-shadow: 0 2px 4px rgb(var(--color-primary-500) / 0.3);
  transition: all 0.15s ease;
  width: 2.5rem;
  height: 2.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

:deep(.cart-button-small svg) {
  width: 20px;
  height: 20px;
  min-width: 20px;
  min-height: 20px;
}

:deep(.cart-button-small:hover) {
  background: rgb(var(--color-primary-600));
  box-shadow: 0 4px 8px rgb(var(--color-primary-500) / 0.4);
}

:deep(.cart-button-small:active) {
  transform: scale(0.95);
}

.dark :deep(.cart-button-small) {
  background: rgb(var(--color-primary-600));
  box-shadow: 0 2px 4px rgb(var(--color-primary-500) / 0.4);
}

.dark :deep(.cart-button-small:hover) {
  background: rgb(var(--color-primary-700));
  box-shadow: 0 4px 8px rgb(var(--color-primary-500) / 0.5);
}
</style> 