<script setup lang="ts">
import { computed, ref, onMounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useLocalization } from '~/composables/useLocalization';
import { useTrpc } from '~/composables/useTrpc';
import ProductCard from '~/components/cards/ProductCard.vue';

const props = defineProps<{
  productId: number;
  limit?: number;
}>();

const { t, locale } = useLocalization();
const route = useRoute();
const trpc = useTrpc();

const isLoading = ref(true);
const crossSellProducts = ref([]);
const shouldRenderSection = computed(() => isLoading.value || crossSellProducts.value.length > 0);
const isTicketRoute = computed(() => route.path.includes('/tickets/'));
const sectionTitle = computed(() =>
  isTicketRoute.value
    ? (t('tickets.relatedTickets') || 'Vé bạn có thể thích')
    : (t('products.relatedProducts') || 'Sản phẩm liên quan'),
);
const sectionSubtitle = computed(() =>
  isTicketRoute.value
    ? 'Những lựa chọn cùng nhóm đang được xem nhiều để bạn đối chiếu nhanh trước khi đặt chỗ.'
    : 'Mẫu xe cùng nhóm đang được quan tâm để bạn so sánh nhanh trước khi quyết định.',
);

// Fetch cross-sell products
const fetchCrossSellProducts = async () => {
  isLoading.value = true;
  try {
    const result = await trpc.product.getCrossSellProducts.query({
      productId: props.productId,
      locale: locale.value,
      limit: props.limit || 4
    });
    
    crossSellProducts.value = result;
  } catch (error) {
    console.error('Error fetching cross-sell products:', error);
  } finally {
    isLoading.value = false;
  }
};

// Initial fetch
onMounted(() => {
  fetchCrossSellProducts();
});

// Watch for locale changes
watch(locale, () => {
  fetchCrossSellProducts();
});
</script>

<template>
  <section v-if="shouldRenderSection" class="cross-sell-products" data-testid="cross-sell-products">
    <div class="cross-sell-products__header">
      <div class="cross-sell-products__eyebrow">
        Gợi ý cho bạn
      </div>
      <div class="cross-sell-products__heading-row">
        <div>
          <h2 class="cross-sell-products__title">
            {{ sectionTitle }}
          </h2>
          <p class="cross-sell-products__subtitle">
            {{ sectionSubtitle }}
          </p>
        </div>
        <div class="cross-sell-products__rule" />
      </div>
    </div>

    <div v-if="isLoading" class="cross-sell-products__grid">
      <div v-for="i in limit || 4" :key="i" class="product-card-skeleton">
        <USkeleton class="h-[260px] w-full rounded-[1.25rem]" />
        <USkeleton class="mt-4 h-4 w-20 rounded-full" />
        <USkeleton class="mt-3 h-6 w-5/6 rounded-full" />
        <USkeleton class="mt-2 h-5 w-2/3 rounded-full" />
        <USkeleton class="mt-6 h-10 w-1/2 rounded-full" />
      </div>
    </div>

    <div v-else class="cross-sell-products__grid">
      <ProductCard 
        v-for="product in crossSellProducts" 
        :key="product.id" 
        :product="product"
        :locale="locale"
      />
    </div>
  </section>
</template>

<style scoped>
.cross-sell-products {
  border-radius: 1.5rem;
  border: 1px solid rgba(226, 232, 240, 0.9);
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.98) 0%, rgba(248, 250, 252, 0.98) 100%);
  padding: 1.75rem;
  box-shadow: 0 20px 45px -34px rgba(15, 23, 42, 0.3);
}

.cross-sell-products__header {
  margin-bottom: 1.5rem;
}

.cross-sell-products__eyebrow {
  margin-bottom: 0.65rem;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: rgb(var(--color-primary-600));
}

.cross-sell-products__heading-row {
  display: flex;
  gap: 1.25rem;
  align-items: end;
}

.cross-sell-products__title {
  margin: 0;
  font-size: clamp(1.65rem, 2vw, 2.1rem);
  line-height: 1.1;
  font-weight: 700;
  color: #0f172a;
}

.cross-sell-products__subtitle {
  margin: 0.65rem 0 0;
  max-width: 42rem;
  font-size: 0.98rem;
  line-height: 1.7;
  color: #64748b;
}

.cross-sell-products__rule {
  flex: 1;
  min-width: 4rem;
  height: 1px;
  margin-bottom: 0.4rem;
  background: linear-gradient(90deg, rgba(148, 163, 184, 0.8), rgba(148, 163, 184, 0));
}

.cross-sell-products__grid {
  display: grid;
  grid-template-columns: repeat(1, minmax(0, 1fr));
  gap: 1.25rem;
  align-items: start;
}

.product-card-skeleton {
  display: flex;
  flex-direction: column;
  padding: 0.25rem;
}

@media (min-width: 640px) {
  .cross-sell-products__grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (min-width: 1280px) {
  .cross-sell-products__grid {
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 1.5rem;
  }
}

@media (max-width: 767px) {
  .cross-sell-products {
    padding: 1.25rem;
  }

  .cross-sell-products__heading-row {
    flex-direction: column;
    align-items: stretch;
  }

  .cross-sell-products__rule {
    width: 100%;
    margin-bottom: 0;
  }
}

.dark .cross-sell-products {
  border-color: rgba(51, 65, 85, 0.9);
  background: linear-gradient(180deg, rgba(15, 23, 42, 0.92) 0%, rgba(2, 6, 23, 0.95) 100%);
  box-shadow: 0 24px 50px -36px rgba(2, 6, 23, 0.7);
}

.dark .cross-sell-products__eyebrow {
  color: rgb(var(--color-primary-300));
}

.dark .cross-sell-products__title {
  color: #f8fafc;
}

.dark .cross-sell-products__subtitle {
  color: #94a3b8;
}

.dark .cross-sell-products__rule {
  background: linear-gradient(90deg, rgba(71, 85, 105, 0.95), rgba(71, 85, 105, 0));
}

.dark .product-card-skeleton :deep(.u-skeleton-stub),
.dark .product-card-skeleton :deep(.u-skeleton) {
  background-color: rgba(51, 65, 85, 0.9);
}
</style>
