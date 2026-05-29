<template>
  <div class="food-menu-item">
    <div class="food-menu-border">
      <a 
        href="#"
        @click.prevent="openPhotoSwipe"
      >
        <NuxtImg
          :src="imageUrl"
          :alt="name"
          class="food-menu-image"
        />
      </a>
    </div>
    <h3 class="food-menu-title">{{ name }}</h3>
    <div class="food-menu-price">
      {{ formatPrice(price) }}
    </div>
  </div>

  <!-- PhotoSwipe Template -->
  <div class="pswp" tabindex="-1" role="dialog" aria-hidden="true">
    <div class="pswp__bg"></div>
    <div class="pswp__scroll-wrap">
      <div class="pswp__container">
        <div class="pswp__item"></div>
        <div class="pswp__item"></div>
        <div class="pswp__item"></div>
      </div>
      <div class="pswp__ui pswp__ui--hidden">
        <div class="pswp__top-bar">
          <div class="pswp__counter"></div>
          <button class="pswp__button pswp__button--close" title="Close (Esc)"></button>
          <button class="pswp__button pswp__button--share" title="Share"></button>
          <button class="pswp__button pswp__button--fs" title="Toggle fullscreen"></button>
          <button class="pswp__button pswp__button--zoom" title="Zoom in/out"></button>
          <div class="pswp__preloader">
            <div class="pswp__preloader__icn">
              <div class="pswp__preloader__cut">
                <div class="pswp__preloader__donut"></div>
              </div>
            </div>
          </div>
        </div>
        <div class="pswp__share-modal pswp__share-modal--hidden pswp__single-tap">
          <div class="pswp__share-tooltip"></div>
        </div>
        <button class="pswp__button pswp__button--arrow--left" title="Previous (arrow left)"></button>
        <button class="pswp__button pswp__button--arrow--right" title="Next (arrow right)"></button>
        <div class="pswp__caption">
          <div class="pswp__caption__center"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import PhotoSwipe from 'photoswipe';
import 'photoswipe/dist/photoswipe.css';

interface Props {
  imageUrl: string;
  name: string;
  description?: string;
  price: number;
}

const props = defineProps<Props>();

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(price);
};

// Function to get image dimensions
const getImageDimensions = (url: string): Promise<{ width: number; height: number }> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.width, height: img.height });
    };
    img.onerror = () => {
      resolve({ width: 800, height: 600 }); // Default fallback size
    };
    img.src = url;
  });
};

// Initialize PhotoSwipe
const openPhotoSwipe = async () => {
  const dimensions = await getImageDimensions(props.imageUrl);
  
  const options = {
    dataSource: [{
      src: props.imageUrl,
      w: dimensions.width,
      h: dimensions.height,
      alt: props.name
    }],
    pswpModule: PhotoSwipe,
    showHideAnimationType: 'fade' as const,
    showAnimationDuration: 300,
    hideAnimationDuration: 300,
    closeOnVerticalDrag: true,
    allowPanToNext: true,
    allowMouseDrag: true,
    maxZoomLevel: 3,
    scaleMode: 'fit' as const
  };

  const lightbox = new PhotoSwipe(options);
  lightbox.init();
};
</script>

<style scoped>
.food-menu-item {
  width: 100%;
  max-width: 320px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.food-menu-border {
  position: relative;
  width: 100%;
  aspect-ratio: 1;
  padding: 1.5rem;
}

.food-menu-border::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image: url('/images/others/af-spp.png');
  background-size: 100% 100%;
  background-repeat: no-repeat;
  pointer-events: none;
}

.food-menu-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 50%;
}

.food-menu-title {
  margin-top: 1rem;
  font-size: 1.5rem;
  font-weight: bold;
  text-align: center;
  color: #B8860B;
  text-transform: uppercase;
}

.food-menu-price {
  margin-top: 0.5rem;
  font-size: 1.25rem;
  font-weight: 600;
  text-align: center;
  color: #B8860B;
}

/* PhotoSwipe overrides */
:deep(.pswp) {
  --pswp-bg: rgba(0, 0, 0, 0.85);
  
  .pswp__img {
    object-fit: contain !important;
    border-radius: 8px;
    max-height: 90vh !important;
    max-width: 90vw !important;
  }
  
  .pswp__zoom-wrap {
    display: flex;
    align-items: center;
    justify-content: center;
  }
}
</style> 
