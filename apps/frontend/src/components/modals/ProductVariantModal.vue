<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { X, ShoppingCart, Minus, Plus } from 'lucide-vue-next';
import { useCart } from '~/composables/useCart';
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
  attributes?: Record<string, any>;
}

interface VariantAttribute {
  name: string;
  values: Array<{
    value: string;
    price?: number;
    stock?: number;
    image?: string;
  }>;
}

interface Product {
  id: number;
  title: string;
  thumbnail?: string;
  price: number | null;
  comparePrice?: number | null;
  sku?: string;
  stock?: number;
  variantAttributes?: {
    variants: ProductVariant[];
    attributes?: VariantAttribute[];
  };
  variants?: ProductVariant[];
}

const props = defineProps<{
  product: Product;
  isOpen: boolean;
}>();

const emit = defineEmits(['close', 'addToCart', 'success']);

const { addToCart } = useCart();
const toast = useNotificationToast();
const { t } = useLocalization();

const quantity = ref(1);
const isAdding = ref(false);
const selectedAttributes = ref<Record<string, string>>({});

// Get available variants
const variants = computed(() => {
  return props.product.variantAttributes?.variants || props.product.variants || [];
});

// Parse variant attributes from variants
const variantAttributes = computed(() => {
  if (props.product.variantAttributes?.attributes) {
    return props.product.variantAttributes.attributes;
  }

  // Parse from variants if no attributes defined
  const attributeMap = new Map<string, Set<string>>();
  
  variants.value.forEach(variant => {
    if (variant.attributes) {
      Object.entries(variant.attributes).forEach(([key, value]) => {
        if (!attributeMap.has(key)) {
          attributeMap.set(key, new Set());
        }
        attributeMap.get(key)?.add(String(value));
      });
    }
  });

  return Array.from(attributeMap.entries()).map(([name, values]) => ({
    name,
    values: Array.from(values).map(value => ({ value }))
  }));
});

// Find matching variant based on selected attributes
const selectedVariant = computed(() => {
  if (Object.keys(selectedAttributes.value).length === 0) {
    return variants.value[0] || null;
  }

  return variants.value.find(variant => {
    if (!variant.attributes) return false;
    
    return Object.entries(selectedAttributes.value).every(([key, value]) => {
      return variant.attributes?.[key] === value;
    });
  }) || variants.value[0] || null;
});

// Watch for product changes to reset selection
watch(() => props.product, () => {
  selectedAttributes.value = {};
  quantity.value = 1;
}, { deep: true });

// Initialize first variant selection when modal opens
watch(() => props.isOpen, (isOpen) => {
  if (isOpen && variantAttributes.value.length > 0) {
    // Auto-select first option for each attribute
    const initialSelection: Record<string, string> = {};
    variantAttributes.value.forEach(attr => {
      if (attr.values.length > 0) {
        initialSelection[attr.name] = attr.values[0].value;
      }
    });
    selectedAttributes.value = initialSelection;
  }
});

// Current product info based on selected variant
const currentPrice = computed(() => {
  return (selectedVariant.value?.price || props.product.price) ?? 0;
});

const currentComparePrice = computed(() => {
  return selectedVariant.value?.comparePrice || props.product.comparePrice || null;
});

const currentStock = computed(() => {
  return selectedVariant.value?.stock || props.product.stock || 0;
});

const discountPercentage = computed(() => {
  if (!currentPrice.value || !currentComparePrice.value) return null;
  return Math.round(((currentComparePrice.value - currentPrice.value) / currentComparePrice.value) * 100);
});

// Check if attribute value is available (has stock)
const isAttributeValueAvailable = (attributeName: string, value: string) => {
  const tempSelection = { ...selectedAttributes.value, [attributeName]: value };
  
  const matchingVariant = variants.value.find(variant => {
    if (!variant.attributes) return false;
    return Object.entries(tempSelection).every(([key, val]) => {
      return variant.attributes?.[key] === val;
    });
  });
  
  return matchingVariant && matchingVariant.stock > 0;
};

// Select attribute value
const selectAttributeValue = (attributeName: string, value: string) => {
  selectedAttributes.value = {
    ...selectedAttributes.value,
    [attributeName]: value
  };
};

// Quantity controls
const increaseQuantity = () => {
  if (quantity.value < currentStock.value) {
    quantity.value++;
  }
};

const decreaseQuantity = () => {
  if (quantity.value > 1) {
    quantity.value--;
  }
};

// Add to cart handler
const handleAddToCart = async () => {
  if (!selectedVariant.value) return;
  
  isAdding.value = true;
  
  const cartItem = {
    productId: props.product.id,
    variantId: selectedVariant.value.id,
    quantity: quantity.value,
    metadata: {
      variantName: selectedVariant.value.name,
      sku: selectedVariant.value.sku,
      selectedAttributes: selectedAttributes.value
    }
  };
  
  try {
    await addToCart(cartItem);
    toast.success(t('common.success'));
    emit('addToCart', cartItem);
    emit('success');
    emit('close');
  } catch (error) {
    toast.error(t('common.error'));
  } finally {
    isAdding.value = false;
  }
};

// Close modal
const closeModal = () => {
  emit('close');
};

// Format price
const formatPrice = (price: number | null) => {
  if (price === null || price === undefined) return 'Liên hệ';
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(price);
};

// Get attribute display name
const getAttributeDisplayName = (attributeName: string) => {
  const nameMap: Record<string, string> = {
    'color': 'Màu sắc',
    'size': 'Kích thước',
    'warranty': 'Bảo hành',
    'material': 'Chất liệu',
    'capacity': 'Dung lượng'
  };
  return nameMap[attributeName.toLowerCase()] || attributeName;
};
</script>

