<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { Newspaper, BriefcaseBusiness } from 'lucide-vue-next';
import { useLocalization } from '~/composables/useLocalization';
import { useTrpc } from '~/composables/useTrpc';
import { getLocalizedRoute, getRouteLocale } from '~/utils/routes';
import ProductCombo from './ProductCombo.vue';

type SidebarItemType = 'post' | 'service';

interface SidebarItemConfig {
  itemType: SidebarItemType;
  itemId: number;
  position?: number;
}

interface SidebarCardItem {
  type: SidebarItemType;
  id: number;
  title: string;
  description: string;
  thumbnail?: string | null;
  href: string;
}

const props = defineProps({
  product: {
    type: Object,
    required: true,
  },
});

const trpc = useTrpc();
const { t, locale } = useLocalization();
const sidebarItems = ref<SidebarCardItem[]>([]);
const loadingSidebarItems = ref(false);

const isOnSale = computed(() => {
  return (
    props.product.comparePrice &&
    props.product.price &&
    props.product.comparePrice > props.product.price
  );
});

const discountPercentage = computed(() => {
  if (!isOnSale.value) return 0;

  const discount = props.product.comparePrice - props.product.price;
  return Math.round((discount / props.product.comparePrice) * 100);
});

const saleEndTime = ref(new Date());
saleEndTime.value.setDate(saleEndTime.value.getDate() + 3);

const configuredSidebarItems = computed<SidebarItemConfig[]>(() =>
  Array.isArray(props.product?.sidebarItems)
    ? [...props.product.sidebarItems].sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
    : []
);

const currentRouteLocale = computed(() => getRouteLocale(locale.value));

const handleAddComboToCart = (_products: unknown) => {
  // Intentionally left empty. Cart integration is handled elsewhere.
};

const loadSidebarItems = async () => {
  loadingSidebarItems.value = true;

  try {
    const configuredItems = configuredSidebarItems.value;

    if (!configuredItems.length) {
      const latestPosts = await trpc.post.latest.query({
        filters: {
          locale: currentRouteLocale.value,
          page: 1,
          limit: 10,
          sortBy: 'newest',
        },
      });

      sidebarItems.value = (latestPosts?.posts || []).flatMap((post: any) => {
        const translation = post.translations?.find((item: any) => item.locale === currentRouteLocale.value) || post.translations?.[0];

        if (!translation?.slug) {
          return [];
        }

        return [{
          type: 'post' as const,
          id: post.id,
          title: post.title || translation?.title || '',
          description: post.shortDescription || translation?.shortDescription || '',
          thumbnail: post.thumbnail,
          href: getLocalizedRoute('POST_DETAIL', currentRouteLocale.value, {
            slug: translation.slug,
          }),
        }];
      }).filter((item: SidebarCardItem) => item.title);

      return;
    }

    const postIds = configuredItems.filter((item) => item.itemType === 'post').map((item) => item.itemId);
    const serviceIds = configuredItems.filter((item) => item.itemType === 'service').map((item) => item.itemId);

    const [posts, services] = await Promise.all([
      postIds.length
        ? trpc.post.byIds.query({ ids: postIds, locale: currentRouteLocale.value })
        : Promise.resolve([]),
      serviceIds.length
        ? trpc.service.all.query({ locale: currentRouteLocale.value })
        : Promise.resolve([]),
    ]);

    const postMap = new Map<number, SidebarCardItem>();
    for (const post of posts as any[]) {
      const translation = post.translations?.find((item: any) => item.locale === currentRouteLocale.value) || post.translations?.[0];
      if (!translation?.slug) continue;

      postMap.set(post.id, {
        type: 'post',
        id: post.id,
        title: post.title || translation?.title || '',
        description: post.shortDescription || translation?.shortDescription || '',
        thumbnail: post.thumbnail,
        href: getLocalizedRoute('POST_DETAIL', currentRouteLocale.value, {
          slug: translation.slug,
        }),
      });
    }

    const serviceMap = new Map<number, SidebarCardItem>();
    for (const service of (services as any[]).filter((item) => serviceIds.includes(item.id))) {
      const translation = service.translations?.find((item: any) => item.locale === currentRouteLocale.value) || service.translations?.[0];
      if (!translation?.slug) continue;

      serviceMap.set(service.id, {
        type: 'service',
        id: service.id,
        title: translation?.title || '',
        description: translation?.shortDescription || translation?.description || '',
        thumbnail: service.thumbnail,
        href: getLocalizedRoute('SERVICE_DETAIL', currentRouteLocale.value, {
          slug: translation.slug,
        }),
      });
    }

    sidebarItems.value = configuredItems
      .map((item) => item.itemType === 'post' ? postMap.get(item.itemId) : serviceMap.get(item.itemId))
      .filter(Boolean) as SidebarCardItem[];
  } catch (error) {
    console.error('Failed to load product sidebar items:', error);
    sidebarItems.value = [];
  } finally {
    loadingSidebarItems.value = false;
  }
};

