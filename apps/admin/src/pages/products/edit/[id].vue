<template>
  <div class="min-h-screen bg-slate-50">
    <!-- Loading State -->
    <div v-if="loading" class="flex items-center justify-center h-[calc(100vh-4rem)]">
      <div class="flex flex-col items-center gap-2">
        <div class="h-8 w-8 animate-spin rounded-full border-4 border-primary border-r-transparent"></div>
        <p class="text-sm text-slate-500">{{ t('common.loading') }}</p>
      </div>
    </div>

    <!-- Content Area -->
    <div v-else class="min-h-screen bg-slate-50">
      <div class="flex-1 overflow-y-auto">
        <div class="space-y-6">
          <!-- Header -->
          <PageHeader
            :title="t('products.edit.title')"
            :description="t('products.edit.description')"
          >
            <template #actions>
              <!-- Language Switcher -->
              <LanguageSwitcher 
                v-model="selectedLanguage" 
                @language-changed="handleLanguageChange"
              />

              <NuxtLink 
                to="/products" 
                class="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-slate-200 bg-white hover:bg-slate-100 h-10 px-4 py-2"
              >
                <XIcon class="w-4 h-4 mr-2" />
                {{ t('actions.cancel') }}
              </NuxtLink>
              
              <button 
                @click="updateProduct(true)" 
                :disabled="loading"
                class="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-white border border-slate-200 text-slate-900 hover:bg-slate-100 h-10 px-4 py-2"
              >
                <SaveIcon class="w-4 h-4 mr-2" />
                {{ loading && saveAndContinue ? t('common.saving') : t('actions.saveAndContinue') }}
              </button>

              <button 
                @click="updateProduct(false)" 
                :disabled="loading"
                class="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-white hover:bg-primary/90 h-10 px-4 py-2"
              >
                <SaveAllIcon class="w-4 h-4 mr-2" />
                {{ loading && !saveAndContinue ? t('common.saving') : t('actions.saveAndBack') }}
              </button>
            </template>
          </PageHeader>

          <!-- Tabs -->
          <nav class="flex items-center space-x-1 rounded-lg bg-white border border-slate-200 p-1 w-fit">
            <button
              v-for="tab in tabs"
              :key="tab.id"
              @click="tab.id !== 'inventory' || !form.hasVariants ? currentTab = tab.id : null"
              class="flex items-center justify-center gap-2 rounded-md px-4 py-2.5 text-sm font-medium transition-all relative group"
              :class="{
                'bg-primary text-white': currentTab === tab.id,
                'text-slate-600 hover:text-slate-900 hover:bg-slate-50': currentTab !== tab.id,
                'opacity-50 cursor-not-allowed': tab.id === 'inventory' && form.hasVariants
              }"
            >
              <component :is="tab.icon" class="w-4 h-4" />
              {{ tab.name }}
              <div v-if="tab.id === 'inventory' && form.hasVariants" class="absolute left-1/2 transform -translate-x-1/2 bottom-full mb-2 w-64 p-2 bg-slate-900 text-white text-xs rounded shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                {{ t('products.inventory.variantsDisabledMessage') }}
              </div>
            </button>
          </nav>

          <div class="grid gap-6">
            <!-- Basic Info Tab -->
            <div v-show="currentTab === 'basic'">
              <ProductEditor
                v-model:name="form.name"
                v-model:slug="form.slug"
                v-model:description="form.description"
                v-model:shortDescription="form.shortDescription"
                v-model:price="form.price"
                v-model:comparePrice="form.comparePrice"
                v-model:sku="form.sku"
                v-model:barcode="form.barcode"
                v-model:isContactPrice="form.isContactPrice"
                :editor-options="editorOptions"
                :disable-price="form.hasVariants"
                @generate-slug="generateSlug"
              />
           
            </div>

            <!-- Media Tab -->
            <div v-show="currentTab === 'media'">
              <ProductMedia
                v-model:thumbnail="form.thumbnail"
                v-model:gallery="form.gallery"
              />
            </div>  

            <!-- Categories Tab -->
            <div v-show="currentTab === 'categories'">
              <ProductCategories
                v-model="form.categoryIds"
              />
            </div>

            <!-- Variants Tab -->
            <div v-show="currentTab === 'variants'">
              <ProductVariants
                :modelValue="form.variants"
                @update:modelValue="handleVariantsUpdate"
                v-model:hasVariants="form.hasVariants"
              />
            </div>

            <!-- Specifications Tab -->
            <div v-show="currentTab === 'specifications'">
              <ProductSpecifications
                :productId="Number(route.params.id)"
                :locale="selectedLanguage"
              />
            </div>

            <!-- Inventory Tab -->
            <div v-show="currentTab === 'inventory'">
              <ProductInventory
                v-model:trackInventory="form.trackInventory"
                v-model:quantity="form.quantity"
                v-model:lowStockThreshold="form.lowStockThreshold"
                v-model:stockStatus="form.stockStatus"
                v-model:allowBackorders="form.allowBackorders"
                :stockMovements="form.stockMovements"
                :hasVariants="form.hasVariants"
              />
              <div v-if="form.hasVariants" class="mt-4 flex items-center p-4 bg-blue-50 rounded-md text-blue-700 text-sm">
                <InfoIcon class="w-5 h-5 mr-2 flex-shrink-0" />
                <div>
                  <p><span class="font-medium">{{ t('products.inventory.notice') }}</span> {{ t('products.inventory.disabledMessage') }}</p>
                  <p>{{ t('products.inventory.manageMessage') }} <button @click="currentTab = 'variants'" class="underline font-medium hover:text-blue-900">{{ t('products.tabs.variants') }}</button>.</p>
                </div>
              </div>
            </div>

            <!-- Tier Pricing Tab -->
            <div v-show="currentTab === 'tier_pricing'">
              <ProductTierDiscounts
                :productId="Number(route.params.id)"
                :locale="selectedLanguage"
              />
            </div>

            <div v-show="currentTab === 'sidebar'">
              <ProductSidebarItems
                v-model="form.sidebarItems"
                :locale="selectedLanguage"
              />
            </div>

            <!-- SEO Tab -->
            <div v-show="currentTab === 'seo'">
              <ProductSEO
                v-model:meta-description="form.metaDescription"
                v-model:tags-input="tagsInput"
                :tags="form.tags"
                @tag-input="handleTagInput"
                @remove-tag="removeTag"
              />
            </div>

            <!-- Settings Tab -->
            <div v-show="currentTab === 'settings'">
              <ProductSettings
                v-model:published="form.published"
                v-model:featured="form.featured"
                v-model:taxable="form.taxable"
                :updated-at="form.updatedAt"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, onBeforeUnmount, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useTrpc } from '../../../composables/useTrpc'
