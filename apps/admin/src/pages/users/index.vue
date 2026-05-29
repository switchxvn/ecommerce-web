<template>
  <div class="space-y-6">
    <!-- Header -->
    <PageHeader
      title="Quản lý người dùng"
      description="Quản lý và tổ chức người dùng trong hệ thống"
    >
      <template #actions>
        <div class="flex items-center gap-2">
          <div v-if="selectedUsers.length" class="relative inline-block text-left">
            <button 
              class="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-dark transition-colors"
              @click="handleBulkAction('delete')"
            >
              <TrashIcon class="h-4 w-4" />
              Xóa ({{ selectedUsers.length }})
            </button>
          </div>

          <NuxtLink
            to="/users/create"
            class="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md text-white bg-emerald-600 hover:bg-emerald-700 transition-colors"
          >
            <UserPlusIcon class="h-4 w-4" />
            Tạo người dùng mới
          </NuxtLink>
        </div>
      </template>
    </PageHeader>

    <!-- Search and Filter -->
    <FilterContainer>
      <template #search>
        <SearchFilter
          v-model:search="searchQuery"
          search-placeholder="Tìm kiếm người dùng..."
        />
      </template>
      
      <template #status>
        <StatusFilter
          v-model:modelValue="activeFilter"
          :options="[
            { label: 'Tất cả người dùng', value: undefined },
            { label: 'Đang hoạt động', value: true },
            { label: 'Bị khóa', value: false }
          ]"
        />
      </template>
      
      <template #pageSize>
        <PageSizeFilter
          v-model:modelValue="perPage"
        />
      </template>
    </FilterContainer>

    <!-- Enhanced Error Alert -->
    <TransitionRoot as="template" :show="!!error">
      <div class="rounded-md bg-red-50 p-4 mb-6">
        <div class="flex">
          <div class="flex-shrink-0">
            <LucideXCircleIcon class="h-5 w-5 text-red-400" />
          </div>
          <div class="ml-3">
            <h3 class="text-sm font-medium text-red-800">Lỗi</h3>
            <div class="mt-2 text-sm text-red-700">
              <p>{{ error }}</p>
            </div>
          </div>
          <div class="ml-auto pl-3">
            <button
              type="button"
              class="inline-flex rounded-md bg-red-50 p-1.5 text-red-500 hover:bg-red-100"
              @click="error = null"
            >
              <XMarkIcon class="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </TransitionRoot>

    <!-- Enhanced Loading State -->
    <div v-if="loading" class="bg-white dark:bg-neutral-800 shadow-sm rounded-lg p-6">
      <div class="animate-pulse space-y-4">
        <div v-for="i in 5" :key="i" class="flex space-x-4">
          <div class="h-4 bg-gray-200 dark:bg-neutral-700 rounded w-1/4"></div>
          <div class="h-4 bg-gray-200 dark:bg-neutral-700 rounded w-1/4"></div>
          <div class="h-4 bg-gray-200 dark:bg-neutral-700 rounded w-1/4"></div>
          <div class="h-4 bg-gray-200 dark:bg-neutral-700 rounded w-1/4"></div>
        </div>
      </div>
    </div>

    <!-- Users Table -->
    <DataTable
      :items="users"
      :loading="loading"
      :error="error"
      :sort-by="sortBy"
      :sort-order="sortOrder"
      :selected-items="selectedUsers"
      :pagination="{
        currentPage: currentPage,
        totalPages: totalPages,
        total: totalUsers,
        pageSize: perPage
      }"
      @update:selected-items="selectedUsers = $event"
      @sort="handleSort"
      @page-change="(newPage) => { currentPage = newPage; fetchUsers(); }"
      @clear-error="error = null"
    >
      <!-- Selection slot -->
      <template #selection="{ item, isSelected, toggleSelection }">
        <input
          type="checkbox"
          class="checkbox rounded"
          :checked="isSelected"
          @change="toggleSelection(item.id)"
        />
      </template>

      <!-- Header slot -->
      <template #header="{ sortBy, sortOrder, handleSort }">
        <th scope="col" class="px-6 py-3 text-left">
          <span class="text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Avatar</span>
        </th>
        <th 
          v-for="column in ['Người dùng', 'Vai trò', 'Đăng nhập gần nhất', 'Trạng thái', 'Thao tác']" 
          :key="column"
          scope="col" 
          class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-neutral-600"
          @click="handleSort(column.toLowerCase())"
        >
          <div class="flex items-center gap-2">
            {{ column }}
            <ChevronDownIcon v-if="sortBy !== column.toLowerCase()" class="h-4 w-4" />
            <ChevronUpIcon v-else-if="sortOrder === 'asc'" class="h-4 w-4" />
            <ChevronDownIcon v-else class="h-4 w-4" />
          </div>
        </th>
      </template>

      <!-- Row slot -->
      <template #row="{ item: user }">
        <td class="px-6 py-4 whitespace-nowrap">
          <div class="flex items-center">
            <div class="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-300 font-semibold">
              {{ getUserInitials(user) }}
            </div>
          </div>
        </td>
        <td class="px-6 py-4 whitespace-nowrap">
          <div class="flex items-center">
            <div class="ml-0">
              <div class="text-sm font-medium text-gray-900 dark:text-white">
                {{ getFullName(user) || user.username || "N/A" }}
              </div>
              <div class="text-sm text-gray-500 dark:text-gray-400">
                {{ user.email }}
              </div>
            </div>
          </div>
        </td>
        <td class="px-6 py-4 whitespace-nowrap">
          <div v-if="user.roles && user.roles.length" class="flex flex-wrap gap-1">
            <span 
              v-for="role in user.roles" 
              :key="role.id" 
              class="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
            >
              {{ role.name }}
            </span>
          </div>
          <span v-else class="text-gray-500 dark:text-gray-400 text-sm">Không có vai trò</span>
        </td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
          {{ user.lastLoginAt ? formatDate(user.lastLoginAt) : 'Chưa đăng nhập' }}
        </td>
        <td class="px-6 py-4 whitespace-nowrap">
          <button
            @click="toggleUserStatus(user)"
            :class="{
              'px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full items-center gap-1 cursor-pointer transition-colors duration-200': true,
              'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 hover:bg-green-200 dark:hover:bg-green-800': user.isActive,
              'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 hover:bg-red-200 dark:hover:bg-red-800': !user.isActive
            }"
          >
            <div class="w-2 h-2 rounded-full"
              :class="{
                'bg-green-500': user.isActive,
                'bg-red-500': !user.isActive
              }"
            ></div>
            {{ user.isActive ? 'Hoạt động' : 'Bị khóa' }}
          </button>
          <span 
            v-if="user.isEmailVerified" 
            class="ml-1 px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
          >
            Đã xác thực
          </span>
        </td>
        <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
          <div class="flex justify-end gap-2">
            <NuxtLink
              :to="`/users/${user.id}`"
              class="inline-flex h-10 w-10 items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 transition-colors shrink-0"
              title="Xem chi tiết"
            >
              <UserIcon class="h-6 w-6 shrink-0" />
            </NuxtLink>
            <button
              v-if="!user.isEmailVerified"
              @click="sendPasswordResetEmail(user.id)"
              class="inline-flex h-10 w-10 items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-yellow-600 hover:text-yellow-900 dark:text-yellow-400 dark:hover:text-yellow-300 transition-colors shrink-0"
              title="Gửi email đặt lại mật khẩu"
            >
              <MailIcon class="h-6 w-6 shrink-0" />
            </button>
            <button
              @click="showDeleteConfirm(user)"
              class="inline-flex h-10 w-10 items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 transition-colors shrink-0"
              title="Xóa người dùng"
            >
              <TrashIcon class="h-6 w-6 shrink-0" />
            </button>
          </div>
        </td>
      </template>
    </DataTable>

    <!-- Delete confirmation modal -->
    <div v-if="showDeleteModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 max-w-md w-full">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Xác nhận xóa người dùng</h3>
        <p class="mt-2 text-gray-600 dark:text-gray-300">
          Bạn có chắc chắn muốn xóa người dùng <span class="font-semibold">{{ userToDelete?.username || userToDelete?.email }}</span>? Hành động này không thể hoàn tác.
        </p>
        <div class="mt-6 flex justify-end space-x-3">
          <button
            class="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            @click="showDeleteModal = false"
          >
            Hủy
          </button>
          <button
            class="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
            @click="confirmDelete"
          >
            Xóa
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  ChevronDownIcon,
  ChevronUpIcon,
  XMarkIcon
} from '@heroicons/vue/24/outline'
import {
  UserPlusIcon,
  UserCircleIcon,
  MailIcon,
  XCircleIcon as LucideXCircleIcon,
  TrashIcon,
  LockIcon,
  UserIcon
} from 'lucide-vue-next'
import Swal from 'sweetalert2'
import { TransitionRoot } from '@headlessui/vue'
import { useAuth } from '~/composables/useAuth'
import { useTrpc } from '~/composables/useTrpc'
import { useSiteTitle } from '../../composables/useSiteTitle'
import PageHeader from '../../components/common/header/PageHeader.vue'
import FilterContainer from '../../components/common/filter/FilterContainer.vue'
import SearchFilter from '../../components/common/filter/SearchFilter.vue'
import StatusFilter from '../../components/common/filter/StatusFilter.vue'
import PageSizeFilter from '../../components/common/filter/PageSizeFilter.vue'
import DataTable from '../../components/common/table/DataTable.vue'

