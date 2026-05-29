<script setup lang="ts">
import { ref, onMounted, watch } from "vue";
import { useAuth } from "../../composables/useAuth";
import { useTrpc } from "../../composables/useTrpc";
import { useRouter, useRoute } from "vue-router";
import { Menu, MenuButton, MenuItem, MenuItems, TransitionRoot } from '@headlessui/vue';
import {
  ChevronDownIcon,
  ChevronUpIcon,
  XMarkIcon
} from '@heroicons/vue/24/outline';
import {
  ArchiveIcon,
  CopyIcon,
  EyeIcon,
  XCircleIcon as LucideXCircleIcon,
  PencilIcon,
  PlusCircleIcon,
  Trash2Icon,
  TrashIcon,
  PackageIcon,
  MoreHorizontalIcon,
  ListChecksIcon,
  ChevronDownIcon as LucideChevronDownIcon,
  ChevronUpIcon as LucideChevronUpIcon
} from 'lucide-vue-next';
import Swal from 'sweetalert2';
import FilterContainer from '../../components/common/filter/FilterContainer.vue';
import SearchFilter from '../../components/common/filter/SearchFilter.vue';
import StatusFilter from '../../components/common/filter/StatusFilter.vue';
import PageSizeFilter from '../../components/common/filter/PageSizeFilter.vue';
import DataTable from '../../components/common/table/DataTable.vue';
import PageHeader from '../../components/common/header/PageHeader.vue';

// These functions are provided by Nuxt at runtime
// @ts-ignore
const definePageMeta = (meta: any) => {}; 
// @ts-ignore
const useHead = (head: any) => {};

definePageMeta({
  middleware: ["auth"],
});

useHead({
  title: 'Orders Management - Admin Panel'
})

const router = useRouter();
const route = useRoute();
const { checkAuth } = useAuth();
const trpc = useTrpc();

// Define OrderStatus and PaymentStatus enums to match backend
enum OrderStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  PROCESSING = 'processing',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled'
}

enum PaymentStatus {
  PENDING = 'pending',
  PAID = 'paid',
  FAILED = 'failed',
  REFUNDED = 'refunded',
  PARTIALLY_REFUNDED = 'partially_refunded'
}

interface Address {
  city: string;
  country: string;
  line1: string;
  line2?: string;
  postal_code: string;
  state: string;
}

interface OrderItem {
  id: number;
  orderId: number;
  productId: number;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  productSnapshot: any;
  createdAt: string;
  updatedAt: string;
  product?: any;
  travelDate?: string;
}

interface Order {
  id: number;
  orderCode: string;
  userId?: string;
  phoneCode: string;
  phoneNumber: string;
  email?: string;
  customerName?: string;
  status: OrderStatus;
  totalAmount: number;
  shippingAddress?: Address;
  billingAddress?: Address;
  paymentMethod: string;
  paymentStatus: PaymentStatus;
  notes?: string;
  items: OrderItem[];
  createdAt: string;
  updatedAt: string;
}

const isLoading = ref(true);
const error = ref<string | null>(null);
const search = ref(route.query.search?.toString() || '');
const statusFilter = ref<OrderStatus | undefined>(
  route.query.status ? route.query.status as OrderStatus : undefined
);
const paymentStatusFilter = ref<PaymentStatus | undefined>(
  route.query.paymentStatus ? route.query.paymentStatus as PaymentStatus : undefined
);
const page = ref(Number(route.query.page) || 1);
const pageSize = ref(10);
const orders = ref<{
  items: Order[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}>({
  items: [],
  total: 0,
  page: 1,
  pageSize: 10,
  totalPages: 1
});

const selectedOrders = ref<number[]>([]);
const sortBy = ref('createdAt');
const sortOrder = ref<'asc' | 'desc'>('desc');

// Capitalize the first letter of a string
const capitalize = (str: string) => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

// Format date
const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleString();
};

// Get order status badge class
const getStatusBadgeClass = (status: OrderStatus) => {
  switch (status) {
    case OrderStatus.PENDING:
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
    case OrderStatus.CONFIRMED:
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
    case OrderStatus.PROCESSING:
      return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
    case OrderStatus.SHIPPED:
      return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300';
    case OrderStatus.DELIVERED:
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
    case OrderStatus.CANCELLED:
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
  }
};

