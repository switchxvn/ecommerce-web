<template>
  <div class="min-h-screen bg-slate-50">
    <!-- Loading State -->
    <div v-if="loading" class="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center">
      <div class="flex flex-col items-center gap-3 p-8 bg-white rounded-lg shadow-xl">
        <div class="relative h-16 w-16">
          <div class="absolute inset-0 rounded-full border-8 border-slate-200"></div>
          <div class="absolute inset-0 rounded-full border-8 border-primary border-r-transparent animate-spin"></div>
        </div>
        <p class="text-lg font-medium text-slate-700">Đang tạo sản phẩm...</p>
        <p class="text-sm text-slate-500">Vui lòng đợi trong giây lát</p>
      </div>
    </div>

    <!-- Content Area -->
    <div v-else class="min-h-screen bg-slate-50">
      <div class="flex-1 overflow-y-auto">
        <div class="space-y-6 pb-10">
          <!-- Header -->
          <PageHeader
            title="Tạo sản phẩm mới"
            description="Thêm sản phẩm mới vào cửa hàng của bạn"
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
                Hủy
              </NuxtLink>
              
              <button 
                @click="createProduct()" 
                :disabled="loading"
                class="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-white hover:bg-primary/90 h-10 px-4 py-2"
              >
                <SaveAllIcon class="w-4 h-4 mr-2" />
                {{ loading ? 'Đang tạo...' : 'Tạo sản phẩm' }}
              </button>
            </template>
          </PageHeader>

          <!-- Tabs -->
          <div class="sticky top-0 z-10 bg-slate-50 pt-2 pb-4">
            <nav class="flex items-center space-x-1 rounded-lg bg-white border border-slate-200 p-1 w-fit shadow-sm">
              <button
                v-for="tab in tabs"
                :key="tab.id"
                @click="tab.id !== 'inventory' || !form.hasVariants ? currentTab = tab.id : null"
                class="flex items-center justify-center gap-2 rounded-md px-4 py-2.5 text-sm font-medium transition-all relative group"
                :class="{
                  'bg-primary text-white shadow-sm': currentTab === tab.id,
                  'text-slate-600 hover:text-slate-900 hover:bg-slate-50': currentTab !== tab.id,
                  'opacity-50 cursor-not-allowed': tab.id === 'inventory' && form.hasVariants
                }"
              >
                <component :is="tab.icon" class="w-4 h-4" />
                {{ tab.name }}
                <div v-if="tab.id === 'inventory' && form.hasVariants" class="absolute left-1/2 transform -translate-x-1/2 bottom-full mb-2 w-64 p-2 bg-slate-900 text-white text-xs rounded shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                  Kho hàng đã bị vô hiệu hóa vì sản phẩm này có biến thể. Vui lòng quản lý kho cho từng biến thể trong tab Biến thể.
                </div>
              </button>
            </nav>
          </div>

          <div class="grid gap-6 px-1">
            <!-- Basic Info Tab -->
            <div v-show="currentTab === 'basic'">
              <div class="mb-6 bg-white rounded-lg shadow-sm p-6">
                <h2 class="text-lg font-medium text-slate-900 mb-1">{{ tabs.find(t => t.id === 'basic')?.name }}</h2>
                <p class="text-sm text-slate-500">{{ tabs.find(t => t.id === 'basic')?.description }}</p>
              </div>
              <ProductEditor
                v-model:name="form.name"
                v-model:slug="form.slug"
                v-model:description="form.description"
                v-model:shortDescription="form.shortDescription"
                v-model:price="form.price"
                v-model:compareAtPrice="form.compareAtPrice"
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
              <div class="mb-6 bg-white rounded-lg shadow-sm p-6">
                <h2 class="text-lg font-medium text-slate-900 mb-1">{{ tabs.find(t => t.id === 'media')?.name }}</h2>
                <p class="text-sm text-slate-500">{{ tabs.find(t => t.id === 'media')?.description }}</p>
              </div>
              <ProductMedia
                v-model:thumbnail="form.thumbnail"
                v-model:gallery="form.gallery"
                v-model:videoUrl="form.videoReview"
              />
            </div>

            <!-- Categories Tab -->
            <div v-show="currentTab === 'categories'">
              <div class="mb-6 bg-white rounded-lg shadow-sm p-6">
                <h2 class="text-lg font-medium text-slate-900 mb-1">{{ tabs.find(t => t.id === 'categories')?.name }}</h2>
                <p class="text-sm text-slate-500">{{ tabs.find(t => t.id === 'categories')?.description }}</p>
              </div>
              <ProductCategories
                v-model="form.categoryIds"
              />
            </div>

            <!-- Variants Tab -->
            <div v-show="currentTab === 'variants'">
              <div class="mb-6 bg-white rounded-lg shadow-sm p-6">
                <h2 class="text-lg font-medium text-slate-900 mb-1">{{ tabs.find(t => t.id === 'variants')?.name }}</h2>
                <p class="text-sm text-slate-500">{{ tabs.find(t => t.id === 'variants')?.description }}</p>
              </div>
              <ProductVariants
                v-model="form.variants"
                v-model:hasVariants="form.hasVariants"
              />
            </div>

            <!-- Specifications Tab -->
            <div v-show="currentTab === 'specifications'">
              <div class="mb-6 bg-white rounded-lg shadow-sm p-6">
                <h2 class="text-lg font-medium text-slate-900 mb-1">{{ tabs.find(t => t.id === 'specifications')?.name }}</h2>
                <p class="text-sm text-slate-500">{{ tabs.find(t => t.id === 'specifications')?.description }}</p>
              </div>
              <div class="bg-white rounded-lg shadow-sm p-6 space-y-6">
                <ProductSpecificationsNew
                  v-model="form.specifications"
                  :selectedLanguage="selectedLanguage"
                />
              </div>
            </div>

            <!-- Inventory Tab -->
            <div v-show="currentTab === 'inventory'">
              <div class="mb-6 bg-white rounded-lg shadow-sm p-6">
                <h2 class="text-lg font-medium text-slate-900 mb-1">{{ tabs.find(t => t.id === 'inventory')?.name }}</h2>
                <p class="text-sm text-slate-500">{{ tabs.find(t => t.id === 'inventory')?.description }}</p>
              </div>
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
                  <p><span class="font-medium">Thông báo:</span> Quản lý số lượng đã bị vô hiệu hóa vì sản phẩm này có biến thể.</p>
                  <p>Số lượng được quản lý riêng cho từng biến thể trong <button @click="currentTab = 'variants'" class="underline font-medium hover:text-blue-900">tab Biến thể</button>.</p>
                </div>
              </div>
            </div>

            <!-- Tier Pricing Tab -->
            <div v-show="currentTab === 'tier_pricing'">
              <div class="mb-6 bg-white rounded-lg shadow-sm p-6">
                <h2 class="text-lg font-medium text-slate-900 mb-1">{{ tabs.find(t => t.id === 'tier_pricing')?.name }}</h2>
                <p class="text-sm text-slate-500">{{ tabs.find(t => t.id === 'tier_pricing')?.description }}</p>
              </div>
              <ProductTierDiscounts
                :isNewProduct="true"
              />
            </div>

            <div v-show="currentTab === 'sidebar'">
              <div class="mb-6 bg-white rounded-lg shadow-sm p-6">
                <h2 class="text-lg font-medium text-slate-900 mb-1">{{ tabs.find(t => t.id === 'sidebar')?.name }}</h2>
                <p class="text-sm text-slate-500">{{ tabs.find(t => t.id === 'sidebar')?.description }}</p>
              </div>
              <ProductSidebarItems
                v-model="form.sidebarItems"
                :locale="selectedLanguage"
              />
            </div>

            <!-- SEO Tab -->
            <div v-show="currentTab === 'seo'">
              <div class="mb-6 bg-white rounded-lg shadow-sm p-6">
                <h2 class="text-lg font-medium text-slate-900 mb-1">{{ tabs.find(t => t.id === 'seo')?.name }}</h2>
                <p class="text-sm text-slate-500">{{ tabs.find(t => t.id === 'seo')?.description }}</p>
              </div>
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
              <div class="mb-6 bg-white rounded-lg shadow-sm p-6">
                <h2 class="text-lg font-medium text-slate-900 mb-1">{{ tabs.find(t => t.id === 'settings')?.name }}</h2>
                <p class="text-sm text-slate-500">{{ tabs.find(t => t.id === 'settings')?.description }}</p>
              </div>
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
import { ref, onMounted, watch, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useTrpc } from '../../composables/useTrpc'
import slugify from 'slugify'
import { useHead, useNuxtApp } from 'nuxt/app'
import { useToast } from '../../composables/useToast'

