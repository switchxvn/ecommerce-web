<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useIntersectionObserver } from '@vueuse/core';

interface ButtonStyle {
  backgroundColor: string;
  color: string;
  padding: string;
  fontSize: string;
  fontWeight: string;
  borderRadius: string;
  boxShadow: string;
}

interface TitleStyle {
  color: string;
  fontSize: string;
  fontWeight: string;
  textShadow: string;
  marginBottom: string;
}

interface Overlay {
  backgroundColor: string;
  backgroundGradient: {
    from: string;
    to: string;
    direction: string;
  };
  opacity?: number;
}

interface HeroBannerConfig {
  backgroundImage: string;
  overlay: Overlay;
  height: string;
  title: string;
  titleStyle: TitleStyle;
  button: {
    text: string;
    link: string;
    style: ButtonStyle;
  };
}

const props = defineProps<{
  config?: HeroBannerConfig;
}>();

const bannerRef = ref<HTMLElement | null>(null);
const isVisible = ref(false);

onMounted(() => {
  if (bannerRef.value) {
    const { stop } = useIntersectionObserver(
      bannerRef,
      ([{ isIntersecting }]) => {
        if (isIntersecting) {
          isVisible.value = true;
          stop();
        }
      },
      { threshold: 0.2 }
    );
  }
});
</script>

<template>
  <section 
    v-if="config" 
    class="hero-banner-section py-6 md:py-8"
  >
    <div class="container mx-auto px-4">
      <div 
        ref="bannerRef"
        class="hero-banner relative w-full overflow-hidden rounded-3xl transition-all duration-700 ease-out"
        :class="{ 'opacity-0 translate-y-8': !isVisible, 'opacity-100 translate-y-0': isVisible }"
      >
        <!-- Background Image -->
        <div 
          class="absolute inset-0 bg-cover bg-top bg-no-repeat transform transition-transform duration-700 hover:scale-[1.02]"
          :style="{ backgroundImage: `url('${config.backgroundImage}')` }"
        ></div>

        <!-- Gradient Overlay -->
        <div 
          class="absolute inset-0"
          :style="{
            background: `linear-gradient(${config.overlay.backgroundGradient.direction}, ${config.overlay.backgroundGradient.from}, ${config.overlay.backgroundGradient.to})`
          }"
        ></div>

        <!-- Additional Dark Overlay for better text contrast -->
        <div 
          class="absolute inset-0 bg-black/30 backdrop-blur-[0.5px]"
          :style="{
            opacity: config.overlay.opacity || 1
          }"
        ></div>

        <!-- Content -->
        <div class="relative z-10 h-full container mx-auto px-4 flex flex-col items-center justify-center text-center py-12 md:py-16">
          <h2 
            class="max-w-4xl mx-auto mb-6 leading-tight animate-fade-in-up drop-shadow-lg"
            :style="{
              color: config.titleStyle.color,
              fontSize: config.titleStyle.fontSize,
              fontWeight: config.titleStyle.fontWeight,
              textShadow: config.titleStyle.textShadow,
              marginBottom: config.titleStyle.marginBottom
            }"
          >
            {{ config.title }}
          </h2>

          <UButton
            v-if="config.button"
            :to="config.button.link"
            class="transform transition-all duration-500 hover:scale-105 animate-fade-in-up animation-delay-300 drop-shadow-lg"
            :style="{
              backgroundColor: config.button.style.backgroundColor,
              color: config.button.style.color,
              padding: config.button.style.padding,
              fontSize: config.button.style.fontSize,
              fontWeight: config.button.style.fontWeight,
              borderRadius: config.button.style.borderRadius,
              boxShadow: config.button.style.boxShadow
            }"
          >
            {{ config.button.text }}
          </UButton>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.hero-banner {
  height: 400px;
  box-shadow: 0 20px 40px -10px rgba(0,0,0,0.1);
}

@media (max-width: 768px) {
  .hero-banner {
    height: 300px;
  }
  
  h1 {
    font-size: 2rem !important;
  }
}

@keyframes fade-in-up {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fade-in-up {
  animation: fade-in-up 0.6s ease-out forwards;
}

.animation-delay-300 {
  animation-delay: 300ms;
}
</style> 
