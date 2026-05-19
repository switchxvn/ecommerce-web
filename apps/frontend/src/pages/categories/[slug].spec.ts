import { defineComponent, ref } from 'vue';
import { flushPromises, mount } from '@vue/test-utils';
import { readFileSync } from 'node:fs';
import { describe, expect, it, vi } from 'vitest';

vi.mock('h3', () => ({
  setResponseStatus: vi.fn(),
}));

vi.mock('nuxt/app', () => ({
  useRequestEvent: () => null,
}));

vi.mock('../../composables/useLocalization', () => ({
  useLocalization: () => ({
    t: (key: string) => key,
    locale: ref('vi'),
  }),
}));

vi.mock('../../composables/useTrpc', () => ({
  useTrpc: () => ({
    category: {
      byType: {
        query: vi.fn().mockResolvedValue([]),
      },
    },
  }),
}));

vi.mock('../../composables/useCategory', () => ({
  useCategory: () => ({
    fetchCategoryBySlug: vi.fn().mockResolvedValue({
      id: 1,
      name: 'Máy nén khí',
      slug: 'may-nen-khi',
      translations: [{ locale: 'vi', name: 'Máy nén khí', slug: 'may-nen-khi' }],
    }),
  }),
}));

vi.mock('../../composables/useProduct', () => ({
  useProduct: () => ({
    filters: ref({
      search: '',
      minPrice: undefined,
      maxPrice: undefined,
      includeNullPrice: true,
      categories: [],
      isFeatured: false,
      isNew: false,
      isSale: false,
      sortBy: 'newest',
      page: 1,
      limit: 12,
      locale: 'vi',
    }),
    products: ref([]),
    totalProducts: ref(0),
    isLoadingProducts: ref(false),
    fetchProducts: vi.fn(),
  }),
}));

vi.mock('~/composables/usePageSeo', () => ({
  usePageSeo: vi.fn(),
}));

vi.mock('~/utils/seo', () => ({
  buildCollectionPageSchema: vi.fn().mockReturnValue({}),
  resolveSeoCanonicalUrl: vi.fn().mockReturnValue('https://example.test/danh-muc-san-pham/may-nen-khi'),
}));

vi.mock('~/utils/routes', () => ({
  getCategoryDetailRoute: vi.fn().mockImplementation((slug: string) => `/danh-muc-san-pham/${slug}`),
  getCategoryListRoute: vi.fn().mockReturnValue('/danh-muc-san-pham'),
  getContactRoute: vi.fn().mockReturnValue('/lien-he'),
}));

vi.mock('vue-router', () => ({
  useRoute: () => ({
    params: { slug: 'may-nen-khi' },
    query: {},
    path: '/danh-muc-san-pham/may-nen-khi',
  }),
  useRouter: () => ({
    replace: vi.fn(),
  }),
}));

Object.assign(globalThis, {
  definePageMeta: vi.fn(),
  useRuntimeConfig: () => ({
    public: {
      siteUrl: 'https://example.test',
    },
  }),
  useAsyncData: async (_key: string, handler: () => Promise<unknown>, options?: { default?: () => unknown }) => ({
    data: ref(handler ? await handler() : options?.default?.()),
    error: ref(null),
    refresh: vi.fn(),
  }),
});

describe('category slug page', () => {
  it('declares useProduct before server-side page state reads', () => {
    const source = readFileSync('/Users/abc/project/mga/apps/frontend/src/pages/categories/[slug].vue', 'utf8');
    const useProductIndex = source.indexOf('const {\n  filters: productFilters,');
    const pageStateIndex = source.indexOf('const pageState = computed(() =>');
    const serverReadIndex = source.indexOf('if (requestEvent && isInvalidCategory.value)');

    expect(useProductIndex).toBeGreaterThan(-1);
    expect(pageStateIndex).toBeGreaterThan(-1);
    expect(serverReadIndex).toBeGreaterThan(-1);
    expect(useProductIndex).toBeLessThan(pageStateIndex);
    expect(useProductIndex).toBeLessThan(serverReadIndex);
  });

  it('initializes without reading totalProducts before useProduct returns', async () => {
    const page = (await import('./[slug].vue')).default;
    const TestHost = defineComponent({
      components: { Page: page },
      template: `
        <Suspense>
          <Page />
        </Suspense>
      `,
    });

    const wrapper = mount(TestHost, {
      global: {
        stubs: {
          CategorySidebar: true,
          CategoryMobileSidebar: true,
          ProductCard: true,
          UIcon: true,
          UButton: true,
          UPagination: true,
          Pagination: true,
          NuxtLink: true,
          CardGridSkeleton: true,
        },
      },
    });

    await flushPromises();

    expect(wrapper.html()).toContain('products-page');
  });
});