// Import Lucide icons
import {
  FileTextIcon,
  ImageIcon,
  SearchIcon,
  SettingsIcon,
  XIcon,
  SaveAllIcon,
  ChevronDownIcon,
  CheckIcon,
  SaveIcon,
  FolderIcon,
  LayersIcon,
  PackageIcon,
  InfoIcon,
  ClipboardListIcon,
  PercentIcon
} from 'lucide-vue-next'

// Import components
import PageHeader from '../../components/common/header/PageHeader.vue'
import ProductEditor from '../../components/products/ProductEditor.vue'
import ProductMedia from '../../components/products/ProductMedia.vue'
import ProductSEO from '../../components/products/ProductSEO.vue'
import ProductSettings from '../../components/products/ProductSettings.vue'
import ProductCategories from '../../components/products/ProductCategories.vue'
import ProductVariants from '../../components/products/ProductVariants.vue'
import ProductInventory from '../../components/products/ProductInventory.vue'
import ProductSpecifications from '../../components/products/ProductSpecifications.vue'
import ProductSpecificationsNew from '../../components/products/ProductSpecificationsNew.vue'
import LanguageSwitcher from '../../components/common/LanguageSwitcher.vue'
import ProductTierDiscounts from '../../components/products/ProductTierDiscounts.vue'
import ProductSidebarItems from '../../components/products/ProductSidebarItems.vue'

