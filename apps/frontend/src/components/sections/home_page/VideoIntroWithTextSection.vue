<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue';
import { useColorMode } from '@vueuse/core';
import { useCssColorValue } from '~/composables/useColorUtils';

interface Video {
  id: number;
  title: string;
  description?: string;
  videoUrl: string;
  thumbnailUrl?: string;
  isActive: boolean;
  order: number;
}

interface VideoIntroConfig {
  layout: "split-columns";
  textColumnWidth: string;
  videoColumnWidth: string;
  description: string;
  buttonText?: string;
  buttonLink?: string;
  backgroundColor?: string;
  textColor?: string;
  themeId?: number;
  border?: {
    width: string;
    style: string;
    color: string;
    radius: string;
  };
  darkMode?: {
    backgroundColor?: string;
    textColor?: string;
    accentColor?: string;
    buttonStyle?: {
      backgroundColor?: string;
      textColor?: string;
    };
  };
  buttonStyle?: {
    padding: string;
    fontSize: string;
    fontWeight: string;
    backgroundColor?: string;
    textColor?: string;
  };
  videoSettings: {
    autoplay: boolean;
    interval: number;
    showDots: boolean;
    showArrows: boolean;
    maxVideos: number;
  };
  videos: Video[];
}

const props = defineProps<{
  config?: VideoIntroConfig;
}>();

const colorMode = useColorMode();
const isDark = computed(() => colorMode.value === 'dark');
const { processColorValue } = useCssColorValue();

const currentSlideIndex = ref(0);
const videos = ref<Video[]>([]);
const isLoading = ref(false);
const error = ref<Error | null>(null);
const contentRef = ref<HTMLElement | null>(null);
const showFade = ref(false);

const fetchVideos = () => {
  try {
    isLoading.value = true;
    if (props.config?.videos) {
      videos.value = props.config.videos.filter(video => video.isActive)
        .sort((a, b) => a.order - b.order)
        .slice(0, props.config.videoSettings.maxVideos);
    }
  } catch (err) {
    console.error('Error processing videos:', err);
    error.value = err as Error;
  } finally {
    isLoading.value = false;
  }
};

const checkScroll = () => {
  if (!contentRef.value) return;
  const element = contentRef.value;
  const hasMoreContent = element.scrollHeight > element.clientHeight;
  const scrollPosition = element.scrollTop;
  const maxScroll = element.scrollHeight - element.clientHeight;
  
  showFade.value = hasMoreContent && scrollPosition < maxScroll - 20;
};

onMounted(() => {
  fetchVideos();
  nextTick(() => {
    checkScroll();
  });
});

const sectionClasses = computed(() => {
  const baseClasses = ['video-intro-with-text', 'py-16', 'transition-colors', 'duration-300'];
  
  if (props.config) {
    if (isDark.value && props.config.darkMode?.backgroundColor) {
      baseClasses.push('dark:bg-opacity-100');
      baseClasses.push(`dark:${props.config.darkMode.backgroundColor}`);
    } else {
      baseClasses.push(props.config.backgroundColor || 'bg-white dark:bg-gray-900');
    }
  } else {
    baseClasses.push('bg-white dark:bg-gray-900');
  }
  
  return baseClasses.join(' ');
});

const getButtonStyles = (config: VideoIntroConfig) => {
  if (!config.buttonStyle) return {};

  interface ButtonStyles {
    padding: string;
    fontSize: string;
    fontWeight: string;
    backgroundColor?: string;
    color?: string;
  }

  const buttonStyles: ButtonStyles = {
    padding: config.buttonStyle.padding,
    fontSize: config.buttonStyle.fontSize,
    fontWeight: config.buttonStyle.fontWeight,
  };

  if (isDark.value && config.darkMode?.buttonStyle) {
    return {
      ...buttonStyles,
      backgroundColor: processColorValue(config.darkMode.buttonStyle.backgroundColor || ''),
      color: processColorValue(config.darkMode.buttonStyle.textColor || ''),
    };
  }

  if (config.buttonStyle.backgroundColor) {
    buttonStyles.backgroundColor = processColorValue(config.buttonStyle.backgroundColor);
  }
  if (config.buttonStyle.textColor) {
    buttonStyles.color = processColorValue(config.buttonStyle.textColor);
  }

  return buttonStyles;
};

const currentBorderStyles = computed(() => {
  if (!props.config?.border) return {};

  const borderColor = isDark.value && props.config.darkMode?.accentColor
    ? processColorValue(props.config.darkMode.accentColor)
    : processColorValue(props.config.border.color);

  return {
    border: `${props.config.border.width} ${props.config.border.style} ${borderColor}`,
    borderRadius: props.config.border.radius,
    padding: "3rem",
  };
});