// Các thiết lập trang
const definePageMeta = (meta: any) => {}; 
const useHead = (head: any) => {};

definePageMeta({
  middleware: ["auth"],
});

// Set page title with i18n support
useSiteTitle('usersManagement');

const router = useRouter()
const route = useRoute()
const { checkAuth } = useAuth()
const trpc = useTrpc()

// State
const users = ref([])
const loading = ref(true)
const error = ref(null)
const totalUsers = ref(0)
const totalPages = ref(0)
const currentPage = ref(Number(route.query.page) || 1)
const perPage = ref(10)
const searchQuery = ref(route.query.search?.toString() || '')
const activeFilter = ref<boolean | undefined>(
  route.query.isActive === 'true' ? true : 
  route.query.isActive === 'false' ? false : 
  undefined
)
const sortBy = ref('createdAt')
const sortOrder = ref<'asc' | 'desc'>('desc')
const showDeleteModal = ref(false)
const userToDelete = ref(null)
const selectedUsers = ref<string[]>([])

// Update URL query parameters
const updateQueryParams = () => {
  const query: Record<string, string | undefined> = {
    page: currentPage.value > 1 ? currentPage.value.toString() : undefined,
    search: searchQuery.value || undefined,
    isActive: activeFilter.value !== undefined ? activeFilter.value.toString() : undefined
  };

  // Remove undefined values
  Object.keys(query).forEach(key => query[key] === undefined && delete query[key]);

  router.replace({ query });
}