import slugify from 'slugify'
import { useHead } from 'nuxt/app'
import { useToast } from '../../../composables/useToast'
import { useLocalization } from '../../../composables/useLocalization'

// Import Lucide icons
import {
  FileTextIcon,
  ImageIcon,
  SearchIcon,
  SettingsIcon,
  XIcon,
  SaveAllIcon,
  SaveIcon,
  FolderIcon,
  LayersIcon,
  PackageIcon,
  InfoIcon,
  ClipboardListIcon,
  PercentIcon
} from 'lucide-vue-next'

// Import components
import PageHeader from '../../../components/common/header/PageHeader.vue'
import ProductEditor from '../../../components/products/ProductEditor.vue'
import ProductMedia from '../../../components/products/ProductMedia.vue'
import ProductSEO from '../../../components/products/ProductSEO.vue'
import ProductSettings from '../../../components/products/ProductSettings.vue'
import ProductCategories from '../../../components/products/ProductCategories.vue'
import ProductVariants from '../../../components/products/ProductVariants.vue'
import ProductInventory from '../../../components/products/ProductInventory.vue'
import ProductSpecifications from '../../../components/products/ProductSpecifications.vue'
import LanguageSwitcher from '../../../components/common/LanguageSwitcher.vue'
import ProductTierDiscounts from '../../../components/products/ProductTierDiscounts.vue'
import ProductSidebarItems from '../../../components/products/ProductSidebarItems.vue'

const trpc = useTrpc()
const route = useRoute()
const router = useRouter()
const loading = ref(true)
const saveAndContinue = ref(false)
const { t } = useLocalization()

// Modify the toast import to use CommonJS default export pattern
const toast = useToast()

// Initialize currentTab from query params or default to 'basic'
const currentTab = ref(route.query.tab?.toString() || 'basic')

// Initialize selectedLanguage
const selectedLanguage = ref('')
const defaultLanguage = ref('')

