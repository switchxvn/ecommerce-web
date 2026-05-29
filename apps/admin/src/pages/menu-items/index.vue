<script setup lang="ts">
import { ref, onMounted, computed, watch, onBeforeUnmount } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { 
  ChevronDownIcon, 
  ChevronUpIcon, 
  XMarkIcon 
} from '@heroicons/vue/24/outline';
import {
  ArchiveIcon,
  EyeIcon,
  EyeOffIcon,
  PencilIcon,
  PlusCircleIcon,
  Trash2Icon,
  GripVerticalIcon,
  ChevronRightIcon,
  ChevronDownIcon as LucideChevronDownIcon,
  FolderIcon,
  LinkIcon,
  GlobeIcon
} from 'lucide-vue-next';
import * as LucideIcons from 'lucide-vue-next';
import Swal from 'sweetalert2';
import draggable from 'vue3-draggable-next';

import { useAuth } from '../../composables/useAuth';
import { useMenuItem, MenuItem } from '../../composables/useMenuItem';
import { useTrpc } from '../../composables/useTrpc';
import PageHeader from '../../components/common/header/PageHeader.vue';
import FilterContainer from '../../components/common/filter/FilterContainer.vue';
import SearchFilter from '../../components/common/filter/SearchFilter.vue';
import StatusFilter from '../../components/common/filter/StatusFilter.vue';
import PageSizeFilter from '../../components/common/filter/PageSizeFilter.vue';
import Pagination from '../../components/common/pagination/Pagination.vue';

// These functions are provided by Nuxt at runtime
// @ts-ignore
const definePageMeta = (meta: any) => {}; 
// @ts-ignore
const useHead = (head: any) => {};

definePageMeta({
  middleware: ["auth"],
});

useHead({
  title: 'Menu Items Management - Admin Panel'
});

const router = useRouter();
const route = useRoute();
const { checkAuth } = useAuth();
const trpc = useTrpc();

// Use the menu item composable
const {
  menuItems,
  isLoading,
  error,
  filter,
  totalItems,
  totalPages,
  currentPage,
  fetchMenuItems,
  deleteMenuItem,
  updateMenuItemsOrder,
  toggleActive,
  applyFilter,
  resetFilter,
  changePage,
  fetchMenuItemChildren
} = useMenuItem();

// Initialize search from URL query params
if (route.query.search) {
  filter.value.search = route.query.search.toString();
}

// Initialize active filter from URL query params
if (route.query.isActive) {
  const activeParam = route.query.isActive.toString();
  filter.value.isActive = 
    activeParam === 'true' ? true :
    activeParam === 'false' ? false :
    null;
}

// Initialize page from URL query params
if (route.query.page) {
  filter.value.page = Number(route.query.page) || 1;
}

// Local state
const expandedItems = ref<number[]>([]);
const dragOptions = ref({
  animation: 200,
  group: "menu-items",
  disabled: false,
  ghostClass: "ghost"
});
const languages = ref<any[]>([]);
const defaultLanguage = ref('');
const isLanguageOpen = ref(false);

// Computed properties for UI binding
const search = computed({
  get: () => filter.value.search,
  set: (value) => { filter.value.search = value; }
});

