<script setup lang="ts">
import { useHead } from '@unhead/vue'
import { useLocalization } from '../composables/useLocalization';
import ZoomableImage from '../components/common/ZoomableImage.vue';
import { useTheme } from '../composables/useTheme';
import { ref, onMounted, computed } from 'vue';

const { t } = useLocalization();
const { isDark } = useTheme();

// Màu sắc RGB cụ thể cho primary
const primaryRGB = {
  light: {
    main: 'rgb(234, 88, 12)', // Orange-600
    decoration: 'linear-gradient(90deg, rgb(249, 115, 22), rgb(234, 88, 12), rgb(194, 65, 12))' // Orange-500 to Orange-700
  },
  dark: {
    main: 'rgb(249, 115, 22)', // Orange-500
    decoration: 'linear-gradient(90deg, rgb(251, 146, 60), rgb(249, 115, 22), rgb(234, 88, 12))' // Orange-400 to Orange-600
  }
};

// Sử dụng màu RGB dựa trên chế độ
const titleColor = computed(() =>
  isDark.value ? primaryRGB.dark.main : primaryRGB.light.main
);

const decorationGradient = computed(() =>
  isDark.value ? primaryRGB.dark.decoration : primaryRGB.light.decoration
);

useHead({
  title: t('map.title'),
  meta: [
    { name: 'description', content: t('map.description') }
  ]
});
</script>

<template>
  <div class="container mx-auto px-4 py-8">
    <div class="title-container mb-6">
      <h1 class="text-3xl md:text-4xl font-bold text-center uppercase main-title" :style="{ color: titleColor }">
        {{ t('map.title') }}
      </h1>
      <div class="title-decoration" :style="{ background: decorationGradient }"></div>
    </div>

    <div class="flex justify-center mb-8">
      <p class="text-lg text-center max-w-3xl">
        {{ t('map.description') }}
      </p>
    </div>

    <div class="map-container mx-auto shadow-lg rounded-lg overflow-hidden">
      <ZoomableImage
        src="https://cdn.captreonuisam.com/maps/z6543989555098_8a3f117355c3f449457a1bf3200486c4.jpg"
        alt="Bản đồ khu du lịch Cáp Treo Núi Sam"
        :maxScale="2.5"
      />
    </div>

  </div>
</template>

<style scoped>
.map-container {
  max-width: 1200px;
  border: 1px solid #e2e8f0;
  margin-top: 2rem;
  margin-bottom: 2rem;
}

.title-container {
  position: relative;
  padding-bottom: 1.5rem;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.title-decoration {
  height: 4px;
  width: 120px;
  border-radius: 2px;
  margin-top: 1rem;
}

.main-title {
  letter-spacing: 0.05em;
  font-weight: 800;
  text-shadow: 1px 1px 3px rgba(0, 0, 0, 0.2);
  position: relative;
  padding: 0.5rem 1rem;
}

/* Responsive styling */
@media (max-width: 768px) {
  h1 {
    font-size: 1.75rem;
  }

  .map-container {
    border-radius: 0.5rem;
  }
}
</style>