// Handle language change
const handleLanguageChange = (code: string) => {
  // Check if code is the same as current language, do nothing in that case
  if (code === selectedLanguage.value) return;
  
  // Save current translations before switching language
  if (selectedLanguage.value && form.value.name !== undefined) {
    form.value.translations[selectedLanguage.value] = {
      name: form.value.name,
      slug: form.value.slug,
      description: form.value.description,
      shortDescription: form.value.shortDescription,
      metaDescription: form.value.metaDescription
    }
  }
  
  // Update selectedLanguage
  selectedLanguage.value = code;
  
  // Check if data exists for the new language
  if (form.value.translations[code]) {
    // If exists, update form with data from translations
    const translation = form.value.translations[code];
    form.value.name = translation.name || '';
    form.value.slug = translation.slug || '';
    form.value.description = translation.description || '';
    form.value.shortDescription = translation.shortDescription || '';
    form.value.metaDescription = translation.metaDescription || '';
  } else {
    // If not exists, reset form for new input
    form.value.name = '';
    form.value.slug = '';
    form.value.description = '';
    form.value.shortDescription = '';
    form.value.metaDescription = '';
  }
  
  // Only update URL if different from current URL locale
  if (route.query.locale !== code) {
    router.push({
      query: {
        ...route.query,
        locale: code
      }
    });
  }
}

// Watch for tab changes and update URL
watch(currentTab, (newTab) => {
  // Tránh gọi router.replace liên tục nếu giá trị tab không thay đổi
  if (route.query.tab?.toString() !== newTab) {
    router.replace({ 
      query: { 
        ...route.query,
        tab: newTab 
      }
    })
  }
})

const tabs = computed(() => [
  { 
    id: 'basic', 
    name: t('products.tabs.basicInfo'), 
    icon: FileTextIcon
  },
  { 
    id: 'media', 
    name: t('products.tabs.media'), 
    icon: ImageIcon
  },
  {
    id: 'categories',
    name: t('products.tabs.categories'),
    icon: FolderIcon
  },
  {
    id: 'variants',
    name: t('products.tabs.variants'),
    icon: LayersIcon
  },
  {
    id: 'specifications',
    name: t('products.tabs.specifications'),
    icon: ClipboardListIcon
  },
  {
    id: 'inventory',
    name: t('products.tabs.inventory'),
    icon: PackageIcon
  },
  {
    id: 'tier_pricing',
    name: t('products.tabs.tierPricing'),
    icon: PercentIcon
  },
  {
    id: 'sidebar',
    name: 'Sidebar',
    icon: InfoIcon
  },
  { 
    id: 'seo', 
    name: t('products.tabs.seo'), 
    icon: SearchIcon
  },
  { 
    id: 'settings', 
    name: t('products.tabs.settings'), 
    icon: SettingsIcon
  }
])

// Định nghĩa interface trực tiếp trong file
interface ProductVariant {
  id?: number;
  productId?: number;
  sku: string;
  price: number | null;
  comparePrice: number | null;
  thumbnail?: string;
  gallery?: string[];
  published?: boolean;
  quantity: number;
  stock?: number; // Alias for quantity used in frontend
  isFeatured?: boolean;
  isNew?: boolean;
  isSale?: boolean;
  barcode?: string;
  options?: Record<string, string>;
  translations?: Array<{locale: string, name: string, variantId?: number}>;
  createdAt?: Date;
  updatedAt?: Date;
  
  // Frontend-only fields for UI state
  _tempPrice?: number;
  _tempComparePrice?: number | null;
  name?: string;
}

interface ProductForm {
  name: string
  slug: string
  description: string
  shortDescription: string
  price: number | null
  comparePrice: number | null
  sku: string
  barcode: string
  published: boolean
  featured: boolean
  taxable: boolean
  thumbnail: string
  gallery: string[]
  metaDescription: string
  tags: string[]
  categoryIds: number[]
  hasVariants: boolean
  variants: ProductVariant[]
  trackInventory: boolean
  quantity: number
  lowStockThreshold: number
  stockStatus: string
  allowBackorders: boolean
  stockMovements: any[]
  sidebarItems: Array<{
    itemType: 'post' | 'service'
    itemId: number
    position: number
  }>
  updatedAt: string
  translations: Record<string, {
    name: string
    slug: string
    description: string
    shortDescription: string
    metaDescription: string
  }>
  isContactPrice: boolean
  _tempPrice?: number
  _tempComparePrice?: number | null
}

const initialForm: ProductForm = {
  name: '',
  slug: '',
  description: '',
  shortDescription: '',
  price: 0,
  comparePrice: null,
  sku: '',
  barcode: '',
  published: false,
  featured: false,
  taxable: true,
  thumbnail: '',
  gallery: [],
  metaDescription: '',
  tags: [],
  categoryIds: [],
  hasVariants: false,
  variants: [],
  trackInventory: true,
  quantity: 0,
  lowStockThreshold: 5,
  stockStatus: 'in_stock',
  allowBackorders: false,
  stockMovements: [],
  sidebarItems: [],
  updatedAt: new Date().toISOString(),
  translations: {},
  isContactPrice: false
}

