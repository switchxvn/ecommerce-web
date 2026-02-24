<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import ServiceCard from '~/components/ui/card/ServiceCard.vue';
import { useLocalization } from '~/composables/useLocalization';
import { useI18n } from 'vue-i18n';
import { useTrpc } from '~/composables/useTrpc';

type ButtonVariant = 'solid' | 'outline' | 'soft' | 'ghost' | 'link';

interface ServiceTranslation {
  id: number;
  title: string;
  description?: string;
  shortDescription?: string;
  locale: string;
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  canonicalUrl?: string;
  serviceId: number;
  createdAt: string | Date;
  updatedAt: string | Date;
}

interface Service {
  id: number;
  icon: string;
  order: number;
  isActive: boolean;
  translations: ServiceTranslation[];
  currentTranslation?: ServiceTranslation;
  createdAt: string | Date;
  updatedAt: string | Date;
}

interface ServicesConfig {
  title?: string;
  layout: 'grid';
  columns: number;
  maxItems: number;
  showIcon: boolean;
  showTitle: boolean;
  showDescription: boolean;
  showPrice: boolean;
  showButton: boolean;
  descriptionLength: number;
  gap: string;
  backgroundGradient: {
    from: string;
    to: string;
    direction: string;
  };
  overlayOpacity: string;
  padding: {
    top: string;
    bottom: string;
  };
  buttonText: string;
  buttonStyle: ButtonVariant;
  cardStyle: {
    background: string;
    shadow: string;
    border: string;
    rounded: string;
    padding: string;
    transition: string;
  };
  iconStyle: {
    size: string;
    background: string;
    color: string;
    rounded: string;
    padding: string;
  };
  titleStyle: {
    size: string;
    weight: string;
    color: string;
    margin: string;
  };
  descriptionStyle: {
    size: string;
    color: string;
    margin: string;
  };
  priceStyle: {
    size: string;
    weight: string;
    color: string;
    margin: string;
  };
}

interface Props {
  config?: Partial<ServicesConfig>;
}

const defaultConfig: ServicesConfig = {
  layout: 'grid',
  columns: 3,
  maxItems: 3,
  showIcon: true,
  showTitle: true,
  showDescription: true,
  showPrice: false,
  showButton: true,
  descriptionLength: 150,
  gap: '2rem',
  backgroundGradient: {
    from: 'transparent',
    to: 'transparent',
    direction: 'to-b'
  },
  overlayOpacity: '0',
  padding: {
    top: '3rem',
    bottom: '3rem'
  },
  buttonText: 'Xem chi tiết',
  buttonStyle: 'solid',
  cardStyle: {
    background: 'white',
    shadow: 'sm',
    border: 'none',
    rounded: 'lg',
    padding: '1.5rem',
    transition: 'all 0.3s ease'
  },
  iconStyle: {
    size: '2rem',
    background: 'primary',
    color: 'white',
    rounded: 'full',
    padding: '0.5rem'
  },
  titleStyle: {
    size: 'xl',
    weight: 'bold',
    color: 'gray-900',
    margin: '1rem 0'
  },
  descriptionStyle: {
    size: 'base',
    color: 'gray-600',
    margin: '0.5rem 0'
  },
  priceStyle: {
    size: 'lg',
    weight: 'bold',
    color: 'primary',
    margin: '1rem 0'
  }
};

const props = withDefaults(defineProps<Props>(), {
  config: () => ({})
});

const { locale } = useLocalization();
const { t: localT } = useI18n();
const trpc = useTrpc();

// State management
const isLoading = ref(false);
const error = ref<string | null>(null);
const services = ref<Service[]>([]);

// Merge default config with provided config
const mergedConfig = computed(() => ({
  ...defaultConfig,
  ...props.config
}));

