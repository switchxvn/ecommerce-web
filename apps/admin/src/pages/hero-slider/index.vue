<script setup lang="ts">
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/vue';
import {
  ChevronDownIcon
} from '@heroicons/vue/24/outline';
import {
  ImageIcon,
  LayoutIcon,
  ListChecksIcon,
  PencilIcon,
  PlusCircleIcon,
  TrashIcon,
  XCircleIcon,
  GripVerticalIcon
} from 'lucide-vue-next';
import Swal from 'sweetalert2';
import { computed, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import draggable from 'vue3-draggable-next';
import FilterContainer from '../../components/common/filter/FilterContainer.vue';
import PageSizeFilter from '../../components/common/filter/PageSizeFilter.vue';
import SearchFilter from '../../components/common/filter/SearchFilter.vue';
import StatusFilter from '../../components/common/filter/StatusFilter.vue';
import PageHeader from '../../components/common/header/PageHeader.vue';
import PermissionGate from '../../components/common/PermissionGate.vue';
import DataTable from '../../components/common/table/DataTable.vue';
import { useAuth } from "../../composables/useAuth";
import { usePermissions } from '../../composables/usePermissions';
import { useTrpc } from "../../composables/useTrpc";
import { HeroSlider } from '../../types/hero-slider';
import { useLocalization } from '../../composables/useLocalization';
import LucideIcon from '../../components/common/icons/LucideIcon.vue';

// These functions are provided by Nuxt at runtime
// @ts-ignore
const definePageMeta = (meta: any) => {}; 
// @ts-ignore
const useHead = (head: any) => {};

definePageMeta({
  middleware: ["auth"],
});

useHead({
  title: 'Hero Slider Management - Admin Panel'
})

const router = useRouter();
const route = useRoute();
const { checkAuth } = useAuth();
const trpc = useTrpc();
const { hasPermission, isSuperAdmin } = usePermissions();
const { t } = useLocalization();

// State
const isLoading = ref(true);
const error = ref<string | null>(null);
const search = ref(route.query.search?.toString() || '');
const activeFilter = ref<boolean | undefined>(
  route.query.active === 'true' ? true : 
  route.query.active === 'false' ? false : 
  undefined
);
const themeId = ref<number | undefined>(
  route.query.themeId ? Number(route.query.themeId) : undefined
);
const page = ref(Number(route.query.page) || 1);
const pageSize = ref(10);
const heroSliders = ref<HeroSlider[]>([]);
const themes = ref<any[]>([]);
const showOnlyActiveThemes = ref(route.query.activeThemesOnly === 'true' ? true : false);

const selectedSliders = ref<number[]>([]);
const sortBy = ref('order');
const sortOrder = ref<'asc' | 'desc'>('asc');
const isDragging = ref(false);

// Drag and drop options
const dragOptions = computed(() => {
  return {
    animation: 200,
    group: "sliders",
    disabled: false,
    ghostClass: "ghost-slider",
    handle: ".slider-drag-handle"
  };
});

// Thêm hàm toggleSelectAll
const toggleSelectAll = () => {
  if (selectedSliders.value.length === heroSliders.value.length) {
    selectedSliders.value = [];
  } else {
    selectedSliders.value = heroSliders.value.map(item => item.id);
  }
};

// Thêm hàm toggleItemSelection
const toggleItemSelection = (id: number) => {
  const index = selectedSliders.value.indexOf(id);
  if (index === -1) {
    selectedSliders.value.push(id);
  } else {
    selectedSliders.value.splice(index, 1);
  }
};

// Handle drag end event
const handleDragEnd = () => {
  isDragging.value = false;
  reorderSliders();
};

// Lọc themes dựa vào trạng thái active
const filteredThemes = computed(() => {
  if (showOnlyActiveThemes.value) {
    return themes.value.filter(theme => theme.isActive);
  }
  return themes.value;
});

// Update URL query parameters
const updateQueryParams = () => {
  const query: Record<string, string | undefined> = {
    page: page.value > 1 ? page.value.toString() : undefined,
    search: search.value || undefined,
    active: activeFilter.value !== undefined ? activeFilter.value.toString() : undefined,
    themeId: themeId.value ? themeId.value.toString() : undefined,
    activeThemesOnly: showOnlyActiveThemes.value ? 'true' : undefined
  };

  // Remove undefined values
  Object.keys(query).forEach(key => query[key] === undefined && delete query[key]);

  router.replace({ query });
};

// Watch for changes in filters and update URL
watch([page, search, activeFilter, themeId, showOnlyActiveThemes], () => {
  updateQueryParams();
  fetchHeroSliders();
}, { deep: true });

// Fetch all themes
const fetchThemes = async () => {
  try {
    const result = await trpc.admin.theme.getAll.query();
    themes.value = result;
  } catch (err: any) {
    console.error('Error fetching themes:', err);
  }
};

// Toggle theme filter
const toggleThemeFilter = () => {
  showOnlyActiveThemes.value = !showOnlyActiveThemes.value;
  
  // Cập nhật URL
  router.replace({ 
    query: { 
      ...route.query,
      activeThemesOnly: showOnlyActiveThemes.value.toString() 
    } 
  });
  
  // Nếu theme hiện tại không còn trong danh sách đã lọc, chọn theme active đầu tiên
  if (themeId.value) {
    const themeExists = filteredThemes.value.some(theme => theme.id === themeId.value);
    if (!themeExists && filteredThemes.value.length > 0) {
      themeId.value = filteredThemes.value[0].id;
    }
  }
};

// Fetch hero sliders with filters
const fetchHeroSliders = async () => {
  try {
    isLoading.value = true;
    error.value = null;
    
    if (!themeId.value) {
      // If no theme selected, just set empty array
      heroSliders.value = [];
      isLoading.value = false;
      return;
    }
    
    // Builds filter object matching backend API
    const filters = {
      themeId: themeId.value,
      search: search.value || undefined,
      isActive: activeFilter.value
    };
    
    // Fetch data from API
    const result = await trpc.admin.heroSlider.getAll.query(filters);
    
    // Update the state
    heroSliders.value = result;
  } catch (err: any) {
    console.error('Error fetching hero sliders:', err);
    error.value = err.message || 'Failed to fetch hero sliders';
    
    // Reset to empty array on error
    heroSliders.value = [];
  } finally {
    isLoading.value = false;
  }
};

// Delete a single hero slider
const deleteSlider = async (id: number) => {
  const result = await Swal.fire({
    title: t('messages.confirmDelete'),
    text: t('hero_slider.confirmDelete'),
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#3085d6',
    cancelButtonColor: '#d33',
    confirmButtonText: t('actions.delete'),
    cancelButtonText: t('actions.cancel')
  });

  if (result.isConfirmed) {
    try {
      await trpc.admin.heroSlider.delete.mutate(id);
      Swal.fire(t('messages.success'), t('hero_slider.deleteSuccess'), 'success');
      fetchHeroSliders();
    } catch (err: any) {
      console.error('Error deleting hero slider:', err);
      Swal.fire(t('messages.error'), err.message || t('hero_slider.deleteError'), 'error');
    }
  }
};

// Toggle active status
const toggleActive = async (id: number, currentStatus: boolean) => {
  try {
    // Đưa sự thay đổi vào state trước để UI phản ứng ngay lập tức
    const index = heroSliders.value.findIndex(slider => slider.id === id);
    if (index !== -1) {
      // Đảo ngược trạng thái hiện tại
      const newStatus = !currentStatus;
      heroSliders.value[index].isActive = newStatus;
      
      // Gọi API để cập nhật backend
      await trpc.admin.heroSlider.update.mutate({ 
        id, 
        data: { isActive: newStatus } 
      });
      
      // Show success message
      Swal.fire({
        title: t('messages.success'),
        text: newStatus ? t('hero_slider.activateSuccess') : t('hero_slider.deactivateSuccess'),
        icon: 'success',
        timer: 1500,
        showConfirmButton: false
      });
    }
  } catch (err: any) {
    // Nếu có lỗi, revert lại trạng thái
    const index = heroSliders.value.findIndex(slider => slider.id === id);
    if (index !== -1) {
      heroSliders.value[index].isActive = currentStatus;
    }
    
    console.error('Error toggling slider status:', err);
    Swal.fire(t('messages.error'), err.message || t('hero_slider.statusUpdateError'), 'error');
  }
};

// Bulk actions
const bulkDeleteSliders = async () => {
  if (!selectedSliders.value.length) return;

  const result = await Swal.fire({
    title: t('hero_slider.confirmBulkDelete', { count: selectedSliders.value.length }),
    text: t('hero_slider.confirmDelete'),
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#3085d6',
    cancelButtonColor: '#d33',
    confirmButtonText: t('actions.delete'),
    cancelButtonText: t('actions.cancel')
  });

  if (result.isConfirmed) {
    try {
      // Delete each slider
      for (const id of selectedSliders.value) {
        await trpc.admin.heroSlider.delete.mutate(id);
      }
      
      Swal.fire(
        t('messages.success'), 
        t('hero_slider.bulkDeleteSuccess', { count: selectedSliders.value.length }), 
        'success'
      );
      selectedSliders.value = [];
      fetchHeroSliders();
    } catch (err: any) {
      console.error('Error deleting sliders:', err);
      Swal.fire(t('messages.error'), err.message || t('hero_slider.bulkDeleteError'), 'error');
    }
  }
};

// Reorder sliders
const reorderSliders = async () => {
  if (!themeId.value || !heroSliders.value.length) return;
  
  try {
    // Prepare data for reordering based on current array order
    const orderList = heroSliders.value.map((slider, index) => ({
      id: slider.id,
      order: index
    }));
    
    await trpc.admin.heroSlider.reorder.mutate(orderList);
    Swal.fire({
      title: t('messages.success'),
      text: t('hero_slider.reorderSuccess'),
      icon: 'success',
      timer: 1500,
      showConfirmButton: false
    });
    
    // Refresh the data after reordering
    await fetchHeroSliders();
  } catch (err: any) {
    console.error('Error reordering sliders:', err);
    Swal.fire(t('messages.error'), err.message || t('hero_slider.reorderError'), 'error');
  }
};

// Format date
const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleString();
};

