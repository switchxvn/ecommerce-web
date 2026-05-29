<script setup lang="ts">
import { ref, onMounted, watch } from "vue";
import { useAuth } from "../../composables/useAuth";
import { useTrpc } from "../../composables/useTrpc";
import { useRouter, useRoute } from "vue-router";
import { useLocalization } from "../../composables/useLocalization";
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
  PackageIcon,
  MoreHorizontalIcon,
  ChevronDownIcon as LucideChevronDownIcon,
  ChevronUpIcon as LucideChevronUpIcon
} from 'lucide-vue-next';
import Swal from 'sweetalert2';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import 'swiper/css/zoom';
import { Navigation, Pagination, Zoom } from 'swiper/modules';
import { Swiper, SwiperSlide } from 'swiper/vue';
import FilterContainer from '../../components/common/filter/FilterContainer.vue';
import SearchFilter from '../../components/common/filter/SearchFilter.vue';
import StatusFilter from '../../components/common/filter/StatusFilter.vue';
import PageSizeFilter from '../../components/common/filter/PageSizeFilter.vue';
import DataTable from '../../components/common/table/DataTable.vue';
import PageHeader from '../../components/common/header/PageHeader.vue';
import { useSiteTitle } from '../../composables/useSiteTitle';

// Base64 encoded transparent placeholder image
const FALLBACK_IMAGE = 'images/default/default-image.jpg';

// These functions are provided by Nuxt at runtime
// @ts-ignore
const definePageMeta = (meta: any) => {}; 
// @ts-ignore
const useHead = (head: any) => {};

definePageMeta({
  middleware: ["auth"],
});

// Set page title with i18n support
useSiteTitle('productsManagement');

const router = useRouter();
const route = useRoute();
const { checkAuth } = useAuth();
const trpc = useTrpc();
const { t } = useLocalization();

interface ProductTranslation {
  id: number;
  title: string;
  content: string;
  shortDescription: string;
  locale: string;
  slug: string;
  metaTitle: string;
  metaDescription: string;
  metaKeywords: string;
  videoTitle?: string;
}

interface ProductVariantTranslation {
  id: number;
  name: string;
  description: string;
  shortDescription: string;
  locale: string;
  metaTitle: string;
  metaDescription: string;
  variantId: number;
  createdAt: string;
  updatedAt: string;
}

interface ProductVariant {
  id: number;
  sku: string;
  price: number;
  salePrice?: number | null;
  stock: number;
  translations: ProductVariantTranslation[];
  published?: boolean;
  quantity?: number;
  comparePrice?: number | null;
  thumbnail?: string;
  isFeatured?: boolean;
  isNew?: boolean;
  isSale?: boolean;
}

interface Product {
  id: number;
  sku: string;
  price: number;
  salePrice?: number | null;
  stock: number;
  published: boolean;
  createdAt: string;
  updatedAt: string;
  translations: ProductTranslation[];
  variants: ProductVariant[];
  thumbnail?: string;
  attributes: any[];
  specifications: any[];
  type?: string;
  categories?: any[];
}