// Watch for changes in filters and update URL
watch([currentPage, searchQuery, activeFilter], () => {
  updateQueryParams();
  fetchUsers();
}, { deep: true });

// Fetch users
const fetchUsers = async (page = currentPage.value) => {
  if (page < 1 || (totalPages.value > 0 && page > totalPages.value)) {
    return
  }
  
  currentPage.value = page
  loading.value = true
  
  try {
    const response = await trpc.admin.users.getAllUsers.query({
      page,
      limit: perPage.value,
      search: searchQuery.value || undefined,
      isActive: activeFilter.value,
      sortBy: sortBy.value,
      sortOrder: sortOrder.value
    })
    
    users.value = response.users
    totalUsers.value = response.total
    totalPages.value = response.totalPages
  } catch (err) {
    console.error('Error fetching users:', err)
    error.value = err.message || 'Không thể tải danh sách người dùng'
  } finally {
    loading.value = false
  }
}

// Reset filters
const resetFilters = () => {
  searchQuery.value = ''
  activeFilter.value = undefined
  sortBy.value = 'createdAt'
  sortOrder.value = 'desc'
  currentPage.value = 1
  fetchUsers(1)
}

// Helper functions
const getUserInitials = (user) => {
  if (user.profile && user.profile.firstName && user.profile.lastName) {
    return `${user.profile.firstName.charAt(0)}${user.profile.lastName.charAt(0)}`.toUpperCase()
  }
  if (user.username) {
    return user.username.charAt(0).toUpperCase()
  }
  if (user.email) {
    return user.email.charAt(0).toUpperCase()
  }
  return 'U'
}