const form = ref({ ...initialForm })
const tagsInput = ref('')

// Update page title dynamically - chỉnh sửa để tránh re-render liên tục
useHead({
  title: computed(() => form.value.name 
    ? `${t('products.edit.title')}: ${form.value.name} - ${t('common.adminDashboard')}`
    : `${t('products.edit.title')} - ${t('common.adminDashboard')}`)
})

const handleTagInput = (e: KeyboardEvent) => {
  // Handle Enter key
  if (e.key === 'Enter') {
    e.preventDefault()
    addTag()
  }
  // Handle Space key
  else if (e.key === ' ') {
    e.preventDefault()
    addTag()
  }
  // Handle Backspace when input is empty
  else if (e.key === 'Backspace' && tagsInput.value === '') {
    e.preventDefault()
    form.value.tags.pop()
  }
}

const addTag = () => {
  const tag = tagsInput.value.trim()
  if (tag && !form.value.tags.includes(tag)) {
    form.value.tags.push(tag)
    tagsInput.value = ''
  }
}

const removeTag = (index: number) => {
  form.value.tags.splice(index, 1)
}

// Generate slug from name with Vietnamese support
const generateSlug = () => {
  if (form.value.name) {
    form.value.slug = slugify(form.value.name, {
      lower: true,           // Convert to lowercase
      strict: true,          // Strip special characters except replacement
      locale: 'vi',          // Vietnamese language
      trim: true             // Trim leading and trailing replacement chars
    })
  }
}

// Tối ưu watch cho form.value.name để không trigger generateSlug quá thường xuyên
const debouncedNameWatcher = (() => {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  
  return (newName: string) => {
    if (timeout) clearTimeout(timeout);
    
    if (newName) {
      timeout = setTimeout(() => {
        generateSlug();
        timeout = null;
      }, 300);
    }
  };
})();

// Thay thế watch để sử dụng debounce
watch(() => form.value.name, debouncedNameWatcher, { immediate: false });

// Đăng ký các lifecycle hooks
onMounted(() => {
  // Khởi tạo dữ liệu
  initData();
});

// Sử dụng biến để ngăn chặn việc gọi fetchProduct nhiều lần
let fetchInProgress = false;

// Hàm khởi tạo dữ liệu
const initData = async () => {
  // Chỉ chạy khi selectedLanguage chưa được thiết lập
  if (selectedLanguage.value) return;
  
  // Kiểm tra URL parameter khi component mounted
  const localeFromUrl = route.query.locale as string;
  
  // Nếu có locale trong URL, sử dụng giá trị đó
  if (localeFromUrl) {
    selectedLanguage.value = localeFromUrl;
  } else {
    // Nếu không, lấy ngôn ngữ mặc định từ hệ thống
    try {
      const defaultLang = await trpc.admin.languages.getDefaultLanguage.query();
      selectedLanguage.value = defaultLang?.code || 'en';
      
      // Sử dụng router.push thay vì replace để tránh trigger nhiều lần
      if (route.query.locale !== selectedLanguage.value) {
        router.push({ 
          query: { 
            ...route.query,
            locale: selectedLanguage.value 
          }
        });
      }
    } catch (error) {
      console.error('Failed to fetch default language:', error);
      selectedLanguage.value = 'en'; // Fallback nếu không lấy được ngôn ngữ mặc định
    }
  }
  
  // Khởi tạo dữ liệu sau khi đã có selectedLanguage
  await fetchProduct();
};