const isLoading = ref(true);
const error = ref<string | null>(null);
const search = ref(route.query.search?.toString() || '');
const publishedFilter = ref<boolean | undefined>(
  route.query.published === 'true' ? true : 
  route.query.published === 'false' ? false : 
  undefined
);
const page = ref(Number(route.query.page) || 1);
const pageSize = ref(10);
const products = ref<{
  items: Product[];
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

const selectedProducts = ref<number[]>([]);
const sortBy = ref('createdAt');
const sortOrder = ref<'asc' | 'desc'>('desc');

const selectedImage = ref<string | null>(null);
const isZoomModalOpen = ref(false);

// Theo dõi sản phẩm đang được mở rộng
const expandedProductId = ref<number | null>(null);

// Add image error handler
const handleImageError = (e: Event) => {
  const target = e.target as HTMLImageElement;
  if (target) {
    // Use a data URI to prevent infinite error loops
    target.src = FALLBACK_IMAGE;
    // Remove onerror handler 
    target.onerror = null;
  }
};

// Update URL query parameters
const updateQueryParams = () => {
  const query: Record<string, string | undefined> = {
    page: page.value > 1 ? page.value.toString() : undefined,
    search: search.value || undefined,
    published: publishedFilter.value !== undefined ? publishedFilter.value.toString() : undefined,
    sortBy: sortBy.value !== 'createdAt' ? sortBy.value : undefined,
    sortOrder: sortOrder.value !== 'desc' ? sortOrder.value : undefined
  };

  Object.keys(query).forEach(key => query[key] === undefined && delete query[key]);
  router.replace({ query });
};

watch([page, search, publishedFilter, sortBy, sortOrder], () => {
  updateQueryParams();
  fetchProducts();
}, { deep: true });

async function fetchProducts() {
  try {
    isLoading.value = true;
    error.value = null;

    // @ts-ignore - Sử dụng ts-ignore cho phép thêm tham số sortBy và sortOrder
    const result = await trpc.admin.products.getAllProducts.query({
      page: page.value,
      limit: pageSize.value,
      search: search.value || undefined,
      published: publishedFilter.value,
      sortBy: sortBy.value,
      sortOrder: sortOrder.value
    });

    // Map API response to Product interface
    const mappedProducts = result.products.map(p => ({
      id: p.id,
      sku: p.sku || '',
      price: typeof p.price === 'number' ? p.price : parseFloat(String(p.price || '0')),
      salePrice: typeof p.salePrice === 'number' 
        ? p.salePrice 
        : p.salePrice ? parseFloat(String(p.salePrice)) : null,
      stock: typeof p.stock === 'number' ? p.stock : parseInt(String(p.stock || '0')),
      published: !!p.published,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
      translations: p.translations || [],
      variants: (p.variants || []).map((v: any) => ({
        id: v.id,
        sku: v.sku || '',
        price: typeof v.price === 'number' ? v.price : parseFloat(String(v.price || '0')),
        salePrice: typeof v.salePrice === 'number' 
          ? v.salePrice 
          : v.salePrice ? parseFloat(String(v.salePrice)) : null,
        stock: typeof v.stock === 'number' ? v.stock : parseInt(String(v.stock || '0')),
        translations: v.translations || [],
        published: v.published !== undefined ? !!v.published : true,
        quantity: typeof v.quantity === 'number' ? v.quantity : parseInt(String(v.quantity || '0')),
        comparePrice: typeof v.comparePrice === 'number' 
          ? v.comparePrice 
          : v.comparePrice ? parseFloat(String(v.comparePrice)) : null,
        thumbnail: v.thumbnail || undefined,
        isFeatured: !!v.isFeatured,
        isNew: !!v.isNew,
        isSale: !!v.isSale
      })),
      thumbnail: p.thumbnail || undefined,
      attributes: p.attributes || [],
      specifications: p.specifications || [],
      type: p.type,
      categories: p.categories || []
    }));

    products.value = {
      items: mappedProducts,
      total: result.total,
      page: result.currentPage,
      pageSize: result.limit,
      totalPages: result.totalPages
    };
  } catch (err: any) {
    error.value = err.message || "Failed to load products";
    console.error("Error loading products:", err);
  } finally {
    isLoading.value = false;
  }
}

async function handleDelete(id: number) {
  const result = await Swal.fire({
    title: t('products.deleteTitle'),
    text: t('products.confirmDelete'),
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: t('products.deleteSelected'),
    cancelButtonText: t('products.cancel'),
    confirmButtonColor: '#DC2626',
  });

  if (!result.isConfirmed) return;

  try {
    await trpc.admin.products.deleteProduct.mutate(id);
    
    Swal.fire({
      title: t('messages.success'),
      text: t('products.deleteSuccess'),
      icon: 'success',
      timer: 2000,
      showConfirmButton: false
    });
    
    await fetchProducts();
  } catch (err: any) {
    console.error("Error deleting product:", err);
    
    Swal.fire({
      title: t('messages.error'),
      text: err.message || t('messages.error'),
      icon: 'error'
    });
  }
}

// Add bulk actions handler
async function handleBulkAction(action: string) {
  const selectedCount = selectedProducts.value.length;
  if (!selectedCount) return;

  let confirmConfig: any = {
    icon: 'question' as const,
    showCancelButton: true,
    confirmButtonText: t('messages.confirm'),
    cancelButtonText: t('products.cancel'),
    title: '',
    text: '',
    confirmButtonColor: ''
  };

  switch (action) {
    case 'publish':
      confirmConfig = {
        ...confirmConfig,
        title: t('products.publishSelected'),
        text: t('products.confirmPublishSelected', { count: selectedCount }),
        confirmButtonColor: '#10B981',
        confirmButtonText: t('products.publishSelected')
      };
      break;
    case 'unpublish':
      confirmConfig = {
        ...confirmConfig,
        title: t('products.unpublishSelected'),
        text: t('products.confirmUnpublishSelected', { count: selectedCount }),
        confirmButtonColor: '#6B7280',
        confirmButtonText: t('products.unpublishSelected')
      };
      break;
    case 'delete':
      confirmConfig = {
        ...confirmConfig,
        title: t('products.deleteSelected'),
        text: t('products.confirmDeleteSelected', { count: selectedCount }),
        confirmButtonColor: '#DC2626',
        confirmButtonText: t('products.deleteSelected'),
        icon: 'warning' as const
      };
      break;
  }

  const result = await Swal.fire(confirmConfig);
  if (!result.isConfirmed) return;

  try {
    isLoading.value = true;

    switch (action) {
      case 'publish':
        // Handle bulk publish - method might be different in your API
        // @ts-ignore
        await Promise.all(
          selectedProducts.value.map(productId => {
            return trpc.admin.products.updateProductStatus.mutate({
              id: productId,
              published: true
            });
          })
        );
        break;
      case 'unpublish':
        // Handle bulk unpublish
        // @ts-ignore
        await Promise.all(
          selectedProducts.value.map(productId => {
            return trpc.admin.products.updateProductStatus.mutate({
              id: productId,
              published: false
            });
          })
        );
        break;
      case 'delete':
        // Handle bulk delete
        await Promise.all(
          selectedProducts.value.map(productId => 
            trpc.admin.products.deleteProduct.mutate(productId)
          )
        );
        break;
    }

    // Refresh posts list
    await fetchProducts();
    selectedProducts.value = [];

    Swal.fire({
      title: t('messages.success'),
      text: t('products.bulkActionSuccess', { action, count: selectedCount }),
      icon: 'success',
      timer: 2000,
      showConfirmButton: false
    });
  } catch (err: any) {
    error.value = err.message || t('products.bulkActionError', { action });
    console.error(`Error performing ${action} on products:`, err);
    
    Swal.fire({
      title: t('messages.error'),
      text: err.message || t('products.bulkActionError', { action }),
      icon: 'error' as const
    });
  } finally {
    isLoading.value = false;
  }
}

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString();
};

