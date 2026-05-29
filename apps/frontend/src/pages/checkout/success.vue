<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useLocalization } from '~/composables/useLocalization';
import { useTrpc } from '~/composables/useTrpc';
import { CheckCircle, Download, Info, Mail, MessageSquare, Phone } from 'lucide-vue-next';
import { ProductType } from '@ew/shared';

const route = useRoute();
const router = useRouter();
const { t } = useLocalization();
const trpc = useTrpc();

const order = ref<any>(null);
const isLoading = ref(true);
const error = ref<string | null>(null);

const hasTicketItems = computed(() => {
  if (!order.value?.items) return false;
  return order.value.items.some((item: any) => item.productType === ProductType.TICKET);
});

const hasPhysicalItems = computed(() => {
  if (!order.value?.items) return false;
  return order.value.items.some((item: any) => item.productType === ProductType.PHYSICAL);
});

const ticketItems = computed(() => {
  if (!order.value?.items) return [];
  return order.value.items.filter((item: any) => item.productType === ProductType.TICKET);
});

const downloadQRCode = (item: any) => {
  if (!item.imageQrCode) return;
  
  const link = document.createElement('a');
  link.download = `ticket-qr-${item.id}.png`;
  link.href = item.imageQrCode;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

const validatePayOSResponse = () => {
  const { code, status, cancel } = route.query;
  
  if (cancel === 'true') {
    error.value = t('checkout.orderCancelled');
    return false;
  }
  
  if (code !== '00' || status !== 'PAID') {
    error.value = t('checkout.paymentFailed');
    return false;
  }
  
  return true;
};

const fetchOrder = async () => {
  const orderCode = route.query.orderCode;
  if (!orderCode) {
    error.value = t('checkout.noOrderCode');
    isLoading.value = false;
    return;
  }

  if (!validatePayOSResponse()) {
    isLoading.value = false;
    return;
  }

  try {
    const orderData = await trpc.order.getOrderByCode.query(orderCode as string);
    order.value = orderData;
  } catch (err) {
    console.error('Error fetching order:', err);
    error.value = t('checkout.errorFetchingOrder');
  } finally {
    isLoading.value = false;
  }
};

onMounted(() => {
  fetchOrder();
});
</script>

<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900 py-16">
    <div class="container mx-auto px-4">
      <div class="max-w-2xl mx-auto text-center">
        <!-- Loading State -->
        <div v-if="isLoading" class="text-left">
          <DetailPageSkeleton :show-gallery="false" :show-sidebar="false" />
        </div>

        <!-- Error State -->
        <div v-else-if="error" class="text-center">
          <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 dark:bg-red-900 mb-4">
            <span class="text-red-600 dark:text-red-400 text-2xl">×</span>
          </div>
          <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            {{ t('checkout.error') }}
          </h2>
          <p class="text-gray-600 dark:text-gray-400 mb-6">{{ error }}</p>
          <UButton to="/tickets" color="primary">
            {{ t('checkout.backToTickets') }}
          </UButton>
        </div>

        <!-- Success State -->
        <div v-else class="space-y-6">
          <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 dark:bg-green-900 mb-4">
            <CheckCircle class="w-8 h-8 text-green-600 dark:text-green-400" />
          </div>

          <h1 class="text-3xl font-bold text-gray-900 dark:text-white">
            {{ t('checkout.orderSuccess') }}
          </h1>

          <p class="text-gray-600 dark:text-gray-400">
            {{ t('checkout.orderSuccessMessage') }}
          </p>

          <!-- QR Code Reminder -->
          <div class="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-2xl p-8 shadow-sm dark:shadow-blue-900/5">
            <div class="text-center space-y-6">
              <div>
                <h3 class="text-xl font-bold text-blue-800 dark:text-blue-200 mb-4">
                  {{ t('checkout.qrReminder.title') }}
                </h3>
                <p class="text-blue-700/90 dark:text-blue-300/90 text-lg mb-6">
                  {{ t('checkout.qrReminder.description') }}
                </p>
              </div>

              <div class="grid grid-cols-3 gap-4">
                <div class="flex flex-col items-center gap-3 p-4 bg-white dark:bg-blue-800/30 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200">
                  <div class="bg-blue-100 dark:bg-blue-700 rounded-full p-3">
                    <Mail class="w-6 h-6 text-blue-600 dark:text-blue-200" />
                  </div>
                  <span class="font-medium text-blue-700 dark:text-blue-200">
                    {{ t('checkout.qrReminder.channels.email') }}
                  </span>
                </div>
                <div class="flex flex-col items-center gap-3 p-4 bg-white dark:bg-blue-800/30 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200">
                  <div class="bg-blue-100 dark:bg-blue-700 rounded-full p-3">
                    <MessageSquare class="w-6 h-6 text-blue-600 dark:text-blue-200" />
                  </div>
                  <span class="font-medium text-blue-700 dark:text-blue-200">
                    {{ t('checkout.qrReminder.channels.zalo') }}
                  </span>
                </div>
                <div class="flex flex-col items-center gap-3 p-4 bg-white dark:bg-blue-800/30 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200">
                  <div class="bg-blue-100 dark:bg-blue-700 rounded-full p-3">
                    <Phone class="w-6 h-6 text-blue-600 dark:text-blue-200" />
                  </div>
                  <span class="font-medium text-blue-700 dark:text-blue-200">
                    {{ t('checkout.qrReminder.channels.sms') }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- Ticket Items Section -->
          <template v-if="hasTicketItems">
            <div v-for="item in ticketItems" :key="item.id" class="mt-8 bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
              <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                {{ t('checkout.qrCodeTitle') }}
              </h3>
              <div class="flex flex-col items-center">
                <img v-if="item.imageQrCode" :src="item.imageQrCode" :alt="`Ticket QR Code ${item.id}`" class="w-64 h-64 mb-4" />
                <p class="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  {{ t('checkout.qrCodeDescription') }}
                </p>
                <p class="text-xs text-gray-500 dark:text-gray-500 mb-4">
                  {{ t('checkout.qrCodeNote') }}
                </p>
                <UButton v-if="item.imageQrCode" color="gray" @click="downloadQRCode(item)" class="flex items-center gap-2">
                  <Download class="w-4 h-4" />
                  {{ t('checkout.downloadQR') }}
                </UButton>
              </div>

              <!-- Ticket Details -->
              <div class="mt-6 space-y-4">
                <div class="flex justify-between border-b dark:border-gray-700 pb-4">
                  <span class="text-gray-600 dark:text-gray-400">{{ t('checkout.ticketId') }}</span>
                  <span class="font-medium text-gray-900 dark:text-white">#{{ item.id }}</span>
                </div>

                <div class="flex justify-between border-b dark:border-gray-700 pb-4">
                  <span class="text-gray-600 dark:text-gray-400">{{ t('checkout.ticketType') }}</span>
                  <span class="font-medium text-gray-900 dark:text-white">{{ item.productSnapshot?.title }}</span>
                </div>

                <div class="flex justify-between border-b dark:border-gray-700 pb-4">
                  <span class="text-gray-600 dark:text-gray-400">{{ t('checkout.ticketQuantity') }}</span>
                  <span class="font-medium text-gray-900 dark:text-white">{{ item.quantity }}</span>
                </div>

                <div class="flex justify-between">
                  <span class="text-gray-600 dark:text-gray-400">{{ t('checkout.totalAmount') }}</span>
                  <span class="font-medium text-gray-900 dark:text-white">
                    {{ new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.totalPrice) }}
                  </span>
                </div>
              </div>
            </div>
          </template>

          <!-- Physical Items Section -->
          <template v-if="hasPhysicalItems">
            <div class="mt-8 bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 text-left">
              <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                {{ t('checkout.orderDetails') }}
              </h3>
              <div class="space-y-4">
                <div class="flex justify-between border-b dark:border-gray-700 pb-4">
                  <span class="text-gray-600 dark:text-gray-400">{{ t('checkout.orderId') }}</span>
                  <span class="font-medium text-gray-900 dark:text-white">#{{ order.id }}</span>
                </div>

                <div class="flex justify-between border-b dark:border-gray-700 pb-4">
                  <span class="text-gray-600 dark:text-gray-400">{{ t('checkout.orderStatus') }}</span>
                  <span class="font-medium text-green-600">{{ order.status }}</span>
                </div>

                <div class="flex justify-between border-b dark:border-gray-700 pb-4">
                  <span class="text-gray-600 dark:text-gray-400">{{ t('checkout.paymentStatus') }}</span>
                  <span class="font-medium text-green-600">{{ order.paymentStatus }}</span>
                </div>

                <div class="flex justify-between">
                  <span class="text-gray-600 dark:text-gray-400">{{ t('checkout.totalAmount') }}</span>
                  <span class="font-medium text-gray-900 dark:text-white">
                    {{ new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(order.totalAmount) }}
                  </span>
                </div>
              </div>
            </div>
          </template>

          <!-- Action Buttons -->
          <div class="flex justify-center gap-4 mt-8">
            <UButton 
              :to="hasTicketItems ? '/ticket-pricing' : '/products'" 
              color="gray"
            >
              {{ hasTicketItems ? t('checkout.backToTickets') : t('checkout.backToProducts') }}
            </UButton>
           
          </div>
        </div>
      </div>
    </div>
  </div>
</template> 