// Cải thiện hàm fetchProduct để giảm thiểu re-render không cần thiết và tránh gọi chồng chéo
const fetchProduct = async () => {
  if (fetchInProgress) return;
  
  try {
    fetchInProgress = true;
    loading.value = true;
    
    const product = await trpc.admin.products.getProductById.query(Number(route.params.id));
    
    if (product) {
      // Initialize translations
      const translations: Record<string, any> = {}
      
      if (Array.isArray(product.translations)) {
        product.translations.forEach(translation => {
          translations[translation.locale] = {
            name: translation.title || '',
            slug: translation.slug || '',
            description: translation.content || '',
            shortDescription: translation.shortDescription || '',
            metaDescription: translation.metaDescription || ''
          }
        })
      }

      // Process price correctly
      let productPrice = null;
      if (product.price !== null && product.price !== undefined) {
        // If price is string, convert to number
        if (typeof product.price === 'string') {
          productPrice = parseFloat(product.price) || 0
        } else if (typeof product.price === 'number') {
          productPrice = product.price
        }
      }

      // Check if this is a "Contact for Price" product
      const isContactPrice = productPrice === null;

      // Process comparePrice
      let comparePrice = null
      if ((product as any).comparePrice !== null && (product as any).comparePrice !== undefined) {
        if (typeof (product as any).comparePrice === 'string') {
          comparePrice = parseFloat((product as any).comparePrice) || null
        } else if (typeof (product as any).comparePrice === 'number') {
          comparePrice = (product as any).comparePrice
        }
      }

      // Process product tags safely
      const productTags: string[] = []
      // Use 'as any' to avoid linter errors
      const productTagsArray = (product as any).productTags
      if (Array.isArray(productTagsArray)) {
        productTagsArray.forEach(tag => {
          if (tag && typeof tag === 'object' && tag.tag && typeof tag.tag === 'object' && tag.tag.name) {
            productTags.push(tag.tag.name)
          }
        })
      }

      // Process variants safely
      const variants: ProductVariant[] = []
      if (Array.isArray(product.variants)) {
        // Analyze variant names to create options
        // In this case, can use translations to create simple options
        // Create a single option named "Type"
        const optionName = selectedLanguage.value === 'vi' ? 'Loại' : 'Type'
        
        product.variants.forEach(variant => {
          const variantName = Array.isArray(variant.translations) 
            ? variant.translations.find(t => t?.locale === selectedLanguage.value)?.name || ''
            : ''

          // Process variant price correctly
          let variantPrice = null;
          if (variant.price !== null && variant.price !== undefined) {
            if (typeof variant.price === 'string') {
              variantPrice = parseFloat(variant.price) || 0
            } else if (typeof variant.price === 'number') {
              variantPrice = variant.price
            }
          }

          // Process variant comparePrice
          let variantComparePrice = null
          if ((variant as any).comparePrice !== null && (variant as any).comparePrice !== undefined) {
            if (typeof (variant as any).comparePrice === 'string') {
              variantComparePrice = parseFloat((variant as any).comparePrice) || null
            } else if (typeof (variant as any).comparePrice === 'number') {
              variantComparePrice = (variant as any).comparePrice
            }
          }

          // Create options object based on variant name
          const variantOptions: Record<string, string> = {}
          if (variantName) {
            variantOptions[optionName] = variantName
          }

          variants.push({
            id: variant.id,
            name: variantName,
            sku: variant.sku || '',
            barcode: (variant as any).barcode || '',
            price: variantPrice,
            comparePrice: variantComparePrice,
            quantity: variant.quantity || 0,
            stock: variant.quantity || 0,  // Use quantity as default value for stock
            options: variantOptions,
            thumbnail: variant.thumbnail || '',
            gallery: variant.gallery || [],
            published: variant.published || false,
            isFeatured: variant.isFeatured || false,
            isNew: variant.isNew || false,
            isSale: !!(variant.comparePrice && variant.price && variant.comparePrice > variant.price),
          })
        })
      }

      // Get translation for current language
      const currentTranslation = product.translations?.find(t => t.locale === selectedLanguage.value);
      
      form.value = {
        name: currentTranslation?.title || '',
        slug: currentTranslation?.slug || '',
        description: currentTranslation?.content || '',
        shortDescription: currentTranslation?.shortDescription || '',
        price: productPrice,
        comparePrice: comparePrice,
        sku: product.sku || '',
        barcode: (product as any).barcode || '',
        published: Boolean(product.published),
        featured: Boolean((product as any).isFeatured),
        taxable: (product as any).taxable === undefined ? true : Boolean((product as any).taxable),
        thumbnail: product.thumbnail || '',
        gallery: Array.isArray(product.gallery) ? product.gallery : [],
        metaDescription: currentTranslation?.metaDescription || '',
        tags: productTags,
        categoryIds: Array.isArray(product.categories) ? product.categories.map(category => category.id) : [],
        hasVariants: Boolean(variants.length > 0),
        variants,
        trackInventory: (product as any).trackInventory === undefined ? true : Boolean((product as any).trackInventory),
        quantity: typeof product.quantity === 'number' ? product.quantity : 0,
        lowStockThreshold: (product as any).lowStockThreshold === undefined ? 5 : Number((product as any).lowStockThreshold),
        stockStatus: (product as any).stockStatus || 'in_stock',
        allowBackorders: (product as any).allowBackorders === undefined ? false : Boolean((product as any).allowBackorders),
        stockMovements: (product as any).stockMovements || [],
        sidebarItems: Array.isArray((product as any).sidebarItems)
          ? (product as any).sidebarItems
              .slice()
              .sort((a: any, b: any) => (a.position ?? 0) - (b.position ?? 0))
              .map((item: any, index: number) => ({
                itemType: item.itemType,
                itemId: item.itemId,
                position: item.position ?? index,
              }))
          : [],
        updatedAt: product.updatedAt,
        translations,
        isContactPrice: isContactPrice
      }
      
      tagsInput.value = form.value.tags.join(', ')
    }
  } catch (error) {
    console.error('Failed to fetch product:', error);
    router.push('/products');
  } finally {
    loading.value = false;
    fetchInProgress = false;
  }
};

