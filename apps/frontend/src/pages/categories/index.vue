<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { useTrpc } from '~/composables/useTrpc'
import { usePageSeo } from '~/composables/usePageSeo'
import { getCategoryDetailRoute, getCategoryListRoute } from '~/utils/routes'

// Sử dụng composables
const { t, locale } = useI18n()
const route = useRoute()
const router = useRouter()

const trpc = useTrpc()

// Định nghĩa alias cho URL tiếng Việt
definePageMeta({
  layout: 'default',
})

// Trạng thái
const isLoading = ref(true)
const error = ref<string | null>(null)
const categories = ref<any[]>([])
const featuredCategories = ref<any[]>([])
const popularCategories = ref<any[]>([])

// Lấy danh sách danh mục
const fetchCategories = async () => {
  try {
    isLoading.value = true
    
    // Lấy tất cả danh mục
    const allCategories = await trpc.category.byType.query({ type: 'product' })
    categories.value = allCategories
    
    // Lấy danh mục nổi bật
    const featured = await trpc.category.featured.query()
    featuredCategories.value = featured.filter(cat => cat.type === 'product' || cat.type === 'both')
    
    // Lấy danh mục phổ biến
    const popular = await trpc.category.popular.query({ limit: 6 })
    popularCategories.value = popular.filter(cat => cat.type === 'product' || cat.type === 'both')
  } catch (err: any) {
    console.error('Error fetching categories:', err)
    error.value = err.message || t('categories.errorLoading') || 'Không thể tải danh sách danh mục'
  } finally {
    isLoading.value = false
  }
}

// Khởi tạo trang
onMounted(() => {
  fetchCategories()
})

usePageSeo({
  title: computed(() => t('categories.pageTitle') || 'Danh muc san pham'),
  description: computed(() => t('categories.pageDescription') || 'Khám phá tất cả danh mục sản phẩm của chúng tôi'),
  keywords: computed(() => t('categories.pageKeywords') || 'danh muc, san pham, mua sam, thuong mai dien tu'),
  currentPath: computed(() => route.path),
  locale: computed(() => (locale.value === 'en' ? 'en' : 'vi')),
  routeKey: 'categories',
})

// Xử lý chuyển hướng đến trang danh mục
const navigateToCategory = (slug: string) => {
  router.push(getCategoryDetailRoute(slug, locale.value))
}
</script>

