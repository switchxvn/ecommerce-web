<script setup lang="ts">
import { ref, onMounted, watch } from "vue";
import { useAuth } from "../../../composables/useAuth";
import { useTrpc } from "../../../composables/useTrpc";
import { useRouter, useRoute } from "vue-router";
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/vue';
import {
  EyeIcon,
  PencilIcon,
  Trash2Icon,
  MoreHorizontalIcon,
  PackageIcon,
  PlusCircleIcon
} from 'lucide-vue-next';
import Swal from 'sweetalert2';
import FilterContainer from '../../../components/common/filter/FilterContainer.vue';
import SearchFilter from '../../../components/common/filter/SearchFilter.vue';
import StatusFilter from '../../../components/common/filter/StatusFilter.vue';
import PageSizeFilter from '../../../components/common/filter/PageSizeFilter.vue';
import DataTable from '../../../components/common/table/DataTable.vue';
import PageHeader from '../../../components/common/header/PageHeader.vue';

// These functions are provided by Nuxt at runtime
// @ts-ignore
const definePageMeta = (meta: any) => {}; 
// @ts-ignore
const useHead = (head: any) => {};

definePageMeta({
  middleware: ["auth"],
});

useHead({
  title: 'Quản lý yêu cầu báo giá - Admin Panel'
})

const router = useRouter();
const route = useRoute();
const { checkAuth } = useAuth();
const trpc = useTrpc();

