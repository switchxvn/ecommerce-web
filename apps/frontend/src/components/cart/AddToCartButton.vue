<script setup lang="ts">
import { ref, computed } from 'vue';
import { useCart } from '~/composables/useCart';
import { useTrpc } from '~/composables/useTrpc';
import { ShoppingCart, Minus, Plus, Loader } from 'lucide-vue-next';
import ProductVariantModal from '~/components/modals/ProductVariantModal.vue';
import { useNotificationToast } from '~/composables/useNotificationToast';
import { useLocalization } from '~/composables/useLocalization';

interface ProductVariant {
  id: number;
  name: string;
  price: number;
  comparePrice?: number;
  sku?: string;
  stock: number;
  image?: string;
}

interface Product {
  id: number;
  title: string;
  thumbnail?: string;
  price: number | null;
  comparePrice?: number | null;
  formattedPrice?: string;
  sku?: string;
  stock?: number;
  variantId?: number;
  variantName?: string;
  hasRequiredAttributes?: boolean;
  hasSelectedAllAttributes?: boolean;
  variantAttributes?: {
    variants: ProductVariant[];
  };
  variants?: ProductVariant[];
}

const props = withDefaults(defineProps<{
  product: Product;
  iconOnly?: boolean;
  showQuantity?: boolean;
  buttonText?: string;
  buttonClass?: string;
}>(), {
  iconOnly: false,
  showQuantity: true,
  buttonText: '',
  buttonClass: 'bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg transition-colors duration-200 flex items-center gap-2'
});

const emit = defineEmits(['success']);

const { addToCart, isCartEnabled } = useCart();
const $trpc = useTrpc();
const { t } = useLocalization();
const isAdding = ref(false);
const quantity = ref(1);
const showVariantModal = ref(false);
const toast = useNotificationToast();

// Ripple effect state
const showRipple = ref(false);
const rippleX = ref(0);
const rippleY = ref(0);

// Check if product has variants
const hasVariants = computed(() => {
  const variants = props.product.variantAttributes?.variants || props.product.variants || [];
  return variants.length > 0;
});

// Tăng số lượng sản phẩm
const increaseQuantity = () => {
  const maxStock = props.product.stock || Infinity;
  if (quantity.value >= maxStock) return;
  quantity.value++;
};

// Giảm số lượng sản phẩm
const decreaseQuantity = () => {
  if (quantity.value > 1) {
    quantity.value--;
  }
};

// Tạo hiệu ứng ripple khi click
const createRipple = (event: MouseEvent) => {
  const button = event.currentTarget as HTMLElement;
  const rect = button.getBoundingClientRect();
  
  rippleX.value = event.clientX - rect.left;
  rippleY.value = event.clientY - rect.top;
  
  showRipple.value = false;
  setTimeout(() => {
    showRipple.value = true;
    setTimeout(() => {
      showRipple.value = false;
    }, 600);
  }, 10);
};

// Kiểm tra xem có thể thêm vào giỏ hàng không
const canAddToCart = computed(() => {
  if (!props.product) {
    return false;
  }

  // Kiểm tra nếu sản phẩm có thuộc tính bắt buộc nhưng chưa chọn đủ
  // và không có variants (nếu có variants thì modal sẽ xử lý)
  if (props.showQuantity && !hasVariants.value && props.product.hasRequiredAttributes && !props.product.hasSelectedAllAttributes) {
    return false;
  }

  // Nếu có variants, luôn cho phép click để mở modal
  if (hasVariants.value) {
    return isCartEnabled && !isAdding.value;
  }

  // Nếu không có variants, cần có giá
  return props.product.price !== null && isCartEnabled && !isAdding.value;
});

// Kiểm tra số lượng tồn kho
const isMaxQuantity = computed(() => {
  const maxStock = props.product.stock || Infinity;
  return quantity.value >= maxStock;
});

// Direct add to cart (for products without variants)
const directAddToCart = async () => {
  isAdding.value = true;
  
  const cartItem = {
    productId: props.product.id,
    variantId: props.product.variantId,
    quantity: 1,
    metadata: {
      variantName: props.product.variantName,
      sku: props.product.sku
    }
  };
  
  try {
    await addToCart(cartItem);
    toast.success(t('common.success'));
    emit('success');
  } catch (error) {
    toast.error(t('common.error'));
  } finally {
    isAdding.value = false;
  }
};

// Handle add to cart with quantity
const handleAddToCartWithQuantity = async (event: MouseEvent) => {
  if (!canAddToCart.value) return;
  
  createRipple(event);
  isAdding.value = true;
  
  const cartItem = {
    productId: props.product.id,
    variantId: props.product.variantId,
    quantity: quantity.value,
    metadata: {
      variantName: props.product.variantName,
      sku: props.product.sku
    }
  };
  
  try {
    await addToCart(cartItem);
    toast.success(t('common.success'));
    emit('success');
  } catch (error) {
    toast.error(t('common.error'));
  } finally {
    isAdding.value = false;
  }
};

