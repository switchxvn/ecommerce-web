<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import { setResponseStatus } from 'h3';
import { useRequestEvent } from 'nuxt/app';
import { useRoute, useRouter } from 'vue-router';
import { SearchX, FilterX } from 'lucide-vue-next';
import type { Post, Tag } from '@ew/shared';

import Breadcrumb from '../../components/common/Breadcrumb.vue';
import PostSidebar from '../../components/sidebar/PostSidebar.vue';
import PostCard from '../../components/ui/card/PostCard.vue';
import PostCardSkeleton from '../../components/ui/skeleton/PostCardSkeleton.vue';
import { useLocalization } from '../../composables/useLocalization';
import { useTrpc } from '../../composables/useTrpc';
import { usePageSeo } from '~/composables/usePageSeo';
import { buildCollectionPageSchema } from '~/utils/seo';

definePageMeta({
  layout: 'default',
});

interface BreadcrumbItem {
  label: string;
  to?: string;
  active?: boolean;
}

const { t, locale } = useLocalization();
const trpc = useTrpc();
const route = useRoute();
const router = useRouter();
const requestEvent = useRequestEvent();
const siteUrl = useRuntimeConfig().public.siteUrl;
const slug = computed(() => route.params.slug as string);

const filters = reactive({
  search: typeof route.query.search === 'string' ? route.query.search : '',
  categories: typeof route.query.categories === 'string' ? route.query.categories.split(',').filter(Boolean) : [],
  tags: [slug.value],
  sort: typeof route.query.sort === 'string' ? route.query.sort : 'newest',
  page: Number(route.query.page) || 1,
  limit: Number(route.query.limit) || 12,
});

const posts = ref<Post[]>([]);
const isLoading = ref(false);
const totalPosts = ref(0);
const totalPages = ref(0);
const shouldResetSidebar = ref(false);

const { data: tag, error: tagError } = await useAsyncData<Tag | null>(
  `tag-${slug.value}`,
  () => trpc.settings.getTagBySlug.query(slug.value),
  {
    watch: [slug],
    default: () => null,
  },
);

const tagData = computed(() => tag.value);
const isInvalidTag = computed(() => !tagData.value || Boolean(tagError.value));

if (requestEvent && isInvalidTag.value) {
  setResponseStatus(requestEvent, 404);
}

const pageTitle = computed(() => tagData.value?.name || slug.value);
const pageDescription = computed(() =>
  tagData.value?.description
  || `${t('posts.title')} - #${tagData.value?.name || slug.value}`,
);

const breadcrumbs = computed<BreadcrumbItem[]>(() => [
  { label: t('posts.title'), to: '/posts' },
  { label: pageTitle.value, to: route.path, active: true },
]);

const tagSlugByLocale = computed(() => ({
  vi: slug.value,
  en: slug.value,
}));

usePageSeo({
  title: pageTitle,
  description: pageDescription,
  ogTitle: pageTitle,
  ogDescription: pageDescription,
  currentPath: computed(() => route.path),
  locale: computed(() => (locale.value === 'en' ? 'en' : 'vi')),
  slugByLocale: tagSlugByLocale,
  breadcrumbs: computed(() => [
    { name: t('common.home') || 'Home', item: '/' },
    { name: t('posts.title'), item: '/posts' },
    { name: pageTitle.value, item: route.path },
  ]),
  schemas: computed(() => isInvalidTag.value ? [] : [
    buildCollectionPageSchema(siteUrl, pageTitle.value, pageDescription.value, `${siteUrl}${route.path}`, true),
  ]),
});

const transformPost = (post: any): Post => ({
  ...post,
  author: post.author ? {
    ...post.author,
    lastLoginAt: post.author.lastLoginAt ? new Date(post.author.lastLoginAt) : null,
  } : null,
});

const fetchPosts = async () => {
  if (isInvalidTag.value) {
    posts.value = [];
    totalPosts.value = 0;
    totalPages.value = 0;
    return;
  }

  isLoading.value = true;

  try {
    const result = await trpc.post.byLocale.query({
      locale: locale.value,
      page: filters.page,
      limit: filters.limit,
      search: filters.search || undefined,
      categories: filters.categories.length > 0 ? filters.categories.join(',') : undefined,
      sort: filters.sort,
      tags: slug.value,
    });

    posts.value = Array.isArray(result.items) ? result.items.map(transformPost) : [];
    totalPosts.value = result.total || 0;
    totalPages.value = result.totalPages || 0;
  } finally {
    isLoading.value = false;
  }
};

const updateQueryParams = () => {
  const query: Record<string, string> = {};

  if (filters.search) {
    query.search = filters.search;
  }

  if (filters.categories.length > 0) {
    query.categories = filters.categories.join(',');
  }

  if (filters.sort !== 'newest') {
    query.sort = filters.sort;
  }

  if (filters.page > 1) {
    query.page = String(filters.page);
  }

  if (filters.limit !== 12) {
    query.limit = String(filters.limit);
  }

  router.replace({ query });
};

const handleFilterChange = (newFilters: {
  search?: string;
  categories?: string[];
  page?: number;
}) => {
  filters.search = newFilters.search || '';
  filters.categories = newFilters.categories || [];
  filters.tags = [slug.value];
  filters.page = newFilters.page || 1;
  updateQueryParams();
};