// Get payment status badge class
const getPaymentStatusBadgeClass = (status: PaymentStatus) => {
  switch (status) {
    case PaymentStatus.PENDING:
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
    case PaymentStatus.PAID:
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
    case PaymentStatus.FAILED:
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
    case PaymentStatus.REFUNDED:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    case PaymentStatus.PARTIALLY_REFUNDED:
      return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
  }
};

// Fetch orders with filters
const fetchOrders = async () => {
  try {
    isLoading.value = true;
    error.value = null;
    
    const params = {
      page: page.value,
      pageSize: pageSize.value,
      search: search.value || undefined,
      status: statusFilter.value,
      paymentStatus: paymentStatusFilter.value
    };
    
    // Nhận kết quả từ API
    const response = await trpc.admin.order.getAllOrders.query(params);
    
    // Trường hợp API trả về dữ liệu trực tiếp
    if (response && typeof response === 'object' && 'items' in response && 'total' in response) {
      orders.value = {
        items: response.items || [],
        total: response.total || 0,
        page: page.value,
        pageSize: pageSize.value,
        totalPages: Math.ceil((response.total || 0) / pageSize.value) || 1
      };
      
      console.log('Orders processed successfully:', orders.value);
    }
    // Xử lý trường hợp cụ thể [{ result: { data: { items: [], total: number } } }]
    else if (Array.isArray(response) && response.length > 0 && response[0]?.result?.data) {
      const result = response[0].result.data;
      
      orders.value = {
        items: result.items || [],
        total: result.total || 0,
        page: page.value,
        pageSize: pageSize.value,
        totalPages: Math.ceil((result.total || 0) / pageSize.value) || 1
      };
      
      console.log('Processed orders from array format:', orders.value);
    }
    // Trường hợp cấu trúc { result: { data: { items: [], total: number } } }
    else if (response?.result?.data) {
      const result = response.result.data;
      
      orders.value = {
        items: result.items || [],
        total: result.total || 0,
        page: page.value,
        pageSize: pageSize.value,
        totalPages: Math.ceil((result.total || 0) / pageSize.value) || 1
      };
      
      console.log('Processed orders from result.data format:', orders.value);
    }
    // Nếu không tìm thấy cấu trúc phù hợp, hiển thị lỗi
    else {
      console.error('Unknown response structure:', response);
      error.value = 'Không thể xử lý dữ liệu từ server';
      
      // Reset orders để tránh lỗi
      orders.value = {
        items: [],
        total: 0,
        page: 1,
        pageSize: 10,
        totalPages: 1
      };
    }
  } catch (err: any) {
    console.error('Error fetching orders:', err);
    error.value = err.message || 'Failed to fetch orders';
    
    // Reset orders to empty state
    orders.value = {
      items: [],
      total: 0,
      page: 1,
      pageSize: 10,
      totalPages: 1
    };
  } finally {
    isLoading.value = false;
  }
};

// Delete a single order
const deleteOrder = async (id: number) => {
  const result = await Swal.fire({
    title: 'Are you sure?',
    text: "You won't be able to revert this!",
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#3085d6',
    cancelButtonColor: '#d33',
    confirmButtonText: 'Yes, delete it!'
  });

  if (result.isConfirmed) {
    try {
      await trpc.admin.order.deleteOrder.mutate(id);
      Swal.fire('Deleted!', 'Order has been deleted.', 'success');
      fetchOrders();
    } catch (err: any) {
      console.error('Error deleting order:', err);
      Swal.fire('Error!', err.message || 'Failed to delete order', 'error');
    }
  }
};

