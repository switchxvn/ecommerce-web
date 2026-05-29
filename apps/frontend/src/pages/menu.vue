<script setup lang="ts">
import { onMounted, watch, computed, ref } from 'vue'
import { useLocalization } from '../composables/useLocalization'
import { useFoodMenu } from '../composables/useFoodMenu'
import { useTrpc } from '../composables/useTrpc'
import { Menu, Phone, Clock } from 'lucide-vue-next'
import FoodMenuItem from '../../components/menu/FoodMenuItem.vue'

const { t, locale } = useLocalization()
const {
  categories,
  items,
  selectedCategory,
  isLoading: menuLoading,
  error: menuError,
  fetchCategories,
  fetchItems,
  selectCategory,
} = useFoodMenu()

const trpc = useTrpc()
const hotline = ref('')
const operatingHours = ref('')

const fetchSettings = async () => {
  try {
    const [hotlineSetting, operatingHoursSetting] = await Promise.all([
      trpc.settings.getPublicSettingByKey.query('hotline'),
      trpc.settings.getPublicSettingByKey.query('operating_hours')
    ])
    
    if (hotlineSetting?.value) {
      hotline.value = hotlineSetting.value
    }
    if (operatingHoursSetting?.value) {
      operatingHours.value = operatingHoursSetting.value
    }
  } catch (error) {
    console.error('Failed to fetch settings:', error)
  }
}

// Initial data fetch
onMounted(() => {
  fetchCategories()
  fetchItems()
  fetchSettings()
})

// Watch for locale changes and refetch data
watch(locale, () => {
  fetchCategories()
  fetchItems()
  fetchSettings()
})

const isLoading = computed(() => menuLoading.value)
const error = computed(() => menuError.value)
</script>

<template>
  <div class="food-menu">
    <div class="food-menu__container">
      <!-- Header -->
      <div class="text-center mb-12">
        <h1 class="food-menu__title">
          {{ t('menu.title') }}
        </h1>
        
        <!-- Contact Info -->
        <div class="mt-6 flex flex-col sm:flex-row items-center justify-center gap-6">
          <div v-if="hotline" class="contact-info-card">
            <Phone class="w-7 h-7 text-amber-400" />
            <a :href="'tel:' + hotline" class="text-2xl font-semibold text-white hover:text-amber-400 transition-colors">
              {{ hotline }}
            </a>
          </div>
          
          <div v-if="operatingHours" class="contact-info-card">
            <Clock class="w-7 h-7 text-amber-400" />
            <span class="text-2xl font-semibold text-white">{{ operatingHours }}</span>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="isLoading" class="food-menu__loading">
        <CardGridSkeleton :item-count="6" :columns="3" />
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="food-menu__error">
        {{ error }}
      </div>

      <template v-else>
        <!-- Categories -->
        <div class="food-menu__categories" v-if="categories.length > 1">
          <button
            class="food-menu__category-btn"
            :class="{ 'food-menu__category-btn--active': !selectedCategory }"
            @click="selectCategory(null)"
          >
            {{ t('menu.all') }}
          </button>
          <button
            v-for="category in categories"
            :key="category.id"
            class="food-menu__category-btn"
            :class="{ 'food-menu__category-btn--active': selectedCategory === category.id }"
            @click="selectCategory(category.id)"
          >
            {{ category.name }}
          </button>
        </div>

        <!-- Menu Items Grid -->
        <div v-if="items.length" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <FoodMenuItem
            v-for="item in items"
            :key="item.id"
            :imageUrl="item.image?.url || '/images/default-food.jpg'"
            :name="item.name"
            :price="item.price || 0"
          />
        </div>

        <!-- No Items State -->
        <div v-else class="text-center py-12 text-gray-300">
          {{ t('menu.noItems') }}
        </div>
      </template>
    </div>
  </div>
</template>

<style lang="scss">
@use '@/assets/styles/components/food-menu' as *;

.contact-info-card {
  @apply flex items-center gap-4 px-8 py-4 rounded-xl;
  @apply bg-black/30 backdrop-blur-sm;
  @apply border border-amber-400/30;
  @apply shadow-lg shadow-amber-400/10;
  @apply animate-fade-in;
}

@keyframes fade-in {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fade-in {
  animation: fade-in 0.5s ease-out forwards;
}
</style> 