const getVideoId = (url: string): string | null => {
  if (!url) return null;
  
  try {
    let videoId: string | null = null;
    
    if (url.includes('youtube.com')) {
      videoId = url.split('v=')[1]?.split('&')[0] || null;
    } else if (url.includes('youtu.be')) {
      videoId = url.split('/').pop() || null;
    }
    
    return videoId;
  } catch (error) {
    console.error('Error extracting video ID:', error);
    return null;
  }
};

const getEmbedUrl = (url: string): string => {
  const videoId = getVideoId(url);
  if (!videoId) return '';
  
  const params = new URLSearchParams({
    autoplay: '0',
    rel: '0',
    modestbranding: '1',
    enablejsapi: '1'
  });
  
  return `https://www.youtube.com/embed/${videoId}?${params.toString()}`;
};

const handleImageError = (event: Event) => {
  const imgElement = event.target as HTMLImageElement;
  imgElement.src = "https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?q=80&w=400&auto=format&fit=crop";
};
</script>

<template>
  <section v-if="config" :class="sectionClasses">
    <div class="container mx-auto px-4 overflow-hidden">
      <div class="flex flex-col md:flex-row gap-8">
        <!-- Text Column -->
        <div class="prose dark:prose-invert max-w-none flex-shrink-0 bg-white dark:bg-gray-800 shadow-lg flex flex-col rounded-2xl relative max-h-[400px] w-full md:column-width-text"
             :style="{
               ...currentBorderStyles,
               '--column-width-text': config.textColumnWidth || '60%'
             }">
          <div class="p-8 md:p-12 flex flex-col h-full">
            <!-- Scrollable Content -->
            <div 
              ref="contentRef"
              class="flex-1 overflow-y-auto relative pr-4 scrollbar-thin min-h-0"
              @scroll="checkScroll"
            >
              <div v-html="config.description" class="prose-lg"></div>
             
            </div>
            
            <!-- Fixed Button -->
            <UButton
              v-if="config.buttonText && config.buttonLink"
              :to="config.buttonLink"
              color="primary"
              variant="solid"
              class="mt-8 inline-flex items-center justify-center px-6 py-3 text-base font-medium transition-all duration-300 hover:transform hover:scale-105 uppercase"
              :style="getButtonStyles(config)"
            >
              {{ config.buttonText }}
            </UButton>
          </div>
        </div>

        <!-- Video Column -->
        <div class="relative flex-shrink-0 w-full md:column-width-video"
             :style="{ '--column-width-video': config.videoColumnWidth || '40%' }">
          <div v-if="isLoading" class="flex justify-center items-center h-[400px] rounded-2xl bg-gray-100 dark:bg-gray-800">
            <Loader size="lg" />
          </div>

          <div v-else-if="error" class="text-red-500 text-center p-8 h-[400px] flex items-center justify-center rounded-2xl bg-red-50 dark:bg-red-900/20">
            {{ error.message }}
          </div>

          <div v-else-if="videos.length === 0" class="h-[400px] rounded-2xl overflow-hidden bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
            <p class="text-gray-500 dark:text-gray-400">Không có video nào</p>
          </div>

          <div v-else class="h-[400px] rounded-2xl overflow-hidden">
            <!-- Video Slides -->
            <TransitionGroup name="fade">
              <div
                v-for="(video, index) in videos"
                :key="video.id"
                v-show="currentSlideIndex === index"
                class="h-full w-full bg-gray-900 rounded-2xl overflow-hidden shadow-xl relative"
              >
                <!-- YouTube iframe -->
                <iframe
                  v-if="getVideoId(video.videoUrl)"
                  :src="getEmbedUrl(video.videoUrl)"
                  class="w-full h-full"
                  :title="video.title"
                  frameborder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowfullscreen
                ></iframe>
                <!-- Regular video or fallback image -->
                <template v-else>
                  <video
                    v-if="video.videoUrl"
                    class="w-full h-full object-contain"
                    :src="video.videoUrl"
                    :poster="video.thumbnailUrl"
                    controls
                    muted
                    loop
                  ></video>
                  <img
                    v-else
                    :src="video.thumbnailUrl"
                    :alt="video.title"
                    class="w-full h-full object-contain"
                    @error="handleImageError"
                  />
                </template>
              </div>
            </TransitionGroup>

            <!-- Navigation Arrows -->
            <div
              v-if="config.videoSettings.showArrows && videos.length > 1"
              class="absolute inset-0 flex items-center justify-between p-4 pointer-events-none z-10"
            >
              <button
                class="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/90 hover:bg-white text-primary-600 flex items-center justify-center opacity-75 hover:opacity-100 pointer-events-auto transition-all duration-300 shadow-lg"
                @click="currentSlideIndex = (currentSlideIndex - 1 + videos.length) % videos.length"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                class="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/90 hover:bg-white text-primary-600 flex items-center justify-center opacity-75 hover:opacity-100 pointer-events-auto transition-all duration-300 shadow-lg"
                @click="currentSlideIndex = (currentSlideIndex + 1) % videos.length"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            <!-- Navigation Dots -->
            <div
              v-if="config.videoSettings.showDots && videos.length > 1"
              class="absolute bottom-4 left-0 right-0 flex justify-center gap-3 z-10"
            >
              <button
                v-for="(_, index) in videos"
                :key="index"
                class="w-3 h-3 rounded-full transition-all duration-300 shadow-md"
                :class="[
                  currentSlideIndex === index
                    ? 'bg-white scale-110'
                    : 'bg-white/50 hover:bg-white/75'
                ]"
                @click="currentSlideIndex = index"
              ></button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style>