// Bulk delete orders
const bulkDeleteOrders = async () => {
  if (!selectedOrders.value.length) return;

  const result = await Swal.fire({
    title: `Delete ${selectedOrders.value.length} orders?`,
    text: "You won't be able to revert this!",
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#3085d6',
    cancelButtonColor: '#d33',
    confirmButtonText: 'Yes, delete them!'
  });

  if (result.isConfirmed) {
    try {
      // Delete each order
      for (const id of selectedOrders.value) {
        await trpc.admin.order.deleteOrder.mutate(id);
      }
      
      Swal.fire('Deleted!', `${selectedOrders.value.length} orders have been deleted.`, 'success');
      selectedOrders.value = [];
      fetchOrders();
    } catch (err: any) {
      console.error('Error deleting orders:', err);
      Swal.fire('Error!', err.message || 'Failed to delete orders', 'error');
    }
  }
};

// Update order status
const updateOrderStatus = async (id: number, status: OrderStatus) => {
  try {
    await trpc.admin.order.updateOrderStatus.mutate({ id, status });
    Swal.fire('Updated!', 'Order status has been updated.', 'success');
    fetchOrders();
  } catch (err: any) {
    console.error('Error updating order status:', err);
    Swal.fire('Error!', err.message || 'Failed to update order status', 'error');
  }
};

// Update payment status
const updatePaymentStatus = async (id: number, paymentStatus: PaymentStatus) => {
  try {
    await trpc.admin.order.updatePaymentStatus.mutate({ id, paymentStatus });
    Swal.fire('Updated!', 'Payment status has been updated.', 'success');
    fetchOrders();
  } catch (err: any) {
    console.error('Error updating payment status:', err);
    Swal.fire('Error!', err.message || 'Failed to update payment status', 'error');
  }
};

// Update URL with search parameters
const updateUrlParams = () => {
  router.push({
    query: {
      ...route.query,
      page: page.value,
      search: search.value || undefined,
      status: statusFilter.value || undefined,
      paymentStatus: paymentStatusFilter.value || undefined
    }
  });
};

// Watch for changes and update URL
watch([search, statusFilter, paymentStatusFilter, page], () => {
  updateUrlParams();
  fetchOrders();
});