<template>
  <Teleport to="body">
    <div v-if="isOpen" class="fixed inset-0 z-[9999] overflow-y-auto">
      <!-- Backdrop -->
      <div 
        class="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        @click="closeModal"
      ></div>
      
      <!-- Modal Container -->
      <div class="flex min-h-screen items-center justify-center p-4">
        <div 
          class="relative w-full max-w-lg transform overflow-hidden rounded-lg bg-white shadow-2xl transition-all dark:bg-gray-800"
          @click.stop
        >
          <!-- Header -->
          <div class="flex items-center justify-between border-b p-4 dark:border-gray-700">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
              Chọn phiên bản
            </h3>
            <button
              @click="closeModal"
              class="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300 transition-colors"
            >
              <X class="h-5 w-5" />
            </button>
          </div>
          
          <!-- Content -->
          <div class="p-4">
            <!-- Product info -->
            <div class="mb-4 flex gap-4">
              <img
                :src="selectedVariant?.image || product.thumbnail || '/images/default-image.jpg'"
                :alt="product.title"
                class="h-20 w-20 rounded-lg object-cover"
                @error="($event.target as HTMLImageElement).src = '/images/default-image.jpg'"
              />
              <div class="flex-1">
                <h4 class="font-medium text-gray-900 dark:text-white">
                  {{ product.title }}
                </h4>
                <div class="mt-1 flex items-center gap-2 flex-wrap">
                  <span class="text-lg font-semibold text-primary-600 dark:text-primary-400">
                    {{ formatPrice(currentPrice) }}
                  </span>
                  <span
                    v-if="currentComparePrice"
                    class="text-sm text-gray-500 line-through dark:text-gray-400"
                  >
                    {{ formatPrice(currentComparePrice) }}
                  </span>
                  <span
                    v-if="discountPercentage"
                    class="rounded bg-red-100 px-2 py-1 text-xs font-medium text-red-800 dark:bg-red-900 dark:text-red-200"
                  >
                    -{{ discountPercentage }}%
                  </span>
                </div>
              </div>
            </div>
            
            <!-- Variant Attributes Selection -->
            <div class="space-y-4 mb-6">
              <div 
                v-for="attribute in variantAttributes" 
                :key="attribute.name"
                class="variant-attribute"
              >
                <label class="mb-3 block text-sm font-medium text-gray-900 dark:text-white uppercase tracking-wide">
                  {{ getAttributeDisplayName(attribute.name) }}
                </label>
                <div class="flex flex-wrap gap-2">
                  <button
                    v-for="attrValue in attribute.values"
                    :key="attrValue.value"
                    @click="selectAttributeValue(attribute.name, attrValue.value)"
                    :disabled="!isAttributeValueAvailable(attribute.name, attrValue.value)"
                    class="relative px-4 py-2 border rounded-lg text-sm font-medium transition-all duration-200"
                    :class="{
                      'border-primary-500 bg-primary-50 text-primary-700 ring-2 ring-primary-500 dark:bg-primary-900/20 dark:text-primary-300': selectedAttributes[attribute.name] === attrValue.value,
                      'border-gray-300 bg-white text-gray-700 hover:border-gray-400 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700': selectedAttributes[attribute.name] !== attrValue.value && isAttributeValueAvailable(attribute.name, attrValue.value),
                      'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed dark:border-gray-700 dark:bg-gray-900 dark:text-gray-600': !isAttributeValueAvailable(attribute.name, attrValue.value)
                    }"
                  >
                    {{ attrValue.value }}
                    <!-- Check mark for selected -->
                    <div 
                      v-if="selectedAttributes[attribute.name] === attrValue.value"
                      class="absolute -top-1 -right-1 w-5 h-5 bg-primary-500 rounded-full flex items-center justify-center"
                    >
                      <svg class="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                      </svg>
                    </div>
                  </button>
                </div>
              </div>
            </div>
            
            <!-- Stock Info -->
            <div v-if="selectedVariant" class="mb-4 p-3 bg-gray-50 rounded-lg dark:bg-gray-800">
              <div class="text-sm text-gray-600 dark:text-gray-400">
                <span v-if="currentStock > 0" class="text-green-600 dark:text-green-400">
                  Còn {{ currentStock }} sản phẩm
                </span>
                <span v-else class="text-red-500 font-medium">
                  Hết hàng
                </span>
              </div>
            </div>
            
            <!-- Quantity selection -->
            <div class="mb-6">
              <label class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Số lượng:
              </label>
              <div class="flex items-center gap-3">
                <button
                  @click="decreaseQuantity"
                  :disabled="quantity <= 1"
                  class="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-300 bg-white text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors dark:border-gray-600 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
                >
                  <Minus class="h-4 w-4" />
                </button>
                <span class="min-w-[3rem] text-center text-lg font-medium text-gray-900 dark:text-white">
                  {{ quantity }}
                </span>
                <button
                  @click="increaseQuantity"
                  :disabled="quantity >= currentStock"
                  class="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-300 bg-white text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors dark:border-gray-600 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
                >
                  <Plus class="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
          
          <!-- Footer -->
          <div class="border-t bg-gray-50 px-4 py-3 dark:border-gray-700 dark:bg-gray-900">
            <div class="flex gap-3">
              <button
                @click="closeModal"
                class="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                Hủy
              </button>
              <button
                @click="handleAddToCart"
                :disabled="!selectedVariant || currentStock === 0 || isAdding"
                class="flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ShoppingCart v-if="!isAdding" class="h-4 w-4" />
                <div v-else class="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                {{ isAdding ? 'Đang thêm...' : 'Thêm vào giỏ hàng' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.variant-attribute {
  @apply space-y-2;
}
</style> 
