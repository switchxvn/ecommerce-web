<script setup lang="ts">
import { ref, reactive, computed, onMounted, provide, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useTrpc } from '../../../../composables/useTrpc'
import { useToast } from '../../../../composables/useToast'
import { 
  Layout, 
  Eye, 
  Settings, 
  Palette, 
  LayoutPanelLeft,
  Type,
  FileTextIcon,
  SearchIcon,
  Settings2,
  ImageIcon,
  PanelLeft,
  LayoutGrid,
} from 'lucide-vue-next'
import { PageType, ThemeSection } from '@ew/shared'
import PageHeader from '../../../../components/common/header/PageHeader.vue'
import MediaUploader from '../../../../components/common/media/MediaUploader.vue'

// Route
const route = useRoute()
const router = useRouter()
const trpc = useTrpc()
const toast = useToast()

// Page title
provide('pageTitle', computed(() => section.value ? `Chỉnh sửa Section: ${section.value.title}` : 'Chỉnh sửa Section'))

// URL params
const themeId = computed(() => {
  // Lấy theme ID từ params, đảm bảo luôn là số hợp lệ
  const id = Number(route.params.id);
  
  // Fallback xử lý nếu id không hợp lệ - redirect về trang themes
  if (isNaN(id) || id <= 0) {
    console.error('Invalid theme ID:', id);
    // Xử lý trong onMounted để tránh lỗi trong quá trình render
    setTimeout(() => {
      toast.error('ID theme không hợp lệ');
      router.push('/themes');
    }, 100);
    return 0;
  }
  
  return id;
});

const sectionId = computed(() => {
  // Lấy section ID từ tham số URL
  const id = Number(route.params.sectionId);
  return id;
});

// State
const section = ref<ThemeSection | null>(null)
const loading = ref(true)
const isSubmitting = ref(false)
const error = ref<string | null>(null)

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

// Define tabs
const tabs = [
  { 
    id: 'basic', 
    name: 'Thông tin cơ bản', 
    icon: FileTextIcon
  },
  { 
    id: 'settings', 
    name: 'Cài đặt Section', 
    icon: Settings2
  },
  { 
    id: 'layout', 
    name: 'Bố cục', 
    icon: LayoutGrid
  },
  { 
    id: 'styles', 
    name: 'Giao diện', 
    icon: Palette
  },
  { 
    id: 'preview', 
    name: 'Xem trước', 
    icon: Eye
  }
]

// Settings editor mode
const settingsEditorMode = ref<'json' | 'form'>('form')

// Form data
const sectionForm = reactive({
  title: '',
  type: '',
  componentName: '',
  pageType: 'home_page' as PageType,
  order: 0,
  isActive: true,
  settings: {} as Record<string, any>
})

// JSON settings string for raw editor
const jsonSettingsString = ref('{}')

// Parse and stringify JSON
const parseJsonSettings = () => {
  try {
    sectionForm.settings = JSON.parse(jsonSettingsString.value)
    return true
  } catch (err) {
    toast.error('JSON không hợp lệ. Vui lòng kiểm tra lại.')
    console.error('Invalid JSON settings:', err)
    return false
  }
}

const stringifyJsonSettings = () => {
  try {
    jsonSettingsString.value = JSON.stringify(sectionForm.settings, null, 2)
  } catch (err) {
    console.error('Failed to stringify settings:', err)
    jsonSettingsString.value = '{}'
  }
}

// Watch for changes in settings and update JSON string
watch(() => sectionForm.settings, () => {
  if (settingsEditorMode.value === 'json') {
    stringifyJsonSettings()
  }
}, { deep: true })

// Helper for ensuring nested object paths exist
const ensureNestedPath = (obj: Record<string, any>, path: string) => {
  const keys = path.split('.')
  let current = obj
  
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i]
    if (current[key] === undefined) {
      current[key] = {}
    }
    current = current[key]
  }
  
  return current
}

// Initialize nested settings objects
const initializeNestedSettings = () => {
  if (!sectionForm.settings.padding) sectionForm.settings.padding = {}
  if (!sectionForm.settings.alignment) sectionForm.settings.alignment = {}
  if (!sectionForm.settings.background) sectionForm.settings.background = {}
  if (!sectionForm.settings.colors) sectionForm.settings.colors = {}
  if (!sectionForm.settings.fontSize) sectionForm.settings.fontSize = {}
  
  // Initialize card settings
  if (!sectionForm.settings.card) sectionForm.settings.card = {}
  if (!sectionForm.settings.card.overlay) sectionForm.settings.card.overlay = { show: false }
  if (!sectionForm.settings.card.overlay.content) sectionForm.settings.card.overlay.content = {}
  
  // Initialize columns settings
  if (!sectionForm.settings.columns) sectionForm.settings.columns = { lg: 3, md: 2, sm: 1, xl: 4 }
  
  // Initialize load more button settings
  if (!sectionForm.settings.loadMoreButton) sectionForm.settings.loadMoreButton = { show: false }
}

// Watch for settings type change and initialize nested objects
watch(() => sectionForm.type, () => {
  initializeNestedSettings()
})

// Fetch section data
const fetchSection = async () => {
  loading.value = true
  error.value = null
  
  if (!themeId.value || themeId.value <= 0) {
    console.error('Invalid theme ID, cannot fetch section');
    error.value = 'ID theme không hợp lệ';
    loading.value = false;
    return;
  }
  
  try {
    const data = await trpc.admin.themeSection.getById.query({
      themeId: themeId.value,
      sectionId: sectionId.value
    })
    section.value = data
    
    // Copy data to form
    sectionForm.title = data.title
    sectionForm.type = data.type
    sectionForm.componentName = data.componentName || ''
    sectionForm.pageType = data.pageType
    sectionForm.order = data.order
    sectionForm.isActive = data.isActive
    sectionForm.settings = data.settings || {}
    
    // Initialize nested settings objects
    initializeNestedSettings()
    normalizeServiceSectionSettings()
    
    // Initialize JSON string
    stringifyJsonSettings()
  } catch (err: any) {
    console.error('Failed to fetch section:', err)
    error.value = err.message || 'Không thể tải thông tin section'
    toast.error('Không thể tải thông tin section')
  } finally {
    loading.value = false
  }
}

// Save section
const saveSection = async () => {
  isSubmitting.value = true
  
  // If in JSON mode, parse the JSON first
  if (settingsEditorMode.value === 'json') {
    if (!parseJsonSettings()) {
      isSubmitting.value = false
      return
    }
  }
  
  try {
    await trpc.admin.themeSection.update.mutate({
      themeId: themeId.value,
      sectionId: sectionId.value,
      data: {
        title: sectionForm.title,
        type: sectionForm.type,
        componentName: sectionForm.componentName || undefined,
        pageType: sectionForm.pageType,
        order: sectionForm.order,
        isActive: sectionForm.isActive,
        settings: sectionForm.settings
      }
    })
    
    toast.success('Cập nhật section thành công')
    
    // Re-fetch section data instead of navigating away
    fetchSection()
  } catch (err: any) {
    console.error('Failed to update section:', err)
    toast.error('Không thể cập nhật section')
  } finally {
    isSubmitting.value = false
  }
}