const trpc = useTrpc()
const route = useRoute()
const router = useRouter()
const nuxtApp = useNuxtApp()
const loading = ref(false)

// Modify the toast import to use CommonJS default export pattern
const toast = useToast()

// Initialize currentTab
// Initialize currentTab from query params or default to 'basic'
const currentTab = ref(route.query.tab?.toString() || 'basic')

// Watch for tab changes and update URL
watch(currentTab, (newTab) => {
  router.replace({ 
    query: { 
      ...route.query,
      tab: newTab 
    }
  })
})

const tabs = [
  { 
    id: 'basic', 
    name: 'Thông tin cơ bản', 
    icon: FileTextIcon,
    description: 'Thông tin chung về sản phẩm'
  },
  { 
    id: 'media', 
    name: 'Hình ảnh', 
    icon: ImageIcon,
    description: 'Quản lý ảnh và video sản phẩm'
  },
  {
    id: 'categories',
    name: 'Danh mục',
    icon: FolderIcon,
    description: 'Phân loại sản phẩm vào danh mục'
  },
  {
    id: 'variants',
    name: 'Biến thể',
    icon: LayersIcon,
    description: 'Tạo các phiên bản khác nhau của sản phẩm'
  },
  {
    id: 'specifications',
    name: 'Thông số kỹ thuật',
    icon: ClipboardListIcon,
    description: 'Các thông số chi tiết của sản phẩm'
  },
  {
    id: 'inventory',
    name: 'Kho hàng',
    icon: PackageIcon,
    description: 'Quản lý số lượng và tình trạng kho'
  },
  {
    id: 'tier_pricing',
    name: 'Giá theo bậc',
    icon: PercentIcon,
    description: 'Thiết lập giảm giá theo số lượng mua'
  },
  {
    id: 'sidebar',
    name: 'Sidebar',
    icon: InfoIcon,
    description: 'Cấu hình tin tức hoặc dịch vụ hiển thị ở sidebar trang chi tiết'
  },
  { 
    id: 'seo', 
    name: 'SEO', 
    icon: SearchIcon,
    description: 'Tối ưu hóa cho công cụ tìm kiếm'
  },
  { 
    id: 'settings', 
    name: 'Cài đặt', 
    icon: SettingsIcon,
    description: 'Cấu hình và thiết lập cho sản phẩm'
  }
]

