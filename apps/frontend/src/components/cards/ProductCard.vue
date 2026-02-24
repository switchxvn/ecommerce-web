<script setup lang="ts">
import { computed } from 'vue';
import { ShoppingCart, Ticket, Calendar, MapPin } from 'lucide-vue-next';
import LazyImage from '~/components/ui/LazyImage.vue';
import AddToCartButton from '~/components/cart/AddToCartButton.vue';
import { getLocalizedRoute } from '~/utils/routes';
import { useLocalization } from '~/composables/useLocalization';
import { useProduct } from '~/composables/useProduct';
import { useComponentStyles } from '~/composables/useComponentStyles';
import type { Product, ProductTranslation, ProductSpecification } from '@ew/shared';
import { ProductType } from '@ew/shared';

interface ComponentStyleConfig {
  settings: {
    imageHeight: number;
    showLabels: {
      new: boolean;
      sale: boolean;
      featured: boolean;
      discount: boolean;
    };
    labelStyles: {
      featured: {
        backgroundColor: string;
        textColor: string;
      };
      new: {
        backgroundColor: string;
        textColor: string;
      };
      sale: {
        backgroundColor: string;
        textColor: string;
      };
      discount: {
        backgroundColor: string;
        textColor: string;
      };
    };
    priceStyles?: {
      price?: {
        fontSize?: string | number | null;
        color?: string | null;
        fontWeight?: string | number | null;
      };
      comparePrice?: {
        fontSize?: string | number | null;
        color?: string | null;
        fontWeight?: string | number | null;
      };
    };
  };
}

const props = defineProps<{
  product: Product & {
    formattedComparePrice?: string;
  };
  locale?: string;
}>();

const { t } = useLocalization();
const { getTranslationByLocale, formatPrice, calculateDiscountPercentage, getProductUrl } = useProduct();
const { getStyleConfig } = useComponentStyles();

const formatFontSize = (value?: string | number | null) => {
  if (value === null || value === undefined) return undefined;
  if (typeof value === 'number' && !Number.isNaN(value)) {
    return `${value}px`;
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }
  return undefined;
};

const formatFontWeight = (value?: string | number | null) => {
  if (value === null || value === undefined) return undefined;
  if (typeof value === 'number' && !Number.isNaN(value)) {
    return value;
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }
  return undefined;
};

// Lấy style config từ store toàn cục
const styleConfig = computed(() => getStyleConfig('product-card') || {
  settings: {
    imageHeight: 300,
    showLabels: {
      new: true,
      sale: true,
      featured: true,
      discount: true
    },
    labelStyles: {
      featured: {
        backgroundColor: '#4F46E5',
        textColor: '#ffffff'
      },
      new: {
        backgroundColor: '#10B981',
        textColor: '#ffffff'
      },
      sale: {
        backgroundColor: '#EF4444', 
        textColor: '#ffffff'
      },
      discount: {
        backgroundColor: '#F59E0B',
        textColor: '#ffffff'
      }
    },
    priceStyles: {
      price: {
        fontSize: null,
        color: null,
        fontWeight: null
      },
      comparePrice: {
        fontSize: null,
        color: null,
        fontWeight: null
      }
    }
  }
});

const currentLocale = computed(() => props.locale || 'vi');
const translation = computed(() => getTranslationByLocale(props.product, currentLocale.value));
const title = computed(() => translation.value?.title || '');
const shortDescription = computed(() => translation.value?.shortDescription || '');
const productSlug = computed(() => translation.value?.slug || props.product.id.toString());

// Check if product has variants and should show "From" in price
const hasVariants = computed(() => 
  props.product.variantAttributes?.variants && 
  props.product.variantAttributes.variants.length > 0
);

// Determine if we should show "From" text before price
const shouldShowFromPrice = computed(() => 
  hasVariants.value && 
  props.product.variantAttributes?.variants?.some((v: any) => v.price !== props.product.price)
);

