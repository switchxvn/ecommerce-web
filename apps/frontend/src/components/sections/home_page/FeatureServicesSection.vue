<script setup lang="ts">
import { computed } from 'vue';
import { ArrowRight } from 'lucide-vue-next';

interface FeatureService {
  icon: string;
  title: string;
  link: string;
}

interface FeatureServicesConfig {
  title: string;
  description: string;
  layout: 'grid';
  columns: number;
  services: FeatureService[];
  gap: string;
  background: {
    light: string;
    dark: string;
  };
  border: {
    light: string;
    dark: string;
  };
  padding: {
    top: string;
    bottom: string;
  };
  cardStyle: {
    height: string;
    padding: string;
    textAlign: string;
    background: {
      dark: string;
      light: string;
    };
    transition: string;
  };
  headerStyle: {
    background: {
      light: string;
      dark: string;
    };
    title: {
      fontSize: string;
      useUppercase: boolean;
      color: {
        light: string;
        dark: string;
      };
    };
    viewAll: {
      show: boolean;
      text: string;
      link: string;
    };
  };
  iconStyle: {
    height: string;
    color: {
      light: string;
      dark: string;
    };
    margin: string;
  };
  titleStyle: {
    size: string;
    weight: string;
    fontWeight: string;
    color: {
      light: string;
      dark: string;
    };
    margin: string;
    textTransform: string;
  };
  descriptionStyle: {
    size: string;
    color: {
      light: string;
      dark: string;
    };
    margin: string;
    maxWidth: string;
    padding: string;
    border: {
      width: string;
      style: string;
      color: {
        light: string;
        dark: string;
      };
      radius: string;
    };
  };
}

interface Props {
  config?: Partial<FeatureServicesConfig>;
}

const defaultConfig: FeatureServicesConfig = {
  title: '',
  description: '',
  layout: 'grid',
  columns: 4,
  services: [],
  gap: '2rem',
  background: {
    light: '#FFFFFF',
    dark: '#1a1a1a'
  },
  border: {
    light: '#FFFFFF',
    dark: '#FFFFFF'
  },
  padding: {
    top: '2rem',
    bottom: '2rem'
  },
  cardStyle: {
    height: '200px',
    padding: '1.5rem',
    textAlign: 'center',
    background: {
      dark: 'transparent',
      light: 'transparent'
    },
    transition: 'all 0.3s ease'
  },
  headerStyle: {
    background: {
      light: 'bg-primary-600',
      dark: 'dark:bg-primary-500'
    },
    title: {
      fontSize: 'text-2xl sm:text-3xl',
      useUppercase: true,
      color: {
        light: 'text-white',
        dark: 'text-white'
      }
    },
    viewAll: {
      show: false,
      text: 'Xem tất cả',
      link: '/services'
    }
  },
  iconStyle: {
    height: '5rem',
    color: {
      light: '#FFFFFF',
      dark: '#FFFFFF'
    },
    margin: '0 auto 1rem auto'
  },
  titleStyle: {
    size: 'lg',
    weight: 'bold',
    fontWeight: '700',
    color: {
      light: '#111827',
      dark: '#F9FAFB'
    },
    margin: '1rem 0',
    textTransform: 'uppercase'
  },
  descriptionStyle: {
    size: 'base',
    color: {
      light: '#333333',
      dark: '#FFFFFF'
    },
    margin: '2rem auto 0',
    maxWidth: '1200px',
    padding: '1.5rem',
    border: {
      width: '1px',
      style: 'solid',
      color: {
        light: '#017399',
        dark: '#FFFFFF'
      },
      radius: '0.5rem'
    }
  }
};

const props = withDefaults(defineProps<Props>(), {
  config: () => ({})
});

// Merge default config with provided config
const mergedConfig = computed(() => ({
  ...defaultConfig,
  ...props.config
}));

// Computed styles for grid
const gridStyles = computed(() => ({
  display: 'grid',
  gridTemplateColumns: `repeat(${mergedConfig.value.columns}, minmax(0, 1fr))`,
  gap: mergedConfig.value.gap
}));
</script>