// Add toggle published function
async function togglePublished(product: Product) {
  const newStatus = !product.published;
  
  const result = await Swal.fire({
    title: newStatus ? t('products.publishSelected') : t('products.unpublishSelected'),
    text: newStatus 
      ? t('products.confirmPublishSelected', { count: 1 }) 
      : t('products.confirmUnpublishSelected', { count: 1 }),
    icon: 'question',
    showCancelButton: true,
    confirmButtonText: newStatus ? t('products.publishSelected') : t('products.unpublishSelected'),
    cancelButtonText: t('products.cancel'),
    confirmButtonColor: newStatus ? '#10B981' : '#6B7280',
  });

  if (!result.isConfirmed) return;

  try {
    // @ts-ignore
    await trpc.admin.products.updateProductStatus.mutate({
      id: product.id,
      published: newStatus
    });
    
    product.published = newStatus;

    Swal.fire({
      title: t('messages.success'),
      text: newStatus 
        ? t('products.bulkActionSuccess', { action: 'publish', count: 1 }) 
        : t('products.bulkActionSuccess', { action: 'unpublish', count: 1 }),
      icon: 'success',
      timer: 2000,
      showConfirmButton: false
    });
  } catch (err: any) {
    const errorMessage = err.message || t('products.bulkActionError', { 
      action: newStatus ? 'publish' : 'unpublish' 
    });
    error.value = errorMessage;
    console.error("Error updating product status:", err);
    
    Swal.fire({
      title: t('messages.error'),
      text: errorMessage,
      icon: 'error' as const
    });
  }
}

