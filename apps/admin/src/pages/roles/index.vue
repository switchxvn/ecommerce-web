<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue';
import { useTrpc } from "../../composables/useTrpc";
import LoadingIcon from "../../components/LoadingIcon.vue";
import PageHeader from "../../components/common/header/PageHeader.vue";
import FilterContainer from "../../components/common/filter/FilterContainer.vue";
import Swal from 'sweetalert2';
import {
  PencilIcon,
  Trash2Icon,
  SearchIcon,
  PlusIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  UserMinusIcon
} from 'lucide-vue-next';

interface Role {
  id: string;
  name: string;
  code: string;
  groupName: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
  permissions?: Permission[];
}

interface Permission {
  id: string;
  name: string;
  code: string;
  groupName: string;
  description: string;
}

const trpc = useTrpc();
const roles = ref<Role[]>([]);
const isLoading = ref(true);
const searchQuery = ref('');
const selectedGroupName = ref<string | null>(null);
const sortBy = ref('name');
const sortOrder = ref<'asc' | 'desc'>('asc');
const groupNames = ref<string[]>([]);
const currentPage = ref(1);
const totalPages = ref(1);
const totalRoles = ref(0);
const limit = ref(10);

const filteredRoles = computed(() => {
  let filtered = roles.value;
  
  // Filter by search query
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    filtered = filtered.filter(role => 
      role.name.toLowerCase().includes(query) || 
      role.code.toLowerCase().includes(query) ||
      role.description?.toLowerCase().includes(query)
    );
  }
  
  // Filter by group name
  if (selectedGroupName.value) {
    filtered = filtered.filter(role => role.groupName === selectedGroupName.value);
  }
  
  return filtered;
});

const fetchRoles = async () => {
  isLoading.value = true;
  
  try {
    const response = await trpc.admin.roles.getAllRoles.query({
      page: currentPage.value,
      limit: limit.value,
      search: searchQuery.value,
      sortBy: sortBy.value,
      sortOrder: sortOrder.value
    });
    
    roles.value = response.roles;
    totalPages.value = response.totalPages;
    totalRoles.value = response.total;
    currentPage.value = response.currentPage;
    
    // Extract unique group names
    const uniqueGroupNames = new Set(response.roles.map(role => role.groupName));
    groupNames.value = Array.from(uniqueGroupNames);
    
  } catch (error: any) {
    console.error('Lỗi khi tải danh sách vai trò:', error);
  } finally {
    isLoading.value = false;
  }
};

const toggleSort = (field: string) => {
  if (sortBy.value === field) {
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc';
  } else {
    sortBy.value = field;
    sortOrder.value = 'asc';
  }
  fetchRoles();
};

const deleteRole = async (roleId: string) => {
  const result = await Swal.fire({
    title: 'Xóa vai trò',
    text: 'Cảnh báo: Tất cả người dùng đang có vai trò này sẽ bị unset khỏi vai trò nếu bạn xóa. Bạn có chắc chắn muốn xóa vai trò này không?',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Có, xóa ngay!',
    cancelButtonText: 'Hủy bỏ',
    confirmButtonColor: '#DC2626',
  });

  if (result.isConfirmed) {
    try {
      await trpc.admin.roles.deleteRole.mutate(roleId);
      fetchRoles();
      
      Swal.fire({
        title: 'Thành công!',
        text: 'Vai trò đã được xóa thành công',
        icon: 'success',
        timer: 2000,
        showConfirmButton: false
      });
    } catch (error: any) {
      console.error('Lỗi khi xóa vai trò:', error);
      
      Swal.fire({
        title: 'Lỗi!',
        text: error.message || 'Không thể xóa vai trò',
        icon: 'error'
      });
    }
  }
};

const changePage = (page: number) => {
  currentPage.value = page;
  fetchRoles();
};

const sortIcon = (field: string) => {
  if (sortBy.value !== field) {
    return 'fas fa-sort';
  }
  return sortOrder.value === 'asc' ? 'fas fa-sort-up' : 'fas fa-sort-down';
};

// Watch for searchQuery and selectedGroupName changes
watch([searchQuery, selectedGroupName], () => {
  currentPage.value = 1; // Reset to first page
  fetchRoles();
}, { debounce: 300 });

onMounted(() => {
  fetchRoles();
});
</script>

