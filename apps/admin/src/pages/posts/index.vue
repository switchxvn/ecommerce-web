<script setup lang="ts">
import { onMounted, ref, watch, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
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
  ZoomInIcon
} from 'lucide-vue-next';
import Swal from 'sweetalert2';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import 'swiper/css/zoom';
import { Navigation, Pagination, Zoom } from 'swiper/modules';
import { Swiper, SwiperSlide } from 'swiper/vue';

// These functions are provided by Nuxt at runtime
// @ts-ignore
const definePageMeta = (meta: any) => {}; 
// @ts-ignore
const useHead = (head: any) => {};

// Import components
import SearchFilter from '../../components/common/filter/SearchFilter.vue';
import StatusFilter from '../../components/common/filter/StatusFilter.vue';
import PageSizeFilter from '../../components/common/filter/PageSizeFilter.vue';
import FilterContainer from '../../components/common/filter/FilterContainer.vue';
import DataTable from '../../components/common/table/DataTable.vue';
import PageHeader from '../../components/common/header/PageHeader.vue';
import PermissionAlert from '../../components/common/PermissionAlert.vue';
import PermissionGate from '../../components/common/PermissionGate.vue';
import AuthWrapper from '../../components/common/AuthWrapper.vue';

// Import composables
import { useAuth } from "../../composables/useAuth";
import { useTrpc } from "../../composables/useTrpc";
import { usePermissions } from '../../composables/usePermissions';
import { useSiteTitle } from '../../composables/useSiteTitle';
import { useLocalization } from '../../composables/useLocalization';
import { usePost } from '../../composables/usePost';

definePageMeta({
  middleware: ["auth"],
});

// Set page title with i18n support
const { t } = useLocalization();
useSiteTitle('postsManagement');

const router = useRouter();
const route = useRoute();
const { checkAuth, user } = useAuth();
const trpc = useTrpc();
const { hasPermission, isSuperAdmin } = usePermissions();

// Initialize posts composable
const {
  isLoading,
  error,
  search,
  publishedFilter,
  page,
  pageSize,
  posts,
  selectedPosts,
  showBulkActions,
  selectedImage,
  isZoomModalOpen,
  sortBy,
  sortOrder,
  initFromRoute,
  updateQueryParams,
  fetchPosts,
  deletePost: handleDelete,
  togglePublished,
  handleBulkAction,
  toggleSelectAll,
  togglePostSelection,
  clearSelection,
  openZoomModal,
  closeZoomModal,
  formatDate
} = usePost();

// Check if user can view posts
const userCanViewPosts = computed(() => {
  if (isSuperAdmin.value) {
    console.log('User is SUPER_ADMIN, can view posts');
    return true;
  }
  const canView = hasPermission('VIEW_POSTS');
  console.log('User can view posts:', canView);
  return canView;
});

// Initialize from route query
initFromRoute();

// Watch for changes in filters and update URL
watch([page, search, publishedFilter], () => {
  updateQueryParams();
  fetchPosts();
}, { deep: true });

// Debounced search
let searchTimeout: NodeJS.Timeout;
function handleSearch() {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    page.value = 1;
  }, 300);
}

// Thêm hàm handleSort vào phần script
const handleSort = (column: string) => {
  if (sortBy.value === column) {
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc';
  } else {
    sortBy.value = column;
    sortOrder.value = 'asc';
  }
  fetchPosts();
};

onMounted(async () => {
  try {
    // Check authentication first
    const isAuthenticated = await checkAuth();
    if (!isAuthenticated) {
      router.push("/auth/login");
      return;
    }

    await fetchPosts();
  } catch (err: any) {
    error.value = err.message || t('messages.error');
    console.error("Error initializing posts page:", err);
    isLoading.value = false;
  }
});
</script>

