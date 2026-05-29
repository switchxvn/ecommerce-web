<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useTrpc } from '~/composables/useTrpc';
import { useLocalization } from '~/composables/useLocalization';

const props = defineProps<{
  productId: number;
  locale?: string;
}>();

interface Specification {
  id: number;
  name: string;
  value: string;
  position: number;
}

const { t, locale } = useLocalization();
const trpc = useTrpc();
const translateWithFallback = (key: string, fallback: string) => {
  const translated = t(key);
  return translated && translated.trim() && translated.trim() !== key ? translated : fallback;
};

const specifications = ref<Specification[]>([]);
const isLoading = ref(true);
const error = ref<Error | null>(null);

const hasSpecifications = computed(() => specifications.value.length > 0);

const fetchSpecifications = async () => {
  isLoading.value = true;
  error.value = null;
  
  try {
    const result = await trpc.product.getProductSpecifications.query({
      productId: props.productId,
      locale: props.locale || locale.value
    });
    
    specifications.value = result;
  } catch (err: any) {
    console.error('Error fetching product specifications:', err);
    error.value = err;
  } finally {
    isLoading.value = false;
  }
};

onMounted(() => {
  fetchSpecifications();
});

// Theo dõi thay đổi của productId hoặc locale
watch([() => props.productId, () => props.locale || locale.value], () => {
  fetchSpecifications();
});
</script>

<template>
  <div class="product-specifications">
    <div v-if="isLoading" class="py-4">
      <USkeleton class="mb-2 h-6 w-1/3" />
      <USkeleton v-for="i in 4" :key="i" class="mb-2 h-4 w-full" />
    </div>
    
    <div v-else-if="error" class="py-4 text-center">
      <UIcon name="i-heroicons-exclamation-circle" class="mx-auto mb-2 h-8 w-8 text-red-500" />
      <p class="text-sm text-gray-600 dark:text-gray-400">
        {{ translateWithFallback('products.specificationError', 'Có lỗi xảy ra khi tải thông số kỹ thuật') }}
      </p>
      <UButton size="sm" color="gray" class="mt-2" @click="fetchSpecifications">
        {{ translateWithFallback('products.tryAgain', 'Thử lại') }}
      </UButton>
    </div>
    
    <div v-else-if="hasSpecifications" class="specifications-table">
      <h3 class="mb-4 text-xl font-bold text-gray-900 dark:text-white">
        {{ translateWithFallback('products.specifications', 'Thông số kỹ thuật') }}
      </h3>
      
      <div class="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
        <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
            <tr 
              v-for="spec in specifications" 
              :key="spec.id"
              class="transition-colors hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              <th class="whitespace-nowrap px-4 py-3 text-left text-sm font-medium text-gray-900 dark:text-white">
                {{ spec.name }}
              </th>
              <td class="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                {{ spec.value }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
    
    <div v-else class="empty-state flex h-64 items-center justify-center">
      <div class="text-center">
        <UIcon name="i-heroicons-document-text" class="mx-auto mb-4 h-16 w-16 text-gray-400" />
        <p class="text-gray-600 dark:text-gray-400">
          {{ translateWithFallback('products.noSpecifications', 'Không có thông số kỹ thuật cho sản phẩm này') }}
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.specifications-table {
  margin-bottom: 2rem;
}

.specifications-table table {
  width: 100%;
  border-collapse: collapse;
}

.specifications-table th {
  width: 40%;
  text-align: left;
  vertical-align: top;
}

.specifications-table td {
  width: 60%;
}

.empty-state {
  min-height: 300px;
}

@media (max-width: 640px) {
  .specifications-table th,
  .specifications-table td {
    padding: 0.75rem 1rem;
  }
  
  .specifications-table th {
    width: 50%;
  }
  
  .specifications-table td {
    width: 50%;
  }
}
</style> 