// Open zoom modal
const openZoomModal = (image: string) => {
  selectedImage.value = image;
  isZoomModalOpen.value = true;
};

// Close zoom modal
const closeZoomModal = () => {
  selectedImage.value = null;
  isZoomModalOpen.value = false;
};

// Toggle variant list expansion
const toggleVariants = (productId: number) => {
  if (expandedProductId.value === productId) {
    expandedProductId.value = null; // Close if already open
  } else {
    expandedProductId.value = productId; // Open the variants
  }
};

// Toggle variant published status
const toggleVariantPublished = async (variant: any) => {
  try {
    const newStatus = !variant.published;
    
    const result = await Swal.fire({
      title: newStatus ? t('products.publishSelected') : t('products.unpublishSelected'),
      text: newStatus 
        ? t('products.confirmPublishSelected', { count: 1 }) 
        : t('products.confirmUnpublishSelected', { count: 1 }),
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: newStatus ? t('products.publishSelected') : t('products.unpublishSelected'),
      cancelButtonText: t('products.cancel'),
      confirmButtonColor: newStatus ? '#10B981' : '#6B7280',
    });

    if (!result.isConfirmed) return;

    // Gọi API để cập nhật trạng thái variant
    try {
      // Sử dụng any để tránh lỗi TypeScript vì có thể API chưa được khai báo trong type
      const adminProductsApi = trpc.admin.products as any;
      
      // Nếu có API endpoint riêng cho variant
      if (adminProductsApi.updateVariantStatus) {
        await adminProductsApi.updateVariantStatus.mutate({
          id: variant.id,
          published: newStatus
        });
      } 
      // Nếu không có API endpoint riêng, có thể gọi API cập nhật variant
      else if (adminProductsApi.updateVariant) {
        await adminProductsApi.updateVariant.mutate({
          id: variant.id,
          published: newStatus
        });
      }
      // Nếu không có bất kỳ API endpoint nào, chỉ cập nhật UI
      else {
        console.warn("API endpoint for updating variant status not found. UI updated but database unchanged.");
      }
    } catch (apiError) {
      console.error("API error:", apiError);
      throw new Error("Failed to update variant status on server");
    }
    
    // Cập nhật UI
    variant.published = newStatus;

    Swal.fire({
      title: t('messages.success'),
      text: newStatus 
        ? t('products.bulkActionSuccess', { action: 'publish', count: 1 }) 
        : t('products.bulkActionSuccess', { action: 'unpublish', count: 1 }),
      icon: 'success',
      timer: 2000,
      showConfirmButton: false
    });
  } catch (err: any) {
    const errorMessage = err.message || t('products.bulkActionError', { 
      action: !variant.published ? 'publish' : 'unpublish' 
    });
    error.value = errorMessage;
    console.error("Error updating variant status:", err);
    
    Swal.fire({
      title: t('messages.error'),
      text: errorMessage,
      icon: 'error'
    });
  }
};

