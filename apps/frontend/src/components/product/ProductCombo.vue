<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useTrpc } from '~/composables/useTrpc';
import { useLocalization } from '~/composables/useLocalization';
import AppImage from '~/components/ui/AppImage.vue';
import AddToCartButton from '~/components/cart/AddToCartButton.vue';

const props = defineProps({
  productId: {
    type: Number,
    required: true
  },
  limit: {
    type: Number,
    default: 4
  }
});

const emit = defineEmits(['add-to-cart']);

const { t, locale } = useLocalization();
const trpc = useTrpc();

const isLoading = ref(true);
const error = ref<Error | null>(null);
const comboProducts = ref<any[]>([]);
const selectedCombos = ref<number[]>([]);

// Tính tổng giá tiền của các sản phẩm combo đã chọn
const totalComboPrice = computed(() => {
  return comboProducts.value
    .filter(product => selectedCombos.value.includes(product.id))
    .reduce((total, product) => total + (product.discountedPrice || 0), 0);
});

// Format giá tiền
const formatPrice = (price: number | null) => {
  if (price === null) return '';
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
};

// Tính tổng tiết kiệm
const totalSavings = computed(() => {
  return comboProducts.value
    .filter(product => selectedCombos.value.includes(product.id))
    .reduce((total, product) => {
      const originalPrice = product.price || 0;
      const discountedPrice = product.discountedPrice || 0;
      return total + (originalPrice - discountedPrice);
    }, 0);
});

// Lấy danh sách sản phẩm combo
const fetchComboProducts = async () => {
  isLoading.value = true;
  error.value = null;
  
  try {
    const result = await trpc.product.getProductCombos.query({
      productId: props.productId,
      locale: locale.value,
      limit: props.limit
    });
    
    comboProducts.value = result;
    isLoading.value = false;
  } catch (err: any) {
    console.error('Error fetching combo products:', err);
    error.value = err;
    isLoading.value = false;
  }
};

// Xử lý khi chọn/bỏ chọn sản phẩm combo
const toggleComboSelection = (comboId: number) => {
  if (selectedCombos.value.includes(comboId)) {
    selectedCombos.value = selectedCombos.value.filter(id => id !== comboId);
  } else {
    selectedCombos.value.push(comboId);
  }
};

// Thêm tất cả sản phẩm combo đã chọn vào giỏ hàng
const addSelectedCombosToCart = () => {
  const selectedProducts = comboProducts.value
    .filter(product => selectedCombos.value.includes(product.id))
    .map(product => ({
      id: product.productId,
      price: product.discountedPrice,
      comboId: product.comboId
    }));
  
  emit('add-to-cart', selectedProducts);
};

// Chọn tất cả sản phẩm combo
const selectAllCombos = () => {
  selectedCombos.value = comboProducts.value.map(product => product.id);
};

// Bỏ chọn tất cả sản phẩm combo
const deselectAllCombos = () => {
  selectedCombos.value = [];
};

// Theo dõi thay đổi của productId hoặc locale
watch([() => props.productId, locale], () => {
  fetchComboProducts();
});

// Lấy dữ liệu khi component được mount
onMounted(() => {
  fetchComboProducts();
});
</script>