.video-intro-with-text {
  @apply bg-gray-50 dark:bg-gray-900;
}

.video-intro-with-text :deep(.prose) {
  --tw-prose-body: var(--text);
  --tw-prose-headings: var(--text);
  --tw-prose-links: var(--primary);
}

.video-intro-with-text .scrollbar-thin {
  scrollbar-width: thin;
  scrollbar-color: theme('colors.gray.300') theme('colors.gray.100');
}

.video-intro-with-text .scrollbar-thin::-webkit-scrollbar {
  width: 6px;
}

.video-intro-with-text .scrollbar-thin::-webkit-scrollbar-track {
  background: theme('colors.gray.100');
  border-radius: 3px;
}

.video-intro-with-text .scrollbar-thin::-webkit-scrollbar-thumb {
  background-color: theme('colors.gray.300');
  border-radius: 3px;
}

.dark .video-intro-with-text .scrollbar-thin::-webkit-scrollbar-track {
  background: theme('colors.gray.700');
}

.dark .video-intro-with-text .scrollbar-thin::-webkit-scrollbar-thumb {
  background-color: theme('colors.gray.600');
}

.video-intro-with-text :deep(.prose h1) {
  @apply text-4xl font-bold mb-6;
}

.video-intro-with-text :deep(.prose h2) {
  @apply text-3xl font-semibold mb-4;
}

.video-intro-with-text :deep(.prose p) {
  @apply mb-4 text-lg leading-relaxed;
}

.dark .video-intro-with-text :deep(.prose) {
  --tw-prose-body: var(--text);
  --tw-prose-headings: var(--text);
  --tw-prose-links: var(--primary);
}

/* Custom column width classes for desktop */
@media (min-width: 768px) {
  .video-intro-with-text .md\:column-width-text {
    width: var(--column-width-text) !important;
  }
  
  .video-intro-with-text .md\:column-width-video {
    width: var(--column-width-video) !important;
  }
}

/* Make columns stack on mobile */
@media (max-width: 768px) {
  .video-intro-with-text .flex-col {
    @apply gap-4;
  }
  
  .video-intro-with-text .p-8 {
    @apply p-6;
  }

  .video-intro-with-text .md\:p-12 {
    @apply p-6;
  }

  .video-intro-with-text .max-h-\[400px\] {
    max-height: none !important;
  }
  
  .video-intro-with-text .overflow-hidden {
    overflow: hidden !important;
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Video container styles */
.video-intro-with-text iframe,
.video-intro-with-text video,
.video-intro-with-text img {
  @apply bg-gray-900;
}

/* Loading and error states */
.video-intro-with-text .loader {
  @apply text-primary-600;
}

.video-intro-with-text .error {
  @apply text-red-500 bg-red-50 dark:bg-red-900/20 rounded-2xl p-4;
}

.fade-bottom {
  transition: opacity 0.3s ease;
}

.video-intro-with-text .prose-content::-webkit-scrollbar {
  width: 6px;
}

.video-intro-with-text .prose-content::-webkit-scrollbar-track {
  background: transparent;
}

.video-intro-with-text .prose-content::-webkit-scrollbar-thumb {
  background-color: theme('colors.gray.300');
  border-radius: 3px;
}

.dark .video-intro-with-text .prose-content::-webkit-scrollbar-thumb {
  background-color: theme('colors.gray.600');
}
</style> 