// Initial load
onMounted(async () => {
  await checkAuth();
  await fetchThemes();
  
  // Auto-select first active theme if no theme was selected
  if (!themeId.value) {
    // Ưu tiên chọn theme active đầu tiên
    const activeTheme = themes.value.find(theme => theme.isActive);
    if (activeTheme) {
      themeId.value = activeTheme.id;
    } else if (themes.value.length > 0) {
      themeId.value = themes.value[0].id;
    }
    // URL sẽ được cập nhật thông qua watch
  } else if (themeId.value) {
    // If theme is already selected, fetch sliders
    await fetchHeroSliders();
  }
});
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <PageHeader
      :title="t('hero_slider.manager')"
      :description="t('hero_slider.description')"
    >
      <template #actions>
        <PermissionGate>
          <div class="flex items-center gap-2">
            <Menu as="div" class="relative" v-if="selectedSliders.length">
              <MenuButton class="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors">
                <LucideIcon :icon="ListChecksIcon" :size="20" aria-hidden="true" />
                {{ t('actions.bulkActions', { count: selectedSliders.length }) }}
                <ChevronDownIcon class="h-5 w-5" aria-hidden="true" />
              </MenuButton>

              <MenuItems class="absolute right-0 mt-2 w-56 origin-top-right divide-y divide-gray-100 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
                <div class="px-1 py-1">
                  <MenuItem v-slot="{ active }">
                    <button
                      @click="bulkDeleteSliders"
                      :class="[
                        active ? 'bg-red-100 text-red-900' : 'text-red-700',
                        'group flex w-full items-center rounded-md px-3 py-2 text-sm transition-colors'
                      ]"
                    >
                      <LucideIcon :icon="TrashIcon" :size="20" class="mr-2" aria-hidden="true" />
                      {{ t('actions.deleteSelected') }}
                    </button>
                  </MenuItem>
                </div>
              </MenuItems>
            </Menu>
            
            <NuxtLink
              v-if="themeId"
              to="/hero-slider/create"
              class="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
            >
              <LucideIcon :icon="PlusCircleIcon" :size="20" class="mr-2" aria-hidden="true" />
              {{ t('hero_slider.addSlider') }}
            </NuxtLink>
          </div>
        </PermissionGate>
      </template>
    </PageHeader>


    <!-- Filter Container -->
    <FilterContainer>
      <template #search>
        <SearchFilter
          :search="search"
          :search-placeholder="t('hero_slider.searchPlaceholder')"
          @update:search="search = $event"
        />
      </template>
      
      <template #status>
        <StatusFilter
          :modelValue="activeFilter"
          :options="[
            { label: t('components.common.filter.statusFilter.allStatus'), value: undefined },
            { label: t('hero_slider.statusActive'), value: true },
            { label: t('hero_slider.statusInactive'), value: false }
          ]"
          @update:modelValue="activeFilter = $event"
        />
      </template>
      
      <template #additionalFilters>
        <div class="flex items-center space-x-4">
          <div class="w-48">
            <label for="theme-filter" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{{ t('hero_slider.theme') }}</label>
            <select
              id="theme-filter"
              v-model="themeId"
              class="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-neutral-800 dark:border-neutral-700 dark:text-white"
            >
              <option :value="undefined">{{ t('hero_slider.selectTheme') }}</option>
              <option v-for="theme in filteredThemes" :key="theme.id" :value="theme.id">
                {{ theme.name }}
              </option>
            </select>
          </div>
          
          <div class="flex flex-col">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{{ t('hero_slider.themeFilter') }}</label>
            <div class="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                id="theme-active-toggle"
                :checked="showOnlyActiveThemes" 
                @change="toggleThemeFilter" 
                class="sr-only peer" 
              />
              <label 
                for="theme-active-toggle" 
                class="flex items-center cursor-pointer"
              >
                <div class="w-11 h-6 bg-gray-200 dark:bg-gray-700 rounded-full relative transition-colors duration-200 ease-in-out" :class="{'bg-indigo-600 dark:bg-indigo-500': showOnlyActiveThemes}">
                  <div class="absolute w-5 h-5 bg-white rounded-full shadow-md transform transition-transform duration-200 ease-in-out" :style="{ top: '2px', [showOnlyActiveThemes ? 'right' : 'left']: '2px' }"></div>
                </div>
                <span class="ml-3 text-sm font-medium text-gray-900 dark:text-gray-300">
                  {{ showOnlyActiveThemes ? t('hero_slider.activeThemesOnly') : t('hero_slider.allThemes') }}
                </span>
              </label>
            </div>
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

    <!-- Hero Sliders Table / Draggable List -->
    <div class="bg-white dark:bg-neutral-800 shadow-sm rounded-lg overflow-hidden">
      <div v-if="themeId && heroSliders.length > 0" class="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
        <p class="text-sm text-gray-600 dark:text-gray-400">
          <span class="font-medium">{{ t('hero_slider.dragDropInstructions') || 'Kéo và thả để sắp xếp lại thứ tự sliders' }}</span>
        </p>
      </div>
      
      <div v-if="themeId && heroSliders.length > 0" class="p-4">
        <draggable
          v-model="heroSliders"
          v-bind="dragOptions"
          item-key="id"
          @end="handleDragEnd"
          class="space-y-2"
        >
          <template #item="{ element: slider }">
            <div class="flex items-center bg-white dark:bg-neutral-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow">
              <!-- Drag Handle -->
              <div class="slider-drag-handle cursor-move p-2 text-gray-400 hover:text-gray-700 dark:hover:text-gray-300">
                <LucideIcon :icon="GripVerticalIcon" :size="20" aria-hidden="true" />
              </div>
              
              <!-- Checkbox for bulk selection -->
              <div class="ml-2">
                <input
                  type="checkbox"
                  class="checkbox rounded"
                  :checked="selectedSliders.includes(slider.id)"
                  @change="toggleItemSelection(slider.id)"
                />
              </div>
              
              <!-- Image -->
              <div class="ml-4 flex-shrink-0 h-12 w-20 rounded-sm bg-gray-100 dark:bg-gray-800 overflow-hidden">
                <img 
                  v-if="slider.imageUrl" 
                  :src="slider.imageUrl" 
                  class="h-12 w-20 object-cover" 
                  :alt="slider.title" 
                />
                <div v-else class="flex items-center justify-center h-full w-full">
                  <LucideIcon :icon="ImageIcon" :size="20" class="text-gray-400" aria-hidden="true" />
                </div>
              </div>
              
              <!-- Content -->
              <div class="ml-4 flex-1">
                <div class="text-sm font-medium text-gray-900 dark:text-white">
                  {{ slider.title }}
                </div>
                <div v-if="slider.description" class="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-1">
                  {{ slider.description }}
                </div>
                
                <div class="flex items-center mt-1">
                  <span class="ml-2 text-xs text-gray-500 dark:text-gray-400">
                    Order: {{ slider.order }}
                  </span>
                  
                  <span v-if="slider.buttonText" class="ml-2 text-xs text-gray-500 dark:text-gray-400">
                    Button: {{ slider.buttonText }}
                  </span>
                </div>
              </div>
              
              <!-- Actions -->
              <div class="flex space-x-2 items-center">
                <!-- Toggle switch -->
                <div class="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    :id="`slider-active-toggle-${slider.id}`"
                    :checked="slider.isActive" 
                    @change="() => toggleActive(slider.id, slider.isActive)" 
                    class="sr-only peer" 
                  />
                  <label 
                    :for="`slider-active-toggle-${slider.id}`" 
                    class="flex cursor-pointer"
                  >
                    <div class="w-9 h-5 bg-gray-200 dark:bg-gray-700 rounded-full relative transition-colors duration-200 ease-in-out" :class="{'bg-green-500 dark:bg-green-600': slider.isActive}">
                      <div class="absolute w-4 h-4 bg-white rounded-full shadow-md transform transition-transform duration-200 ease-in-out" :style="{ top: '2px', [slider.isActive ? 'right' : 'left']: '2px' }"></div>
                    </div>
                  </label>
                </div>
                <NuxtLink 
                  :to="`/hero-slider/${slider.id}/edit`" 
                  class="inline-flex h-10 w-10 items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors shrink-0"
                  :title="t('hero_slider.edit')"
                >
                  <LucideIcon 
                    :icon="PencilIcon" 
                    :size="20" 
                    aria-hidden="true" 
                  />
                </NuxtLink>
                <button 
                  @click="deleteSlider(slider.id)" 
                  class="inline-flex h-10 w-10 items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 transition-colors shrink-0"
                  :title="t('hero_slider.delete')"
                >
                  <LucideIcon 
                    :icon="TrashIcon" 
                    :size="20" 
                    aria-hidden="true" 
                  />
                </button>
              </div>
            </div>
          </template>
        </draggable>
      </div>

      <!-- Empty state -->
      <div v-if="isLoading" class="px-6 py-10 text-center">
        <div class="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" role="status">
          <span class="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]">
            {{ t('loading') }}
          </span>
        </div>
      </div>
      
      <div v-else-if="error" class="px-6 py-10 text-center">
        <div class="inline-flex items-center justify-center flex-shrink-0 w-12 h-12 rounded-full bg-red-100 text-red-500">
          <LucideIcon :icon="XCircleIcon" :size="24" aria-hidden="true" />
        </div>
        <h3 class="mt-2 text-sm font-medium text-gray-900 dark:text-white">{{ t('error') }}</h3>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">{{ error }}</p>
        <div class="mt-6">
          <button
            @click="fetchHeroSliders"
            class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            {{ t('retry') }}
          </button>
        </div>
      </div>
      
      <div v-else-if="!themeId || heroSliders.length === 0" class="text-center py-10">
        <LucideIcon 
          :icon="LayoutIcon" 
          :size="48" 
          class="mx-auto text-gray-400 dark:text-gray-600" 
          aria-hidden="true" 
        />
        <h3 class="mt-2 text-sm font-medium text-gray-900 dark:text-white">
          {{ themeId ? t('hero_slider.noSlidersFound') : t('hero_slider.selectThemeFirst') }}
        </h3>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {{ themeId ? t('hero_slider.createNewHint') : t('hero_slider.selectThemeHint') }}
        </p>
        <div class="mt-6" v-if="themeId">
          <NuxtLink
            to="/hero-slider/create"
            class="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
          >
            <LucideIcon :icon="PlusCircleIcon" :size="20" class="mr-2" aria-hidden="true" />
            {{ t('hero_slider.addSlider') }}
          </NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.ghost-slider {
  opacity: 0.5;
  background: #c8ebfb;
}
</style> 