const resetAllFilters = () => {
  shouldResetSidebar.value = true;
  filters.search = '';
  filters.categories = [];
  filters.tags = [slug.value];
  filters.page = 1;
  filters.sort = 'newest';
  updateQueryParams();
  fetchPosts();
};

const handlePageChange = (page: number) => {
  filters.page = page;
  updateQueryParams();
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

const handleSortChange = (event: Event) => {
  const target = event.target as HTMLSelectElement;
  filters.sort = target.value;
  filters.page = 1;
  updateQueryParams();
};

watch(
  () => route.query,
  (query) => {
    filters.search = typeof query.search === 'string' ? query.search : '';
    filters.categories = typeof query.categories === 'string' ? query.categories.split(',').filter(Boolean) : [];
    filters.sort = typeof query.sort === 'string' ? query.sort : 'newest';
    filters.page = Number(query.page) || 1;
    filters.limit = Number(query.limit) || 12;
    filters.tags = [slug.value];
    fetchPosts();
  },
  { immediate: true },
);

watch([slug, locale], () => {
  filters.tags = [slug.value];
  fetchPosts();
});
</script>

<template>
  <div class="bg-gray-50 dark:bg-gray-900">
    <div class="container mx-auto px-4 py-8">
      <div class="mb-6 w-full">
        <Breadcrumb
          :items="breadcrumbs"
          variant="default"
          class="text-sm md:text-base"
        />
      </div>

      <div class="mb-12 space-y-4">
        <h1 class="text-4xl md:text-5xl font-bold text-primary-500 leading-tight">
          {{ pageTitle }}
        </h1>
        <div v-if="pageDescription" class="text-lg md:text-xl text-gray-600 leading-relaxed w-full">
          <p class="first-letter-styled">
            {{ pageDescription }}
          </p>
        </div>
        <div class="flex items-center gap-4 text-sm text-gray-500 border-t border-gray-200 pt-4 mt-2">
          <span class="flex items-center">
            <span class="mr-2 text-primary-600 font-semibold">#</span>
            {{ t('posts.totalPosts', { count: totalPosts }) }}
          </span>
        </div>
      </div>

      <div v-if="isInvalidTag" class="rounded-xl border border-red-200 bg-white px-6 py-10 text-center">
        <h2 class="text-2xl font-semibold text-gray-900">
          {{ locale === 'vi' ? 'Không tìm thấy tag' : 'Tag not found' }}
        </h2>
        <p class="mt-3 text-gray-600">
          {{ locale === 'vi' ? 'Đường dẫn tag này không tồn tại hoặc đã bị tắt.' : 'This tag does not exist or is no longer active.' }}
        </p>
      </div>

      <div v-else class="flex flex-col lg:flex-row gap-8">
        <div class="flex-1 lg:max-w-[calc(100%-352px)]">
          <div class="mb-6 flex items-center justify-between gap-4">
            <div class="text-sm text-gray-500">
              {{ t('posts.totalPosts', { count: totalPosts }) }}
            </div>
            <select
              :value="filters.sort"
              class="rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700"
              @change="handleSortChange"
            >
              <option value="newest">{{ t('sort.newest') }}</option>
              <option value="oldest">{{ t('sort.oldest') }}</option>
              <option value="title_asc">{{ t('sort.title_asc') }}</option>
              <option value="title_desc">{{ t('sort.title_desc') }}</option>
            </select>
          </div>

          <div v-if="!isLoading && posts.length > 0" class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <PostCard
              v-for="(post, index) in posts"
              :key="`post-${post.id}`"
              :post="post"
              :priority="index === 0"
              class="h-full"
            />
          </div>

          <div v-else-if="isLoading" class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <PostCardSkeleton v-for="n in 6" :key="`skeleton-${n}`" />
          </div>

          <div v-else class="flex flex-col items-center justify-center py-16 px-4 text-center">
            <div class="bg-gray-100 dark:bg-gray-800 rounded-full p-4 mb-4">
              <SearchX class="w-12 h-12 text-gray-400 dark:text-gray-500" />
            </div>
            <h3 class="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2">
              {{ t('posts.noPostsFound') }}
            </h3>
            <p class="text-gray-600 dark:text-gray-400 max-w-md mb-6">
              {{ t('posts.noPostsFoundDescription') }}
            </p>
            <button
              class="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-md transition-colors duration-200"
              @click="resetAllFilters"
            >
              <FilterX class="w-4 h-4" />
              {{ t('posts.resetFilters') }}
            </button>
          </div>

          <div v-if="totalPages > 1" class="mt-8 flex justify-center">
            <div class="flex items-center gap-2">
              <button
                v-for="page in totalPages"
                :key="`page-${page}`"
                :class="[
                  'px-4 py-2 rounded-md',
                  filters.page === page
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                ]"
                @click="handlePageChange(page)"
              >
                {{ page }}
              </button>
            </div>
          </div>
        </div>

        <div class="lg:w-[320px] flex-shrink-0">
          <PostSidebar
            :initial-filters="filters"
            :should-reset="shouldResetSidebar"
            @filter-change="handleFilterChange"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.first-letter-styled {
  display: block;
}

.first-letter-styled::first-letter {
  font-size: 3.5em;
  font-weight: 700;
  @apply text-primary-500;
  float: left;
  padding-right: 0.2em;
  line-height: 0.85;
  margin-top: -0.1em;
}

.first-letter-styled p {
  margin: 0;
  padding: 0;
}
</style>