<template>
  <div class="categories-page bg-gray-50 dark:bg-gray-900">
    <UContainer>
      <!-- Breadcrumb -->
      <nav class="py-4">
        <ol class="flex items-center space-x-1 text-sm">
          <li>
            <NuxtLink to="/" class="text-gray-500 hover:text-primary-500">
              {{ t('common.home') }}
            </NuxtLink>
          </li>
          <li class="flex items-center">
            <span class="mx-2 text-gray-400">/</span>
            <span class="font-medium text-primary-600">{{ t('common.categories') }}</span>
          </li>
        </ol>
      </nav>

      <!-- Tiêu đề trang -->
      <div class="mb-8 text-center">
        <h1 class="text-3xl font-bold text-gray-900 dark:text-white">{{ t('categories.allCategories') }}</h1>
        <p class="mt-2 text-gray-600 dark:text-gray-400">{{ t('categories.exploreAll') }}</p>
      </div>

      <!-- Trạng thái tải -->
      <div v-if="isLoading" class="py-12">
        <CardGridSkeleton :item-count="8" :columns="4" :show-card-action="false" />
      </div>

      <!-- Thông báo lỗi -->
      <div v-else-if="error" class="rounded-lg border border-red-200 bg-red-50 p-8 text-center dark:border-red-800 dark:bg-red-900/20">
        <UIcon name="i-heroicons-exclamation-circle" class="mx-auto mb-4 h-12 w-12 text-red-500" />
        <h3 class="mb-2 text-lg font-medium text-red-800 dark:text-red-400">{{ t('common.error') }}</h3>
        <p class="text-red-600 dark:text-red-300">{{ error }}</p>
        <UButton color="red" variant="soft" class="mt-4" @click="fetchCategories">
          {{ t('common.tryAgain') }}
        </UButton>
      </div>

      <!-- Không có danh mục -->
      <div v-else-if="categories.length === 0" class="rounded-lg border border-gray-200 bg-white p-8 text-center dark:border-gray-700 dark:bg-gray-800">
        <UIcon name="i-heroicons-folder" class="mx-auto mb-4 h-12 w-12 text-gray-400 dark:text-gray-500" />
        <h3 class="mb-2 text-lg font-medium text-gray-900 dark:text-gray-100">{{ t('categories.noCategories') }}</h3>
        <p class="text-gray-500 dark:text-gray-400">{{ t('categories.checkBackLater') }}</p>
      </div>

      <template v-else>
        <!-- Danh mục nổi bật -->
        <div v-if="featuredCategories.length > 0" class="mb-12">
          <div class="mb-6 flex items-center justify-between">
            <h2 class="text-2xl font-bold text-gray-900 dark:text-white">
              <UIcon name="i-heroicons-star" class="mr-2 inline-block h-6 w-6 text-amber-500" />
              {{ t('categories.featuredCategories') }}
            </h2>
            <UButton
              :to="getCategoryListRoute(locale.value)"
              variant="ghost"
              color="gray"
              trailing-icon="i-heroicons-arrow-right"
              class="text-sm font-medium"
            >
              {{ t('common.viewAll') }}
            </UButton>
          </div>
          
          <div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            <div 
              v-for="category in featuredCategories" 
              :key="category.id" 
              class="group cursor-pointer overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-md dark:border-gray-700 dark:bg-gray-800"
              @click="navigateToCategory(category.slug)"
            >
              <div class="relative aspect-video overflow-hidden bg-gray-100 dark:bg-gray-900">
                <img
                  v-if="category.ogImage"
                  :src="category.ogImage"
                  :alt="category.name"
                  class="h-full w-full object-cover object-center transition-transform duration-300 group-hover:scale-105"
                />
                <div v-else class="flex h-full items-center justify-center bg-gray-200 dark:bg-gray-700">
                  <UIcon name="i-heroicons-folder" class="h-12 w-12 text-gray-400 dark:text-gray-500" />
                </div>
                <div class="absolute left-2 top-2 rounded-full bg-amber-500 px-2 py-1 text-xs font-medium text-white">
                  {{ t('categories.featured') }}
                </div>
              </div>
              <div class="p-4">
                <h3 class="text-lg font-medium text-gray-900 dark:text-white">{{ category.name }}</h3>
                <p v-if="category.description" class="mt-1 text-sm text-gray-600 line-clamp-2 dark:text-gray-400">{{ category.description }}</p>
                <div class="mt-4 flex justify-between">
                  <span class="text-sm text-gray-500 dark:text-gray-400">
                    <UIcon name="i-heroicons-shopping-bag" class="mr-1 inline-block h-4 w-4" />
                    {{ category.products?.length || 0 }} {{ t('products.items') }}
                  </span>
                  <UButton
                    variant="link"
                    color="primary"
                    size="xs"
                    trailing-icon="i-heroicons-arrow-right"
                    class="font-medium"
                  >
                    {{ t('common.explore') }}
                  </UButton>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Danh mục phổ biến -->
        <div v-if="popularCategories.length > 0" class="mb-12">
          <div class="mb-6 flex items-center justify-between">
            <h2 class="text-2xl font-bold text-gray-900 dark:text-white">
              <UIcon name="i-heroicons-fire" class="mr-2 inline-block h-6 w-6 text-red-500" />
              {{ t('categories.popularCategories') }}
            </h2>
          </div>
          
          <div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <div 
              v-for="category in popularCategories" 
              :key="category.id" 
              class="group cursor-pointer overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-md dark:border-gray-700 dark:bg-gray-800"
              @click="navigateToCategory(category.slug)"
            >
              <div class="flex items-center p-4">
                <div class="mr-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary-100 dark:bg-primary-900">
                  <UIcon name="i-heroicons-folder" class="h-6 w-6 text-primary-600 dark:text-primary-400" />
                </div>
                <div class="flex-1">
                  <h3 class="text-lg font-medium text-gray-900 dark:text-white">{{ category.name }}</h3>
                  <p class="text-sm text-gray-500 dark:text-gray-400">
                    {{ category.products?.length || 0 }} {{ t('products.items') }}
                  </p>
                </div>
                <UIcon name="i-heroicons-chevron-right" class="h-5 w-5 text-gray-400 transition-transform group-hover:translate-x-1 dark:text-gray-500" />
              </div>
            </div>
          </div>
        </div>

        <!-- Tất cả danh mục -->
        <div>
          <div class="mb-6">
            <h2 class="text-2xl font-bold text-gray-900 dark:text-white">
              <UIcon name="i-heroicons-rectangle-stack" class="mr-2 inline-block h-6 w-6 text-primary-500" />
              {{ t('categories.allCategories') }}
            </h2>
          </div>
          
          <div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            <div 
              v-for="category in categories" 
              :key="category.id" 
              class="group cursor-pointer overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-md dark:border-gray-700 dark:bg-gray-800"
              @click="navigateToCategory(category.slug)"
            >
              <div class="relative aspect-video overflow-hidden bg-gray-100 dark:bg-gray-900">
                <img
                  v-if="category.ogImage"
                  :src="category.ogImage"
                  :alt="category.name"
                  class="h-full w-full object-cover object-center transition-transform duration-300 group-hover:scale-105"
                />
                <div v-else class="flex h-full items-center justify-center bg-gray-200 dark:bg-gray-700">
                  <UIcon name="i-heroicons-folder" class="h-12 w-12 text-gray-400 dark:text-gray-500" />
                </div>
                <div v-if="category.isFeatured" class="absolute left-2 top-2 rounded-full bg-amber-500 px-2 py-1 text-xs font-medium text-white">
                  {{ t('categories.featured') }}
                </div>
              </div>
              <div class="p-4">
                <h3 class="text-lg font-medium text-gray-900 dark:text-white">{{ category.name }}</h3>
                <p v-if="category.description" class="mt-1 text-sm text-gray-600 line-clamp-2 dark:text-gray-400">{{ category.description }}</p>
                <div v-if="category.children && category.children.length > 0" class="mt-3">
                  <span class="text-xs font-medium text-gray-500 dark:text-gray-400">{{ t('categories.subcategories') }}:</span>
                  <div class="mt-1 flex flex-wrap gap-1">
                    <UBadge
                      v-for="child in category.children.slice(0, 3)"
                      :key="child.id"
                      color="gray"
                      variant="subtle"
                      size="xs"
                    >
                      {{ child.name }}
                    </UBadge>
                    <UBadge
                      v-if="category.children.length > 3"
                      color="gray"
                      variant="subtle"
                      size="xs"
                    >
                      +{{ category.children.length - 3 }}
                    </UBadge>
                  </div>
                </div>
                <div class="mt-4 flex justify-between">
                  <span class="text-sm text-gray-500 dark:text-gray-400">
                    <UIcon name="i-heroicons-shopping-bag" class="mr-1 inline-block h-4 w-4" />
                    {{ category.products?.length || 0 }} {{ t('products.items') }}
                  </span>
                  <UButton
                    variant="link"
                    color="primary"
                    size="xs"
                    trailing-icon="i-heroicons-arrow-right"
                    class="font-medium"
                  >
                    {{ t('common.explore') }}
                  </UButton>
                </div>
              </div>
            </div>
          </div>
        </div>
      </template>
    </UContainer>
  </div>
</template>

<style scoped>
.categories-page {
  @apply bg-gray-50 py-8 dark:bg-gray-900;
}

/* Hiệu ứng hover cho card */
.group {
  @apply transition-all duration-300;
}

.group:hover {
  @apply shadow-md;
}

.group:hover img {
  @apply scale-105;
}

/* Hiệu ứng cho badge */
:deep(.u-badge) {
  @apply transition-all duration-200;
}

:deep(.u-badge:hover) {
  @apply bg-gray-200 dark:bg-gray-700;
}
</style> 
