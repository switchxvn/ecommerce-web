<script setup lang="ts">
import { ref, onMounted, watch } from "vue";
import { useAuth } from "../../composables/useAuth";
import { useTrpc } from "../../composables/useTrpc";
import { useRouter, useRoute } from "vue-router";
import { Menu, MenuButton, MenuItem, MenuItems, TransitionRoot } from '@headlessui/vue';
import {
  ChevronDownIcon,
  ChevronUpIcon,
  XMarkIcon,
  CheckIcon,
  StarIcon
} from '@heroicons/vue/24/outline';
import {
  EyeIcon,
  CheckCircleIcon,
  PencilIcon,
  PlusCircleIcon,
  Trash2Icon,
  XCircleIcon,
  ShieldIcon,
  ClockIcon,
  MoreHorizontalIcon,
  ListChecksIcon
} from 'lucide-vue-next';
import Swal from 'sweetalert2';
import FilterContainer from '../../components/common/filter/FilterContainer.vue';
import SearchFilter from '../../components/common/filter/SearchFilter.vue';
import StatusFilter from '../../components/common/filter/StatusFilter.vue';
import PageSizeFilter from '../../components/common/filter/PageSizeFilter.vue';
import DataTable from '../../components/common/table/DataTable.vue';
import PageHeader from '../../components/common/header/PageHeader.vue';
import { RouterLink } from 'vue-router';

// These functions are provided by Nuxt at runtime
// @ts-ignore
const definePageMeta = (meta: any) => {}; 
// @ts-ignore
const useHead = (head: any) => {};

definePageMeta({
  middleware: ["auth"],
});

useHead({
  title: 'Reviews Management - Admin Panel'
})

const router = useRouter();
const route = useRoute();
const { checkAuth } = useAuth();
const trpc = useTrpc();

// Enum for review status
enum ReviewStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  PENDING = 'PENDING',
}

// Define interface for review translation
interface ReviewTranslation {
  id: number;
  locale: string;
  title?: string;
  content: string;
}

// Define interface for review service type
interface ReviewServiceType {
  id: number;
  slug: string;
  name?: string;
}

// Define interface for review
interface Review {
  id: number;
  authorName: string;
  authorAvatar?: string;
  profession?: string;
  rating: number;
  serviceType?: ReviewServiceType;
  visitDate?: string;
  featured: boolean;
  status: ReviewStatus;
  createdAt: string;
  updatedAt: string;
  translations: ReviewTranslation[];
}

// Status options for filter
const statusOptions = [
  { value: ReviewStatus.ACTIVE, label: 'Active', icon: CheckCircleIcon, color: 'text-green-500' },
  { value: ReviewStatus.INACTIVE, label: 'Inactive', icon: XCircleIcon, color: 'text-red-500' },
  { value: ReviewStatus.PENDING, label: 'Pending', icon: ClockIcon, color: 'text-yellow-500' },
];

// Initial state
const isLoading = ref(true);
const error = ref<string | null>(null);
const search = ref(route.query.search?.toString() || '');
const statusFilter = ref<ReviewStatus | undefined>(
  route.query.status ? route.query.status.toString() as ReviewStatus : undefined
);
const featuredFilter = ref<boolean | undefined>(
  route.query.featured === 'true' ? true : 
  route.query.featured === 'false' ? false : 
  undefined
);
const page = ref(Number(route.query.page) || 1);
const pageSize = ref(10);
const reviews = ref<{
  items: Review[];
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

const selectedReviews = ref<number[]>([]);
const showBulkActions = ref(false);
const sortBy = ref('createdAt');
const sortOrder = ref<'asc' | 'desc'>('desc');

// Debounced search
let searchTimeout: NodeJS.Timeout;
function handleSearch() {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    page.value = 1;
  }, 300);
}