// Save and back to list
const saveAndBack = async () => {
  isSubmitting.value = true
  
  // If in JSON mode, parse the JSON first
  if (settingsEditorMode.value === 'json') {
    if (!parseJsonSettings()) {
      isSubmitting.value = false
      return
    }
  }
  
  try {
    await trpc.admin.themeSection.update.mutate({
      themeId: themeId.value,
      sectionId: sectionId.value,
      data: {
        title: sectionForm.title,
        type: sectionForm.type,
        componentName: sectionForm.componentName || undefined,
        pageType: sectionForm.pageType,
        order: sectionForm.order,
        isActive: sectionForm.isActive,
        settings: sectionForm.settings
      }
    })
    
    toast.success('Cập nhật section thành công')
    
    // Navigate back to sections list
    navigateToSections()
  } catch (err: any) {
    console.error('Failed to update section:', err)
    toast.error('Không thể cập nhật section')
  } finally {
    isSubmitting.value = false
  }
}

// Delete section
const deleteSection = async () => {
  try {
    await trpc.admin.themeSection.delete.mutate({
      themeId: themeId.value,
      sectionId: sectionId.value
    })
    
    toast.success('Xóa section thành công')
    navigateToSections()
  } catch (err: any) {
    console.error('Failed to delete section:', err)
    toast.error('Không thể xóa section')
  }
}

