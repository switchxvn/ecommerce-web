import { flushPromises, mount } from '@vue/test-utils';
import { ref } from 'vue';
import CrossSellProducts from './CrossSellProducts.vue';

const locale = ref('vi');
const getCrossSellProducts = vi.fn();

vi.mock('~/composables/useLocalization', () => ({
  useLocalization: () => ({
    t: (key: string) => ({
      'products.relatedProducts': 'Sản phẩm liên quan',
    }[key] || key),
    locale,
  }),
}));

vi.mock('~/composables/useTrpc', () => ({
  useTrpc: () => ({
    product: {
      getCrossSellProducts: {
        query: getCrossSellProducts,
      },
    },
  }),
}));

vi.mock('vue-router', () => ({
  useRoute: () => ({
    path: '/san-pham/test',
  }),
}));

describe('CrossSellProducts', () => {
  beforeEach(() => {
    getCrossSellProducts.mockReset();
    locale.value = 'vi';
  });

  it('renders a commercial section header above the related product grid', async () => {
    getCrossSellProducts.mockResolvedValue([
      { id: 1, title: 'Xe nâng 1' },
    ]);

    const wrapper = mount(CrossSellProducts, {
      props: {
        productId: 99,
        limit: 4,
      },
      global: {
        stubs: {
          ProductCard: {
            props: ['product'],
            template: '<div class="product-card-stub">{{ product.id }}</div>',
          },
          USkeleton: {
            template: '<div class="u-skeleton-stub" />',
          },
        },
      },
    });

    await flushPromises();

    expect(wrapper.text()).toContain('Sản phẩm liên quan');
    expect(wrapper.text()).toContain('Mẫu xe cùng nhóm đang được quan tâm');
    expect(wrapper.findAll('.product-card-stub')).toHaveLength(1);
  });
});
