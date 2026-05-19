<script setup lang="ts">
import { TrendingUp, ChevronUp, ChevronDown, Calendar } from 'lucide-vue-next';
import { ref, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { usePopularPosts } from '~/composables/usePopularPosts';
import { usePost } from '~/composables/usePost';
import { formatDate } from '~/utils/date';
import type { Post } from '@ew/shared';

const props = defineProps<{
  excludeId?: number;
  limit?: number;
}>();

const { t } = useI18n();
const isExpanded = ref(true);
const { popularPosts, loading: loadingPopular, fetchPopularPosts } = usePopularPosts();
const { getTranslationByLocale, getPostUrl } = usePost();

const toggleExpanded = () => {
  isExpanded.value = !isExpanded.value;
};

onMounted(() => {
  fetchPopularPosts({ 
    limit: props.limit || 5,
    excludeId: props.excludeId 
  });
});
</script>

<template>
  <div>
    <div
      @click="toggleExpanded"
      class="flex cursor-pointer items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700"
    >
      <div class="flex items-center gap-2.5">
        <TrendingUp class="h-5 w-5 text-primary-500" />
        <h3 class="font-medium text-gray-900 dark:text-white">
          {{ t("sidebar.popularPosts") }}
        </h3>
      </div>
      <component
        :is="isExpanded ? ChevronUp : ChevronDown"
        class="h-5 w-5 text-gray-500"
      />
    </div>

    <div v-if="isExpanded" class="px-4 pb-4">
      <div v-if="loadingPopular" class="py-2">
        <ListSkeleton :item-count="props.limit || 5" :show-thumbnail="false" />
      </div>

      <div
        v-else-if="popularPosts.length === 0"
        class="py-2 text-sm text-gray-500 text-center"
      >
        {{ t("sidebar.noPopularPosts") }}
      </div>

      <ul v-else class="space-y-4">
        <li
          v-for="(post, index) in popularPosts"
          :key="post.id"
          class="border-b border-gray-100 dark:border-gray-700 last:border-0 pb-4 last:pb-0"
        >
          <NuxtLink :to="getPostUrl(post)" class="group flex items-start gap-3">
            <div
              class="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary-100 text-primary-600 dark:bg-primary-900/50 dark:text-primary-400 font-medium text-xs"
            >
              {{ index + 1 }}
            </div>

            <div class="flex-grow min-w-0 text-left">
              <h4
                class="line-clamp-2 text-sm font-medium text-gray-900 group-hover:text-primary-600 dark:text-white dark:group-hover:text-primary-400"
              >
                {{ getTranslationByLocale(post)?.title }}
              </h4>
              <p class="mt-1 flex items-center gap-1 text-xs text-gray-500">
                <Calendar :size="14" />
                {{ formatDate(post.createdAt) }}
              </p>
            </div>
          </NuxtLink>
        </li>
      </ul>
    </div>
  </div>
</template> 