interface ProductVariant {
  id?: number
  name: string
  sku: string
  barcode: string
  price: number | null
  compareAtPrice: number | null
  quantity: number
  stock: number
  options: Record<string, string>
}

interface ProductForm {
  name: string
  slug: string
  description: string
  shortDescription: string
  price: number | null
  compareAtPrice: number | null
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
  sidebarItems: Array<{ itemType: 'post' | 'service', itemId: number, position: number }>
  updatedAt: string
  specifications: Array<{name: string, value: string, position: number, isNew?: boolean}>
  videoReview: string
  translations: Record<string, {
    name: string
    slug: string
    description: string
    shortDescription: string
    metaDescription: string
  }>
  isContactPrice: boolean
  _tempPrice?: number
  _tempCompareAtPrice?: number | null
  tierPricing: Array<{quantity: number, price: number}>
}

const initialForm: ProductForm = {
  name: '',
  slug: '',
  description: '',
  shortDescription: '',
  price: 0,
  compareAtPrice: null,
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
  specifications: [],
  videoReview: '',
  updatedAt: new Date().toISOString(),
  translations: {},
  isContactPrice: false,
  tierPricing: []
}

const form = ref({ ...initialForm })
const tagsInput = ref('')

// Update page title
useHead({
  title: 'Create Product - Admin Dashboard'
})

// Initialize selectedLanguage
const selectedLanguage = ref('')
const defaultLanguage = ref('')

// Handle language change
const handleLanguageChange = (code: string) => {
  // Lưu translations hiện tại trước khi chuyển ngôn ngữ
  if (selectedLanguage.value && form.value.name !== undefined) {
    form.value.translations[selectedLanguage.value] = {
      name: form.value.name,
      slug: form.value.slug,
      description: form.value.description,
      shortDescription: form.value.shortDescription,
      metaDescription: form.value.metaDescription
    }
  }
  
  // Cập nhật selectedLanguage
  selectedLanguage.value = code;
  
  // Kiểm tra xem đã có dữ liệu cho ngôn ngữ mới chưa
  if (form.value.translations[code]) {
    // Nếu có, cập nhật form với dữ liệu từ translations
    const translation = form.value.translations[code];
    form.value.name = translation.name || '';
    form.value.slug = translation.slug || '';
    form.value.description = translation.description || '';
    form.value.shortDescription = translation.shortDescription || '';
    form.value.metaDescription = translation.metaDescription || '';
  } else {
    // Nếu chưa có, reset form để nhập mới
    form.value.name = '';
    form.value.slug = '';
    form.value.description = '';
    form.value.shortDescription = '';
    form.value.metaDescription = '';
  }
}

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

// Watch name changes to suggest slug
watch(() => form.value.name, (newName) => {
  if (newName) {
    generateSlug()
  }
})

onMounted(async () => {
  try {
    // Lấy ngôn ngữ mặc định từ hệ thống
    const defaultLang = await trpc.admin.languages.getDefaultLanguage.query()
    selectedLanguage.value = defaultLang?.code || 'en'
    defaultLanguage.value = defaultLang?.code || 'en'
    
    // Cập nhật tab từ query parameter nếu có
    if (route.query.tab) {
      const tabId = route.query.tab.toString()
      // Kiểm tra nếu tab tồn tại trong danh sách tabs
      if (tabs.some(tab => tab.id === tabId)) {
        currentTab.value = tabId
      }
    }
  } catch (error) {
    console.error('Failed to fetch default language:', error)
    selectedLanguage.value = 'en' // Fallback nếu không lấy được ngôn ngữ mặc định
  }
})

