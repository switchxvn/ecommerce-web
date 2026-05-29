<script setup lang="ts">
import type { Category, PaginatedResponse } from '@ew/shared';
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
  EyeOffIcon,
  ImageIcon,
  ListChecksIcon,
  XCircleIcon as LucideXCircleIcon,
  PencilIcon,
  PlusCircleIcon,
  Trash2Icon,
  TrashIcon,
  ZoomInIcon,
  HelpCircleIcon
} from 'lucide-vue-next';
import * as lucideIcons from 'lucide-vue-next';
import Swal from 'sweetalert2';
import { onMounted, ref, watch, computed, h } from "vue";
import { useRoute, useRouter } from "vue-router";
import FilterContainer from '../../components/common/filter/FilterContainer.vue';
import SearchFilter from '../../components/common/filter/SearchFilter.vue';
import StatusFilter from '../../components/common/filter/StatusFilter.vue';
import PageSizeFilter from '../../components/common/filter/PageSizeFilter.vue';
import DataTable from '../../components/common/table/DataTable.vue';
import PageHeader from '../../components/common/header/PageHeader.vue';
import { useAuth } from "../../composables/useAuth";
import { useCategory } from "../../composables/useCategory";
import { useLocalization } from '../../composables/useLocalization';
import { useSiteTitle } from '../../composables/useSiteTitle';

// Set page title with i18n support
useSiteTitle('categoriesList');

// Đăng ký $lucide để sử dụng trong template
const $lucide = lucideIcons;

// Helper function để lấy đúng icon component từ tên icon
const getIconComponent = (iconName: string | undefined | null) => {
  if (!iconName) return HelpCircleIcon;
  
  // Chuyển đổi tên icon sang PascalCase với "Icon" suffix
  // Ví dụ: "credit-card" -> "CreditCardIcon"
  const pascalCaseName = iconName
    .split('-')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join('') + 'Icon';
  
  // Trả về icon component tương ứng hoặc HelpCircleIcon nếu không tìm thấy
  return $lucide[pascalCaseName as keyof typeof $lucide] || HelpCircleIcon;
};

// These functions are provided by Nuxt at runtime
// @ts-ignore
const definePageMeta = (meta: any) => {};

definePageMeta({
  middleware: ["auth"],
}); 
// @ts-ignore
const useHead = (head: any) => {};
// @ts-ignore
const navigateTo = (path: any, options?: any) => {};

const router = useRouter();
const route = useRoute();
const { checkAuth } = useAuth();
const { t } = useLocalization();

// Use the category composable
const {
  loading: isLoading,
  categories: categoryData,
  filter,
  totalItems,
  totalPages,
  currentPage,
  fetchCategories,
  deleteCategory,
  applyFilter,
  resetFilter,
  changePage,
  toggleActive,
  bulkAction
} = useCategory();

// Initialize search from URL query params
if (route.query.search) {
  filter.value.search = route.query.search.toString();
}

// Initialize active filter from URL query params
if (route.query.active) {
  const activeParam = route.query.active.toString();
  filter.value.active = 
    activeParam === 'active' || activeParam === 'true' ? true :
    activeParam === 'inactive' || activeParam === 'false' ? false :
    null;
}

// Initialize page from URL query params
if (route.query.page) {
  filter.value.page = Number(route.query.page) || 1;
}

// Initialize sort from URL query params
if (route.query.sortBy) {
  filter.value.sortBy = route.query.sortBy.toString();
}

if (route.query.sortOrder) {
  filter.value.sortOrder = (route.query.sortOrder.toString() as 'asc' | 'desc');
}

// Local state for UI
const error = ref<string | null>(null);
const selectedCategories = ref<number[]>([]);
const showBulkActions = ref(false);

// Computed properties for UI binding
const search = computed({
  get: () => filter.value.search,
  set: (value) => { filter.value.search = value; }
});

const activeFilter = computed({
  get: () => filter.value.active === true ? 'true' : filter.value.active === false ? 'false' : '',
  set: (value) => { 
    filter.value.active = value === 'true' ? true : value === 'false' ? false : null; 
  }
});

const page = computed({
  get: () => filter.value.page,
  set: (value) => { filter.value.page = value; }
});