// Get full name from profile
const getFullName = (user) => {
  if (user.profile) {
    if (user.profile.lastName && user.profile.firstName) {
      return `${user.profile.lastName} ${user.profile.firstName}`.trim()
    } else if (user.profile.lastName) {
      return user.profile.lastName
    } else if (user.profile.firstName) {
      return user.profile.firstName
    }
  }
  return null
}

const formatDate = (dateString) => {
  if (!dateString) return 'N/A'
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('vi-VN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date)
}

// Delete user handling
const showDeleteConfirm = (user) => {
  userToDelete.value = user
  showDeleteModal.value = true
}

const confirmDelete = async () => {
  if (!userToDelete.value) return
  
  try {
    await trpc.admin.users.deleteUser.mutate(userToDelete.value.id)
    
    Swal.fire({
      title: 'Thành công!',
      text: 'Xóa người dùng thành công',
      icon: 'success',
      timer: 2000,
      showConfirmButton: false
    })
    
    showDeleteModal.value = false
    fetchUsers(currentPage.value)
  } catch (err) {
    console.error('Error deleting user:', err)
    
    Swal.fire({
      title: 'Lỗi!',
      text: err.message || 'Không thể xóa người dùng',
      icon: 'error'
    })
  }
}

// Bulk actions
const handleBulkAction = async (action) => {
  const selectedCount = selectedUsers.value.length
  if (!selectedCount) return

  let confirmConfig = {
    icon: 'question',
    showCancelButton: true,
    confirmButtonText: 'Xác nhận',
    cancelButtonText: 'Hủy',
    title: '',
    text: '',
    confirmButtonColor: ''
  }

  switch (action) {
    case 'activate':
      confirmConfig = {
        ...confirmConfig,
        title: 'Kích hoạt người dùng đã chọn?',
        text: `Bạn có chắc muốn kích hoạt ${selectedCount} người dùng đã chọn?`,
        confirmButtonColor: '#10B981',
        confirmButtonText: 'Kích hoạt'
      }
      break
    case 'deactivate':
      confirmConfig = {
        ...confirmConfig,
        title: 'Vô hiệu hóa người dùng đã chọn?',
        text: `Bạn có chắc muốn vô hiệu hóa ${selectedCount} người dùng đã chọn?`,
        confirmButtonColor: '#6B7280',
        confirmButtonText: 'Vô hiệu hóa'
      }
      break
    case 'delete':
      confirmConfig = {
        ...confirmConfig,
        title: 'Xóa người dùng đã chọn?',
        text: `Bạn có chắc muốn xóa ${selectedCount} người dùng đã chọn? Hành động này không thể hoàn tác.`,
        confirmButtonColor: '#DC2626',
        confirmButtonText: 'Xóa',
        icon: 'warning'
      }
      break
    case 'resetPassword':
      confirmConfig = {
        ...confirmConfig,
        title: 'Gửi email đặt lại mật khẩu?',
        text: `Bạn có chắc muốn gửi email đặt lại mật khẩu cho ${selectedCount} người dùng đã chọn?`,
        confirmButtonColor: '#2563EB',
        confirmButtonText: 'Gửi email'
      }
      break
  }

  const result = await Swal.fire(confirmConfig)
  if (!result.isConfirmed) return

  try {
    loading.value = true

    switch (action) {
      case 'activate':
      case 'deactivate':
        // To be implemented when API supports bulk updates
        break
      case 'delete':
        for (const userId of selectedUsers.value) {
          await trpc.admin.users.deleteUser.mutate(userId)
        }
        break
      case 'resetPassword':
        for (const userId of selectedUsers.value) {
          await trpc.admin.users.sendPasswordResetEmail.mutate(userId)
        }
        break
    }

    // Refresh users list
    await fetchUsers()
    selectedUsers.value = []

    Swal.fire({
      title: 'Thành công!',
      text: `Đã thực hiện thao tác ${action} cho ${selectedCount} người dùng`,
      icon: 'success',
      timer: 2000,
      showConfirmButton: false
    })
  } catch (err) {
    error.value = err.message || `Không thể thực hiện thao tác ${action}`
    console.error(`Error performing ${action} on users:`, err)
    
    Swal.fire({
      title: 'Lỗi!',
      text: err.message || `Không thể thực hiện thao tác ${action}`,
      icon: 'error'
    })
  } finally {
    loading.value = false
  }
}

// Send password reset email
const sendPasswordResetEmail = async (userId) => {
  try {
    await trpc.admin.users.sendPasswordResetEmail.mutate(userId)
    
    Swal.fire({
      title: 'Thành công!',
      text: 'Đã gửi email đặt lại mật khẩu',
      icon: 'success',
      timer: 2000,
      showConfirmButton: false
    })
  } catch (err) {
    console.error('Error sending password reset email:', err)
    
    Swal.fire({
      title: 'Lỗi!',
      text: err.message || 'Không thể gửi email đặt lại mật khẩu',
      icon: 'error'
    })
  }
}

// Toggle user active status
const toggleUserStatus = async (user) => {
  const newStatus = !user.isActive
  
  const result = await Swal.fire({
    title: `${newStatus ? 'Kích hoạt' : 'Vô hiệu hóa'} người dùng?`,
    text: `Bạn có chắc muốn ${newStatus ? 'kích hoạt' : 'vô hiệu hóa'} người dùng "${user.email}"?`,
    icon: 'question',
    showCancelButton: true,
    confirmButtonText: `${newStatus ? 'Kích hoạt' : 'Vô hiệu hóa'}`,
    cancelButtonText: 'Hủy',
    confirmButtonColor: newStatus ? '#10B981' : '#6B7280',
  })

  if (!result.isConfirmed) return

  try {
    // Implementation pending API support
    // await trpc.admin.users.updateUserStatus.mutate({
    //   id: user.id,
    //   isActive: newStatus
    // })
    
    // Temporarily update UI directly
    user.isActive = newStatus
    
    Swal.fire({
      title: 'Thành công!',
      text: `Người dùng đã được ${newStatus ? 'kích hoạt' : 'vô hiệu hóa'}`,
      icon: 'success',
      timer: 2000,
      showConfirmButton: false
    })
  } catch (err) {
    console.error('Error updating user status:', err)
    
    Swal.fire({
      title: 'Lỗi!',
      text: err.message || 'Không thể cập nhật trạng thái người dùng',
      icon: 'error'
    })
  }
}

// Sorting
const handleSort = (column) => {
  if (sortBy.value === column) {
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortBy.value = column
    sortOrder.value = 'asc'
  }
  fetchUsers()
}

// Selection
const toggleSelectAll = () => {
  if (selectedUsers.value.length === users.value.length) {
    selectedUsers.value = []
  } else {
    selectedUsers.value = users.value.map(user => user.id)
  }
}

const toggleUserSelection = (userId) => {
  const index = selectedUsers.value.indexOf(userId)
  if (index === -1) {
    selectedUsers.value.push(userId)
  } else {
    selectedUsers.value.splice(index, 1)
  }
}

// Initial load
onMounted(async () => {
  try {
    // Check authentication first
    const isAuthenticated = await checkAuth()
    if (!isAuthenticated) {
      router.push("/auth/login")
      return
    }

    await fetchUsers()
  } catch (err) {
    error.value = err.message || "Không thể khởi tạo trang quản lý người dùng"
    console.error("Error initializing users page:", err)
    loading.value = false
  }
})
</script> 