// Define PriceRequestStatus enum to match backend
enum PriceRequestStatus {
  PENDING = 'pending',
  PROCESSED = 'processed',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

interface PriceRequest {
  id: number;
  fullName: string;
  email: string;
  phone: string;
  message?: string;
  productId: number;
  productName: string;
  status: PriceRequestStatus;
  createdAt: string;
  updatedAt: string;
  product?: any;
}

const isLoading = ref(true);
const error = ref<string | null>(null);
const search = ref(route.query.search?.toString() || '');
const statusFilter = ref<PriceRequestStatus | undefined>(
  route.query.status ? route.query.status as PriceRequestStatus : undefined
);
const page = ref(Number(route.query.page) || 1);
const pageSize = ref(10);
const priceRequests = ref<{
  items: PriceRequest[];
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

const selectedRequests = ref<number[]>([]);
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

// Get status badge class
const getStatusBadgeClass = (status: PriceRequestStatus) => {
  switch (status) {
    case PriceRequestStatus.PENDING:
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
    case PriceRequestStatus.PROCESSED:
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
    case PriceRequestStatus.COMPLETED:
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
    case PriceRequestStatus.CANCELLED:
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
  }
};

// Get status display name
const getStatusDisplayName = (status: PriceRequestStatus) => {
  switch (status) {
    case PriceRequestStatus.PENDING:
      return 'Đang chờ';
    case PriceRequestStatus.PROCESSED:
      return 'Đã xử lý';
    case PriceRequestStatus.COMPLETED:
      return 'Hoàn thành';
    case PriceRequestStatus.CANCELLED:
      return 'Đã hủy';
    default:
      return status;
  }
};

// Update URL with search parameters
const updateUrlParams = () => {
  router.replace({
    query: {
      ...route.query,
      page: page.value.toString(),
      ...(statusFilter.value && { status: statusFilter.value }),
      ...(search.value && { search: search.value })
    }
  });
};

// Fetch price requests with filters
const fetchPriceRequests = async () => {
  try {
    isLoading.value = true;
    error.value = null;
    
    const params = {
      page: page.value,
      pageSize: pageSize.value,
      status: statusFilter.value,
      search: search.value?.trim() || undefined
    };

    const response = await trpc.admin.priceRequest.getAllPriceRequests.query(params);
    
    priceRequests.value = {
      items: response.items,
      total: response.total,
      page: params.page,
      pageSize: params.pageSize,
      totalPages: Math.ceil(response.total / params.pageSize)
    };
  } catch (err) {
    console.error('Error fetching price requests:', err);
    error.value = 'Không thể tải yêu cầu báo giá. Vui lòng thử lại sau.';
  } finally {
    isLoading.value = false;
  }
};

// Handle page change
const handlePageChange = (newPage: number) => {
  page.value = newPage;
};

// Handle page size change
const handlePageSizeChange = (newSize: number) => {
  pageSize.value = newSize;
  page.value = 1; // Reset to first page when changing page size
};

// Handle search
const handleSearch = (searchTerm: string) => {
  search.value = searchTerm;
  page.value = 1; // Reset to first page when searching
};

// Handle status filter change
const handleStatusChange = (status: PriceRequestStatus | undefined) => {
  statusFilter.value = status;
  page.value = 1; // Reset to first page when changing filter
};

// Handle view price request details
const viewPriceRequest = (id: number) => {
  router.push(`/orders/price-requests/${id}`);
};

// Handle delete price request
const deletePriceRequest = async (id: number) => {
  try {
    const result = await Swal.fire({
      title: 'Xác nhận xóa',
      text: 'Bạn có chắc chắn muốn xóa yêu cầu báo giá này?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Xóa',
      cancelButtonText: 'Hủy',
      confirmButtonColor: '#ef4444',
    });

    if (result.isConfirmed) {
      await trpc.admin.priceRequest.deletePriceRequest.mutate(id);
      
      Swal.fire({
        title: 'Đã xóa!',
        text: 'Yêu cầu báo giá đã được xóa thành công.',
        icon: 'success',
        timer: 2000,
        showConfirmButton: false
      });
      
      fetchPriceRequests();
    }
  } catch (err) {
    console.error('Error deleting price request:', err);
    Swal.fire({
      title: 'Lỗi!',
      text: 'Không thể xóa yêu cầu báo giá. Vui lòng thử lại sau.',
      icon: 'error'
    });
  }
};

// Handle update status
const updateStatus = async (id: number, status: PriceRequestStatus) => {
  try {
    await trpc.admin.priceRequest.updatePriceRequestStatus.mutate({
      id,
      status
    });
    
    Swal.fire({
      title: 'Thành công!',
      text: 'Đã cập nhật trạng thái yêu cầu báo giá.',
      icon: 'success',
      timer: 2000,
      showConfirmButton: false
    });
    
    fetchPriceRequests();
  } catch (err) {
    console.error('Error updating price request status:', err);
    Swal.fire({
      title: 'Lỗi!',
      text: 'Không thể cập nhật trạng thái yêu cầu báo giá. Vui lòng thử lại sau.',
      icon: 'error'
    });
  }
};

// Handle bulk delete requests
const bulkDeleteRequests = async () => {
  if (!selectedRequests.value.length) return;

  const result = await Swal.fire({
    title: `Xóa ${selectedRequests.value.length} yêu cầu?`,
    text: "Hành động này không thể hoàn tác!",
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#dc2626',
    cancelButtonColor: '#6b7280',
    confirmButtonText: 'Đồng ý, xóa!',
    cancelButtonText: 'Hủy'
  });

  if (result.isConfirmed) {
    try {
      for (const id of selectedRequests.value) {
        await trpc.admin.priceRequest.deletePriceRequest.mutate(id);
      }
      
      Swal.fire({
        title: 'Đã xóa!',
        text: `${selectedRequests.value.length} yêu cầu báo giá đã được xóa.`,
        icon: 'success',
        timer: 2000,
        showConfirmButton: false
      });
      
      selectedRequests.value = [];
      fetchPriceRequests();
    } catch (err) {
      console.error('Error deleting price requests:', err);
      Swal.fire({
        title: 'Lỗi!',
        text: 'Không thể xóa yêu cầu báo giá. Vui lòng thử lại sau.',
        icon: 'error'
      });
    }
  }
};

// Watch for changes and update URL
watch([search, statusFilter, page, pageSize], () => {
  updateUrlParams();
  fetchPriceRequests();
}, { deep: true });

// Initialize data
onMounted(async () => {
  try {
    await checkAuth(); // Verify user is authenticated
    await fetchPriceRequests();
  } catch (err) {
    console.error('Authentication error:', err);
    error.value = 'Vui lòng đăng nhập để tiếp tục.';
    isLoading.value = false;
  }
});
</script>

<template>
  <div class="space-y-6">
    <!-- Page header -->
    <PageHeader 
      title="Quản lý yêu cầu báo giá" 
      description="Quản lý các yêu cầu báo giá từ khách hàng"
    >
      <template #actions>
        <div class="flex items-center gap-2">
          <Menu as="div" class="relative" v-if="selectedRequests.length">
            <MenuButton class="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors">
              <span>Thao tác ({{ selectedRequests.length }})</span>
            </MenuButton>

            <MenuItems class="absolute right-0 mt-2 w-56 origin-top-right divide-y divide-gray-100 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-10 dark:bg-neutral-800 dark:divide-neutral-700">
              <div class="px-1 py-1">
                <MenuItem v-slot="{ active }">
                  <button
                    @click="bulkDeleteRequests"
                    :class="[
                      active ? 'bg-red-100 text-red-900 dark:bg-red-900 dark:text-red-100' : 'text-red-700 dark:text-red-400',
                      'group flex w-full items-center rounded-md px-2 py-2 text-sm'
                    ]"
                  >
                    <Trash2Icon class="mr-2 h-4 w-4" />
                    Xóa đã chọn
                  </button>
                </MenuItem>
              </div>
            </MenuItems>
          </Menu>
        </div>
      </template>
    </PageHeader>
    