const pageSize = computed({
  get: () => filter.value.limit,
  set: (value) => { filter.value.limit = value; }
});

const sortBy = computed({
  get: () => filter.value.sortBy || 'createdAt',
  set: (value) => { filter.value.sortBy = value; }
});

const sortOrder = computed({
  get: () => filter.value.sortOrder || 'desc',
  set: (value) => { filter.value.sortOrder = value; }
});

// Categories for UI with proper typing
const categories = computed(() => ({
  items: categoryData.value,
  total: totalItems.value,
  totalPages: totalPages.value,
  currentPage: currentPage.value,
  limit: filter.value.limit
}));

// Update URL query parameters
const updateQueryParams = () => {
  console.log('Updating query params:', {
    page: page.value,
    search: search.value,
    active: activeFilter.value,
    sortBy: sortBy.value,
    sortOrder: sortOrder.value
  });

  // Convert internal values to URL-friendly values
  const activeParamValue = 
    activeFilter.value === 'true' ? 'active' :
    activeFilter.value === 'false' ? 'inactive' :
    undefined;

  navigateTo({
    query: {
      page: page.value > 1 ? page.value.toString() : undefined,
      search: search.value || undefined,
      active: activeParamValue,
      sortBy: sortBy.value || undefined,
      sortOrder: sortOrder.value || undefined
    }
  }, { replace: true });
};

// Watch for changes in filters and update URL
watch([page, search, activeFilter, sortBy, sortOrder], () => {
  console.log('Filters changed:', {
    page: page.value,
    search: search.value,
    active: activeFilter.value,
    sortBy: sortBy.value,
    sortOrder: sortOrder.value
  });
  
  updateQueryParams();
  applyFilter();
}, { deep: true });

async function handleDelete(id: number) {
  const result = await Swal.fire({
    title: t('actions.delete') + ' ' + t('categories.title'),
    text: t('categories.confirmDelete'),
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: t('actions.confirm'),
    cancelButtonText: t('actions.cancel'),
    confirmButtonColor: '#DC2626',
  });

  if (result.isConfirmed) {
    try {
      await deleteCategory(id);
      
      Swal.fire({
        title: t('messages.success'),
        text: t('categories.title') + ' ' + t('messages.success').toLowerCase(),
        icon: 'success',
        timer: 2000,
        showConfirmButton: false
      });
    } catch (err: any) {
      console.error('Error deleting category:', err);
      
      Swal.fire({
        title: t('messages.error'),
        text: err.message || t('messages.error'),
        icon: 'error'
      });
    }
  }
}

// Handle bulk actions
const handleBulkAction = async (action: string) => {
  if (selectedCategories.value.length === 0) {
    return;
  }

  let confirmMessage = '';
  let confirmButtonText = '';
  let confirmButtonColor = '';

  if (action === 'delete') {
    confirmMessage = t('categories.confirmBulkDelete');
    confirmButtonText = t('actions.confirm');
    confirmButtonColor = '#DC2626';
  } else if (action === 'activate') {
    confirmMessage = t('categories.confirmBulkActivate');
    confirmButtonText = t('actions.confirm');
    confirmButtonColor = '#10B981';
  } else if (action === 'deactivate') {
    confirmMessage = t('categories.confirmBulkDeactivate');
    confirmButtonText = t('actions.confirm');
    confirmButtonColor = '#EF4444';
  }

  const result = await Swal.fire({
    title: action.charAt(0).toUpperCase() + action.slice(1) + ' ' + t('categories.title'),
    text: confirmMessage,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText,
    cancelButtonText: t('actions.cancel'),
    confirmButtonColor,
  });

  if (result.isConfirmed) {
    try {
      await bulkAction(action, selectedCategories.value);
      
      // Show success message and reset selected categories
      selectedCategories.value = [];
      showBulkActions.value = false;
    } catch (err: any) {
      console.error(`Error during bulk ${action}:`, err);
      
      Swal.fire({
        title: t('messages.error'),
        text: err.message || `Failed to ${action} selected categories`,
        icon: 'error'
      });
    }
  }
};

// Format date for display
const formatDate = (date: string | Date) => {
  return new Date(date).toLocaleDateString();
};