// Fetch services data
async function fetchServices() {
  isLoading.value = true;
  error.value = null;
  try {
    const result = await trpc.service.all.query({ locale: locale.value });
    services.value = result
      .filter(service => service.isActive)
      .map((service: any) => {
        const translation = service.translations?.find(
          (t: { locale: string }) => t.locale === locale.value
        );

        return {
          ...service,
          id: Number(service.id),
          currentTranslation: translation
        } as Service;
      })
      .slice(0, mergedConfig.value.maxItems);
  } catch (err: any) {
    console.error("Failed to fetch services:", err);
    error.value = err.message || localT('errors.failed_to_load_services');
  } finally {
    isLoading.value = false;
  }
}

// Watch for locale changes
watch(locale, () => {
  fetchServices();
}, { immediate: false });

// Initialize data on component mount
onMounted(() => {
  fetchServices();
});

const handleRetry = () => {
  fetchServices();
};

const buttonVariant = computed<ButtonVariant>(() => {
  return mergedConfig.value.buttonStyle || 'solid';
});

// Computed để lấy số cột dựa trên config hoặc responsive default
const gridColumns = computed(() => {
  if (mergedConfig.value.columns) {
    return mergedConfig.value.columns;
  }
  return 3; // default columns
});

// Computed để lấy gap từ config hoặc default
const gridGap = computed(() => {
  return mergedConfig.value.gap || '2rem';
});

// Computed để tạo grid styles
const gridStyles = computed(() => ({
  display: 'grid',
  gridTemplateColumns: `repeat(${gridColumns.value}, minmax(0, 1fr))`,
  gap: gridGap.value
}));
</script>

<template>
  <section 
    class="services-section"
    :style="{
      background: `linear-gradient(${mergedConfig.backgroundGradient.direction}, ${mergedConfig.backgroundGradient.from}, ${mergedConfig.backgroundGradient.to})`,
      paddingTop: mergedConfig.padding.top,
      paddingBottom: mergedConfig.padding.bottom
    }"
  >
    <div class="container mx-auto px-4">
      <!-- Section Title -->
      <h2 v-if="mergedConfig.title" class="text-3xl font-bold text-center mb-8">
        {{ mergedConfig.title }}
      </h2>

      <!-- Loading state -->
      <div v-if="isLoading" class="flex justify-center items-center py-12">
        <Loader size="lg" />
      </div>
      
      <!-- Error state -->
      <div v-else-if="error" class="text-center text-red-500 py-8">
        <p>{{ error }}</p>
        <Button 
          @click="handleRetry" 
          variant="destructive"
          class="mt-4"
        >
          {{ localT('common.retry') }}
        </Button>
      </div>
      
      <!-- Services Grid -->
      <div 
        v-else-if="services?.length > 0" 
        class="grid"
        :style="gridStyles"
      >
        <ServiceCard
          v-for="(service, index) in (services || []).slice(0, mergedConfig.maxItems || services?.length)"
          :key="`${service.id}-${index}`"
          :service="service"
          :show-icon="mergedConfig.showIcon"
          :show-title="mergedConfig.showTitle"
          :show-description="mergedConfig.showDescription"
          :show-button="mergedConfig.showButton"
          :button-text="mergedConfig.buttonText"
          :button-variant="buttonVariant"
          :card-style="mergedConfig.cardStyle"
          :icon-style="mergedConfig.iconStyle"
          :title-style="mergedConfig.titleStyle"
          :description-style="mergedConfig.descriptionStyle"
        />
      </div>
      
      <!-- Empty state -->
      <div v-else class="text-center text-gray-500 dark:text-gray-400 py-8">
        <p>{{ localT('services.no_services') }}</p>
      </div>
    </div>
  </section>
</template>

<style lang="scss" scoped>
.services-section {
  .grid {
    @media (max-width: 1024px) {
      grid-template-columns: repeat(2, 1fr) !important;
    }
    
    @media (max-width: 640px) {
      grid-template-columns: 1fr !important;
    }
  }
}

.spinner {
  width: 48px;
  height: 48px;
  border: 4px solid rgba(var(--color-primary-500), 0.2);
  border-top-color: rgb(var(--color-primary-500));
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style> 