<template>
  <div v-if="comboProducts.length > 0" class="product-combo-container border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
    <div class="bg-primary-50 dark:bg-primary-900/20 p-2 border-b border-gray-200 dark:border-gray-700">
      <h3 class="text-sm font-bold text-primary-700 dark:text-primary-300 flex items-center">
        <UIcon name="i-heroicons-gift" class="mr-1 h-4 w-4" />
        {{ t('products.buyTogether') || 'Mua kèm giảm giá' }}
      </h3>
      <p class="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
        {{ t('products.comboDescription') || 'Chọn sản phẩm mua kèm để được giảm giá đặc biệt' }}
      </p>
    </div>
    
    <div v-if="isLoading" class="p-2">
      <div class="flex flex-col space-y-2">
        <USkeleton v-for="i in 3" :key="i" class="h-8 w-full" />
      </div>
    </div>
    
    <div v-else-if="error" class="p-2 text-center">
      <UIcon name="i-heroicons-exclamation-circle" class="mx-auto mb-1 h-5 w-5 text-red-500" />
      <p class="text-xs text-gray-600 dark:text-gray-400">{{ t('products.errorLoadingCombos') || 'Có lỗi xảy ra khi tải sản phẩm mua kèm' }}</p>
      <UButton size="xs" color="primary" class="mt-1" @click="fetchComboProducts">
        {{ t('products.tryAgain') || 'Thử lại' }}
      </UButton>
    </div>
    
    <div v-else class="divide-y divide-gray-200 dark:divide-gray-700">
      <div v-for="product in comboProducts" :key="product.id" class="p-1 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
        <div class="flex items-center">
          <UCheckbox 
            v-model="selectedCombos" 
            :value="product.id"
            color="primary"
            class="mr-2 flex-shrink-0"
            size="xs"
          />
          
          <div class="flex flex-1 items-center space-x-1">
            <AppImage 
              :src="product.thumbnail" 
              :alt="product.title"
              fallbackSrc="/images/default-image.jpg"
              width="30px"
              height="30px"
              customClass="object-cover rounded-sm flex-shrink-0"
            />
            
            <div class="flex-1 min-w-0">
              <h4 class="font-medium text-xs text-gray-900 dark:text-white truncate">{{ product.title }}</h4>
              <p v-if="product.shortDescription" class="text-[10px] text-gray-500 dark:text-gray-400 line-clamp-1">
                {{ product.shortDescription }}
              </p>
            </div>
            
            <div class="text-right flex-shrink-0 ml-1">
              <div class="flex flex-col items-end">
                <span class="text-xs text-primary-600 dark:text-primary-400 font-bold">
                  {{ product.formattedDiscountedPrice }}
                </span>
                <span v-if="product.price !== product.discountedPrice" class="text-[10px] text-gray-500 line-through">
                  {{ product.formattedPrice }}
                </span>
                <span v-if="product.discountPercent" class="text-[10px] text-green-600 dark:text-green-400">
                  -{{ product.discountPercent }}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div class="p-1.5 bg-gray-50 dark:bg-gray-800/50">
        <div class="flex justify-between items-center mb-1">
          <div>
            <UButton 
              v-if="selectedCombos.length < comboProducts.length" 
              size="xs" 
              color="gray" 
              variant="soft"
              @click="selectAllCombos"
              class="text-[10px] py-0.5 px-1.5"
            >
              {{ t('products.selectAll') || 'Chọn tất cả' }}
            </UButton>
            <UButton 
              v-else
              size="xs" 
              color="gray" 
              variant="soft"
              @click="deselectAllCombos"
              class="text-[10px] py-0.5 px-1.5"
            >
              {{ t('products.deselectAll') || 'Bỏ chọn tất cả' }}
            </UButton>
          </div>
          
          <div v-if="selectedCombos.length > 0" class="text-right">
            <div class="text-[10px] text-gray-600 dark:text-gray-400">
              {{ t('products.totalSavings') || 'Tiết kiệm' }}: 
              <span class="font-bold text-green-600 dark:text-green-400">{{ formatPrice(totalSavings) }}</span>
            </div>
            <div class="font-bold text-xs text-gray-900 dark:text-white">
              {{ t('products.total') || 'Tổng cộng' }}: {{ formatPrice(totalComboPrice) }}
            </div>
          </div>
        </div>
        
        <AddToCartButton 
          v-if="selectedCombos.length > 0"
          :product="{ id: combo.id, name: combo.name, price: totalPrice }" 
          :buttonText="t('products.addSelectedToCart') || 'Thêm sản phẩm đã chọn vào giỏ hàng'"
          buttonClass="text-[10px] py-0.5 w-full"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.product-combo-container {
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
  font-size: 0.75rem;
}

.product-combo-container:hover {
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

/* Hiệu ứng khi hover vào sản phẩm */
.product-combo-container .hover\:bg-gray-50:hover {
  transform: translateX(2px);
  transition: transform 0.2s ease;
}

/* Hiệu ứng cho checkbox */
:deep(.checkbox) {
  transition: all 0.2s ease;
  transform-origin: center;
  transform: scale(0.85);
}

:deep(.checkbox:hover) {
  transform: scale(0.9);
}

/* Hiệu ứng cho giá */
.text-primary-600 {
  transition: all 0.3s ease;
}

.hover\:bg-gray-50:hover .text-primary-600 {
  transform: scale(1.02);
}
</style> 