watch(
  [() => props.product?.id, configuredSidebarItems, () => locale.value],
  () => {
    loadSidebarItems();
  },
  { immediate: true }
);
</script>

<template>
  <div class="product-detail-sidebar">
    <div v-if="isOnSale" class="sale-info mb-4 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
      <div class="flex items-center justify-between">
        <div class="flex items-center">
          <UIcon name="i-heroicons-fire" class="text-red-500 mr-2 h-5 w-5" />
          <span class="font-bold text-red-600 dark:text-red-400">
            {{ t("products.limitedOffer") || "Ưu đãi có hạn" }}
          </span>
        </div>
        <UBadge color="red" variant="solid" size="sm">-{{ discountPercentage }}%</UBadge>
      </div>
      <p class="text-sm text-gray-700 dark:text-gray-300 mt-2">
        {{ t("products.saleEnds") || "Kết thúc sau" }}:
        <span class="font-semibold">{{ saleEndTime.toLocaleDateString() }}</span>
      </p>
    </div>

    <div class="mb-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <div class="mb-4 flex items-center justify-between">
        <h3 class="text-base font-semibold text-slate-900 dark:text-slate-100">
          {{ t('sidebar.relatedContent') || 'Tin tức và dịch vụ' }}
        </h3>
        <span class="text-xs uppercase tracking-wide text-slate-500">
          {{ configuredSidebarItems.length ? t('sidebar.customLabel') || 'Tùy chọn' : t('sidebar.defaultLabel') || 'Mặc định' }}
        </span>
      </div>

      <div v-if="loadingSidebarItems" class="space-y-3">
        <div
          v-for="index in 3"
          :key="index"
          class="h-20 animate-pulse rounded-lg bg-slate-100 dark:bg-slate-800"
        />
      </div>

      <div v-else-if="sidebarItems.length === 0" class="rounded-lg bg-slate-50 p-4 text-sm text-slate-500 dark:bg-slate-800 dark:text-slate-400">
        {{ t('sidebar.noRelatedContent') || 'Chưa có dữ liệu để hiển thị trong sidebar.' }}
      </div>

      <div v-else class="space-y-3">
        <NuxtLink
          v-for="item in sidebarItems"
          :key="`${item.type}-${item.id}`"
          :to="item.href"
          class="sidebar-related-card rounded-lg border border-slate-200 p-3 transition hover:-translate-y-0.5 hover:border-primary-300 hover:shadow-sm dark:border-slate-700 dark:hover:border-primary-700"
        >
          <div class="sidebar-related-card__media flex flex-shrink-0 items-center justify-center overflow-hidden rounded-lg bg-slate-100 dark:bg-slate-800">
            <img
              v-if="item.thumbnail"
              :src="item.thumbnail"
              :alt="item.title"
              class="h-full w-full object-cover"
            >
            <Newspaper v-else-if="item.type === 'post'" class="h-5 w-5 text-slate-500" />
            <BriefcaseBusiness v-else class="h-5 w-5 text-slate-500" />
          </div>

          <div class="min-w-0 flex-1">
            <div class="mb-1 flex items-center gap-2">
              <span class="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium uppercase text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                {{ item.type === 'post' ? t('sidebar.postLabel') || 'Tin tức' : t('sidebar.serviceLabel') || 'Dịch vụ' }}
              </span>
            </div>
            <p class="line-clamp-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
              {{ item.title }}
            </p>
            <p v-if="item.description" class="mt-1 line-clamp-2 text-xs text-slate-500 dark:text-slate-400">
              {{ item.description }}
            </p>
          </div>
        </NuxtLink>
      </div>
    </div>

    <ProductCombo
      v-if="product.id"
      :productId="product.id"
      :limit="4"
      @add-to-cart="handleAddComboToCart"
    />
  </div>
</template>

<style scoped>
.product-detail-sidebar {
  transition: all 0.3s ease;
  background-color: var(--color-white);
  border-radius: 0.5rem;
}

.dark .product-detail-sidebar {
  background-color: var(--color-gray-900);
}

.sale-info {
  transition: all 0.3s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.sale-info:hover {
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.sidebar-related-card__media {
  inline-size: clamp(72px, 20%, 112px);
  block-size: 100%;
  max-block-size: 112px;
  aspect-ratio: 1 / 1;
}

.sidebar-related-card__media img {
  display: block;
}

.sidebar-related-card {
  display: grid;
  grid-template-columns: clamp(72px, 20%, 112px) minmax(0, 1fr);
  align-items: stretch;
  gap: 0.75rem;
}

@media (max-width: 640px) {
  .sidebar-related-card {
    grid-template-columns: 84px minmax(0, 1fr);
  }

  .sidebar-related-card__media {
    inline-size: 84px;
    max-block-size: 84px;
  }
}
</style>