// Format the price with "From" if needed
const displayPrice = computed(() => {
  if (props.product.price === null) {
    return t('products.contactUs') || 'Liên hệ';
  }
  
  const priceText = props.product.formattedPrice || formatPrice(props.product.price);
  
  if (shouldShowFromPrice.value) {
    return `${t('products.from') || 'Từ'} ${priceText}`;
  }
  
  return priceText;
});

// Handle compare price
const displayComparePrice = computed(() => {
  if (!props.product.comparePrice) return null;
  return props.product.formattedComparePrice || formatPrice(props.product.comparePrice);
});

const discountPercentage = computed(() => {
  const price = props.product.price;
  const comparePrice = props.product.comparePrice;
  
  if (price === null || price === undefined || comparePrice === null || comparePrice === undefined) {
    return null;
  }
  
  return calculateDiscountPercentage(price, comparePrice);
});

const productLink = computed(() => getProductUrl(props.product));

// Style computed properties
const imageStyle = computed(() => ({
  height: `${styleConfig.value?.settings?.imageHeight || 200}px`
}));

const priceTextStyle = computed(() => {
  const priceStyle = styleConfig.value?.settings?.priceStyles?.price;
  return {
    fontSize: formatFontSize(priceStyle?.fontSize),
    color: priceStyle?.color || undefined,
    fontWeight: formatFontWeight(priceStyle?.fontWeight)
  };
});

const comparePriceTextStyle = computed(() => {
  const compareStyle = styleConfig.value?.settings?.priceStyles?.comparePrice;
  return {
    fontSize: formatFontSize(compareStyle?.fontSize),
    color: compareStyle?.color || undefined,
    fontWeight: formatFontWeight(compareStyle?.fontWeight)
  };
});

const labelStyle = (type: 'featured' | 'new' | 'sale' | 'discount') => ({
  backgroundColor: styleConfig.value?.settings?.labelStyles?.[type]?.backgroundColor || '#4F46E5',
  color: styleConfig.value?.settings?.labelStyles?.[type]?.textColor || '#ffffff'
});

// Specs for ticket
const ticketLocation = computed(() => props.product.specifications?.find((spec: ProductSpecification) => spec.name === 'location')?.value || '');
const ticketDate = computed(() => props.product.specifications?.find((spec: ProductSpecification) => spec.name === 'date')?.value || '');

// Quick add to cart logic
const shouldShowVariantModal = computed(() => {
  return hasVariants.value && props.product.variantAttributes?.variants && props.product.variantAttributes.variants.length > 0;
});

// Product data for AddToCartButton
const productForCart = computed(() => ({
  id: props.product.id,
  title: title.value,
  thumbnail: props.product.thumbnail,
  price: props.product.price,
  comparePrice: props.product.comparePrice,
  formattedPrice: props.product.formattedPrice,
  sku: props.product.sku,
  stock: props.product.stock,
  hasRequiredAttributes: false, // For quick add, we handle variants via modal
  hasSelectedAllAttributes: true, // Always true for quick add
  variantAttributes: props.product.variantAttributes,
  variants: props.product.variantAttributes?.variants || []
}));
</script>