<template>
  <AuthWrapper @auth-success="fetchPosts">
    <div class="space-y-6">
      <PageHeader 
        :title="t('posts.title')" 
        :description="t('posts.description')"
      >
        <template #actions>
          <NuxtLink
            to="/posts/create"
            class="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <PlusCircleIcon class="h-5 w-5 mr-2" /> 
            {{ t('posts.createPost') }}
          </NuxtLink>
        </template>
      </PageHeader>

      <!-- Bulk actions toolbar -->
      <TransitionRoot
        :show="showBulkActions"
        as="template"
        enter="transition ease-out duration-200"
        enter-from="opacity-0 -translate-y-4"
        enter-to="opacity-100 translate-y-0"
        leave="transition ease-in duration-150"
        leave-from="opacity-100 translate-y-0"
        leave-to="opacity-0 -translate-y-4"
      >
        <div v-if="showBulkActions" class="bg-white dark:bg-neutral-800 shadow-md rounded-lg p-4 mb-4">
          <div class="flex items-center justify-between">
            <div class="flex items-center">
              <span class="text-sm font-medium text-gray-700 dark:text-gray-300 mr-4">
                {{ selectedPosts.length }} items selected
              </span>
              <div class="flex space-x-2">
                <button
                  @click="handleBulkAction('publish')"
                  class="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-green-700 bg-green-100 hover:bg-green-200 dark:bg-green-900 dark:text-green-100 dark:hover:bg-green-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  <EyeIcon class="h-4 w-4 mr-1" />
                  {{ t('posts.bulkPublish') }}
                </button>
                <button
                  @click="handleBulkAction('unpublish')"
                  class="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-gray-700 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                >
                  <EyeOffIcon class="h-4 w-4 mr-1" />
                  {{ t('posts.bulkUnpublish') }}
                </button>
                <button
                  @click="handleBulkAction('duplicate')"
                  class="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-blue-700 bg-blue-100 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-100 dark:hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <CopyIcon class="h-4 w-4 mr-1" />
                  {{ t('actions.duplicate') }}
                </button>
                <button
                  @click="handleBulkAction('delete')"
                  class="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-red-700 bg-red-100 hover:bg-red-200 dark:bg-red-900 dark:text-red-100 dark:hover:bg-red-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  <TrashIcon class="h-4 w-4 mr-1" />
                  {{ t('posts.bulkDelete') }}
                </button>
              </div>
            </div>
            <button
              @click="clearSelection"
              class="inline-flex items-center p-1 border border-transparent rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-500 dark:hover:bg-gray-700"
            >
              <XMarkIcon class="h-5 w-5" />
            </button>
          </div>
        </div>
      </TransitionRoot>

      <!-- Permission Check -->
      <PermissionGate :permissions="[]">
        <!-- Permission Denied Alert -->
        <template v-slot:default>
          <!-- Search and Filter -->
          <FilterContainer>
            <SearchFilter 
              :search="search"
              :search-placeholder="t('components.common.filter.searchFilter.placeholder')"
              @update:search="search = $event"
              class="w-full md:w-auto"
            />
            
            <StatusFilter 
              :modelValue="publishedFilter"
              :options="[
                { label: t('components.common.filter.statusFilter.allStatus'), value: undefined },
                { label: t('components.common.filter.statusFilter.published'), value: true },
                { label: t('components.common.filter.statusFilter.unpublished'), value: false }
              ]"
              @update:modelValue="publishedFilter = $event"
              class="w-full md:w-auto"
            />
            
            <PageSizeFilter 
              v-model:modelValue="pageSize"
              class="w-full md:w-auto"
            />
          </FilterContainer>

          <!-- Error Alert -->
          <div v-if="error && !isLoading" class="bg-red-50 border-l-4 border-red-400 p-4 mb-4 dark:bg-red-900/30 dark:border-red-500">
            <div class="flex">
              <div class="flex-shrink-0">
                <LucideXCircleIcon class="h-5 w-5 text-red-400" />
              </div>
              <div class="ml-3">
                <p class="text-sm text-red-700 dark:text-red-300">
                  {{ error }}
                </p>
              </div>
            </div>
          </div>

          <!-- Enhanced Loading State -->
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

          <!-- Enhanced Posts Table with Thumbnails -->
          <DataTable
            :items="posts.items"
            :loading="isLoading"
            :error="error"
            :sort-by="sortBy"
            :sort-order="sortOrder"
            :selected-items="selectedPosts"
            :pagination="{
              currentPage: page,
              totalPages: posts.totalPages,
              total: posts.total,
              pageSize: pageSize
            }"
            @page-change="page = $event"
            @toggle-select-all="toggleSelectAll"
            @toggle-item-selection="togglePostSelection"
            @sort="handleSort"
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
                <span class="text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">{{ t('posts.featuredImage') }}</span>
              </th>
              <th 
                v-for="column in ['Title', 'Status', 'Created At', 'Actions']" 
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
            <template #row="{ item: post }">
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center">
                  <div 
                    v-if="post.thumbnail" 
                    class="h-16 w-16 flex-shrink-0 cursor-pointer group relative rounded-lg overflow-hidden"
                    @click="openZoomModal(post.thumbnail)"
                  >
                    <img 
                      :src="post.thumbnail" 
                      class="h-full w-full object-cover transition-transform group-hover:scale-105"
                      alt=""
                    />
                    <div class="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-opacity flex items-center justify-center">
                      <ZoomInIcon class="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                  <div v-else class="h-16 w-16 flex-shrink-0 rounded-lg bg-gray-100 dark:bg-neutral-700 flex items-center justify-center">
                    <ImageIcon class="h-8 w-8 text-gray-400" />
                  </div>
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center">
                  <div class="text-sm font-medium text-gray-900 dark:text-white">
                    {{ post.title }}
                    <p v-if="post.shortDescription" class="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-[200px] truncate">
                      {{ post.shortDescription }}
                    </p>
                  </div>
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <button
                  @click="togglePublished(post)"
                  :class="{
                    'px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full items-center gap-1 cursor-pointer transition-colors duration-200': true,
                    'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 hover:bg-green-200 dark:hover:bg-green-800': post.published,
                    'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600': !post.published
                  }"
                >
                  <div class="w-2 h-2 rounded-full"
                    :class="{
                      'bg-green-500': post.published,
                      'bg-gray-500': !post.published
                    }"
                  ></div>
                  {{ post.published ? t('posts.settings.published') : t('posts.settings.draft') }}
                </button>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                {{ formatDate(post.createdAt) }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <div class="flex justify-end gap-2">
                  <NuxtLink
                    :to="`/posts/edit/${post.id}`"
                    class="inline-flex h-10 w-10 items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 transition-colors shrink-0"
                    :title="t('posts.editPost')"
                  >
                    <PencilIcon class="h-6 w-6 shrink-0" />
                  </NuxtLink>
                  <button
                    @click="handleDelete(post.id)"
                    class="inline-flex h-10 w-10 items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 transition-colors shrink-0"
                    :title="t('posts.deletePost')"
                  >
                    <Trash2Icon class="h-6 w-6 shrink-0" />
                  </button>
                </div>
              </td>
            </template>
          </DataTable>
        </template>
        
        <!-- AccessDenied template -->
        <template v-slot:access-denied>
          <PermissionAlert
            :requiredPermissions="['VIEW_POSTS']"
            type="error"
          />
        </template>
      </PermissionGate>

      <!-- Modal for image zoom -->
      <TransitionRoot :show="isZoomModalOpen" as="template">
        <div
          v-if="isZoomModalOpen"
          class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75"
          @click="closeZoomModal"
        >
          <div
            class="max-w-4xl max-h-[90vh] overflow-auto p-2 bg-white dark:bg-neutral-800 rounded-lg"
            @click.stop
          >
            <img
              v-if="selectedImage"
              :src="selectedImage"
              class="max-w-full h-auto"
              alt="Zoomed post image"
            />
          </div>
        </div>
      </TransitionRoot>
    </div>
  </AuthWrapper>
</template>

<style scoped>
.swiper {
  width: 100%;
  height: 100%;
}

.swiper-slide {
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
}

.swiper-button-next,
.swiper-button-prev {
  color: theme('colors.indigo.600');
}

.swiper-pagination-bullet-active {
  background: theme('colors.indigo.600');
}

/* Dark mode */
:dark .swiper-button-next,
:dark .swiper-button-prev {
  color: theme('colors.indigo.400');
}

:dark .swiper-pagination-bullet-active {
  background: theme('colors.indigo.400');
}
</style> 