const activeFilter = computed({
  get: () => filter.value.isActive === true ? 'true' : filter.value.isActive === false ? 'false' : '',
  set: (value) => { 
    filter.value.isActive = value === 'true' ? true : value === 'false' ? false : null; 
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

const localeFilter = computed({
  get: () => filter.value.locale || '',
  set: (value) => { filter.value.locale = value || null; }
});

// Update URL query parameters
const updateQueryParams = () => {
  router.replace({
    query: {
      page: page.value > 1 ? page.value.toString() : undefined,
      search: search.value || undefined,
      isActive: filter.value.isActive !== null ? filter.value.isActive.toString() : undefined,
      locale: filter.value.locale || undefined
    }
  });
};

// Watch for changes in filters and update URL
watch([page, search, activeFilter, localeFilter], () => {
  updateQueryParams();
  
  // Only fetch when on client side
  if (process.client) {
    fetchMenuItems();
  }
}, { deep: true });

// Toggle expand/collapse of menu item
const toggleExpand = async (id: number) => {
  const index = expandedItems.value.indexOf(id);
  
  if (index === -1) {
    // Expanding - fetch children if not already loaded
    expandedItems.value.push(id);
    
    // Find the menu item
    const menuItem = menuItems.value.find(item => item.id === id);
    
    // Check if children need to be loaded
    if (menuItem && (!menuItem.children || menuItem.children.length === 0)) {
      try {
        // Show loading indicator for this item
        const loadingItem = menuItem;
        loadingItem.isLoadingChildren = true;
        
        // Fetch children
        await fetchMenuItemChildren(id);
      } catch (error) {
        console.error(`Failed to load children for menu item ${id}:`, error);
      } finally {
        // Remove loading indicator
        const updatedItem = menuItems.value.find(item => item.id === id);
        if (updatedItem) {
          updatedItem.isLoadingChildren = false;
        }
      }
    }
  } else {
    // Collapsing
    expandedItems.value.splice(index, 1);
  }
};

// Check if a menu item is expanded
const isExpanded = (id: number) => {
  return expandedItems.value.includes(id);
};

// Handle drag end event
const handleDragEnd = async () => {
  // Prepare items for order update
  const updateItems = menuItems.value.map((item, index) => ({
    id: item.id,
    order: index,
    parentId: item.parentId
  }));

  // Also include children
  menuItems.value.forEach(item => {
    if (item.children && item.children.length > 0) {
      item.children.forEach((child, childIndex) => {
        updateItems.push({
          id: child.id,
          order: childIndex,
          parentId: item.id
        });
      });
    }
  });

  // Update order in backend
  await updateMenuItemsOrder(updateItems);
};

// Handle delete
const handleDelete = async (id: number) => {
  await deleteMenuItem(id);
};

// Format date for display
const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString();
};

// Handle menu item activation/deactivation
const handleToggleActive = async (id: number, isActive: boolean) => {
  await toggleActive(id, isActive);
};

// Fetch languages
const fetchLanguages = async () => {
  try {
    const [langs, defaultLang] = await Promise.all([
      trpc.admin.languages.getLanguages.query(),
      trpc.admin.languages.getDefaultLanguage.query()
    ]);
    languages.value = langs;
    defaultLanguage.value = defaultLang?.code || 'en';
    
    // If no locale is selected, set default language
    if (!filter.value.locale) {
      filter.value.locale = defaultLanguage.value;
    }
  } catch (error) {
    console.error('Failed to fetch languages:', error);
  }
};

// Handle flag image error
const onFlagImageError = (event: Event) => {
  const target = event.target as HTMLImageElement;
  if (target) {
    target.style.display = 'none';
    const parent = target.parentElement;
    if (parent) {
      // Hiển thị mã ngôn ngữ viết hoa (2 ký tự)
      const langCode = filter.value.locale || '';
      parent.textContent = langCode.toUpperCase().slice(0, 2);
      parent.classList.add('bg-primary', 'text-white', 'rounded-sm', 'text-xs', 'font-medium', 'flex', 'items-center', 'justify-center');
    }
  }
};

// Handle click outside language dropdown
const handleClickOutside = (event: Event) => {
  if (isLanguageOpen.value) {
    const target = event.target as HTMLElement;
    if (!target.closest('.language-switcher')) {
      isLanguageOpen.value = false;
    }
  }
};

// Thêm hàm để lấy Lucide Icon component từ tên
const getLucideIcon = (iconName: string | null | undefined) => {
  if (!iconName) return LucideIcons.FolderIcon; // Default icon
  
  // Kiểm tra xem icon có tồn tại trong Lucide không
  const IconComponent = (LucideIcons as Record<string, any>)[iconName];
  return IconComponent || LucideIcons.FolderIcon; // Fallback to default if not found
};

onMounted(async () => {
  try {
    // Check authentication first
    const isAuthenticated = await checkAuth();
    if (!isAuthenticated) {
      router.push("/auth/login");
      return;
    }

    // Initialize locale from URL query params
    if (route.query.locale) {
      filter.value.locale = route.query.locale.toString();
    }

    // Fetch languages first
    await fetchLanguages();
    
    // Then fetch menu items
    await fetchMenuItems();
    
    // Add click outside event listener
    if (process.client) {
      document.addEventListener('click', handleClickOutside);
    }
  } catch (err: any) {
    console.error("Error initializing menu items page:", err);
  }
});

// Remove event listener on unmount
onBeforeUnmount(() => {
  if (process.client) {
    document.removeEventListener('click', handleClickOutside);
  }
});
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <PageHeader
      title="Menu Items Management"
      description="Manage and organize your website navigation menu"
    >
      <template #actions>
        <NuxtLink
          to="/menu-items/create"
          class="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <PlusCircleIcon class="h-5 w-5 mr-2" /> 
          Create New Menu Item
        </NuxtLink>
      </template>
    </PageHeader>

    <!-- Search and Filter -->
    <FilterContainer>
      <template #search>
        <SearchFilter
          v-model:search="search"
          search-placeholder="Search menu items..."
        />
      </template>
      
      <template #status>
        <StatusFilter
          :modelValue="activeFilter === 'true' ? true : activeFilter === 'false' ? false : undefined"
          :options="[
            { label: 'All Status', value: undefined },
            { label: 'Active', value: true },
            { label: 'Inactive', value: false }
          ]"
          @update:modelValue="activeFilter = $event === true ? 'true' : $event === false ? 'false' : ''"
        />
      </template>
      
      <!-- Language Filter -->
      <template #language>
        <div class="language-switcher relative">
          <button 
            type="button"
            @click.stop="isLanguageOpen = !isLanguageOpen"
            class="inline-flex items-center gap-2 h-10 px-4 py-2 rounded-md text-sm font-medium bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
          >
            <div class="w-5 h-5 flex items-center justify-center">
              <img 
                v-if="filter.locale"
                :src="`/images/flag/${languages.find(l => l.code === filter.locale)?.flagCode?.toLowerCase() || filter.locale.toLowerCase()}.svg`"
                :alt="`${languages.find(l => l.code === filter.locale)?.nativeName || filter.locale} flag`"
                class="w-5 h-5 rounded-sm object-cover"
                @error="onFlagImageError"
              />
              <GlobeIcon v-else class="w-5 h-5 text-slate-500" />
            </div>
            <span>{{ languages.find(l => l.code === filter.locale)?.nativeName || (filter.locale ? filter.locale.toUpperCase() : 'All Languages') }}</span>
            <LucideChevronDownIcon 
              class="h-4 w-4 transition-transform"
              :class="{ 'rotate-180': isLanguageOpen }"
            />
          </button>

          <!-- Dropdown menu -->
          <div 
            v-if="isLanguageOpen" 
            class="absolute z-50 mt-1 min-w-[240px] rounded-md shadow-lg bg-white ring-1 ring-black/5 focus:outline-none"
          >
            <div class="py-1">
              <button
                type="button"
                @click="localeFilter = ''; isLanguageOpen = false"
                class="flex items-center w-full h-10 px-4 py-2 text-sm text-left text-slate-700 hover:bg-slate-100 transition-colors whitespace-nowrap"
                :class="{ 'bg-slate-50': !filter.locale }"
              >
                <div class="w-5 h-5 flex-shrink-0 flex items-center justify-center mr-2">
                  <GlobeIcon class="w-5 h-5 text-slate-500" />
                </div>
                <span class="truncate">All Languages</span>
              </button>
              
              <button
                type="button"
                v-for="lang in languages"
                :key="lang.code"
                @click="localeFilter = lang.code; isLanguageOpen = false"
                class="flex items-center w-full h-10 px-4 py-2 text-sm text-left text-slate-700 hover:bg-slate-100 transition-colors whitespace-nowrap"
                :class="{ 'bg-slate-50': filter.locale === lang.code }"
              >
                <div class="w-5 h-5 flex-shrink-0 flex items-center justify-center mr-2">
                  <img 
                    :src="`/images/flag/${lang.flagCode.toLowerCase()}.svg`"
                    :alt="`${lang.nativeName} flag`"
                    class="w-5 h-5 rounded-sm object-cover"
                    @error="onFlagImageError"
                  />
                </div>
                <span class="truncate">{{ lang.nativeName }}</span>
                <span v-if="lang.code === defaultLanguage" class="ml-1 text-xs text-slate-500 flex-shrink-0">(Default)</span>
              </button>
            </div>
          </div>
        </div>
      </template>
      
      <template #pageSize>
        <PageSizeFilter
          v-model:modelValue="pageSize"
        />
      </template>
    </FilterContainer>

    <!-- Error Alert -->
    <div v-if="error" class="bg-red-50 border-l-4 border-red-400 p-4 mb-4 dark:bg-red-900/30 dark:border-red-500">
      <div class="flex">
        <div class="flex-shrink-0">
          <XMarkIcon class="h-5 w-5 text-red-400" />
        </div>
        <div class="ml-3">
          <p class="text-sm text-red-700 dark:text-red-300">
            {{ error }}
          </p>
        </div>
      </div>
    </div>

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

    <!-- Menu Items List with Drag and Drop -->
    <div v-else class="bg-white dark:bg-neutral-800 shadow-sm rounded-lg overflow-hidden">
      <div class="px-4 py-5 sm:px-6 flex justify-between items-center">
        <h3 class="text-lg leading-6 font-medium text-gray-900 dark:text-white">Menu Items</h3>
        <div class="text-sm text-gray-500 dark:text-gray-400">
          Drag and drop to reorder items
        </div>
      </div>
      
      <div class="border-t border-gray-200 dark:border-neutral-700">
        <!-- Root Level Menu Items -->
        <draggable
          v-model="menuItems"
          v-bind="dragOptions"
          @end="handleDragEnd"
          item-key="id"
          class="min-h-[50px] p-2"
        >
          <template #item="{ element: item }">
            <div class="menu-item-container mb-2">
              <!-- Parent Item -->
              <div 
                class="flex items-center p-3 bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-lg shadow-sm hover:shadow-md transition-shadow"
              >
                <div class="flex-1 flex items-center">
                  <div class="cursor-move px-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                    <GripVerticalIcon class="h-5 w-5" />
                  </div>
                  
                  <button 
                    v-if="item.isLoadingChildren"
                    class="mr-2 p-1 rounded-full"
                    disabled
                  >
                    <div class="h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-primary"></div>
                  </button>
                  
                  <button 
                    v-else-if="item.children && item.children.length > 0"
                    @click="toggleExpand(item.id)"
                    class="mr-2 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-neutral-700"
                    :class="{ 'bg-gray-100 dark:bg-neutral-700': isExpanded(item.id) }"
                  >
                    <ChevronDownIcon v-if="isExpanded(item.id)" class="h-5 w-5 text-gray-500" />
                    <ChevronRightIcon v-else class="h-5 w-5 text-gray-500" />
                  </button>
                  
                  <div v-else class="mr-2 p-1 w-7 h-7"></div>
                  
                  <div class="flex-1 ml-2">
                    <div class="flex items-center">
                      <component :is="getLucideIcon(item.icon)" class="h-5 w-5 text-indigo-500 mr-2" />
                      <span class="font-medium text-gray-900 dark:text-white">{{ item.translations?.[0]?.label || 'Unnamed Menu Item' }}</span>
                    </div>
                    <div class="text-sm text-gray-500 flex items-center mt-1">
                      <LinkIcon class="h-4 w-4 mr-1" />
                      <span>{{ item.translations?.[0]?.href || '#' }}</span>
                    </div>
                  </div>
                </div>
                
                <div class="flex items-center space-x-2">
                  <button
                    @click="handleToggleActive(item.id, item.isActive)"
                    :class="{
                      'px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full items-center gap-1 cursor-pointer transition-colors duration-200': true,
                      'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 hover:bg-green-200 dark:hover:bg-green-800': item.isActive,
                      'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600': !item.isActive
                    }"
                  >
                    <div class="w-2 h-2 rounded-full"
                      :class="{
                        'bg-green-500': item.isActive,
                        'bg-gray-500': !item.isActive
                      }"
                    ></div>
                    {{ item.isActive ? 'Active' : 'Inactive' }}
                  </button>
                  
                  <NuxtLink
                    :to="`/menu-items/edit/${item.id}`"
                    class="inline-flex h-10 w-10 items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 transition-colors shrink-0"
                    title="Edit menu item"
                  >
                    <PencilIcon class="h-6 w-6 shrink-0" />
                  </NuxtLink>
                  
                  <button
                    @click="handleDelete(item.id)"
                    class="inline-flex h-10 w-10 items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 transition-colors shrink-0"
                    title="Delete menu item"
                  >
                    <Trash2Icon class="h-6 w-6 shrink-0" />
                  </button>
                </div>
              </div>
              
              <!-- Children -->
              <div 
                v-if="isExpanded(item.id) && item.children && item.children.length > 0"
                class="pl-10 mt-2 space-y-2"
              >
                <draggable
                  v-model="item.children"
                  v-bind="dragOptions"
                  @end="handleDragEnd"
                  item-key="id"
                  class="space-y-2"
                >
                  <template #item="{ element: child }">
                    <div 
                      class="flex items-center p-3 bg-gray-50 dark:bg-neutral-700 border border-gray-200 dark:border-neutral-600 rounded-lg shadow-sm hover:shadow-md transition-shadow"
                    >
                      <div class="flex-1 flex items-center">
                        <div class="cursor-move px-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                          <GripVerticalIcon class="h-5 w-5" />
                        </div>
                        
                        <div class="flex-1 ml-2">
                          <div class="flex items-center">
                            <component :is="getLucideIcon(child.icon)" class="h-5 w-5 text-indigo-400 mr-2" />
                            <span class="font-medium text-gray-900 dark:text-white">{{ child.translations?.[0]?.label || 'Unnamed Menu Item' }}</span>
                          </div>
                          <div class="text-sm text-gray-500 flex items-center mt-1">
                            <LinkIcon class="h-4 w-4 mr-1" />
                            <span>{{ child.translations?.[0]?.href || '#' }}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div class="flex items-center space-x-2">
                        <button
                          @click="handleToggleActive(child.id, child.isActive)"
                          :class="{
                            'px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full items-center gap-1 cursor-pointer transition-colors duration-200': true,
                            'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 hover:bg-green-200 dark:hover:bg-green-800': child.isActive,
                            'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600': !child.isActive
                          }"
                        >
                          <div class="w-2 h-2 rounded-full"
                            :class="{
                              'bg-green-500': child.isActive,
                              'bg-gray-500': !child.isActive
                            }"
                          ></div>
                          {{ child.isActive ? 'Active' : 'Inactive' }}
                        </button>
                        
                        <NuxtLink
                          :to="`/menu-items/edit/${child.id}`"
                          class="inline-flex h-10 w-10 items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 transition-colors shrink-0"
                          title="Edit menu item"
                        >
                          <PencilIcon class="h-6 w-6 shrink-0" />
                        </NuxtLink>
                        
                        <button
                          @click="handleDelete(child.id)"
                          class="inline-flex h-10 w-10 items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 transition-colors shrink-0"
                          title="Delete menu item"
                        >
                          <Trash2Icon class="h-6 w-6 shrink-0" />
                        </button>
                      </div>
                    </div>
                  </template>
                  
                  <template #footer>
                    <div class="mt-2">
                      <NuxtLink
                        :to="`/menu-items/create?parentId=${item.id}`"
                        class="inline-flex items-center px-3 py-2 text-sm font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300"
                      >
                        <PlusCircleIcon class="h-4 w-4 mr-1" />
                        Add Submenu Item
                      </NuxtLink>
                    </div>
                  </template>
                </draggable>
              </div>
            </div>
          </template>
          
          <!-- Empty State -->
          <template #footer>
            <div v-if="menuItems.length === 0" class="text-center py-8">
              <div class="mx-auto h-12 w-12 text-gray-400">
                <svg class="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h7" />
                </svg>
              </div>
              <h3 class="mt-2 text-sm font-medium text-gray-900 dark:text-white">No menu items</h3>
              <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">Get started by creating a new menu item.</p>
              <div class="mt-6">
                <NuxtLink
                  to="/menu-items/create"
                  class="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <PlusCircleIcon class="h-5 w-5 mr-2" />
                  Create New Menu Item
                </NuxtLink>
              </div>
            </div>
          </template>
        </draggable>
      </div>
      
      <!-- Pagination -->
      <div v-if="totalPages > 1" class="border-t border-gray-200 dark:border-neutral-700">
        <Pagination
          :current-page="page"
          :total-pages="totalPages"
          :total-items="totalItems"
          :items-per-page="pageSize"
          @page-change="changePage"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.ghost {
  opacity: 0.5;
  background: #c8ebfb;
}

.menu-item-container {
  transition: all 0.3s;
}

.language-switcher {
  position: relative;
  display: inline-block;
  width: auto;
}

/* Dropdown menu */
.absolute {
  z-index: 50 !important;
}
</style> 