// Format date
const formatDate = (date: Date | string) => {
  return new Date(date).toLocaleDateString('vi-VN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// Get page type options
const pageTypeOptions = [
  { value: 'home_page', label: 'Trang chủ' },
  { value: 'product_page', label: 'Trang sản phẩm' },
  { value: 'news_page', label: 'Trang tin tức' },
  { value: 'about_page', label: 'Trang giới thiệu' },
  { value: 'service_page', label: 'Trang dịch vụ' },
  { value: 'contact_page', label: 'Trang liên hệ' },
  { value: 'common', label: 'Chung' }
]

// Get section type options
const sectionTypeOptions = [
  { value: 'hero', label: 'Hero Banner' },
  { value: 'featured_products', label: 'Sản phẩm nổi bật' },
  { value: 'feature_services', label: 'Dịch vụ xe nâng hàng' },
  { value: 'category_grid', label: 'Lưới danh mục' },
  { value: 'testimonials', label: 'Đánh giá khách hàng' },
  { value: 'about', label: 'Giới thiệu' },
  { value: 'services', label: 'Dịch vụ' },
  { value: 'contact', label: 'Liên hệ' },
  { value: 'cta', label: 'Call-to-Action' },
  { value: 'faq', label: 'Câu hỏi thường gặp' },
  { value: 'features', label: 'Tính năng' },
  { value: 'gallery', label: 'Thư viện ảnh' },
  { value: 'newsletter', label: 'Đăng ký nhận tin' },
  { value: 'custom', label: 'Tùy chỉnh' }
]

// Layout options
const layoutOptions = [
  { value: 'grid', label: 'Lưới' },
  { value: 'list', label: 'Danh sách' },
  { value: 'slider', label: 'Trượt ngang' },
  { value: 'masonry', label: 'Xếp chồng' },
  { value: 'carousel', label: 'Băng chuyền' }
]

// Boolean options
const booleanOptions = [
  { value: true, label: 'Có' },
  { value: false, label: 'Không' }
]

// Font size options
const fontSizeOptions = [
  { value: 'text-xs', label: 'Rất nhỏ' },
  { value: 'text-sm', label: 'Nhỏ' },
  { value: 'text-base', label: 'Thường' },
  { value: 'text-lg', label: 'Lớn' },
  { value: 'text-xl', label: 'Rất lớn' },
  { value: 'text-2xl', label: 'Cực lớn' },
  { value: 'text-3xl', label: 'Siêu lớn' },
  { value: 'text-4xl', label: 'Khổng lồ' }
]

// Alignment options
const alignmentOptions = [
  { value: 'justify-start', label: 'Trái' },
  { value: 'justify-center', label: 'Giữa' },
  { value: 'justify-end', label: 'Phải' },
  { value: 'justify-between', label: 'Căn đều' },
  { value: 'justify-around', label: 'Xung quanh' },
  { value: 'justify-evenly', label: 'Đều nhau' }
]

// Column options
const columnOptions = [
  { value: 1, label: '1 cột' },
  { value: 2, label: '2 cột' },
  { value: 3, label: '3 cột' },
  { value: 4, label: '4 cột' },
  { value: 6, label: '6 cột' },
  { value: 8, label: '8 cột' },
  { value: 12, label: '12 cột' }
]

// Display mode options
const displayModeOptions = [
  { value: 'grid', label: 'Lưới' },
  { value: 'list', label: 'Danh sách' },
  { value: 'carousel', label: 'Băng chuyền' }
]

// Get section type label
const getSectionTypeLabel = (type: string) => {
  const option = sectionTypeOptions.find(opt => opt.value === type)
  return option ? option.label : type
}

// Helper for deep object access
const getNestedValue = (obj: any, path: string) => {
  const keys = path.split('.')
  return keys.reduce((o, key) => (o || {})[key], obj) ?? null
}

const setNestedValue = (obj: any, path: string, value: any) => {
  const keys = path.split('.')
  const lastKey = keys.pop()
  
  if (!lastKey) return
  
  const target = keys.reduce((o, key) => {
    if (o[key] === undefined) {
      o[key] = {}
    }
    return o[key]
  }, obj)
  
  target[lastKey] = value
}

const normalizeServiceSectionSettings = () => {
  const isServiceType = sectionForm.type === 'services' || sectionForm.type === 'feature_services'
  if (!isServiceType) return

  if (!Array.isArray(sectionForm.settings.services)) {
    sectionForm.settings.services = []
  }

  sectionForm.settings.services = sectionForm.settings.services.map((service: Record<string, any>) => ({
    ...service,
    title: service?.title || '',
    icon: service?.icon || '',
    link: service?.link || '/',
  }))
}

// Load data on mount
onMounted(() => {
  fetchSection()
})

watch(() => sectionForm.type, () => {
  normalizeServiceSectionSettings()
}, { immediate: true })

// Navigate back to sections list
const navigateToSections = () => {
  const id = themeId.value || 0;
  if (id <= 0) {
    console.warn('Invalid theme ID, navigating to themes list');
    router.push('/themes');
    return;
  }
  console.log(`Navigating to sections list: /themes/${id}/sections`);
  router.push(`/themes/${id}/sections`);
};

// Navigate back to theme detail
const navigateToTheme = () => {
  const id = themeId.value || 0;
  if (id <= 0) {
    console.warn('Invalid theme ID, navigating to themes list');
    router.push('/themes');
    return;
  }
  console.log(`Navigating to theme detail: /themes/${id}`);
  router.push(`/themes/${id}`);
};
</script>

<template>
  <div>
    <PageHeader
      :title="section ? section.title : 'Chỉnh sửa Section'"
      description="Chỉnh sửa thông tin và cài đặt của section"
    >
      <template #actions>
        <!-- Status badge display -->
        <div v-if="section && !loading" class="mr-2">
          <UBadge
            :color="section.isActive ? 'green' : 'gray'"
            variant="soft"
            size="md"
          >
            {{ section.isActive ? 'Hiển thị' : 'Ẩn' }}
          </UBadge>
        </div>
        
        <UButton
          color="gray"
          variant="soft"
          icon="i-heroicons-arrow-left"
          @click="navigateToSections"
        >
          Quay lại danh sách
        </UButton>
        
        <UButton
          color="gray"
          variant="soft"
          @click="saveSection"
          :loading="isSubmitting"
          :disabled="isSubmitting"
        >
          <div class="flex items-center">
            <i class="i-heroicons-document-check mr-1"></i>
            Lưu & Tiếp tục
          </div>
        </UButton>
        
        <UButton
          color="primary"
          @click="saveAndBack"
          :loading="isSubmitting"
          :disabled="isSubmitting"
        >
          <div class="flex items-center">
            <i class="i-heroicons-check mr-1"></i>
            Lưu & Quay lại
          </div>
        </UButton>
      </template>
    </PageHeader>
    
    <!-- Status badge display -->
    <div v-if="section && !loading" class="mb-6 flex items-center">
    </div>
    
    <!-- Loading state -->
    <div v-if="loading" class="flex items-center justify-center py-20">
      <ULoading class="w-8 h-8 text-primary-500" />
      <span class="ml-2 text-gray-600 dark:text-gray-400">Đang tải dữ liệu...</span>
    </div>
    
    <!-- Error state -->
    <UCard v-else-if="error" class="p-4 bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-900/50">
      <div class="flex items-center text-red-600 dark:text-red-400">
        <i class="i-heroicons-exclamation-circle mr-2 text-xl"></i>
        <span>{{ error }}</span>
      </div>
      <UButton color="gray" variant="ghost" class="mt-2" @click="fetchSection">
        Thử lại
      </UButton>
    </UCard>
    
    <!-- Main content area -->
    <div v-else-if="section">
      <!-- Tabs Navigation -->
      <nav class="flex items-center space-x-1 rounded-lg bg-white border border-slate-200 p-1 w-fit mb-6">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          @click="currentTab = tab.id"
          class="flex items-center justify-center gap-2 rounded-md px-4 py-2.5 text-sm font-medium transition-all relative"
          :class="{
            'bg-primary text-white': currentTab === tab.id,
            'text-slate-600 hover:text-slate-900 hover:bg-slate-50': currentTab !== tab.id
          }"
        >
          <component :is="tab.icon" class="w-4 h-4" />
          {{ tab.name }}
        </button>
      </nav>
      
      <!-- Section form -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        <!-- Form -->
        <div class="lg:col-span-2">
          <!-- Tab Content -->
          <div class="grid gap-6">
            <!-- Basic Info Tab -->
            <div v-show="currentTab === 'basic'">
              <UCard>
                <form @submit.prevent="saveSection" class="space-y-6">
                  <!-- Title -->
                  <UFormGroup label="Tiêu đề" required>
                    <UInput
                      v-model="sectionForm.title"
                      placeholder="Nhập tiêu đề cho section"
                    />
                  </UFormGroup>
                  
                  <!-- Section Type -->
                  <UFormGroup label="Loại Section" required>
                    <USelect
                      v-model="sectionForm.type"
                      :options="sectionTypeOptions"
                      option-attribute="label"
                      value-attribute="value"
                      placeholder="Chọn loại section"
                    />
                  </UFormGroup>
                  
                  <!-- Component Name -->
                  <UFormGroup label="Tên Component" help="Tên component sẽ được sử dụng để render section này">
                    <UInput
                      v-model="sectionForm.componentName"
                      placeholder="Ví dụ: HeroSection, ProductsGrid, ..."
                    />
                  </UFormGroup>
                  
                  <!-- Page Type -->
                  <UFormGroup label="Thuộc trang" required>
                    <USelect
                      v-model="sectionForm.pageType"
                      :options="pageTypeOptions"
                      option-attribute="label"
                      value-attribute="value"
                      placeholder="Chọn trang để hiển thị section này"
                    />
                  </UFormGroup>
                  
                  <!-- Order -->
                  <UFormGroup label="Thứ tự" help="Thứ tự hiển thị của section trong trang">
                    <UInput
                      v-model.number="sectionForm.order"
                      type="number"
                      min="0"
                      placeholder="Thứ tự hiển thị"
                    />
                  </UFormGroup>
                  
                  <!-- Active Status -->
                  <UFormGroup>
                    <UToggle
                      v-model="sectionForm.isActive"
                      label="Hiển thị section này"
                      color="primary"
                    />
                  </UFormGroup>
                </form>
              </UCard>
            </div>

            <!-- Settings Tab -->
            <div v-show="currentTab === 'settings'">
              <UCard>
                <!-- Editor type switcher -->
                <div class="mb-4">
                  <UButtonGroup>
                    <UButton
                      :color="settingsEditorMode === 'form' ? 'primary' : 'gray'"
                      :variant="settingsEditorMode === 'form' ? 'solid' : 'soft'"
                      @click="settingsEditorMode = 'form'"
                    >
                      <Settings class="w-4 h-4 mr-1" />
                      Giao diện
                    </UButton>
                    <UButton
                      :color="settingsEditorMode === 'json' ? 'primary' : 'gray'"
                      :variant="settingsEditorMode === 'json' ? 'solid' : 'soft'"
                      @click="settingsEditorMode = 'json'; stringifyJsonSettings()"
                    >
                      <code class="text-xs mr-1">{ }</code>
                      JSON
                    </UButton>
                  </UButtonGroup>
                </div>
                
                <!-- JSON Editor -->
                <div v-if="settingsEditorMode === 'json'" class="space-y-4">
                  <UFormGroup label="Cài đặt JSON" help="Nhập cấu hình JSON cho section này">
                    <UTextarea
                      v-model="jsonSettingsString"
                      placeholder='{}'
                      rows="20"
                      class="font-mono text-sm"
                    />
                  </UFormGroup>
                </div>
                
                <!-- Form editor - varies by section type -->
                <div v-else class="space-y-6">
                  <!-- Featured Products Section Settings -->
                  <div v-if="sectionForm.type === 'featured_products'" class="space-y-4">
                    <h3 class="text-lg font-medium">Cài đặt Sản phẩm nổi bật</h3>
                    
                    <!-- Layout -->
                    <UFormGroup label="Kiểu hiển thị">
                      <USelect
                        v-model="sectionForm.settings.layout"
                        :options="layoutOptions"
                        option-attribute="label"
                        value-attribute="value"
                        placeholder="Chọn kiểu hiển thị"
                      />
                    </UFormGroup>
                    
                    <!-- Max items -->
                    <UFormGroup label="Số lượng sản phẩm tối đa">
                      <UInput
                        v-model.number="sectionForm.settings.maxItems"
                        type="number"
                        min="1"
                        max="24"
                      />
                    </UFormGroup>
                    
                    <!-- Items per view (for slider) -->
                    <UFormGroup v-if="sectionForm.settings.layout === 'slider'" label="Số sản phẩm mỗi lần hiện">
                      <UInput
                        v-model.number="sectionForm.settings.itemsPerView"
                        type="number"
                        min="1"
                        max="12"
                      />
                    </UFormGroup>
                    
                    <!-- Slider settings -->
                    <div v-if="sectionForm.settings.layout === 'slider'" class="space-y-3">
                      <UToggle
                        v-model="sectionForm.settings.autoplay"
                        label="Tự động chạy"
                        color="primary"
                      />
                      
                      <UFormGroup v-if="sectionForm.settings.autoplay" label="Thời gian chuyển (ms)">
                        <UInput
                          v-model.number="sectionForm.settings.interval"
                          type="number"
                          min="1000"
                          step="500"
                        />
                      </UFormGroup>
                    </div>
                    
                    <!-- Display options -->
                    <UToggle
                      v-model="sectionForm.settings.showPrice"
                      label="Hiển thị giá"
                      color="primary"
                    />
                    
                    <UToggle
                      v-model="sectionForm.settings.showRating"
                      label="Hiển thị đánh giá"
                      color="primary"
                    />
                  </div>
                  
                  <!-- Category Grid Section Settings -->
                  <div v-else-if="sectionForm.type === 'category_grid'" class="space-y-4">
                    <h3 class="text-lg font-medium">Cài đặt Lưới danh mục</h3>
                    
                    <!-- Layout -->
                    <UFormGroup label="Kiểu hiển thị">
                      <USelect
                        v-model="sectionForm.settings.layout"
                        :options="layoutOptions"
                        option-attribute="label"
                        value-attribute="value"
                        placeholder="Chọn kiểu hiển thị"
                      />
                    </UFormGroup>
                    
                    <!-- Columns -->
                    <UFormGroup label="Số cột">
                      <UInput
                        v-model.number="sectionForm.settings.columns"
                        type="number"
                        min="1"
                        max="12"
                      />
                    </UFormGroup>
                    
                    <!-- Max items -->
                    <UFormGroup label="Số lượng danh mục tối đa">
                      <UInput
                        v-model.number="sectionForm.settings.maxItems"
                        type="number"
                        min="1"
                        max="24"
                      />
                    </UFormGroup>
                    
                    <!-- Display mode -->
                    <UFormGroup label="Chế độ hiển thị">
                      <USelect
                        v-model="sectionForm.settings.displayMode"
                        :options="displayModeOptions"
                        option-attribute="label"
                        value-attribute="value"
                        placeholder="Chọn chế độ hiển thị"
                      />
                    </UFormGroup>
                    
                    <!-- Category IDs -->
                    <UFormGroup label="ID các danh mục" help="Nhập ID danh mục, cách nhau bằng dấu phẩy">
                      <UInput
                        v-model="sectionForm.settings.categoryIds"
                        placeholder="Ví dụ: 1,2,3,4"
                      />
                    </UFormGroup>
                    
                    <!-- Card Settings -->
                    <h4 class="font-medium mt-6">Cài đặt thẻ (Card)</h4>
                    
                    <UToggle
                      v-model="sectionForm.settings.showTitle"
                      label="Hiển thị tiêu đề"
                      color="primary"
                    />
                    
                    <UFormGroup label="Bo tròn">
                      <USelect
                        v-model="sectionForm.settings.card.rounded"
                        :options="[
                          { value: 'rounded-none', label: 'Không' },
                          { value: 'rounded-sm', label: 'Nhỏ' },
                          { value: 'rounded', label: 'Vừa' },
                          { value: 'rounded-md', label: 'Trung bình' },
                          { value: 'rounded-lg', label: 'Lớn' },
                          { value: 'rounded-xl', label: 'Rất lớn' },
                          { value: 'rounded-2xl', label: 'Cực lớn' },
                          { value: 'rounded-full', label: 'Tròn đầy đủ' }
                        ]"
                        option-attribute="label"
                        value-attribute="value"
                        placeholder="Chọn loại bo tròn"
                      />
                    </UFormGroup>
                    
                    <UFormGroup label="Đổ bóng">
                      <USelect
                        v-model="sectionForm.settings.card.shadow"
                        :options="[
                          { value: 'shadow-none', label: 'Không' },
                          { value: 'shadow-sm', label: 'Nhỏ' },
                          { value: 'shadow', label: 'Vừa' },
                          { value: 'shadow-md', label: 'Trung bình' },
                          { value: 'shadow-lg', label: 'Lớn' },
                          { value: 'shadow-xl', label: 'Rất lớn' },
                          { value: 'shadow-2xl', label: 'Cực lớn' },
                          { value: 'shadow-lg hover:shadow-xl', label: 'Lớn & Hover Rất lớn' }
                        ]"
                        option-attribute="label"
                        value-attribute="value"
                        placeholder="Chọn kiểu đổ bóng"
                      />
                    </UFormGroup>
                    
                    <UFormGroup label="Tỷ lệ khung hình">
                      <USelect
                        v-model="sectionForm.settings.card.aspectRatio"
                        :options="[
                          { value: '1/1', label: 'Vuông (1:1)' },
                          { value: '4/3', label: 'Tiêu chuẩn (4:3)' },
                          { value: '16/9', label: 'Rộng (16:9)' },
                          { value: '2/3', label: 'Dọc (2:3)' },
                          { value: '3/4', label: 'Dọc (3:4)' }
                        ]"
                        option-attribute="label"
                        value-attribute="value"
                        placeholder="Chọn tỷ lệ khung hình"
                      />
                    </UFormGroup>
                    
                    <UFormGroup label="Hiệu ứng">
                      <USelect
                        v-model="sectionForm.settings.card.animation"
                        :options="[
                          { value: '', label: 'Không' },
                          { value: 'hover:scale-105', label: 'Phóng to khi di chuột' },
                          { value: 'hover:scale-95', label: 'Thu nhỏ khi di chuột' },
                          { value: 'hover:opacity-80', label: 'Mờ khi di chuột' },
                          { value: 'hover:rotate-1', label: 'Xoay nhẹ khi di chuột' }
                        ]"
                        option-attribute="label"
                        value-attribute="value"
                        placeholder="Chọn hiệu ứng"
                      />
                    </UFormGroup>
                    
                    <!-- Overlay Settings -->
                    <h4 class="font-medium mt-6">Cài đặt lớp phủ (Overlay)</h4>
                    
                    <UToggle
                      v-model="sectionForm.settings.card.overlay.show"
                      label="Hiển thị lớp phủ"
                      color="primary"
                    />
                    
                    <div v-if="sectionForm.settings.card.overlay.show" class="ml-6 mt-4 space-y-4 border-l-2 border-gray-200 dark:border-gray-700 pl-4">
                      <UFormGroup label="Độ mờ">
                        <USelect
                          v-model="sectionForm.settings.card.overlay.opacity"
                          :options="[
                            { value: 'bg-black/20', label: 'Rất nhẹ (20%)' },
                            { value: 'bg-black/40', label: 'Nhẹ (40%)' },
                            { value: 'bg-black/60', label: 'Vừa (60%)' },
                            { value: 'bg-black/80', label: 'Đậm (80%)' },
                            { value: 'bg-black', label: 'Hoàn toàn (100%)' }
                          ]"
                          option-attribute="label"
                          value-attribute="value"
                          placeholder="Chọn độ mờ"
                        />
                      </UFormGroup>
                      
                      <UFormGroup label="Vị trí nội dung">
                        <USelect
                          v-model="sectionForm.settings.card.overlay.content.position"
                          :options="[
                            { value: 'top', label: 'Trên cùng' },
                            { value: 'center', label: 'Giữa' },
                            { value: 'bottom', label: 'Dưới cùng' }
                          ]"
                          option-attribute="label"
                          value-attribute="value"
                          placeholder="Chọn vị trí"
                        />
                      </UFormGroup>
                      
                      <UFormGroup label="Đệm nội dung">
                        <USelect
                          v-model="sectionForm.settings.card.overlay.content.padding"
                          :options="[
                            { value: 'p-2', label: 'Nhỏ' },
                            { value: 'p-4', label: 'Vừa' },
                            { value: 'p-6', label: 'Lớn' }
                          ]"
                          option-attribute="label"
                          value-attribute="value"
                          placeholder="Chọn đệm"
                        />
                      </UFormGroup>
                      
                      <UFormGroup label="Kích thước tiêu đề">
                        <USelect
                          v-model="sectionForm.settings.card.overlay.content.titleSize"
                          :options="fontSizeOptions"
                          option-attribute="label"
                          value-attribute="value"
                          placeholder="Chọn kích thước tiêu đề"
                        />
                      </UFormGroup>
                      
                      <UFormGroup label="Kích thước mô tả">
                        <USelect
                          v-model="sectionForm.settings.card.overlay.content.descriptionSize"
                          :options="fontSizeOptions"
                          option-attribute="label"
                          value-attribute="value"
                          placeholder="Chọn kích thước mô tả"
                        />
                      </UFormGroup>
                    </div>
                    
                    <!-- Columns Settings -->
                    <h4 class="font-medium mt-6">Cài đặt cột</h4>
                    
                    <UFormGroup label="Số cột (XL - màn hình lớn)">
                      <UInput
                        v-model.number="sectionForm.settings.columns.xl"
                        type="number"
                        min="1"
                        max="12"
                      />
                    </UFormGroup>
                    
                    <UFormGroup label="Số cột (LG - màn hình vừa)">
                      <UInput
                        v-model.number="sectionForm.settings.columns.lg"
                        type="number"
                        min="1" 
                        max="12"
                      />
                    </UFormGroup>
                    
                    <UFormGroup label="Số cột (MD - máy tính bảng)">
                      <UInput
                        v-model.number="sectionForm.settings.columns.md"
                        type="number"
                        min="1"
                        max="12"
                      />
                    </UFormGroup>
                    
                    <UFormGroup label="Số cột (SM - điện thoại)">
                      <UInput
                        v-model.number="sectionForm.settings.columns.sm"
                        type="number"
                        min="1"
                        max="12"
                      />
                    </UFormGroup>
                    
                    <!-- General Spacing -->
                    <h4 class="font-medium mt-6">Khoảng cách</h4>
                    
                    <UFormGroup label="Khoảng cách giữa các thẻ">
                      <UInput
                        v-model="sectionForm.settings.gap"
                        placeholder="Ví dụ: 0.5rem, 1rem, 1.5rem"
                      />
                    </UFormGroup>
                    
                    <!-- Load More Button -->
                    <h4 class="font-medium mt-6">Nút xem thêm</h4>
                    
                    <UToggle
                      v-model="sectionForm.settings.loadMoreButton.show"
                      label="Hiển thị nút xem thêm"
                      color="primary"
                    />
                    
                    <div v-if="sectionForm.settings.loadMoreButton.show" class="ml-6 mt-4 space-y-4 border-l-2 border-gray-200 dark:border-gray-700 pl-4">
                      <UFormGroup label="Chữ nút">
                        <UInput
                          v-model="sectionForm.settings.loadMoreButton.text"
                          placeholder="Ví dụ: Xem thêm"
                        />
                      </UFormGroup>
                      
                      <UFormGroup label="Kiểu nút">
                        <USelect
                          v-model="sectionForm.settings.loadMoreButton.style"
                          :options="[
                            { value: 'primary', label: 'Chính' },
                            { value: 'secondary', label: 'Phụ' },
                            { value: 'outline', label: 'Viền' },
                            { value: 'ghost', label: 'Trong suốt' }
                          ]"
                          option-attribute="label"
                          value-attribute="value"
                          placeholder="Chọn kiểu nút"
                        />
                      </UFormGroup>
                    </div>

                    <!-- Font sizes -->
                    <h4 class="font-medium mt-6">Kích thước chữ</h4>
                    
                    <UFormGroup label="Tiêu đề">
                      <USelect
                        v-model="sectionForm.settings.fontSize.title"
                        :options="fontSizeOptions"
                        option-attribute="label"
                        value-attribute="value"
                        placeholder="Chọn kích thước tiêu đề"
                      />
                    </UFormGroup>
                    
                    <UFormGroup label="Mô tả">
                      <USelect
                        v-model="sectionForm.settings.fontSize.description"
                        :options="fontSizeOptions"
                        option-attribute="label"
                        value-attribute="value"
                        placeholder="Chọn kích thước mô tả"
                      />
                    </UFormGroup>
                    
                    <!-- Text colors -->
                    <h4 class="font-medium mt-6">Màu chữ</h4>
                    
                    <UFormGroup label="Tiêu đề">
                      <UInput
                        v-model="sectionForm.settings.colors.title"
                        placeholder="Ví dụ: text-gray-900 dark:text-white"
                      />
                    </UFormGroup>
                    
                    <UFormGroup label="Mô tả">
                      <UInput
                        v-model="sectionForm.settings.colors.description"
                        placeholder="Ví dụ: text-gray-600 dark:text-gray-400"
                      />
                    </UFormGroup>
                    
                    <!-- Alignment -->
                    <h4 class="font-medium mt-6">Căn chỉnh</h4>
                    
                    <UFormGroup label="Header">
                      <USelect
                        v-model="sectionForm.settings.alignment.header"
                        :options="alignmentOptions"
                        option-attribute="label"
                        value-attribute="value"
                        placeholder="Chọn căn chỉnh header"
                      />
                    </UFormGroup>
                    
                    <UFormGroup label="Nội dung">
                      <UInput
                        v-model="sectionForm.settings.alignment.content"
                        placeholder="Ví dụ: text-left, text-center, text-right"
                      />
                    </UFormGroup>
                    
                    <UFormGroup label="Container">
                      <UInput
                        v-model="sectionForm.settings.alignment.container"
                        placeholder="Ví dụ: items-start, items-center, items-end"
                      />
                    </UFormGroup>
                    
                    <!-- Other options -->
                    <UToggle
                      v-model="sectionForm.settings.useUppercase"
                      label="Chữ in hoa"
                      color="primary"
                    />
                    
                    <UToggle
                      v-model="sectionForm.settings.showDescription"
                      label="Hiển thị mô tả"
                      color="primary"
                    />
                  </div>
                  
                  <!-- Services Section Settings -->
                  <div v-else-if="sectionForm.type === 'services' || sectionForm.type === 'feature_services'" class="space-y-4">
                    <h3 class="text-lg font-medium">Cài đặt Dịch vụ</h3>
                    
                    <!-- Layout -->
                    <UFormGroup label="Kiểu hiển thị">
                      <USelect
                        v-model="sectionForm.settings.layout"
                        :options="layoutOptions"
                        option-attribute="label"
                        value-attribute="value"
                        placeholder="Chọn kiểu hiển thị"
                      />
                    </UFormGroup>
                    
                    <!-- Columns -->
                    <UFormGroup label="Số cột">
                      <UInput
                        v-model.number="sectionForm.settings.columns"
                        type="number"
                        min="1"
                        max="12"
                      />
                    </UFormGroup>
                    
                    <!-- Gap -->
                    <UFormGroup label="Khoảng cách">
                      <UInput
                        v-model="sectionForm.settings.gap"
                        placeholder="Ví dụ: 1rem, 2rem, 0.5rem"
                      />
                    </UFormGroup>
                    
                    <!-- Padding -->
                    <h4 class="font-medium mt-6">Đệm (padding)</h4>
                    
                    <UFormGroup label="Phía trên">
                      <UInput
                        v-model="sectionForm.settings.padding.top"
                        placeholder="Ví dụ: 1rem, 2rem, 3rem"
                      />
                    </UFormGroup>
                    
                    <UFormGroup label="Phía dưới">
                      <UInput
                        v-model="sectionForm.settings.padding.bottom"
                        placeholder="Ví dụ: 1rem, 2rem, 3rem"
                      />
                    </UFormGroup>
                    
                    <!-- Background colors -->
                    <h4 class="font-medium mt-6">Màu nền</h4>
                    
                    <UFormGroup label="Sáng">
                      <UInput
                        v-model="sectionForm.settings.background.light"
                        placeholder="Ví dụ: #FFFFFF, #F9FAFB"
                      />
                    </UFormGroup>
                    
                    <UFormGroup label="Tối">
                      <UInput
                        v-model="sectionForm.settings.background.dark"
                        placeholder="Ví dụ: #1a1a1a, #000000"
                      />
                    </UFormGroup>
                    
                    <!-- Services list -->
                    <h4 class="font-medium mt-6">Danh sách dịch vụ</h4>
                    
                    <div v-if="sectionForm.settings.services && Array.isArray(sectionForm.settings.services)" class="space-y-4">
                      <div v-for="(service, index) in sectionForm.settings.services" :key="index" class="border dark:border-gray-700 p-4 rounded-lg">
                        <div class="flex justify-between items-center mb-2">
                          <h5 class="font-medium">Dịch vụ #{{ index + 1 }}</h5>
                          <UButton v-if="sectionForm.settings.services.length > 1" color="red" variant="soft" size="sm" icon="i-heroicons-trash" @click="sectionForm.settings.services.splice(index, 1)" />
                        </div>
                        
                        <UFormGroup label="Tiêu đề">
                          <UInput v-model="service.title" placeholder="Nhập tiêu đề dịch vụ" />
                        </UFormGroup>
                        
                        <UFormGroup label="Icon URL">
                          <UInput v-model="service.icon" placeholder="Nhập đường dẫn icon" />
                        </UFormGroup>

                        <UFormGroup label="Thumbnail">
                          <div class="h-40">
                            <MediaUploader
                              v-model="service.icon"
                              :preview="service.icon"
                              accept="image/*"
                              :max-size="5 * 1024 * 1024"
                              :alt="service.title || `Service ${index + 1}`"
                            />
                          </div>
                        </UFormGroup>
                        
                        <UFormGroup label="Đường dẫn">
                          <UInput v-model="service.link" placeholder="Nhập đường dẫn khi click" />
                        </UFormGroup>
                      </div>
                      
                      <UButton color="gray" variant="soft" icon="i-heroicons-plus" block
                        @click="sectionForm.settings.services.push({
                          title: 'Dịch vụ mới',
                          icon: '',
                          link: '/'
                        })"
                      >
                        Thêm dịch vụ
                      </UButton>
                    </div>
                    
                    <!-- Description -->
                    <UFormGroup label="Mô tả" help="Hỗ trợ HTML">
                      <UTextarea
                        v-model="sectionForm.settings.description"
                        placeholder="Nhập mô tả cho phần dịch vụ"
                        rows="5"
                      />
                    </UFormGroup>
                  </div>
                  
                  <!-- Testimonials Section Settings -->
                  <div v-else-if="sectionForm.type === 'testimonials'" class="space-y-4">
                    <h3 class="text-lg font-medium">Cài đặt Đánh giá khách hàng</h3>
                    
                    <!-- Limit -->
                    <UFormGroup label="Số lượng đánh giá hiển thị">
                      <UInput
                        v-model.number="sectionForm.settings.limit"
                        type="number"
                        min="1"
                        max="12"
                      />
                    </UFormGroup>
                    
                    <!-- Background color -->
                    <UFormGroup label="Màu nền">
                      <UInput
                        v-model="sectionForm.settings.backgroundColor"
                        placeholder="Ví dụ: bg-gray-50 dark:bg-gray-900"
                      />
                    </UFormGroup>
                    
                    <!-- Text color -->
                    <UFormGroup label="Màu chữ">
                      <UInput
                        v-model="sectionForm.settings.textColor"
                        placeholder="Ví dụ: text-gray-900 dark:text-white"
                      />
                    </UFormGroup>
                    
                    <!-- Button color -->
                    <UFormGroup label="Màu nút">
                      <UInput
                        v-model="sectionForm.settings.buttonColor"
                        placeholder="Ví dụ: bg-primary-600 hover:bg-primary-700 text-white"
                      />
                    </UFormGroup>
                    
                    <!-- Layout settings -->
                    <UFormGroup v-if="sectionForm.settings.layout" label="Kiểu hiển thị">
                      <USelect
                        v-model="sectionForm.settings.layout"
                        :options="layoutOptions"
                        option-attribute="label"
                        value-attribute="value"
                        placeholder="Chọn kiểu hiển thị"
                      />
                    </UFormGroup>
                    
                    <!-- Columns settings -->
                    <UFormGroup v-if="sectionForm.settings.columns !== undefined" label="Số cột">
                      <UInput
                        v-model.number="sectionForm.settings.columns"
                        type="number"
                        min="1"
                        max="6"
                      />
                    </UFormGroup>
                    
                    <!-- Title -->
                    <h4 class="font-medium mt-6">Tiêu đề phần</h4>
                    
                    <UFormGroup label="Tiếng Việt">
                      <UInput
                        v-model="sectionForm.settings.sectionTitle.vi"
                        placeholder="Nhập tiêu đề tiếng Việt"
                      />
                    </UFormGroup>
                    
                    <UFormGroup label="Tiếng Anh">
                      <UInput
                        v-model="sectionForm.settings.sectionTitle.en"
                        placeholder="Nhập tiêu đề tiếng Anh"
                      />
                    </UFormGroup>
                    
                    <!-- Description -->
                    <h4 class="font-medium mt-6">Mô tả phần</h4>
                    
                    <UFormGroup label="Tiếng Việt">
                      <UTextarea
                        v-model="sectionForm.settings.sectionDescription.vi"
                        placeholder="Nhập mô tả tiếng Việt"
                        rows="3"
                      />
                    </UFormGroup>
                    
                    <UFormGroup label="Tiếng Anh">
                      <UTextarea
                        v-model="sectionForm.settings.sectionDescription.en"
                        placeholder="Nhập mô tả tiếng Anh"
                        rows="3"
                      />
                    </UFormGroup>
                    
                    <!-- Button text -->
                    <h4 class="font-medium mt-6">Nút xem tất cả</h4>
                    
                    <UFormGroup label="Tiếng Việt">
                      <UInput
                        v-model="sectionForm.settings.buttonText.vi"
                        placeholder="Nhập chữ nút tiếng Việt"
                      />
                    </UFormGroup>
                    
                    <UFormGroup label="Tiếng Anh">
                      <UInput
                        v-model="sectionForm.settings.buttonText.en"
                        placeholder="Nhập chữ nút tiếng Anh"
                      />
                    </UFormGroup>
                    
                    <!-- Padding -->
                    <h4 v-if="sectionForm.settings.padding" class="font-medium mt-6">Đệm (padding)</h4>
                    
                    <UFormGroup v-if="sectionForm.settings.padding" label="Phía trên">
                      <UInput
                        v-model="sectionForm.settings.padding.top"
                        placeholder="Ví dụ: 1rem, 2rem, 3rem"
                      />
                    </UFormGroup>
                    
                    <UFormGroup v-if="sectionForm.settings.padding" label="Phía dưới">
                      <UInput
                        v-model="sectionForm.settings.padding.bottom"
                        placeholder="Ví dụ: 1rem, 2rem, 3rem"
                      />
                    </UFormGroup>
                    
                    <UFormGroup v-if="sectionForm.settings.padding" label="Phía trái">
                      <UInput
                        v-model="sectionForm.settings.padding.left"
                        placeholder="Ví dụ: 1rem, 2rem, 3rem" 
                      />
                    </UFormGroup>
                    
                    <UFormGroup v-if="sectionForm.settings.padding" label="Phía phải">
                      <UInput
                        v-model="sectionForm.settings.padding.right"
                        placeholder="Ví dụ: 1rem, 2rem, 3rem"
                      />
                    </UFormGroup>
                    
                    <!-- Alignment -->
                    <h4 v-if="sectionForm.settings.alignment" class="font-medium mt-6">Căn chỉnh</h4>
                    
                    <UFormGroup v-if="sectionForm.settings.alignment" label="Nội dung">
                      <USelect
                        v-model="sectionForm.settings.alignment.content"
                        :options="[
                          { value: 'text-left', label: 'Trái' },
                          { value: 'text-center', label: 'Giữa' },
                          { value: 'text-right', label: 'Phải' }
                        ]"
                        option-attribute="label"
                        value-attribute="value"
                        placeholder="Chọn căn chỉnh nội dung"
                      />
                    </UFormGroup>
                    
                    <UFormGroup v-if="sectionForm.settings.alignment" label="Items">
                      <USelect
                        v-model="sectionForm.settings.alignment.items"
                        :options="[
                          { value: 'items-start', label: 'Đầu' },
                          { value: 'items-center', label: 'Giữa' },
                          { value: 'items-end', label: 'Cuối' }
                        ]"
                        option-attribute="label"
                        value-attribute="value"
                        placeholder="Chọn căn chỉnh items"
                      />
                    </UFormGroup>
                    
                    <!-- Background colors -->
                    <h4 v-if="sectionForm.settings.background" class="font-medium mt-6">Màu nền chi tiết</h4>
                    
                    <UFormGroup v-if="sectionForm.settings.background" label="Sáng">
                      <UInput
                        v-model="sectionForm.settings.background.light"
                        placeholder="Ví dụ: #FFFFFF, #F9FAFB"
                      />
                    </UFormGroup>
                    
                    <UFormGroup v-if="sectionForm.settings.background" label="Tối">
                      <UInput
                        v-model="sectionForm.settings.background.dark"
                        placeholder="Ví dụ: #1a1a1a, #000000"
                      />
                    </UFormGroup>
                    
                    <!-- Text colors -->
                    <h4 v-if="sectionForm.settings.colors" class="font-medium mt-6">Màu chữ chi tiết</h4>
                    
                    <UFormGroup v-if="sectionForm.settings.colors" label="Tiêu đề">
                      <UInput
                        v-model="sectionForm.settings.colors.title"
                        placeholder="Ví dụ: text-gray-900 dark:text-white"
                      />
                    </UFormGroup>
                    
                    <UFormGroup v-if="sectionForm.settings.colors" label="Mô tả">
                      <UInput
                        v-model="sectionForm.settings.colors.description"
                        placeholder="Ví dụ: text-gray-600 dark:text-gray-400"
                      />
                    </UFormGroup>
                    
                    <!-- Font sizes -->
                    <h4 v-if="sectionForm.settings.fontSize" class="font-medium mt-6">Kích thước chữ</h4>
                    
                    <UFormGroup v-if="sectionForm.settings.fontSize" label="Tiêu đề">
                      <USelect
                        v-model="sectionForm.settings.fontSize.title"
                        :options="fontSizeOptions"
                        option-attribute="label"
                        value-attribute="value"
                        placeholder="Chọn kích thước tiêu đề"
                      />
                    </UFormGroup>
                    
                    <UFormGroup v-if="sectionForm.settings.fontSize" label="Mô tả">
                      <USelect
                        v-model="sectionForm.settings.fontSize.description"
                        :options="fontSizeOptions"
                        option-attribute="label"
                        value-attribute="value"
                        placeholder="Chọn kích thước mô tả"
                      />
                    </UFormGroup>
                    
                    <!-- Other optional settings -->
                    <UToggle
                      v-if="sectionForm.settings.showImages !== undefined"
                      v-model="sectionForm.settings.showImages"
                      label="Hiển thị hình ảnh"
                      color="primary"
                    />
                    
                    <UToggle
                      v-if="sectionForm.settings.showRating !== undefined"
                      v-model="sectionForm.settings.showRating"
                      label="Hiển thị đánh giá sao"
                      color="primary"
                    />
                    
                    <UToggle
                      v-if="sectionForm.settings.showDate !== undefined"
                      v-model="sectionForm.settings.showDate"
                      label="Hiển thị ngày đánh giá"
                      color="primary"
                    />
                  </div>
                  
                  <!-- Generic settings for other section types -->
                  <div v-else class="space-y-4">
                    <div class="bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300 p-4 rounded-lg border border-yellow-100 dark:border-yellow-800">
                      <p>Chưa có giao diện chỉnh sửa tùy chỉnh cho loại section này. Vui lòng sử dụng chế độ JSON để chỉnh sửa cài đặt.</p>
                    </div>
                    
                    <UButton
                      color="primary"
                      variant="soft"
                      icon="i-heroicons-code-bracket"
                      @click="settingsEditorMode = 'json'; stringifyJsonSettings()"
                    >
                      Chuyển sang chế độ JSON
                    </UButton>
                  </div>
                </div>
              </UCard>
            </div>

            <!-- Layout Tab -->
            <div v-show="currentTab === 'layout'">
              <UCard>
                <div class="space-y-6">
                  <h3 class="text-lg font-medium">Cài đặt bố cục</h3>
                  
                  <!-- Layout Type -->
                  <UFormGroup label="Kiểu bố cục" help="Lựa chọn cách sắp xếp nội dung">
                    <USelect
                      v-model="sectionForm.settings.layout"
                      :options="layoutOptions"
                      option-attribute="label"
                      value-attribute="value"
                      placeholder="Chọn kiểu bố cục"
                    />
                  </UFormGroup>
                  
                  <!-- Columns/Grid Settings -->
                  <UFormGroup label="Số cột" v-if="['grid', 'masonry'].includes(sectionForm.settings?.layout || '')">
                    <UInput
                      v-model.number="sectionForm.settings.columns"
                      type="number"
                      min="1"
                      max="12"
                    />
                  </UFormGroup>
                  
                  <!-- Container Width -->
                  <UFormGroup label="Chiều rộng container">
                    <USelect
                      v-model="sectionForm.settings.containerWidth"
                      :options="[
                        { value: 'max-w-full', label: 'Đầy màn hình' },
                        { value: 'max-w-7xl', label: 'Rộng (1280px)' },
                        { value: 'max-w-5xl', label: 'Trung bình (1024px)' },
                        { value: 'max-w-3xl', label: 'Nhỏ (768px)' }
                      ]"
                      option-attribute="label"
                      value-attribute="value"
                      placeholder="Chọn chiều rộng"
                    />
                  </UFormGroup>
                  
                  <!-- Spacing -->
                  <h4 class="font-medium mt-6">Khoảng cách</h4>
                  
                  <UFormGroup label="Khoảng cách giữa các phần tử">
                    <UInput
                      v-model="sectionForm.settings.gap"
                      placeholder="Ví dụ: 1rem, 2rem, 0.5rem"
                    />
                  </UFormGroup>
                  
                  <UFormGroup label="Đệm trên">
                    <UInput
                      v-model="sectionForm.settings.padding.top"
                      placeholder="Ví dụ: 1rem, 2rem, 3rem"
                    />
                  </UFormGroup>
                  
                  <UFormGroup label="Đệm dưới">
                    <UInput
                      v-model="sectionForm.settings.padding.bottom"
                      placeholder="Ví dụ: 1rem, 2rem, 3rem"
                    />
                  </UFormGroup>
                  
                  <!-- Alignment -->
                  <h4 class="font-medium mt-6">Căn chỉnh</h4>
                  
                  <UFormGroup label="Căn chỉnh nội dung">
                    <USelect
                      v-model="sectionForm.settings.alignment.content"
                      :options="[
                        { value: 'text-left', label: 'Trái' },
                        { value: 'text-center', label: 'Giữa' },
                        { value: 'text-right', label: 'Phải' }
                      ]"
                      option-attribute="label"
                      value-attribute="value"
                      placeholder="Chọn căn chỉnh nội dung"
                    />
                  </UFormGroup>
                  
                  <UFormGroup label="Căn chỉnh items">
                    <USelect
                      v-model="sectionForm.settings.alignment.items"
                      :options="[
                        { value: 'items-start', label: 'Đầu' },
                        { value: 'items-center', label: 'Giữa' },
                        { value: 'items-end', label: 'Cuối' }
                      ]"
                      option-attribute="label"
                      value-attribute="value"
                      placeholder="Chọn căn chỉnh items"
                    />
                  </UFormGroup>
                </div>
              </UCard>
            </div>

            <!-- Styles Tab -->
            <div v-show="currentTab === 'styles'">
              <UCard>
                <div class="space-y-6">
                  <h3 class="text-lg font-medium">Cài đặt giao diện</h3>
                  
                  <!-- Background -->
                  <h4 class="font-medium mt-3">Màu nền</h4>
                  
                  <UFormGroup label="Màu nền (sáng)">
                    <UInput
                      v-model="sectionForm.settings.background.light"
                      placeholder="Ví dụ: #FFFFFF, bg-white"
                    />
                  </UFormGroup>
                  
                  <UFormGroup label="Màu nền (tối)">
                    <UInput
                      v-model="sectionForm.settings.background.dark"
                      placeholder="Ví dụ: #1a1a1a, bg-gray-900"
                    />
                  </UFormGroup>
                  
                  <!-- Text Styles -->
                  <h4 class="font-medium mt-6">Kiểu chữ</h4>
                  
                  <UFormGroup label="Màu chữ tiêu đề">
                    <UInput
                      v-model="sectionForm.settings.colors.title"
                      placeholder="Ví dụ: text-gray-900 dark:text-white"
                    />
                  </UFormGroup>
                  
                  <UFormGroup label="Màu chữ mô tả">
                    <UInput
                      v-model="sectionForm.settings.colors.description"
                      placeholder="Ví dụ: text-gray-600 dark:text-gray-400"
                    />
                  </UFormGroup>
                  
                  <UFormGroup label="Kích thước tiêu đề">
                    <USelect
                      v-model="sectionForm.settings.fontSize.title"
                      :options="fontSizeOptions"
                      option-attribute="label"
                      value-attribute="value"
                      placeholder="Chọn kích thước tiêu đề"
                    />
                  </UFormGroup>
                  
                  <UFormGroup label="Kích thước mô tả">
                    <USelect
                      v-model="sectionForm.settings.fontSize.description"
                      :options="fontSizeOptions"
                      option-attribute="label"
                      value-attribute="value"
                      placeholder="Chọn kích thước mô tả"
                    />
                  </UFormGroup>
                  
                  <!-- Other Styling Options -->
                  <h4 class="font-medium mt-6">Tùy chọn khác</h4>
                  
                  <UToggle
                    v-model="sectionForm.settings.useUppercase"
                    label="Chữ hoa cho tiêu đề"
                    color="primary"
                  />
                  
                  <UFormGroup label="Bo tròn">
                    <USelect
                      v-model="sectionForm.settings.borderRadius"
                      :options="[
                        { value: 'rounded-none', label: 'Không' },
                        { value: 'rounded-sm', label: 'Nhỏ' },
                        { value: 'rounded', label: 'Vừa' },
                        { value: 'rounded-md', label: 'Trung bình' },
                        { value: 'rounded-lg', label: 'Lớn' },
                        { value: 'rounded-xl', label: 'Rất lớn' },
                        { value: 'rounded-full', label: 'Tròn đầy đủ' }
                      ]"
                      option-attribute="label"
                      value-attribute="value"
                      placeholder="Chọn bo tròn"
                    />
                  </UFormGroup>
                </div>
              </UCard>
            </div>

            <!-- Preview Tab -->
            <div v-show="currentTab === 'preview'">
              <UCard>
                <div class="space-y-6">
                  <h3 class="text-lg font-medium">Xem trước</h3>
                  
                  <div class="p-4 border rounded-lg dark:border-gray-700 text-center">
                    <LayoutPanelLeft class="w-16 h-16 mx-auto text-gray-400 dark:text-gray-600 mb-2" />
                    <p class="text-sm text-gray-500 dark:text-gray-400">
                      Xem trước chưa được hỗ trợ cho section này.
                    </p>
                  </div>
                </div>
              </UCard>
            </div>
          </div>
          
          <!-- Form Actions -->
          <div class="flex justify-between mt-6">
            <UButton
              color="red"
              variant="soft"
              icon="i-heroicons-trash"
              @click="deleteSection"
              type="button"
            >
              Xóa Section
            </UButton>
            
            <div class="space-x-2">
              <UButton
                color="gray"
                variant="soft"
                @click="navigateToSections"
                type="button"
              >
                Hủy
              </UButton>
              <UButton
                color="primary"
                @click="saveAndBack"
                :loading="isSubmitting"
                :disabled="isSubmitting"
              >
                Lưu thay đổi
              </UButton>
            </div>
          </div>
        </div>
        
        <!-- Info Panel -->
        <div class="lg:col-span-1">
          <UCard>
            <template #header>
              <div class="font-medium">Thông tin</div>
            </template>
            
            <div class="space-y-4">
              <div>
                <div class="text-sm font-medium text-gray-500 dark:text-gray-400">ID</div>
                <div>{{ section.id }}</div>
              </div>
              
              <div>
                <div class="text-sm font-medium text-gray-500 dark:text-gray-400">Loại</div>
                <div>{{ getSectionTypeLabel(section.type) }}</div>
              </div>
              
              <div>
                <div class="text-sm font-medium text-gray-500 dark:text-gray-400">Thuộc Theme</div>
                <div>{{ themeId }}</div>
              </div>
              
              <div>
                <div class="text-sm font-medium text-gray-500 dark:text-gray-400">Thuộc trang</div>
                <UBadge
                  color="blue"
                  variant="soft"
                >
                  {{ pageTypeOptions.find(o => o.value === section?.pageType)?.label || section?.pageType }}
                </UBadge>
              </div>
              
              <div>
                <div class="text-sm font-medium text-gray-500 dark:text-gray-400">Ngày tạo</div>
                <div>{{ formatDate(section.createdAt) }}</div>
              </div>
              
              <div>
                <div class="text-sm font-medium text-gray-500 dark:text-gray-400">Cập nhật lần cuối</div>
                <div>{{ formatDate(section.updatedAt) }}</div>
              </div>
            </div>
          </UCard>
        </div>
      </div>
    </div>
  </div>
</template> 