// Main click handler
const handleClick = async (event: MouseEvent) => {
  if (!canAddToCart.value) return;

  // If product has variants, show modal
  if (hasVariants.value) {
    showVariantModal.value = true;
    return;
  }

  // If showing quantity selector, use quantity
  if (props.showQuantity) {
    await handleAddToCartWithQuantity(event);
    return;
  }

  // Direct add to cart with quantity 1
  createRipple(event);
  await directAddToCart();
};

// Handle modal close
const handleModalClose = () => {
  showVariantModal.value = false;
};

// Handle successful add from modal
const handleModalAddToCart = (item: any) => {
  // Modal already handles the cart addition
};

// Handle success from modal
const handleModalSuccess = () => {
  emit('success');
};

// Component is now using centralized cart store
// No local initialization needed
</script>

<template>
  <div class="add-to-cart-container">
    <!-- Chọn số lượng sản phẩm nếu showQuantity = true -->
    <div v-if="showQuantity" class="quantity-selector">
      <button 
        @click="decreaseQuantity" 
        class="quantity-btn"
        :disabled="quantity <= 1"
      >
        <Minus class="w-4 h-4" />
      </button>
      <span class="quantity-value">{{ quantity }}</span>
      <button 
        @click="increaseQuantity" 
        class="quantity-btn"
        :disabled="isMaxQuantity"
      >
        <Plus class="w-4 h-4" />
      </button>
    </div>
    
    <button
      :class="['add-to-cart-button', buttonClass]"
      :disabled="!canAddToCart"
      @click="handleClick"
    >
      <div class="button-content">
        <!-- Sử dụng slot mặc định nếu được cung cấp -->
        <slot v-if="$slots.default"></slot>
        
        <!-- Sử dụng icon mặc định nếu không có slot -->
        <template v-else>
          <ShoppingCart v-if="iconOnly" class="w-5 h-5" />
          <template v-else>
            <ShoppingCart class="cart-icon" />
            <span class="button-text">{{ buttonText || t('common.addToCart') }}</span>
          </template>
        </template>
      </div>
      
      <!-- Hiệu ứng loading -->
      <div v-if="isAdding" class="loading-spinner">
        <Loader class="w-5 h-5 animate-spin" />
      </div>
      
      <!-- Hiệu ứng ripple -->
      <span 
        v-if="showRipple" 
        class="ripple-effect"
        :style="{
          left: `${rippleX}px`,
          top: `${rippleY}px`
        }"
      ></span>
    </button>

    <!-- Product Variant Modal -->
    <ProductVariantModal
      v-if="hasVariants"
      :product="product"
      :isOpen="showVariantModal"
      @close="handleModalClose"
      @addToCart="handleModalAddToCart"
      @success="handleModalSuccess"
    />
  </div>
</template>

<style scoped>
.add-to-cart-container {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.quantity-selector {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  padding: 0.25rem;
  background: white;
}

.quantity-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  border: none;
  border-radius: 0.25rem;
  background: transparent;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.2s;
}

.quantity-btn:hover:not(:disabled) {
  background: #f3f4f6;
  color: #374151;
}

.quantity-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.quantity-value {
  min-width: 2rem;
  text-align: center;
  font-weight: 500;
  color: #374151;
}

.add-to-cart-button {
  position: relative;
  overflow: hidden;
  transition: all 0.2s;
  border: none;
  cursor: pointer;
  font-weight: 500;
  display: flex;
  align-items: center;
  justify-content: center;
}

.add-to-cart-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.button-content {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  z-index: 1;
  position: relative;
}

.loading-spinner {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.9);
  z-index: 2;
}

.cart-icon {
  width: 1.25rem;
  height: 1.25rem;
}

.ripple-effect {
  position: absolute;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.6);
  transform: scale(0);
  animation: ripple 0.6s linear;
  pointer-events: none;
}

@keyframes ripple {
  to {
    transform: scale(4);
    opacity: 0;
  }
}

.cart-button-small {
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 50%;
  background: #6366f1;
  border: none;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.cart-button-small:hover {
  background: #5b5bd6;
  transform: scale(1.1);
}

.cart-button-small:disabled {
  background: #9ca3af;
  transform: none;
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
  .quantity-selector {
    border-color: #374151;
    background: #1f2937;
  }
  
  .quantity-btn {
    color: #9ca3af;
  }
  
  .quantity-btn:hover:not(:disabled) {
    background: #374151;
    color: #d1d5db;
  }
  
  .quantity-value {
    color: #d1d5db;
  }
  
  .loading-spinner {
    background: rgba(31, 41, 55, 0.9);
  }
}
</style>