// Update URL query parameters
const updateQueryParams = () => {
  const query: Record<string, string | undefined> = {
    page: page.value > 1 ? page.value.toString() : undefined,
    search: search.value || undefined,
    status: statusFilter.value,
    featured: featuredFilter.value !== undefined ? featuredFilter.value.toString() : undefined,
    sortBy: sortBy.value !== 'createdAt' ? sortBy.value : undefined,
    sortOrder: sortOrder.value !== 'desc' ? sortOrder.value : undefined
  };

  Object.keys(query).forEach(key => query[key] === undefined && delete query[key]);
  router.replace({ query });
};

// Watch for changes in filter parameters
watch([page, search, statusFilter, featuredFilter, sortBy, sortOrder], () => {
  updateQueryParams();
  fetchReviews();
}, { deep: true });

// Function to fetch reviews
async function fetchReviews() {
  try {
    isLoading.value = true;
    error.value = null;

    const result = await trpc.admin.review.list.query({
      page: page.value,
      limit: pageSize.value,
      search: search.value || undefined,
      status: statusFilter.value,
      featured: featuredFilter.value
    });

    console.log("API Response:", result);

    // Handle the complex nested API response structure
    if (Array.isArray(result) && result.length > 0 && result[0]?.result?.data) {
      // Format from the JSON you provided
      const responseData = result[0].result.data;
      reviews.value = {
        items: responseData.data as Review[],
        total: responseData.meta.total,
        page: responseData.meta.page,
        pageSize: responseData.meta.limit,
        totalPages: responseData.meta.totalPages
      };
    } else if (result.data && result.meta) {
      // Standard data/meta structure
      reviews.value = {
        items: result.data as Review[],
        total: result.meta.total,
        page: result.meta.page,
        pageSize: result.meta.limit,
        totalPages: result.meta.totalPages
      };
    } else {
      // Handle raw data array (fallback)
      reviews.value = {
        items: Array.isArray(result) ? result as Review[] : [],
        total: Array.isArray(result) ? result.length : 0,
        page: 1,
        pageSize: 10,
        totalPages: 1
      };
    }
    
    console.log("Processed reviews:", reviews.value);
  } catch (err: any) {
    error.value = err.message || "Failed to load reviews";
    console.error("Error loading reviews:", err);
  } finally {
    isLoading.value = false;
  }
}

// Function to toggle review featured status
async function toggleFeatured(id: number) {
  try {
    await trpc.admin.review.toggleFeatured.mutate({ id });
    await fetchReviews(); // Refresh the data
    Swal.fire({
      icon: 'success',
      title: 'Success',
      text: 'Featured status updated successfully',
      timer: 1500,
      showConfirmButton: false
    });
  } catch (err: any) {
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: err.message || 'Failed to update featured status'
    });
  }
}

// Function to change review status
async function changeStatus(id: number, status: ReviewStatus) {
  try {
    await trpc.admin.review.updateStatus.mutate({ id, status });
    await fetchReviews(); // Refresh the data
    Swal.fire({
      icon: 'success',
      title: 'Success',
      text: 'Status updated successfully',
      timer: 1500,
      showConfirmButton: false
    });
  } catch (err: any) {
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: err.message || 'Failed to update status'
    });
  }
}

// Function to delete review
async function deleteReview(id: number) {
  // Ask for confirmation
  const result = await Swal.fire({
    title: 'Are you sure?',
    text: "This action cannot be undone",
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#dc2626',
    cancelButtonColor: '#6b7280',
    confirmButtonText: 'Yes, delete it!'
  });

  if (result.isConfirmed) {
    try {
      await trpc.admin.review.delete.mutate({ id });
      await fetchReviews(); // Refresh the data
      Swal.fire({
        icon: 'success',
        title: 'Deleted!',
        text: 'Review has been deleted',
        timer: 1500,
        showConfirmButton: false
      });
    } catch (err: any) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: err.message || 'Failed to delete review'
      });
    }
  }
}

// Function to navigate to edit page
function editReview(id: number) {
  router.push(`/reviews/edit/${id}`);
}

