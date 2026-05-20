import { defineComponent, ref } from 'vue';
import { flushPromises, mount } from '@vue/test-utils';
import { readFileSync } from 'node:fs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const localizationLocale = ref('vi');
const mockedProductFilters = ref({
  search: '',
  minPrice: undefined as number | undefined,
  maxPrice: undefined as number | undefined,
  includeNullPrice: true,
  categories: [] as number[],
  isFeatured: false,
  isNew: false,
  isSale: false,
  sortBy: 'newest',
  page: 1,
  limit: 12,
  locale: 'vi',
});
const categoryByTypeQuery = vi.fn().mockResolvedValue([]);
const categoryBySlugQuery = vi.fn().mockResolvedValue({
  id: 1,
  name: 'Máy nén khí',
  slug: 'may-nen-khi',
  translations: [{ locale: 'vi', name: 'Máy nén khí', slug: 'may-nen-khi' }],
});

vi.mock('h3', () => ({
  setResponseStatus: vi.fn(),
}));

vi.mock('nuxt/app', () => ({
  useRequestEvent: () => null,
}));

vi.mock('../../composables/useLocalization', () => ({
  useLocalization: () => ({
    t: (key: string) => key,
    locale: localizationLocale,
  }),
}));

vi.mock('../../composables/useTrpc', () => ({
  useTrpc: () => ({
    category: {
      byType: {
        query: categoryByTypeQuery,
      },
      bySlug: {
        query: categoryBySlugQuery,
      },
    },
  }),
}));

vi.mock('../../composables/useProduct', () => ({
  useProduct: () => ({
    filters: mockedProductFilters,
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
    pending: ref(false),
    error: ref(null),
    refresh: vi.fn(),
  }),
});

describe('category slug page', () => {
  beforeEach(() => {
    localizationLocale.value = 'vi';
    categoryBySlugQuery.mockClear();
    categoryByTypeQuery.mockClear();
    mockedProductFilters.value = {
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
    };
  });

  it('fetches the category using the locale implied by the route path during CSR navigation', async () => {
    localizationLocale.value = 'en';

    const page = (await import('./[slug].vue')).default;
    const TestHost = defineComponent({
      components: { Page: page },
      template: `
        <Suspense>
          <Page />
        </Suspense>
      `,
    });

    mount(TestHost, {
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

    expect(categoryBySlugQuery).toHaveBeenCalledWith({
      slug: 'may-nen-khi',
      locale: 'vi',
    });
  });

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

  it('keeps category filters as numeric ids when syncing to useProduct', async () => {
    const page = (await import('./[slug].vue')).default;
    const TestHost = defineComponent({
      components: { Page: page },
      template: `
        <Suspense>
          <Page />
        </Suspense>
      `,
    });

    mount(TestHost, {
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

    expect(mockedProductFilters.value.categories).toEqual([1]);
    expect(typeof mockedProductFilters.value.categories[0]).toBe('number');
  });

  it('shows a loading skeleton instead of the invalid-category state while category data is pending', async () => {
    const originalUseAsyncData = globalThis.useAsyncData;

    Object.assign(globalThis, {
      useAsyncData: async (_key: string, handler: () => Promise<unknown>, options?: { default?: () => unknown }) => ({
        data: ref(_key.startsWith('category-') ? null : (handler ? await handler() : options?.default?.())),
        pending: ref(_key.startsWith('category-')),
        error: ref(null),
        refresh: vi.fn(),
      }),
    });

    try {
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

      expect(wrapper.html()).toContain('card-grid-skeleton-stub');
      expect(wrapper.html()).not.toContain('categories.invalidCategoryTitle');
    } finally {
      Object.assign(globalThis, {
        useAsyncData: originalUseAsyncData,
      });
    }
  });
});