onMounted(async () => {
  try {
    // Check authentication first
    const isAuthenticated = await checkAuth();
    if (!isAuthenticated) {
      router.push("/auth/login");
      return;
    }

    // Initialize sort parameters from URL
    if (route.query.sortBy) {
      sortBy.value = route.query.sortBy.toString();
    }
    
    if (route.query.sortOrder && ['asc', 'desc'].includes(route.query.sortOrder.toString())) {
      sortOrder.value = route.query.sortOrder.toString() as 'asc' | 'desc';
    }

    await fetchProducts();
  } catch (err: any) {
    error.value = err.message || "Failed to initialize products page";
    console.error("Error initializing products page:", err);
  }
});
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <PageHeader
      :title="t('products.title')"
      :description="t('products.description')"
    >
      <template #actions>
        <div class="flex items-center gap-2">
          <Menu as="div" class="relative" v-if="selectedProducts.length">
            <MenuButton class="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors">
              <ListChecksIcon class="h-4 w-4" />
              {{ t('products.bulkActions', { count: selectedProducts.length }) }}
              <ChevronDownIcon class="h-4 w-4" />
            </MenuButton>

            <MenuItems class="absolute right-0 mt-2 w-56 origin-top-right divide-y divide-gray-100 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
              <div class="p-1">
                <MenuItem v-slot="{ active }">
                  <button
                    @click="handleBulkAction('publish')"
                    :class="[
                      active ? 'bg-emerald-50 text-emerald-700' : 'text-gray-900',
                      'group flex w-full items-center rounded-md px-2 py-2 text-sm gap-2'
                    ]"
                  >
                    <EyeIcon class="h-4 w-4" :class="active ? 'text-emerald-700' : 'text-gray-500'" />
                    {{ t('products.publishSelected') }}
                  </button>
                </MenuItem>
                <MenuItem v-slot="{ active }">
                  <button
                    @click="handleBulkAction('unpublish')"
                    :class="[
                      active ? 'bg-slate-50 text-slate-700' : 'text-gray-900',
                      'group flex w-full items-center rounded-md px-2 py-2 text-sm gap-2'
                    ]"
                  >
                    <EyeOffIcon class="h-4 w-4" :class="active ? 'text-slate-700' : 'text-gray-500'" />
                    {{ t('products.unpublishSelected') }}
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
                    {{ t('products.deleteSelected') }}
                  </button>
                </MenuItem>
              </div>
            </MenuItems>
          </Menu>

          <NuxtLink
            to="/products/create"
            class="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-colors"
          >
            <PlusCircleIcon class="h-4 w-4" />
            {{ t('products.createProduct') }}
          </NuxtLink>
        </div>
      </template>
    </PageHeader>

    <!-- Search and Filter -->
    <FilterContainer>
      <template #search>
        <SearchFilter
          v-model:search="search"
          :search-placeholder="t('products.searchPlaceholder')"
        />
      </template>
      
      <template #status>
        <StatusFilter
          :modelValue="publishedFilter"
          :options="[
            { label: t('products.allStatus'), value: undefined },
            { label: t('products.published'), value: true },
            { label: t('products.draft'), value: false }
          ]"
          @update:modelValue="publishedFilter = $event"
        />
      </template>
      
      <template #pageSize>
        <PageSizeFilter
          v-model:modelValue="pageSize"
        />
      </template>
    </FilterContainer>

    <!-- Products Table -->
    <DataTable
      :items="products.items"
      :loading="isLoading"
      :error="error"
      :sort-by="sortBy"
      :sort-order="sortOrder"
      :selected-items="selectedProducts"
      :pagination="{
        currentPage: page,
        totalPages: products.totalPages,
        total: products.total,
        pageSize: pageSize
      }"
      @update:selected-items="selectedProducts = $event"
      @sort="sortBy = $event; fetchProducts()"
      @page-change="page = $event"
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
      <template #header="{ sortBy: tableSortBy, sortOrder: tableSortOrder, handleSort }">
        <th scope="col" class="px-6 py-3 text-left">
          <span class="text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">{{ t('products.thumbnail') }}</span>
        </th>
        <th 
          v-for="column in [
            { display: t('products.product'), value: 'title' },
            { display: t('products.sku'), value: 'sku' },
            { display: t('products.price'), value: 'price' },
            { display: t('products.status'), value: 'published' },
            { display: t('products.createdAt'), value: 'createdAt' },
            { display: t('products.actions'), value: '' }
          ]" 
          :key="column.display"
          scope="col" 
          class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-neutral-600"
          @click="column.value && (sortBy = column.value, sortOrder = sortBy === column.value && sortOrder === 'desc' ? 'asc' : 'desc')"
        >
          <div class="flex items-center gap-2">
            {{ column.display }}
            <template v-if="column.value">
              <ChevronDownIcon v-if="sortBy !== column.value" class="h-4 w-4" />
              <ChevronUpIcon v-else-if="sortOrder === 'asc'" class="h-4 w-4" />
              <ChevronDownIcon v-else class="h-4 w-4" />
            </template>
          </div>
        </th>
      </template>

      <!-- Row slot -->
      <template #row="{ item: product }">
        <td class="px-6 py-4 whitespace-nowrap">
          <div class="flex items-center">
            <div 
              v-if="product.thumbnail" 
              class="h-16 w-16 flex-shrink-0 cursor-pointer group relative rounded-lg overflow-hidden"
              @click="openZoomModal(product.thumbnail)"
            >
              <img 
                :src="product.thumbnail" 
                class="h-full w-full object-cover transition-transform group-hover:scale-105"
                alt=""
                @error="handleImageError"
              />
              <div class="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-opacity flex items-center justify-center">
                <ZoomInIcon class="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
            <div v-else class="h-16 w-16 flex-shrink-0 rounded-lg bg-gray-100 dark:bg-neutral-700 flex items-center justify-center">
              <PackageIcon class="h-8 w-8 text-gray-400" />
            </div>
          </div>
        </td>
        <td class="px-6 py-4 whitespace-nowrap">
          <div class="flex flex-col">
            <div class="text-sm font-medium text-gray-900 dark:text-white">
              {{ product.translations[0]?.title || 'Untitled Product' }}
            </div>
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {{ product.translations[0]?.shortDescription || '' }}
            </p>
            <div class="text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-1">
              <button
                v-if="product.variants.length > 0"
                @click="toggleVariants(product.id)"
                class="inline-flex items-center text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
              >
                {{ product.variants.length }} {{ t('products.variants') }}
                <LucideChevronDownIcon v-if="expandedProductId !== product.id" class="h-4 w-4 ml-1" />
                <LucideChevronUpIcon v-else class="h-4 w-4 ml-1" />
              </button>
              <span v-else>{{ product.variants.length }} {{ t('products.variants') }}</span>
            </div>
          </div>
        </td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
          {{ product.sku }}
        </td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
          {{ typeof product.price === 'number' ? product.price.toFixed(2) : product.price }}
          <span v-if="product.salePrice" class="text-red-500 ml-1">
            {{ typeof product.salePrice === 'number' ? product.salePrice.toFixed(2) : product.salePrice }}
          </span>
        </td>
        <td class="px-6 py-4 whitespace-nowrap">
          <button
            @click="togglePublished(product)"
            :class="{
              'px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full items-center gap-1 cursor-pointer transition-colors duration-200': true,
              'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 hover:bg-green-200 dark:hover:bg-green-800': product.published,
              'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600': !product.published
            }"
          >
            <div class="w-2 h-2 rounded-full"
              :class="{
                'bg-green-500': product.published,
                'bg-gray-500': !product.published
              }"
            ></div>
            {{ product.published ? t('products.published') : t('products.draft') }}
          </button>
        </td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
          {{ formatDate(product.createdAt) }}
        </td>
        <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
          <div class="flex justify-end gap-2">
            <NuxtLink
              :to="`/products/edit/${product.id}`"
              class="inline-flex h-10 w-10 items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 transition-colors shrink-0"
              title="Edit product"
            >
              <PencilIcon class="h-6 w-6 shrink-0" />
            </NuxtLink>
            <button
              @click="handleDelete(product.id)"
              class="inline-flex h-10 w-10 items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 transition-colors shrink-0"
              title="Delete product"
            >
              <Trash2Icon class="h-6 w-6 shrink-0" />
            </button>
          </div>
        </td>
      </template>
      
      <!-- Variants dropdown -->
      <template #expanded-row="{ item: product }">
        <tr v-if="expandedProductId === product.id">
          <td colspan="8" class="px-2 pb-6 pt-2">
            <div class="bg-gray-50 dark:bg-neutral-800 rounded-lg shadow-sm border border-gray-200 dark:border-neutral-700 overflow-hidden mx-2">
              <div class="bg-gray-100 dark:bg-neutral-700 px-4 py-3 border-b border-gray-200 dark:border-neutral-600 flex items-center justify-between">
                <h3 class="text-sm font-medium text-gray-700 dark:text-gray-300">{{ product.translations[0]?.title || 'Untitled Product' }} - Variants</h3>
                <div class="text-xs text-gray-500 dark:text-gray-400">{{ product.variants.length }} variants found</div>
              </div>
              <div class="overflow-x-auto p-0">
                <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead class="bg-gray-50 dark:bg-neutral-700">
                    <tr>
                      <th scope="col" class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Image</th>
                      <th scope="col" class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Name</th>
                      <th scope="col" class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">SKU</th>
                      <th scope="col" class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Price</th>
                      <th scope="col" class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Compare Price</th>
                      <th scope="col" class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Stock</th>
                      <th scope="col" class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                      <th scope="col" class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Flags</th>
                      <th scope="col" class="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody class="bg-white dark:bg-neutral-800 divide-y divide-gray-100 dark:divide-gray-700">
                    <tr v-for="variant in product.variants" :key="variant.id" class="hover:bg-gray-50 dark:hover:bg-neutral-700">
                      <td class="px-4 py-4 whitespace-nowrap">
                        <div class="flex items-center">
                          <div v-if="variant.thumbnail" class="h-12 w-12 flex-shrink-0 rounded overflow-hidden border border-gray-200 dark:border-neutral-700">
                            <img 
                              :src="variant.thumbnail" 
                              class="h-full w-full object-cover"
                              alt=""
                              @error="handleImageError"
                            />
                          </div>
                          <div v-else class="h-12 w-12 flex-shrink-0 rounded bg-gray-100 dark:bg-neutral-700 flex items-center justify-center border border-gray-200 dark:border-neutral-700">
                            <PackageIcon class="h-6 w-6 text-gray-400" />
                          </div>
                        </div>
                      </td>
                      <td class="px-4 py-4 whitespace-nowrap">
                        <div class="text-sm font-medium text-gray-900 dark:text-white">
                          {{ variant.translations[0]?.name || 'Unnamed Variant' }}
                        </div>
                        <div class="text-xs text-gray-500 dark:text-gray-400">
                          {{ variant.translations[0]?.shortDescription || '' }}
                        </div>
                      </td>
                      <td class="px-4 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {{ variant.sku }}
                      </td>
                      <td class="px-4 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {{ typeof variant.price === 'number' ? variant.price.toFixed(2) : variant.price }}
                      </td>
                      <td class="px-4 py-4 whitespace-nowrap text-sm text-red-500 dark:text-red-400">
                        {{ variant.comparePrice ? (typeof variant.comparePrice === 'number' ? variant.comparePrice.toFixed(2) : variant.comparePrice) : '-' }}
                      </td>
                      <td class="px-4 py-4 whitespace-nowrap text-sm">
                        <span :class="{
                          'px-2 py-1 text-xs rounded-full': true,
                          'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200': variant.quantity > 10,
                          'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200': variant.quantity > 0 && variant.quantity <= 10,
                          'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200': variant.quantity === 0
                        }">
                          {{ variant.quantity }}
                        </span>
                      </td>
                      <td class="px-4 py-4 whitespace-nowrap text-sm">
                        <button
                          @click="toggleVariantPublished(variant)"
                          :class="{
                            'px-2 py-1 text-xs rounded-full inline-flex items-center gap-1 cursor-pointer transition-colors': true,
                            'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 hover:bg-green-200 dark:hover:bg-green-800': variant.published,
                            'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600': !variant.published
                          }"
                        >
                          <div class="w-1.5 h-1.5 rounded-full" :class="{
                            'bg-green-500': variant.published,
                            'bg-gray-500': !variant.published
                          }"></div>
                          {{ variant.published ? 'Published' : 'Unpublished' }}
                        </button>
                      </td>
                      <td class="px-4 py-4 whitespace-nowrap text-sm">
                        <div class="flex space-x-1.5">
                          <span v-if="variant.isFeatured" class="px-2 py-1 text-xs rounded-full bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                            Featured
                          </span>
                          <span v-if="variant.isNew" class="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                            New
                          </span>
                          <span v-if="variant.isSale" class="px-2 py-1 text-xs rounded-full bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">
                            Sale
                          </span>
                        </div>
                      </td>
                      <td class="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div class="flex justify-end gap-2">
                          <NuxtLink
                            :to="`/products/edit/${product.id}/variants/${variant.id}`"
                            class="inline-flex h-9 w-9 items-center justify-center rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 transition-colors shrink-0"
                            title="Edit variant"
                          >
                            <PencilIcon class="h-5 w-5 shrink-0" />
                          </NuxtLink>
                          <button
                            class="inline-flex h-9 w-9 items-center justify-center rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 transition-colors shrink-0"
                            title="Delete variant"
                          >
                            <Trash2Icon class="h-5 w-5 shrink-0" />
                          </button>
                        </div>
                      </td>
                    </tr>
                    <tr v-if="product.variants.length === 0">
                      <td colspan="9" class="px-4 py-6 text-sm text-gray-500 dark:text-gray-400 text-center">
                        <div class="flex flex-col items-center py-4">
                          <PackageIcon class="h-10 w-10 text-gray-300 dark:text-gray-600 mb-2" />
                          <p>No variants available for this product</p>
                          <p class="text-xs mt-1">Add variants to provide different options of the same product</p>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div class="px-4 py-3 bg-gray-50 dark:bg-neutral-700 border-t border-gray-200 dark:border-neutral-600 flex justify-between items-center">
                <div class="text-xs text-gray-500 dark:text-gray-400">
                  Variants allow you to create different versions of the same product
                </div>
                <NuxtLink
                  :to="`/products/edit/${product.id}/variants/create`"
                  class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                >
                  <PlusCircleIcon class="h-3.5 w-3.5" />
                  Add New Variant
                </NuxtLink>
              </div>
            </div>
          </td>
        </tr>
      </template>
    </DataTable>

    <!-- Image Zoom Modal -->
    <TransitionRoot as="template" :show="isZoomModalOpen">
      <div class="fixed inset-0 z-50 overflow-y-auto" @click="closeZoomModal">
        <div class="flex min-h-full items-center justify-center p-4 text-center">
          <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
          
          <div class="relative transform overflow-hidden rounded-lg bg-white dark:bg-neutral-800 px-4 pb-4 pt-5 text-left shadow-xl transition-all max-w-4xl w-full" @click.stop>
            <div class="absolute right-0 top-0 pr-4 pt-4">
              <button
                type="button"
                class="rounded-md bg-white dark:bg-neutral-800 text-gray-400 hover:text-gray-500 focus:outline-none"
                @click="closeZoomModal"
              >
                <XMarkIcon class="h-6 w-6" />
              </button>
            </div>
            
            <div class="mt-6">
              <swiper
                :modules="[Navigation, Pagination, Zoom]"
                :navigation="true"
                :pagination="{ clickable: true }"
                :zoom="true"
                class="h-[60vh]"
              >
                <swiper-slide v-if="selectedImage">
                  <div class="swiper-zoom-container">
                    <img 
                      :src="selectedImage" 
                      class="w-full h-full object-contain" 
                      alt="" 
                      @error="handleImageError"
                    />
                  </div>
                </swiper-slide>
              </swiper>
            </div>
          </div>
        </div>
      </div>
    </TransitionRoot>
  </div>
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