<template>
  <div class="space-y-6 p-6">
    <PageHeader 
      title="Quản lý vai trò" 
      description="Quản lý các vai trò và phân quyền trong hệ thống"
    >
      <template #actions>
        <NuxtLink
          to="/roles/create"
          class="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <PlusIcon class="w-4 h-4 mr-2" />Thêm vai trò mới
        </NuxtLink>
      </template>
    </PageHeader>
    
    <FilterContainer>
      <template #search>
        <div>
          <label for="search" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tìm kiếm vai trò</label>
          <div class="relative">
            <div class="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <SearchIcon class="w-4 h-4 text-gray-400" />
            </div>
            <input
              id="search"
              v-model="searchQuery"
              type="text"
              class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 p-2.5 dark:bg-neutral-700 dark:border-neutral-600 dark:text-white"
              placeholder="Tìm kiếm theo tên, mã vai trò hoặc mô tả"
            />
          </div>
        </div>
      </template>
      
      <template #status>
        <div>
          <label for="group-filter" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Lọc theo nhóm</label>
          <select
            id="group-filter"
            v-model="selectedGroupName"
            class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-neutral-700 dark:border-neutral-600 dark:text-white"
          >
            <option :value="null">Tất cả nhóm</option>
            <option v-for="group in groupNames" :key="group" :value="group">{{ group }}</option>
          </select>
        </div>
      </template>
      
      <template #pageSize>
        <div>
          <label for="limit-filter" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Số mục mỗi trang</label>
          <select
            id="limit-filter"
            v-model="limit"
            @change="fetchRoles"
            class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-neutral-700 dark:border-neutral-600 dark:text-white"
          >
            <option :value="10">10 mục</option>
            <option :value="25">25 mục</option>
            <option :value="50">50 mục</option>
            <option :value="100">100 mục</option>
          </select>
        </div>
      </template>
    </FilterContainer>
    
    <div class="bg-white dark:bg-neutral-800 shadow-sm rounded-lg p-6">
      <div v-if="isLoading" class="flex justify-center items-center h-64">
        <LoadingIcon size="lg" />
      </div>
      
      <div v-else-if="filteredRoles.length === 0" class="text-center py-16">
        <UserMinusIcon class="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <p class="text-gray-500 dark:text-gray-400 text-lg">Không tìm thấy vai trò nào</p>
      </div>
      
      <div v-else class="overflow-x-auto">
        <table class="w-full text-sm text-left text-gray-500 dark:text-gray-400">
          <thead class="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
            <tr>
              <th scope="col" class="px-6 py-3 cursor-pointer" @click="toggleSort('name')">
                Tên vai trò
                <i :class="sortIcon('name')" class="ml-1"></i>
              </th>
              <th scope="col" class="px-6 py-3 cursor-pointer" @click="toggleSort('code')">
                Mã vai trò
                <i :class="sortIcon('code')" class="ml-1"></i>
              </th>
              <th scope="col" class="px-6 py-3 cursor-pointer" @click="toggleSort('groupName')">
                Nhóm
                <i :class="sortIcon('groupName')" class="ml-1"></i>
              </th>
              <th scope="col" class="px-6 py-3">
                Mô tả
              </th>
              <th scope="col" class="px-6 py-3 cursor-pointer" @click="toggleSort('createdAt')">
                Ngày tạo
                <i :class="sortIcon('createdAt')" class="ml-1"></i>
              </th>
              <th scope="col" class="px-6 py-3 text-right">
                Thao tác
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="role in filteredRoles" :key="role.id" class="bg-white dark:bg-neutral-800 border-b dark:border-neutral-700 hover:bg-gray-50 dark:hover:bg-neutral-700">
              <th scope="row" class="px-6 py-4 font-medium text-gray-900 dark:text-white whitespace-nowrap">
                {{ role.name }}
              </th>
              <td class="px-6 py-4">
                <span class="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 dark:bg-neutral-700">{{ role.code }}</span>
              </td>
              <td class="px-6 py-4">
                {{ role.groupName }}
              </td>
              <td class="px-6 py-4">
                {{ role.description || '-' }}
              </td>
              <td class="px-6 py-4">
                {{ new Date(role.createdAt).toLocaleDateString() }}
              </td>
              <td class="px-6 py-4 text-right">
                <div class="flex justify-end gap-2">
                  <NuxtLink
                    :to="`/roles/${role.id}`"
                    class="inline-flex h-10 w-10 items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 transition-colors shrink-0"
                    title="Chỉnh sửa vai trò"
                  >
                    <PencilIcon class="h-6 w-6 shrink-0" />
                  </NuxtLink>
                  <button 
                    class="inline-flex h-10 w-10 items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 transition-colors shrink-0"
                    :disabled="role.code === 'SUPER_ADMIN'"
                    :class="{ 'opacity-50 cursor-not-allowed': role.code === 'SUPER_ADMIN' }"
                    @click="deleteRole(role.id)"
                    title="Xóa vai trò"
                  >
                    <Trash2Icon class="h-6 w-6 shrink-0" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
        
        <!-- Pagination -->
        <div class="flex justify-between items-center mt-4 px-2">
          <div class="text-sm text-gray-700 dark:text-gray-300">
            Hiển thị <span class="font-semibold">{{ roles.length }}</span> trên tổng số <span class="font-semibold">{{ totalRoles }}</span> vai trò
          </div>
          
          <div v-if="totalPages > 1" class="flex space-x-1">
            <button 
              @click="changePage(currentPage - 1)" 
              :disabled="currentPage === 1"
              :class="[
                'px-3 py-1 rounded text-sm',
                currentPage === 1 
                  ? 'bg-gray-100 dark:bg-neutral-700 text-gray-400 dark:text-gray-500 cursor-not-allowed' 
                  : 'bg-gray-200 dark:bg-neutral-600 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-neutral-500'
              ]"
            >
              <ChevronLeftIcon class="w-4 h-4" />
            </button>
            
            <template v-for="page in totalPages" :key="page">
              <button
                v-if="page === currentPage || 
                      page === 1 || 
                      page === totalPages || 
                      (page >= currentPage - 1 && page <= currentPage + 1)"
                @click="changePage(page)"
                :class="[
                  'px-3 py-1 rounded text-sm',
                  currentPage === page
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-200 dark:bg-neutral-600 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-neutral-500'
                ]"
              >
                {{ page }}
              </button>
              
              <span 
                v-else-if="page === currentPage - 2 || page === currentPage + 2"
                class="px-2 py-1 text-gray-500 dark:text-gray-400"
              >
                ...
              </span>
            </template>
            
            <button 
              @click="changePage(currentPage + 1)" 
              :disabled="currentPage === totalPages"
              :class="[
                'px-3 py-1 rounded text-sm',
                currentPage === totalPages 
                  ? 'bg-gray-100 dark:bg-neutral-700 text-gray-400 dark:text-gray-500 cursor-not-allowed' 
                  : 'bg-gray-200 dark:bg-neutral-600 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-neutral-500'
              ]"
            >
              <ChevronRightIcon class="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template> 