<template>
  <section 
    class="feature-services-section"
    :style="{
      paddingTop: mergedConfig.padding.top,
      paddingBottom: mergedConfig.padding.bottom
    }"
  >
    <div class="container mx-auto px-4">
      <!-- Section Header -->
      <div class="mb-8" :class="mergedConfig.headerStyle.background.light">
        <div class="container mx-auto px-4">
          <div class="flex items-center justify-between gap-4 py-3">
            <div class="w-32 hidden sm:block"><!-- Spacer --></div>
            <div class="category-header flex-1 text-center">
              <h2 
                class="inline-flex items-center px-4 py-2 mobile-title"
                :class="[
                  mergedConfig.headerStyle.title.fontSize,
                  'font-bold',
                  mergedConfig.headerStyle.title.color.light,
                  mergedConfig.headerStyle.title.useUppercase ? 'uppercase' : ''
                ]"
              >
                {{ mergedConfig.title }}
              </h2>
            </div>
            <div v-if="mergedConfig.headerStyle.viewAll.show" class="w-32 flex justify-end">
              <NuxtLink
                :to="mergedConfig.headerStyle.viewAll.link"
                class="mobile-view-all inline-flex items-center justify-center px-4 py-2 text-xs sm:text-lg font-semibold uppercase tracking-wider text-white hover:text-primary-100 transition-colors duration-200 whitespace-nowrap"
              >
                {{ mergedConfig.headerStyle.viewAll.text }}
                <ArrowRight class="ml-1 h-3 w-3 sm:h-5 sm:w-5" aria-hidden="true" />
              </NuxtLink>
            </div>
            <div v-else class="w-32"><!-- Spacer --></div>
          </div>
        </div>
      </div>
      
      <!-- Services Grid -->
      <div 
        class="grid"
        :style="gridStyles"
      >
        <div
          v-for="(service, index) in mergedConfig.services"
          :key="index"
          class="feature-service-card"
          :style="{
            textAlign: mergedConfig.cardStyle.textAlign as any,
            background: mergedConfig.cardStyle.background.light,
            transition: mergedConfig.cardStyle.transition
          }"
        >
          <NuxtLink :to="service.link" class="service-link">
            <div class="image-wrapper">
              <img 
                class="service-image"
                :src="service.icon" 
                :alt="service.title"
              />
            </div>

            <!-- Title -->
            <h3 
              class="service-title"
              :style="{
                fontSize: `var(--text-${mergedConfig.titleStyle.size})`,
                fontWeight: mergedConfig.titleStyle.fontWeight,
                color: mergedConfig.titleStyle.color.light,
                margin: mergedConfig.titleStyle.margin,
                textTransform: mergedConfig.titleStyle.textTransform as any
              }"
            >
              {{ service.title }}
            </h3>
          </NuxtLink>
        </div>
      </div>

      <!-- Description Box -->
      <div 
        v-if="mergedConfig.description"
        class="description-box"
        :style="{
          margin: mergedConfig.descriptionStyle.margin,
          maxWidth: mergedConfig.descriptionStyle.maxWidth,
          padding: mergedConfig.descriptionStyle.padding,
          fontSize: `var(--text-${mergedConfig.descriptionStyle.size})`,
          color: mergedConfig.descriptionStyle.color.light,
          borderWidth: mergedConfig.descriptionStyle.border.width,
          borderStyle: mergedConfig.descriptionStyle.border.style,
          borderColor: mergedConfig.descriptionStyle.border.color.light,
          borderRadius: mergedConfig.descriptionStyle.border.radius
        }"
        v-html="mergedConfig.description"
      />
    </div>
  </section>
</template>

<style lang="scss" scoped>
.feature-services-section {
  font-family: var(--font-primary);
  background-color: v-bind('mergedConfig.background.light');

  // Add consistent font sizing
  --text-lg: 1.125rem;
  --text-base: 1rem;
  --text-sm: 0.875rem;
  --text-xs: 0.75rem;

  :deep(.dark) & {
    background-color: v-bind('mergedConfig.background.dark');

    .description-box {
      color: v-bind('mergedConfig.descriptionStyle.color.dark');
      border-color: v-bind('mergedConfig.descriptionStyle.border.color.dark');
    }

    .feature-service-card {
      background: v-bind('mergedConfig.cardStyle.background.dark');
    }

    .service-title {
      color: v-bind('mergedConfig.titleStyle.color.dark');
    }
  }

  .category-header {
    @media (max-width: 640px) {
      text-align: left !important;
      
      h2.mobile-title {
        font-size: var(--text-sm) !important;
        line-height: 1.25rem !important;
        padding: 0.375rem 0 !important;
        justify-content: flex-start !important;
        letter-spacing: 0.025em !important;
        font-weight: 600 !important;
      }
    }
  }

  .mobile-view-all {
    @media (max-width: 640px) {
      font-size: var(--text-xs) !important;
      line-height: 1rem !important;
      padding: 0.25rem 0.75rem !important;
      font-weight: 500 !important;
      letter-spacing: 0.025em !important;
    }
  }

  .grid {
    @media (max-width: 1024px) {
      grid-template-columns: repeat(2, 1fr) !important;
    }
    
    @media (max-width: 640px) {
      grid-template-columns: 1fr !important;
    }
  }
}

.feature-service-card {
  text-align: center;
  display: block;
  font-family: inherit;

  &:hover {
    transform: translateY(-4px);
  }

  .service-link {
    display: block;
    width: 100%;
  }

  .image-wrapper {
    width: 100%;
    aspect-ratio: 4 / 3;
    overflow: hidden;
    border-radius: 0.5rem;
    background: #e5e7eb;
  }

  .service-image {
    width: 100%;
    height: 100%;
    display: block;
    object-fit: cover;
    transition: transform 0.3s ease;
  }

  &:hover .service-image {
    transform: scale(1.04);
  }

  .service-title {
    font-family: inherit;
    line-height: 1.5;
  }
}

.description-box {
  text-align: justify;
  line-height: 1.6;
  font-family: inherit;

  :deep(p) {
    margin-bottom: 1rem;

    &:last-child {
      margin-bottom: 0;
    }
  }
}
</style> 