<template>
  <div
    class="product-card group relative overflow-hidden rounded-lg border-2 border-gray-200 bg-white shadow-sm transition-all hover:shadow-md dark:border-gray-800 dark:bg-gray-900"
    :class="{'ticket-card': product.type === ProductType.TICKET}"
  >
    <!-- Badge: New, Sale, Featured -->
    <div class="absolute left-2 top-2 z-10 flex flex-col gap-1">
      <!-- Ticket Badge -->
      <UBadge
        v-if="product.type === ProductType.TICKET"
        color="purple"
        variant="solid"
        class="text-xs"
      >
        <Ticket class="w-3 h-3 mr-1" />
        {{ t("products.ticketType") || "Vé" }}
      </UBadge>
      
      <UBadge
        v-if="product.isNew && styleConfig.value?.settings?.showLabels?.new"
        :style="labelStyle('new')"
        variant="solid"
        class="text-xs"
      >
        Mới
      </UBadge>
      <UBadge
        v-if="product.isSale && styleConfig.value?.settings?.showLabels?.sale"
        :style="labelStyle('sale')"
        variant="solid"
        class="text-xs"
      >
        Giảm giá
      </UBadge>
      <UBadge
        v-if="product.isFeatured && styleConfig.value?.settings?.showLabels?.featured"
        :style="labelStyle('featured')"
        variant="solid"
        class="text-xs"
      >
        Nổi bật
      </UBadge>
    </div>

    <!-- Discount percentage -->
    <div
      v-if="discountPercentage && styleConfig.value?.settings?.showLabels?.discount"
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

    <!-- Product info -->
    <div class="product-info p-4 flex flex-col" :class="{'ticket-info': product.type === ProductType.TICKET}">
      <NuxtLink :to="productLink" class="block">
        <h3
          class="product-title mb-1 text-lg font-medium text-gray-900 dark:text-gray-100"
        >
          {{ title }}
        </h3>
      </NuxtLink>

      <!-- Ticket Specific Info -->
      <div v-if="product.type === ProductType.TICKET" class="ticket-details mb-2">
        <div v-if="ticketLocation" class="flex items-center text-xs text-gray-600 dark:text-gray-400 mb-1">
          <MapPin class="w-3 h-3 mr-1 flex-shrink-0" />
          <span class="truncate">{{ ticketLocation }}</span>
        </div>
        <div v-if="ticketDate" class="flex items-center text-xs text-gray-600 dark:text-gray-400">
          <Calendar class="w-3 h-3 mr-1 flex-shrink-0" />
          <span>{{ ticketDate }}</span>
        </div>
      </div>

      <div v-else class="product-description-container">
        <p
          v-if="shortDescription"
          class="product-description text-sm text-gray-600 line-clamp-2 dark:text-gray-400"
        >
          {{ shortDescription }}
        </p>
        <p v-else class="product-description-empty"></p>
      </div>

      <div class="product-footer flex items-center justify-between">
        <div>
          <div class="flex items-center gap-2">
            <span
              v-if="product.price === null"
              class="text-lg font-semibold text-primary-600 dark:text-primary-400"
              :style="priceTextStyle"
              >{{ t('products.contactUs') || 'Liên hệ' }}</span
            >
            <template v-else>
              <span
                class="text-lg font-semibold text-primary-600 dark:text-primary-400"
                :style="priceTextStyle"
                >{{ displayPrice }}</span
              >
              <span
                v-if="displayComparePrice"
                class="text-sm text-gray-500 line-through dark:text-gray-400"
                :style="comparePriceTextStyle"
                >{{ displayComparePrice }}</span
              >
            </template>
          </div>
        </div>

        <!-- Nút thêm vào giỏ hàng -->
        <div class="flex items-center">
          <AddToCartButton
            v-if="product.price !== null"
            :product="productForCart"
            iconOnly
            :showQuantity="false"
            buttonClass="p-2 flex items-center justify-center rounded-full hover:scale-110 transition-transform duration-200 cart-button-small"
          >
            <template #default>
              <ShoppingCart :size="20" :stroke-width="2" class="text-white" />
            </template>
          </AddToCartButton>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.product-card {
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.product-card:hover {
  transform: translateY(-5px);
}

/* Đảm bảo chiều cao cố định cho phần thông tin sản phẩm */
.product-info {
  height: 11rem;
  display: grid;
  grid-template-rows: auto 3rem 1fr;
}

/* Ticket card specific styles */
.ticket-card {
  border-color: rgba(168, 85, 247, 0.3);
}

.ticket-info {
  grid-template-rows: auto auto 1fr;
}

.ticket-details {
  margin-top: 0.25rem;
}

.product-title {
  height: 3rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: normal;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  line-height: 1.5rem;
}

.product-description-container {
  height: 3rem;
  overflow: hidden;
  margin-bottom: 0.5rem;
}

.product-description {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.product-description-empty {
  height: 3rem;
}

.product-footer {
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