    <!-- Filters -->
    <FilterContainer>
      <template #search>
        <SearchFilter
          v-model:search="search"
          search-placeholder="Tìm theo tên, email, số điện thoại..."
          hide-label
        />
      </template>
      
      <template #status>
        <StatusFilter
          :modelValue="statusFilter"
          :options="[
            { value: undefined, label: 'Tất cả trạng thái' },
            { value: PriceRequestStatus.PENDING, label: 'Đang chờ' },
            { value: PriceRequestStatus.PROCESSED, label: 'Đã xử lý' },
            { value: PriceRequestStatus.COMPLETED, label: 'Hoàn thành' },
            { value: PriceRequestStatus.CANCELLED, label: 'Đã hủy' }
          ]"
          @update:modelValue="handleStatusChange"
          hide-label
        />
      </template>
      
      <template #pageSize>
        <PageSizeFilter
          v-model:modelValue="pageSize"
          hide-label
        />
      </template>
    </FilterContainer>

    <!-- Table -->
    <DataTable
      :loading="isLoading"
      :error="error"
      :items="priceRequests.items"
      :pagination="{
        currentPage: page,
        totalPages: priceRequests.totalPages,
        total: priceRequests.total,
        pageSize: pageSize
      }"
      :selected-items="selectedRequests"
      :sort-by="sortBy"
      :sort-order="sortOrder"
      @page-change="handlePageChange"
      @update:selected-items="selectedRequests = $event"
    >
      <template #header>
        <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          ID
        </th>
        <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          Khách hàng
        </th>
        <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          Sản phẩm
        </th>
        <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          Trạng thái
        </th>
        <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          Ngày tạo
        </th>
        <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          Thao tác
        </th>
      </template>
      
      <template #row="{ item }">
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
          {{ item.id }}
        </td>
        <td class="px-6 py-4 whitespace-nowrap">
          <div class="flex flex-col">
            <div class="text-sm font-medium text-gray-900 dark:text-white">
              {{ item.fullName }}
            </div>
            <div class="text-xs text-gray-500 dark:text-gray-400 mt-1">{{ item.email }}</div>
            <div class="text-xs text-gray-500 dark:text-gray-400">{{ item.phone }}</div>
          </div>
        </td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
          {{ item.productName }}
        </td>
        <td class="px-6 py-4 whitespace-nowrap">
          <div class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
               :class="getStatusBadgeClass(item.status)">
            {{ getStatusDisplayName(item.status) }}
          </div>
          <Menu as="div" class="relative inline-block text-left mt-1">
            <MenuButton class="inline-flex w-full justify-center text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300">
              <span class="underline">Thay đổi</span>
            </MenuButton>
            <MenuItems class="absolute left-0 z-10 mt-1 w-36 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none dark:bg-neutral-800 dark:ring-neutral-700">
              <div class="py-1">
                <MenuItem v-for="status in Object.values(PriceRequestStatus)" :key="status" v-slot="{ active }">
                  <button
                    @click="updateStatus(item.id, status)"
                    :class="[
                      active ? 'bg-gray-100 text-gray-900 dark:bg-neutral-700 dark:text-white' : 'text-gray-700 dark:text-gray-300',
                      'block px-4 py-2 text-sm w-full text-left'
                    ]"
                    :disabled="item.status === status"
                  >
                    {{ getStatusDisplayName(status) }}
                  </button>
                </MenuItem>
              </div>
            </MenuItems>
          </Menu>
        </td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
          {{ formatDate(item.createdAt) }}
        </td>
        <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
          <div class="flex items-center space-x-2">
            <button 
              @click="viewPriceRequest(item.id)" 
              class="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
              title="Xem chi tiết"
            >
              <EyeIcon class="w-5 h-5" />
            </button>
            <button 
              @click="deletePriceRequest(item.id)" 
              class="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
              title="Xóa yêu cầu"
            >
              <Trash2Icon class="w-5 h-5" />
            </button>
          </div>
        </td>
      </template>
      
      <template #empty>
        <div class="text-center py-10">
          <PackageIcon class="mx-auto h-12 w-12 text-gray-400 dark:text-gray-600" />
          <h3 class="mt-2 text-sm font-medium text-gray-900 dark:text-white">Không tìm thấy yêu cầu báo giá nào</h3>
          <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Chưa có yêu cầu báo giá nào được gửi đến.
          </p>
        </div>
      </template>
    </DataTable>
  </div>
</template> 