// Function to navigate to add page
function addReview() {
  router.push('/reviews/add');
}

// Function to render rating stars
function renderRatingStars(rating: number) {
  return Array(5).fill(0).map((_, i) => 
    i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
  );
}

// Get status color and icon
function getStatusInfo(status: ReviewStatus) {
  const statusOption = statusOptions.find(option => option.value === status);
  return {
    color: statusOption?.color || 'text-gray-500',
    icon: statusOption?.icon || ShieldIcon,
    label: statusOption?.label || status
  };
}

// Get review title or content for display
function getReviewTitle(review: Review): string {
  const defaultLocale = 'vi';
  const translation = review.translations.find(t => t.locale === defaultLocale) || review.translations[0];
  
  if (!translation) return 'No content';
  
  return translation.title || translation.content.substring(0, 50) + (translation.content.length > 50 ? '...' : '');
}

// Handle sorting when clicking on header
function handleSort(column: string) {
  if (sortBy.value === column) {
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc';
  } else {
    sortBy.value = column;
    sortOrder.value = 'asc';
  }
  fetchReviews();
}

// Add bulk actions handler
async function handleBulkAction(action: string) {
  const selectedCount = selectedReviews.value.length;
  if (!selectedCount) return;

  let confirmConfig: any = {
    icon: 'question' as const,
    showCancelButton: true,
    confirmButtonText: 'Yes, proceed',
    cancelButtonText: 'Cancel',
    title: '',
    text: '',
    confirmButtonColor: ''
  };

  switch (action) {
    case 'active':
      confirmConfig = {
        ...confirmConfig,
        title: 'Activate Selected Reviews?',
        text: `Are you sure you want to activate ${selectedCount} selected reviews?`,
        confirmButtonColor: '#10B981',
        confirmButtonText: 'Yes, activate them'
      };
      break;
    case 'inactive':
      confirmConfig = {
        ...confirmConfig,
        title: 'Deactivate Selected Reviews?',
        text: `Are you sure you want to deactivate ${selectedCount} selected reviews?`,
        confirmButtonColor: '#6B7280',
        confirmButtonText: 'Yes, deactivate them'
      };
      break;
    case 'pending':
      confirmConfig = {
        ...confirmConfig,
        title: 'Mark Selected Reviews as Pending?',
        text: `Are you sure you want to mark ${selectedCount} selected reviews as pending?`,
        confirmButtonColor: '#F59E0B',
        confirmButtonText: 'Yes, mark them as pending'
      };
      break;
    case 'featured':
      confirmConfig = {
        ...confirmConfig,
        title: 'Feature Selected Reviews?',
        text: `Are you sure you want to feature ${selectedCount} selected reviews?`,
        confirmButtonColor: '#3B82F6',
        confirmButtonText: 'Yes, feature them'
      };
      break;
    case 'unfeatured':
      confirmConfig = {
        ...confirmConfig,
        title: 'Unfeature Selected Reviews?',
        text: `Are you sure you want to unfeature ${selectedCount} selected reviews?`,
        confirmButtonColor: '#6B7280',
        confirmButtonText: 'Yes, unfeature them'
      };
      break;
    case 'delete':
      confirmConfig = {
        ...confirmConfig,
        title: 'Delete Selected Reviews?',
        text: `Are you sure you want to permanently delete ${selectedCount} selected reviews? This action cannot be undone.`,
        confirmButtonColor: '#DC2626',
        confirmButtonText: 'Yes, delete them',
        icon: 'warning' as const
      };
      break;
  }

  const result = await Swal.fire(confirmConfig);
  if (!result.isConfirmed) return;

  try {
    isLoading.value = true;

    switch (action) {
      case 'active':
      case 'inactive':
      case 'pending':
        await Promise.all(
          selectedReviews.value.map(reviewId => {
            return trpc.admin.review.updateStatus.mutate({
              id: reviewId,
              status: action === 'active' ? ReviewStatus.ACTIVE : 
                     action === 'inactive' ? ReviewStatus.INACTIVE : 
                     ReviewStatus.PENDING
            });
          })
        );
        break;
      case 'featured':
      case 'unfeatured':
        await Promise.all(
          selectedReviews.value.map(reviewId => {
            return trpc.admin.review.toggleFeatured.mutate({ id: reviewId });
          })
        );
        break;
      case 'delete':
        await Promise.all(
          selectedReviews.value.map(reviewId => 
            trpc.admin.review.delete.mutate({ id: reviewId })
          )
        );
        break;
    }

    // Refresh reviews list
    await fetchReviews();
    selectedReviews.value = [];

    Swal.fire({
      title: 'Success!',
      text: `Successfully performed ${action} on ${selectedCount} reviews`,
      icon: 'success',
      timer: 2000,
      showConfirmButton: false
    });
  } catch (err: any) {
    error.value = err.message || `Failed to ${action} reviews`;
    console.error(`Error performing ${action} on reviews:`, err);
    
    Swal.fire({
      title: 'Error!',
      text: err.message || `Failed to ${action} reviews`,
      icon: 'error' as const
    });
  } finally {
    isLoading.value = false;
  }
}