// Thêm debounce cho việc cập nhật Product
const debounce = (fn: Function, wait = 300) => {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  
  return (...args: any[]) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => fn(...args), wait);
  };
};

// Cập nhật updateProduct để tránh gọi liên tục và thêm debounce
const updateProduct = debounce(async (continueEditing = false) => {
  if (loading.value) return;
  
  try {
    loading.value = true;
    saveAndContinue.value = continueEditing;

    // Save current content to translations before updating
    form.value.translations[selectedLanguage.value] = {
      name: form.value.name,
      slug: form.value.slug,
      description: form.value.description,
      shortDescription: form.value.shortDescription,
      metaDescription: form.value.metaDescription
    }

    // Prepare translations array for API
    const translations = Object.entries(form.value.translations).map(([locale, content]) => ({
      locale,
      title: content.name,
      slug: content.slug,
      content: content.description,
      shortDescription: content.shortDescription,
      metaDescription: content.metaDescription
    }))

    const updateData: any = {
      price: form.value.price, // Will be null if "Contact for price" is enabled
      comparePrice: form.value.comparePrice,
      sku: form.value.sku,
      thumbnail: form.value.thumbnail,
      gallery: form.value.gallery,
      published: form.value.published,
      quantity: form.value.quantity,
      isFeatured: form.value.featured,
      translations
    }

    // Conditionally add optional fields
    if (typeof form.value.barcode === 'string') {
      updateData.barcode = form.value.barcode
    }
    
    if (typeof form.value.taxable === 'boolean') {
      updateData.taxable = form.value.taxable
    }

    if (Array.isArray(form.value.tags)) {
      updateData.tags = form.value.tags
    }

    if (Array.isArray(form.value.categoryIds)) {
      updateData.categoryIds = form.value.categoryIds
    }

    if (Array.isArray(form.value.sidebarItems)) {
      updateData.sidebarItems = form.value.sidebarItems.map((item, index) => ({
        itemType: item.itemType,
        itemId: item.itemId,
        position: index,
      }))
    }

    if (typeof form.value.hasVariants === 'boolean') {
      updateData.hasVariants = form.value.hasVariants
    }

    // Improved variants handling
    if (Array.isArray(form.value.variants)) {
      console.log(`Preparing ${form.value.variants.length} variants for update`);
      
      updateData.variants = form.value.variants.map(variant => {
        // Convert and validate numeric values
        const variantPrice = variant.price === null || variant.price === undefined ? null : 
          (typeof variant.price === 'string' ? parseFloat(variant.price) || null : Number(variant.price));
          
        const variantComparePrice = variant.comparePrice === null || variant.comparePrice === undefined ? null : 
          (typeof variant.comparePrice === 'string' ? parseFloat(variant.comparePrice) || null : Number(variant.comparePrice));
          
        // Use quantity as primary source, fallback to stock
        let variantQuantity = 0;
        if (variant.quantity !== undefined && variant.quantity !== null) {
          variantQuantity = typeof variant.quantity === 'number' ? variant.quantity : parseInt(String(variant.quantity)) || 0;
        } else if (variant.stock !== undefined && variant.stock !== null) {
          variantQuantity = typeof variant.stock === 'number' ? variant.stock : parseInt(String(variant.stock)) || 0;
        }
        
        console.log(`Preparing variant ${variant.id || 'new'}: Price=${variantPrice}, ComparePrice=${variantComparePrice}, Quantity=${variantQuantity}`);
        
        // Prepare data for variant API with all required fields
        const variantData: any = {
          sku: variant.sku || '',
          price: variantPrice,
          comparePrice: variantComparePrice,
          quantity: variantQuantity,
          published: variant.published !== undefined ? Boolean(variant.published) : true,
          isFeatured: Boolean(variant.isFeatured),
          isNew: Boolean(variant.isNew),
          isSale: Boolean(variantComparePrice && variantPrice && variantComparePrice > variantPrice),
          gallery: Array.isArray(variant.gallery) ? variant.gallery : [],
          thumbnail: variant.thumbnail || '',
          options: variant.options || {}
        };

        // Add ID only for existing variants
        if (variant.id) {
          variantData.id = variant.id;
        }

        // Process translations for variants
        const variantTranslations = [];
        
        // First, try to get name from variant.name
        if (variant.name) {
          variantTranslations.push({
            locale: selectedLanguage.value,
            name: variant.name
          });
        }
        // Fallback to options if name is not available
        else if (variant.options) {
          const optionName = selectedLanguage.value === 'vi' ? 'Loại' : 'Type';
          const optionValue = variant.options[optionName];

          if (optionValue) {
            variantTranslations.push({
              locale: selectedLanguage.value,
              name: optionValue
            });
          }
        }
        
        if (variantTranslations.length > 0) {
          variantData.translations = variantTranslations;
        }

        return variantData;
      });
      
      console.log(`Prepared ${updateData.variants.length} variants for API request`);
      console.log("Sample variant data:", updateData.variants[0]);
    }

    if (typeof form.value.trackInventory === 'boolean') {
      updateData.trackInventory = form.value.trackInventory
    }

    if (typeof form.value.lowStockThreshold === 'number') {
      updateData.lowStockThreshold = form.value.lowStockThreshold
    }

    if (typeof form.value.stockStatus === 'string') {
      updateData.stockStatus = form.value.stockStatus
    }

    if (typeof form.value.allowBackorders === 'boolean') {
      updateData.allowBackorders = form.value.allowBackorders
    }

    // Log entire update data for debugging
    console.log("Final update data being sent to API:", {
      ...updateData,
      variants: updateData.variants ? `${updateData.variants.length} variants` : 'no variants'
    });

    await trpc.admin.products.updateProduct.mutate({
      id: Number(route.params.id),
      data: updateData
    });

    if (process.client) {
      toast.success(t('products.edit.success'));
    }

    if (!continueEditing) {
      router.push('/products');
    } else {
      // Refresh data to get latest state from backend
      await fetchProduct();
    }
  } catch (error: any) {
    console.error('Failed to update product:', error);
    
    // Display detailed error message
    if (process.client) {
      let errorMessage = `[${selectedLanguage.value}] `
      
      // Handle tRPC error with better details
      if (error.cause) {
        errorMessage += error.cause
      } else if (error.message) {
        errorMessage += error.message
      } else {
        errorMessage += t('products.updateError')
      }
      
      // Additional context for variants errors
      if (error.message && error.message.includes('variant')) {
        errorMessage += ` - Kiểm tra lại thông tin variants (SKU, giá, số lượng)`;
      }
      
      toast.error(errorMessage, 8000);
    }
  } finally {
    loading.value = false;
    saveAndContinue.value = false;
  }
}, 500);