// Handle category activation/deactivation
const toggleCategoryStatus = async (id: number, active: boolean) => {
  try {
    await toggleActive(id, active);
  } catch (err: any) {
    console.error('Error toggling category status:', err);
    error.value = err.message;
  }
};

// Handle row click
const handleRowClick = async (id: number) => {
  await navigateTo(`/categories/${id}`);
};

// Add helper function to get translated name
const getCategoryName = (category: any): string => {
  if (!category.translations || category.translations.length === 0) {
    return 'No translation';
  }
  
  // Try to find translation for current locale
  const translation = category.translations.find((t: any) => t.locale === 'vi') || category.translations[0];
  return translation?.name || 'Unnamed';
};

onMounted(async () => {
  try {
    // Check authentication first
    const isAuthenticated = await checkAuth();
    if (!isAuthenticated) {
      router.push("/auth/login");
      return;
    }

    await fetchCategories();
  } catch (err: any) {
    error.value = err.message || "Failed to initialize categories page";
    console.error("Error initializing categories page:", err);
    isLoading.value = false;
  }
});
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <PageHeader
      :title="t('categories.title')"
      :description="t('categories.description')"
    >
      <template #actions>
        <div class="flex items-center gap-2">
          <Menu as="div" class="relative" v-if="selectedCategories.length">
            <MenuButton class="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors">
              <ListChecksIcon class="h-4 w-4" />
              {{ t('categories.bulkActions') }} ({{ selectedCategories.length }})
              <ChevronDownIcon class="h-4 w-4" />
            </MenuButton>

            <MenuItems class="absolute right-0 mt-2 w-56 origin-top-right divide-y divide-gray-100 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
              <div class="p-1">
                <MenuItem v-slot="{ active }">
                  <button
                    @click="handleBulkAction('activate')"
                    :class="[
                      active ? 'bg-emerald-50 text-emerald-700' : 'text-gray-900',
                      'group flex w-full items-center rounded-md px-2 py-2 text-sm gap-2'
                    ]"
                  >
                    <EyeIcon class="h-4 w-4" :class="active ? 'text-emerald-700' : 'text-gray-500'" />
                    {{ t('categories.activate') }}
                  </button>
                </MenuItem>
                <MenuItem v-slot="{ active }">
                  <button
                    @click="handleBulkAction('deactivate')"
                    :class="[
                      active ? 'bg-slate-50 text-slate-700' : 'text-gray-900',
                      'group flex w-full items-center rounded-md px-2 py-2 text-sm gap-2'
                    ]"
                  >
                    <EyeOffIcon class="h-4 w-4" :class="active ? 'text-slate-700' : 'text-gray-500'" />
                    {{ t('categories.deactivate') }}
                  </button>
                </MenuItem>
              </div>
              <div class="p-1">
                <MenuItem v-slot="{ active }">
                  <button
                    @click="handleBulkAction('delete')"
                    :class="[
                      active ? 'bg-red-50 text-red-700' : 'text-gray-900',
                      'group flex w-full items-center rounded-md px-2 py-2 text-sm gap-2'
                    ]"
                  >
                    <TrashIcon class="h-4 w-4" :class="active ? 'text-red-700' : 'text-gray-500'" />
                    {{ t('categories.deleteSelected') }}
                  </button>
                </MenuItem>
              </div>
            </MenuItems>
          </Menu>

          <NuxtLink
            to="/categories/create"
            class="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-colors"
          >
            <PlusCircleIcon class="h-4 w-4" />
            {{ t('categories.createCategory') }}
          </NuxtLink>
        </div>
      </template>
    </PageHeader>

    <!-- Search and Filter -->
    <FilterContainer>
      <template #search>
        <SearchFilter
          v-model:search="search"
          :search-placeholder="t('categories.filters.searchPlaceholder')"
        />
      </template>
      
      <template #status>
        <StatusFilter
          :modelValue="activeFilter === 'true' ? true : activeFilter === 'false' ? false : undefined"
          :options="[
            { label: t('categories.filters.all'), value: undefined },
            { label: t('categories.filters.active'), value: true },
            { label: t('categories.filters.inactive'), value: false }
          ]"
          @update:modelValue="activeFilter = $event === true ? 'true' : $event === false ? 'false' : ''"
        />
      </template>
      
      <template #pageSize>
        <PageSizeFilter
          v-model:modelValue="pageSize"
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
            <h3 class="text-sm font-medium text-red-800">{{ t('messages.error') }}</h3>
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

    <!-- Loading State -->
    <div v-if="isLoading" class="bg-white dark:bg-neutral-800 shadow-sm rounded-lg p-6">
      <div class="animate-pulse space-y-4">
        <div v-for="i in 5" :key="i" class="flex space-x-4">
          <div class="h-4 bg-gray-200 dark:bg-neutral-700 rounded w-1/4"></div>
          <div class="h-4 bg-gray-200 dark:bg-neutral-700 rounded w-1/4"></div>
          <div class="h-4 bg-gray-200 dark:bg-neutral-700 rounded w-1/4"></div>
          <div class="h-4 bg-gray-200 dark:bg-neutral-700 rounded w-1/4"></div>
        </div>
      </div>
    </div>

    <!-- Categories Table -->
    <DataTable
      v-else
      :items="categories?.items || []"
      :loading="isLoading"
      :error="error"
      :sort-by="sortBy"
      :sort-order="sortOrder"
      :selected-items="selectedCategories"
      :pagination="{
        currentPage: page,
        totalPages: categories?.totalPages || 1,
        total: categories?.total || 0,
        pageSize: pageSize
      }"
      @update:selected-items="selectedCategories = $event"
      @sort="(column) => { sortBy = column; fetchCategories(); }"
      @page-change="(newPage) => { page = newPage; fetchCategories(); }"
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
          <span class="text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">ID</span>
        </th>
        <th 
          v-for="column in ['Name', 'Type', 'Status', 'Created At', 'Actions']" 
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
      <template #row="{ item: category }">
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
          {{ category.id }}
        </td>
        <td class="px-6 py-4 whitespace-nowrap">
          <div class="flex items-center gap-2">
            <!-- Thay thế cách hiển thị icon hiện tại -->
            <div v-if="category.icon" class="w-6 h-6 flex items-center justify-center">
              <component 
                :is="getIconComponent(category.icon)" 
                class="w-4 h-4 text-gray-600 dark:text-gray-400"
              />
            </div>
            <div v-else class="w-6 h-6"></div>
            <div class="text-sm font-medium text-gray-900 dark:text-white">
              {{ getCategoryName(category) }}
            </div>
          </div>
        </td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
          {{ category.type }}
        </td>
        <td class="px-6 py-4 whitespace-nowrap">
          <button
            @click="toggleCategoryStatus(category.id, category.active)"
            :class="{
              'px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full items-center gap-1 cursor-pointer transition-colors duration-200': true,
              'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 hover:bg-green-200 dark:hover:bg-green-800': category.active,
              'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600': !category.active
            }"
          >
            <div class="w-2 h-2 rounded-full"
              :class="{
                'bg-green-500': category.active,
                'bg-gray-500': !category.active
              }"
            ></div>
            {{ category.active ? t('categories.statusActive') : t('categories.statusInactive') }}
          </button>
        </td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
          {{ formatDate(category.createdAt) }}
        </td>
        <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
          <div class="flex justify-end gap-2">
            <NuxtLink
              :to="`/categories/edit/${category.id}`"
              class="inline-flex h-10 w-10 items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 transition-colors shrink-0"
              :title="t('actions.edit') + ' ' + t('categories.title').toLowerCase()"
            >
              <PencilIcon class="h-6 w-6 shrink-0" />
            </NuxtLink>
            <button
              @click="handleDelete(category.id)"
              class="inline-flex h-10 w-10 items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 transition-colors shrink-0"
              :title="t('actions.delete') + ' ' + t('categories.title').toLowerCase()"
            >
              <Trash2Icon class="h-6 w-6 shrink-0" />
            </button>
          </div>
        </td>
      </template>
    </DataTable>
  </div>
</template>

<style scoped>
.checkbox:indeterminate {
  background-image: url("data:image/svg+xml,%3csvg viewBox='0 0 16 16' fill='white' xmlns='http://www.w3.org/2000/svg'%3e%3cpath d='M3 8h10'/%3e%3c/svg%3e");
}
</style> 