// Initial load
onMounted(async () => {
  await checkAuth();
  await fetchOrders();
});
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <PageHeader
      :title="$t('orders.management')"
      :description="$t('orders.manageAndTrack')"
    >
      <template #actions>
        <div class="flex items-center gap-2">
          <Menu as="div" class="relative" v-if="selectedOrders.length">
            <MenuButton class="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors">
              <ListChecksIcon class="h-4 w-4" />
              {{ $t('orders.bulkActions') }} ({{ selectedOrders.length }})
              <ChevronDownIcon class="h-4 w-4" />
            </MenuButton>

            <MenuItems class="absolute right-0 mt-2 w-56 origin-top-right divide-y divide-gray-100 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
              <div class="px-1 py-1">
                <MenuItem v-slot="{ active }">
                  <button
                    @click="bulkDeleteOrders"
                    :class="[
                      active ? 'bg-red-100 text-red-900' : 'text-red-700',
                      'group flex w-full items-center rounded-md px-2 py-2 text-sm'
                    ]"
                  >
                    <TrashIcon class="mr-2 h-4 w-4" />
                    {{ $t('orders.deleteSelected') }}
                  </button>
                </MenuItem>
              </div>
            </MenuItems>
          </Menu>
          
          <NuxtLink
            to="/orders/create"
            class="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <PlusCircleIcon class="h-5 w-5 mr-2" />
            {{ $t('orders.createOrder') }}
          </NuxtLink>
        </div>
      </template>
    </PageHeader>

    <!-- Filter Container -->
    <FilterContainer>
      <template #search>
        <SearchFilter
          :search="search"
          :search-placeholder="$t('orders.searchPlaceholder')"
          @update:search="search = $event"
        />
      </template>
      
      <template #status>
        <StatusFilter
          :modelValue="statusFilter"
          :options="[
            { label: $t('orders.allStatus'), value: undefined },
            { label: $t('orders.statusPending'), value: OrderStatus.PENDING },
            { label: $t('orders.statusConfirmed'), value: OrderStatus.CONFIRMED },
            { label: $t('orders.statusProcessing'), value: OrderStatus.PROCESSING },
            { label: $t('orders.statusShipped'), value: OrderStatus.SHIPPED },
            { label: $t('orders.statusDelivered'), value: OrderStatus.DELIVERED },
            { label: $t('orders.statusCancelled'), value: OrderStatus.CANCELLED }
          ]"
          @update:modelValue="statusFilter = $event"
        />
      </template>
      
      <template #additionalFilters>
        <div class="flex items-center space-x-4">
          <div class="w-48">
            <label for="payment-status" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{{ $t('orders.paymentStatusLabel') }}</label>
            <select
              id="payment-status"
              v-model="paymentStatusFilter"
              class="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-neutral-800 dark:border-neutral-700 dark:text-white"
            >
              <option :value="undefined">{{ $t('orders.allPaymentStatus') }}</option>
              <option v-for="status in Object.values(PaymentStatus)" :key="status" :value="status">
                {{ capitalize(status.replace('_', ' ')) }}
              </option>
            </select>
          </div>
        </div>
      </template>
      
      <template #pageSize>
        <PageSizeFilter
          :modelValue="pageSize"
          @update:modelValue="pageSize = $event"
        />
      </template>
    </FilterContainer>

    <!-- Orders Table -->
    <DataTable
      :items="orders.items"
      :loading="isLoading"
      :error="error"
      :sort-by="sortBy"
      :sort-order="sortOrder"
      :selected-items="selectedOrders"
      :pagination="{
        currentPage: page,
        totalPages: orders.totalPages,
        total: orders.total,
        pageSize: pageSize
      }"
      @update:selected-items="selectedOrders = $event"
      @sort="sortBy = $event; fetchOrders()"
      @page-change="page = $event"
      @clear-error="error = null"
    >
      <template #header>
        <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          {{ $t('orders.orderInfo') }}
        </th>
        <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          {{ $t('orders.customer') }}
        </th>
        <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          {{ $t('orders.status') }}
        </th>
        <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          {{ $t('orders.payment') }}
        </th>
        <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          {{ $t('orders.amount') }}
        </th>
        <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          {{ $t('orders.date') }}
        </th>
        <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          {{ $t('orders.travelDate') }}
        </th>
        <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          {{ $t('orders.actions') }}
        </th>
      </template>

      <template #row="{ item: order }">
        <!-- ORDER INFO Column -->
        <td class="px-6 py-4 whitespace-nowrap">
          <div class="flex items-center">
            <div>
              <div class="text-sm font-medium text-gray-900 dark:text-white">
                {{ order.orderCode }}
              </div>
              <div class="text-xs text-gray-500 dark:text-gray-400 mt-1">#{{ order.id }}</div>
            </div>
          </div>
        </td>
        
        <!-- CUSTOMER Column -->
        <td class="px-6 py-4 whitespace-nowrap">
          <div class="flex flex-col">
            <div class="text-sm font-medium text-gray-900 dark:text-white">
              {{ order.customerName || $t('orders.guestCustomer') }}
            </div>
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {{ order.email || `${order.phoneCode}${order.phoneNumber}` }}
            </p>
          </div>
        </td>
        
        <!-- STATUS Column -->
        <td class="px-6 py-4 whitespace-nowrap">
          <div class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
               :class="getStatusBadgeClass(order.status)">
            {{ capitalize(order.status) }}
          </div>
          <Menu as="div" class="relative inline-block text-left mt-1">
            <MenuButton class="inline-flex w-full justify-center text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300">
              <span class="underline">{{ $t('orders.change') }}</span>
            </MenuButton>
            <MenuItems class="absolute left-0 z-10 mt-1 w-36 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none dark:bg-neutral-800 dark:ring-neutral-700">
              <div class="py-1">
                <MenuItem v-for="status in Object.values(OrderStatus)" :key="status" v-slot="{ active }">
                  <button
                    @click="updateOrderStatus(order.id, status)"
                    :class="[
                      active ? 'bg-gray-100 text-gray-900 dark:bg-neutral-700 dark:text-white' : 'text-gray-700 dark:text-gray-300',
                      'block px-4 py-2 text-sm w-full text-left'
                    ]"
                  >
                    {{ capitalize(status) }}
                  </button>
                </MenuItem>
              </div>
            </MenuItems>
          </Menu>
        </td>

        <!-- PAYMENT STATUS Column -->
        <td class="px-6 py-4 whitespace-nowrap">
          <div class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
               :class="getPaymentStatusBadgeClass(order.paymentStatus)">
            {{ capitalize(order.paymentStatus.replace('_', ' ')) }}
          </div>
          <Menu as="div" class="relative inline-block text-left mt-1">
            <MenuButton class="inline-flex w-full justify-center text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300">
              <span class="underline">{{ $t('orders.change') }}</span>
            </MenuButton>
            <MenuItems class="absolute left-0 z-10 mt-1 w-36 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none dark:bg-neutral-800 dark:ring-neutral-700">
              <div class="py-1">
                <MenuItem v-for="status in Object.values(PaymentStatus)" :key="status" v-slot="{ active }">
                  <button
                    @click="updatePaymentStatus(order.id, status)"
                    :class="[
                      active ? 'bg-gray-100 text-gray-900 dark:bg-neutral-700 dark:text-white' : 'text-gray-700 dark:text-gray-300',
                      'block px-4 py-2 text-sm w-full text-left'
                    ]"
                  >
                    {{ capitalize(status.replace('_', ' ')) }}
                  </button>
                </MenuItem>
              </div>
            </MenuItems>
          </Menu>
        </td>
        
        <!-- AMOUNT Column -->
        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
          {{ typeof order.totalAmount === 'number' ? order.totalAmount.toFixed(2) : order.totalAmount }}
        </td>
        
        <!-- DATE Column -->
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
          {{ formatDate(order.createdAt) }}
        </td>
        
        <!-- TRAVEL DATE Column -->
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
          <div v-if="order.items && order.items.length > 0">
            <div v-for="item in order.items" :key="item.id" class="mb-1">
              <span v-if="item.travelDate" class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                {{ formatDate(item.travelDate) }}
              </span>
              <span v-else class="text-gray-400 dark:text-gray-600 text-xs">N/A</span>
            </div>
          </div>
          <span v-else class="text-gray-400 dark:text-gray-600 text-xs">N/A</span>
        </td>
        
        <!-- ACTIONS Column -->
        <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
          <div class="flex items-center space-x-2">
            <NuxtLink :to="`/orders/${order.id}`" class="inline-flex h-10 w-10 items-center justify-center rounded-lg text-indigo-600 hover:bg-gray-100 hover:text-indigo-900 dark:text-indigo-400 dark:hover:bg-gray-700 dark:hover:text-indigo-300 transition-colors shrink-0">
              <EyeIcon class="h-6 w-6 shrink-0" />
            </NuxtLink>
            <NuxtLink :to="`/orders/${order.id}/edit`" class="inline-flex h-10 w-10 items-center justify-center rounded-lg text-blue-600 hover:bg-gray-100 hover:text-blue-900 dark:text-blue-400 dark:hover:bg-gray-700 dark:hover:text-blue-300 transition-colors shrink-0">
              <PencilIcon class="h-6 w-6 shrink-0" />
            </NuxtLink>
            <button @click="deleteOrder(order.id)" class="inline-flex h-10 w-10 items-center justify-center rounded-lg text-red-600 hover:bg-gray-100 hover:text-red-900 dark:text-red-400 dark:hover:bg-gray-700 dark:hover:text-red-300 transition-colors shrink-0">
              <TrashIcon class="h-6 w-6 shrink-0" />
            </button>
          </div>
        </td>
      </template>

      <template #empty>
        <div class="text-center py-10">
          <PackageIcon class="mx-auto h-12 w-12 text-gray-400 dark:text-gray-600" />
          <h3 class="mt-2 text-sm font-medium text-gray-900 dark:text-white">{{ $t('orders.noOrdersFound') }}</h3>
          <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {{ $t('orders.getStartedByCreating') }}
          </p>
          <div class="mt-6">
            <NuxtLink
              to="/orders/create"
              class="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <PlusCircleIcon class="-ml-1 mr-2 h-5 w-5" />
              {{ $t('orders.createOrder') }}
            </NuxtLink>
          </div>
        </div>
      </template>
    </DataTable>
  </div>
</template> 