// Watch for changes in isContactPrice to update price values
watch(() => form.value.isContactPrice, (newValue) => {
  if (newValue) {
    // Save current price if it's not already contact price
    if (form.value.price !== null) {
      form.value._tempPrice = form.value.price;
      form.value.price = null;
    }
    // Save current compare price if exists
    if (form.value.comparePrice !== null) {
      form.value._tempComparePrice = form.value.comparePrice;
      form.value.comparePrice = null;
    }
  } else {
    // Restore saved price or set to 0
    form.value.price = form.value._tempPrice || 0;
    // Restore saved compare price or keep null
    form.value.comparePrice = form.value._tempComparePrice !== undefined ? 
      form.value._tempComparePrice : null;
    
    // Clear temporary values
    form.value._tempPrice = undefined;
    form.value._tempComparePrice = undefined;
  }
});

// Quill Editor Options
const editorOptions = ref({
  theme: 'snow',
  modules: {}
})

// Initialize editor options on client-side only
if (process.client) {
  editorOptions.value.modules = {
    toolbar: [
      ['bold', 'italic', 'underline', 'strike'],
      ['blockquote', 'code-block'],
      [{ 'header': 1 }, { 'header': 2 }],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'script': 'sub'}, { 'script': 'super' }],
      [{ 'indent': '-1'}, { 'indent': '+1' }],
      [{ 'direction': 'rtl' }],
      [{ 'size': ['small', false, 'large', 'huge'] }],
      [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'font': [] }],
      [{ 'align': [] }],
      ['clean'],
      ['link', 'image']
    ]
  }
}

// Thêm cleanup khi component unmount
onBeforeUnmount(() => {
  // Cleanup để tránh memory leak
  selectedLanguage.value = '';
  form.value = { ...initialForm };
  loading.value = false;
  saveAndContinue.value = false;
});