// Create product
const createProduct = async () => {
  try {
    loading.value = true

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

    // Chuẩn bị dữ liệu sản phẩm theo schema API
    const productData: any = {
      sku: form.value.sku,
      price: form.value.price, // Đã là null khi Giá liên hệ được bật
      comparePrice: form.value.compareAtPrice,
      thumbnail: form.value.thumbnail,
      gallery: form.value.gallery,
      published: form.value.published,
      quantity: form.value.hasVariants ? 0 : form.value.quantity,
      isFeatured: form.value.featured,
      translations
    }

    // Thêm các trường tùy chọn nếu có
    if (form.value.categoryIds && form.value.categoryIds.length > 0) {
      productData.categoryIds = form.value.categoryIds
    }

    if (form.value.sidebarItems.length > 0) {
      productData.sidebarItems = form.value.sidebarItems.map((item, index) => ({
        itemType: item.itemType,
        itemId: item.itemId,
        position: index
      }))
    }

    // Thêm trường specifications nếu có
    if (form.value.specifications && form.value.specifications.length > 0) {
      productData.specifications = form.value.specifications.map(spec => ({
        name: spec.name,
        value: spec.value,
        position: spec.position,
        locale: selectedLanguage.value
      }))
    }

    // Xử lý variants nếu product có variants
    if (form.value.hasVariants && form.value.variants.length > 0) {
      // API mong đợi variants là một mảng của ProductVariant entities
      productData.variants = form.value.variants.map(variant => {
        // Chuẩn bị dữ liệu cho variant
        const variantData: any = {
          sku: variant.sku,
          price: variant.price, // Đã là null khi Giá liên hệ được bật cho variant
          comparePrice: variant.compareAtPrice,
          quantity: variant.quantity || variant.stock || 0
        }

        // Xử lý translations dựa trên options
        const optionName = selectedLanguage.value === 'vi' ? 'Loại' : 'Type'
        const optionValue = variant.options[optionName] || variant.name

        // Thêm translations nếu có giá trị
        if (optionValue) {
          variantData.translations = [
            {
              locale: selectedLanguage.value,
              name: optionValue
            }
          ]
        }

        return variantData
      })
    }

    // Gọi API tạo sản phẩm
    await trpc.admin.products.createProduct.mutate(productData)

    if (process.client) {
      toast.success('Product created successfully!')
    }
    router.push('/products')
  } catch (error: any) {
    console.error('Failed to create product:', error)
    
    // Hiển thị thông báo lỗi với ngôn ngữ hiện tại
    if (process.client) {
      let errorMessage = `[${selectedLanguage.value}] `
      
      // Handle tRPC error
      if (error.cause) {
        errorMessage += error.cause
      } else if (error.message) {
        errorMessage += error.message
      } else {
        errorMessage += 'Failed to create product. Please try again.'
      }
      
      toast.error(errorMessage, 8000)
    }
  } finally {
    loading.value = false
  }
}

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

// Theo dõi sự thay đổi của isContactPrice để cập nhật giá
watch(() => form.value.isContactPrice, (newValue) => {
  if (newValue) {
    // Lưu giá hiện tại nếu nó không phải là giá liên hệ
    if (form.value.price !== null) {
      form.value._tempPrice = form.value.price;
      form.value.price = null;
    }
    // Lưu giá so sánh hiện tại nếu có
    if (form.value.compareAtPrice !== null) {
      form.value._tempCompareAtPrice = form.value.compareAtPrice;
      form.value.compareAtPrice = null;
    }
  } else {
    // Khôi phục giá đã lưu hoặc đặt thành 0
    form.value.price = form.value._tempPrice || 0;
    // Khôi phục giá so sánh đã lưu hoặc giữ nguyên null
    form.value.compareAtPrice = form.value._tempCompareAtPrice !== undefined ? 
      form.value._tempCompareAtPrice : null;
    
    // Xóa các giá trị tạm thời
    form.value._tempPrice = undefined;
    form.value._tempCompareAtPrice = undefined;
  }
});
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