// Load data on mounted
onMounted(() => {
  checkAuth().then(() => {
    fetchReviews();
  });
});
</script>

<template>
  <div class="space-y-6">
    <!-- Page Header -->
    <PageHeader 
      title="Reviews Management" 
      description="Manage customer reviews and testimonials"
    >
      <template #actions>
        <div class="flex items-center gap-2">
          <Menu as="div" class="relative" v-if="selectedReviews.length">
            <MenuButton class="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors">
              <ListChecksIcon class="h-4 w-4" />
              Bulk Actions ({{ selectedReviews.length }})
              <ChevronDownIcon class="h-4 w-4" />
            </MenuButton>

            <MenuItems class="absolute right-0 mt-2 w-56 origin-top-right divide-y divide-gray-100 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
              <div class="p-1">
                <MenuItem v-slot="{ active }">
                  <button
                    @click="handleBulkAction('active')"
                    :class="[
                      active ? 'bg-green-50 text-green-700' : 'text-gray-900',
                      'group flex w-full items-center rounded-md px-2 py-2 text-sm gap-2'
                    ]"
                  >
                    <CheckCircleIcon class="h-4 w-4" :class="active ? 'text-green-700' : 'text-gray-500'" />
                    Activate Selected
                  </button>
                </MenuItem>
                <MenuItem v-slot="{ active }">
                  <button
                    @click="handleBulkAction('inactive')"
                    :class="[
                      active ? 'bg-red-50 text-red-700' : 'text-gray-900',
                      'group flex w-full items-center rounded-md px-2 py-2 text-sm gap-2'
                    ]"
                  >
                    <XCircleIcon class="h-4 w-4" :class="active ? 'text-red-700' : 'text-gray-500'" />
                    Deactivate Selected
                  </button>
                </MenuItem>
                <MenuItem v-slot="{ active }">
                  <button
                    @click="handleBulkAction('pending')"
                    :class="[
                      active ? 'bg-yellow-50 text-yellow-700' : 'text-gray-900',
                      'group flex w-full items-center rounded-md px-2 py-2 text-sm gap-2'
                    ]"
                  >
                    <ClockIcon class="h-4 w-4" :class="active ? 'text-yellow-700' : 'text-gray-500'" />
                    Mark as Pending
                  </button>
                </MenuItem>
              </div>
              <div class="p-1">
                <MenuItem v-slot="{ active }">
                  <button
                    @click="handleBulkAction('featured')"
                    :class="[
                      active ? 'bg-blue-50 text-blue-700' : 'text-gray-900',
                      'group flex w-full items-center rounded-md px-2 py-2 text-sm gap-2'
                    ]"
                  >
                    <CheckIcon class="h-4 w-4" :class="active ? 'text-blue-700' : 'text-gray-500'" />
                    Feature Selected
                  </button>
                </MenuItem>
                <MenuItem v-slot="{ active }">
                  <button
                    @click="handleBulkAction('unfeatured')"
                    :class="[
                      active ? 'bg-gray-50 text-gray-700' : 'text-gray-900',
                      'group flex w-full items-center rounded-md px-2 py-2 text-sm gap-2'
                    ]"
                  >
                    <XMarkIcon class="h-4 w-4" :class="active ? 'text-gray-700' : 'text-gray-500'" />
                    Unfeature Selected
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
                    <Trash2Icon class="h-4 w-4" :class="active ? 'text-red-700' : 'text-gray-500'" />
                    Delete Selected
                  </button>
                </MenuItem>
              </div>
            </MenuItems>
          </Menu>

          <button
            @click="addReview"
            class="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-colors"
          >
            <PlusCircleIcon class="h-4 w-4" />
            Add New Review
          </button>
          
          <RouterLink 
            to="/reviews/service-types" 
            class="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
          >
            <ListChecksIcon class="h-4 w-4" />
            Manage Service Types
          </RouterLink>
        </div>
      </template>
    </PageHeader>

    <!-- Filters -->
    <FilterContainer>
      <template #search>
        <div class="w-full">
          <div class="relative rounded-lg overflow-hidden shadow-sm border border-gray-200 dark:border-gray-700">
            <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg class="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clip-rule="evenodd" />
              </svg>
            </div>
            <input
              v-model="search"
              type="text"
              placeholder="Search by name or content..."
              class="block w-full pl-10 pr-3 py-2 border-0 text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-indigo-600 dark:focus:ring-indigo-500 rounded-lg bg-transparent"
              @input="handleSearch"
            />
          </div>
        </div>
      </template>
      
      <template #status>
        <div class="w-full">
          <div class="rounded-lg overflow-hidden shadow-sm border border-gray-200 dark:border-gray-700">
            <select
              v-model="statusFilter"
              class="block w-full px-3 py-2 border-0 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-600 dark:focus:ring-indigo-500 rounded-lg bg-transparent"
            >
              <option :value="undefined">All Statuses</option>
              <option v-for="option in statusOptions" :key="option.value" :value="option.value">
                {{ option.label }}
              </option>
            </select>
          </div>
        </div>
      </template>

      <template #pageSize>
        <div class="w-full">
          <div class="rounded-lg overflow-hidden shadow-sm border border-gray-200 dark:border-gray-700">
            <select 
              v-model="pageSize"
              class="block w-full px-3 py-2 border-0 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-600 dark:focus:ring-indigo-500 rounded-lg bg-transparent"
            >
              <option :value="10">10 per page</option>
              <option :value="25">25 per page</option>
              <option :value="50">50 per page</option>
              <option :value="100">100 per page</option>
            </select>
          </div>
        </div>
      </template>
      
      <div class="w-full">
        <div class="rounded-lg overflow-hidden shadow-sm border border-gray-200 dark:border-gray-700">
          <select
            v-model="featuredFilter"
            class="block w-full px-3 py-2 border-0 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-600 dark:focus:ring-indigo-500 rounded-lg bg-transparent"
          >
            <option :value="undefined">All Featured Status</option>
            <option :value="true">Featured</option>
            <option :value="false">Not Featured</option>
          </select>
        </div>
      </div>
    </FilterContainer>

    <!-- Error Message -->
    <TransitionRoot as="template" :show="!!error">
      <div class="rounded-md bg-red-50 p-4 mb-6">
        <div class="flex">
          <div class="flex-shrink-0">
            <XCircleIcon class="h-5 w-5 text-red-400" />
          </div>
          <div class="ml-3">
            <h3 class="text-sm font-medium text-red-800">Error</h3>
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

    <!-- Reviews Table -->
    <DataTable
      :items="reviews.items"
      :loading="isLoading"
      :pagination="{
        currentPage: reviews.page,
        totalPages: reviews.totalPages,
        total: reviews.total,
        pageSize: reviews.pageSize
      }"
      :selectedItems="selectedReviews"
      :sort-by="sortBy"
      :sort-order="sortOrder"
      :error="error"
      @update:selectedItems="selectedReviews = $event"
      @page-change="page = $event"
      @sort="handleSort"
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
      
      <template #header="{ sortBy: columnSortBy, sortOrder: columnSortOrder, handleSort }">
        <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
          <div class="flex items-center">Author</div>
        </th>
        <th 
          scope="col" 
          class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-neutral-600"
          @click="handleSort('title')"
        >
          <div class="flex items-center gap-2">
            Review
            <ChevronDownIcon v-if="columnSortBy !== 'title'" class="h-4 w-4" />
            <ChevronUpIcon v-else-if="columnSortOrder === 'asc'" class="h-4 w-4" />
            <ChevronDownIcon v-else class="h-4 w-4" />
          </div>
        </th>
        <th 
          scope="col" 
          class="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-neutral-600"
          @click="handleSort('rating')"
        >
          <div class="flex items-center justify-center gap-2">
            Rating
            <ChevronDownIcon v-if="columnSortBy !== 'rating'" class="h-4 w-4" />
            <ChevronUpIcon v-else-if="columnSortOrder === 'asc'" class="h-4 w-4" />
            <ChevronDownIcon v-else class="h-4 w-4" />
          </div>
        </th>
        <th 
          scope="col" 
          class="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-neutral-600"
          @click="handleSort('status')"
        >
          <div class="flex items-center justify-center gap-2">
            Status
            <ChevronDownIcon v-if="columnSortBy !== 'status'" class="h-4 w-4" />
            <ChevronUpIcon v-else-if="columnSortOrder === 'asc'" class="h-4 w-4" />
            <ChevronDownIcon v-else class="h-4 w-4" />
          </div>
        </th>
        <th 
          scope="col" 
          class="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-neutral-600"
          @click="handleSort('featured')"
        >
          <div class="flex items-center justify-center gap-2">
            Featured
            <ChevronDownIcon v-if="columnSortBy !== 'featured'" class="h-4 w-4" />
            <ChevronUpIcon v-else-if="columnSortOrder === 'asc'" class="h-4 w-4" />
            <ChevronDownIcon v-else class="h-4 w-4" />
          </div>
        </th>
        <th 
          scope="col" 
          class="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-neutral-600"
          @click="handleSort('createdAt')"
        >
          <div class="flex items-center justify-center gap-2">
            Date
            <ChevronDownIcon v-if="columnSortBy !== 'createdAt'" class="h-4 w-4" />
            <ChevronUpIcon v-else-if="columnSortOrder === 'asc'" class="h-4 w-4" />
            <ChevronDownIcon v-else class="h-4 w-4" />
          </div>
        </th>
        <th scope="col" class="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
          <div class="flex items-center justify-end">Actions</div>
        </th>
      </template>
        
      <template #row="{ item: review }">
        <!-- Author Column -->
        <td class="px-6 py-4 whitespace-nowrap">
          <div class="flex items-center">
            <div 
              v-if="review.authorAvatar" 
              class="h-10 w-10 mr-3 rounded-full bg-cover bg-center"
              :style="`background-image: url(${review.authorAvatar})`"
            ></div>
            <div v-else class="h-10 w-10 mr-3 rounded-full bg-gray-200 flex items-center justify-center">
              <span class="text-gray-500 text-lg font-medium">{{ review.authorName.charAt(0) }}</span>
            </div>
            <div>
              <div class="font-medium text-gray-900 dark:text-white">{{ review.authorName }}</div>
              <div v-if="review.profession" class="text-sm text-gray-500 dark:text-gray-400">{{ review.profession }}</div>
            </div>
          </div>
        </td>
        
        <!-- Review Content Column -->
        <td class="px-6 py-4 whitespace-nowrap">
            <div class="max-w-xs">
            <div class="text-sm font-medium text-gray-900 dark:text-white truncate">{{ getReviewTitle(review) }}</div>
            <div v-if="review.serviceType" class="text-xs text-gray-500 dark:text-gray-400">
              {{ review.serviceType.name || review.serviceType.slug }}
            </div>
            <div v-if="review.service?.translations?.[0]?.title" class="text-xs text-gray-500 dark:text-gray-400">
              {{ review.service.translations[0].title }}
            </div>
          </div>
        </td>
        
        <!-- Rating Column -->
        <td class="px-6 py-4 whitespace-nowrap text-center">
          <div class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200">
            <span class="flex items-center">
              <StarIcon class="w-3.5 h-3.5 mr-1 text-amber-500 fill-current" />
              {{ review.rating }}
            </span>
          </div>
        </td>
        
        <!-- Status Column -->
        <td class="px-6 py-4 whitespace-nowrap text-center">
          <button
            @click="() => changeStatus(review.id, review.status === ReviewStatus.ACTIVE ? ReviewStatus.INACTIVE : ReviewStatus.ACTIVE)"
            :class="{
              'px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full items-center gap-1 cursor-pointer transition-colors duration-200': true,
              'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 hover:bg-green-200 dark:hover:bg-green-800': review.status === ReviewStatus.ACTIVE,
              'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 hover:bg-red-200 dark:hover:bg-red-800': review.status === ReviewStatus.INACTIVE,
              'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 hover:bg-yellow-200 dark:hover:bg-yellow-800': review.status === ReviewStatus.PENDING
            }"
          >
            <div class="w-2 h-2 rounded-full"
              :class="{
                'bg-green-500': review.status === ReviewStatus.ACTIVE,
                'bg-red-500': review.status === ReviewStatus.INACTIVE,
                'bg-yellow-500': review.status === ReviewStatus.PENDING
              }"
            ></div>
            {{ getStatusInfo(review.status).label }}
          </button>
        </td>
        
        <!-- Featured Column -->
        <td class="px-6 py-4 whitespace-nowrap text-center">
          <button
            @click="toggleFeatured(review.id)"
            :class="{
              'px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full items-center gap-1 cursor-pointer transition-colors duration-200': true,
              'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 hover:bg-blue-200 dark:hover:bg-blue-800': review.featured,
              'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600': !review.featured
            }"
          >
            <div class="w-2 h-2 rounded-full"
              :class="{
                'bg-blue-500': review.featured,
                'bg-gray-500': !review.featured
              }"
            ></div>
            {{ review.featured ? 'Featured' : 'Not Featured' }}
          </button>
        </td>
        
        <!-- Date Column -->
        <td class="px-6 py-4 whitespace-nowrap text-center">
          <div class="text-sm text-gray-500 dark:text-gray-400">
            {{ new Date(review.createdAt).toLocaleDateString() }}
          </div>
        </td>
        
        <!-- Actions Column -->
        <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
          <div class="flex justify-end gap-2">
            <button
              @click="editReview(review.id)"
              class="inline-flex h-10 w-10 items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 transition-colors shrink-0"
              title="Edit review"
            >
              <PencilIcon class="h-6 w-6 shrink-0" />
            </button>
            <button
              @click="deleteReview(review.id)"
              class="inline-flex h-10 w-10 items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 transition-colors shrink-0"
              title="Delete review"
            >
              <Trash2Icon class="h-6 w-6 shrink-0" />
            </button>
          </div>
        </td>
      </template>
        
      <template #empty>
        <div class="text-center py-10">
          <div class="text-gray-500 mb-2">No reviews found</div>
          <button 
            @click="addReview" 
            class="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <PlusCircleIcon class="h-5 w-5 mr-2" />
            Add New Review
          </button>
        </div>
      </template>
    </DataTable>
  </div>
</template> 