// Watch cho form.variants để log khi thay đổi - cải thiện logging
watch(() => form.value.variants, (newVariants, oldVariants) => {
  console.log("[id].vue variants changed:");
  console.log("  Old length:", oldVariants?.length || 0);
  console.log("  New length:", newVariants?.length || 0);
  
  if (newVariants && newVariants.length > 0) {
    console.log("  Sample new variant:", {
      id: newVariants[0].id,
      name: newVariants[0].name,
      sku: newVariants[0].sku,
      price: newVariants[0].price,
      comparePrice: newVariants[0].comparePrice,
      stock: newVariants[0].stock,
      quantity: newVariants[0].quantity,
      options: newVariants[0].options
    });
  }
  
  // Count new vs existing variants
  const newVariantsCount = newVariants?.filter(v => !v.id).length || 0;
  const existingVariantsCount = newVariants?.filter(v => v.id).length || 0;
  console.log(`  New variants: ${newVariantsCount}, Existing variants: ${existingVariantsCount}`);
}, { deep: true });

// Hàm xử lý khi variants được cập nhật từ component ProductVariants
const handleVariantsUpdate = (updatedVariants: ProductVariant[]) => {
  console.log("handleVariantsUpdate called with", updatedVariants.length, "variants");
  
  // Validate variants data before updating
  const validatedVariants = updatedVariants.map(variant => {
    // Ensure required fields are present for new variants
    const validatedVariant = {
      ...variant,
      sku: variant.sku || '',
      price: variant.price !== undefined ? variant.price : null,
      comparePrice: variant.comparePrice !== undefined ? variant.comparePrice : null,
      quantity: variant.quantity !== undefined ? variant.quantity : (variant.stock !== undefined ? variant.stock : 0),
      published: variant.published !== undefined ? variant.published : true,
      isFeatured: variant.isFeatured !== undefined ? variant.isFeatured : false,
      isNew: variant.isNew !== undefined ? variant.isNew : false,
      isSale: variant.isSale !== undefined ? variant.isSale : false,
      gallery: Array.isArray(variant.gallery) ? variant.gallery : [],
      thumbnail: variant.thumbnail || '',
      options: variant.options || {},
    };
    
    // Sync stock and quantity
    if (validatedVariant.stock !== undefined && validatedVariant.quantity !== validatedVariant.stock) {
      validatedVariant.quantity = validatedVariant.stock;
    }
    
    return validatedVariant;
  });
  
  // Update form.variants
  form.value.variants = validatedVariants;
  
  console.log("form.variants updated with validated data:", form.value.variants.length, "variants");
};
</script>

<style>
.quill-editor {
  @apply bg-white rounded-lg overflow-hidden;
}

.ql-toolbar {
  @apply border-0 border-b border-slate-200 bg-white px-6 !important;
}

.ql-container {
  @apply border-0 bg-white !important;
}

.ql-editor {
  @apply min-h-[400px] text-slate-700 px-6 !important;
}

.ql-editor h1 {
  @apply text-3xl font-bold mb-4;
}

.ql-editor h2 {
  @apply text-2xl font-semibold mb-3;
}

.ql-editor h3 {
  @apply text-xl font-semibold mb-3;
}

.ql-editor p {
  @apply mb-4 text-base leading-relaxed;
}

.ql-editor ul, .ql-editor ol {
  @apply mb-4 pl-6;
}

.ql-editor ul {
  @apply list-disc;
}

.ql-editor ol {
  @apply list-decimal;
}

.ql-editor blockquote {
  @apply border-l-4 border-slate-200 pl-4 italic my-4;
}

.ql-editor img {
  @apply max-w-full rounded-lg my-4;
}

.ql-editor pre {
  @apply bg-slate-100 p-4 rounded-lg my-4 overflow-x-auto;
}

.ql-editor code {
  @apply font-mono text-sm bg-slate-100 px-1.5 py-0.5 rounded;
}

/* Prose styles for preview */
.prose {
  @apply text-slate-700;
}

.prose h1, .prose h2, .prose h3, .prose h4, .prose h5, .prose h6 {
  @apply text-slate-900 font-semibold mt-8 mb-4;
}

.prose p {
  @apply mb-4;
}

.prose ul, .prose ol {
  @apply mb-4 pl-6;
}

.prose ul {
  @apply list-disc;
}

.prose ol {
  @apply list-decimal;
}

.prose a {
  @apply text-primary hover:text-primary/80;
}

.prose img {
  @apply rounded-lg my-8;
}

.prose blockquote {
  @apply border-l-4 border-slate-200 pl-4 italic my-6;
}

.prose code {
  @apply bg-slate-100 px-1.5 py-0.5 rounded text-sm;
}

.prose pre {
  @apply bg-slate-900 text-slate-50 p-4 rounded-lg my-6 overflow-x-auto;
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
