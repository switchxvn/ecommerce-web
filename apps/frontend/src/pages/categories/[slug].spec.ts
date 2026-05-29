import { defineComponent, ref } from 'vue';
import { flushPromises, mount } from '@vue/test-utils';
import { readFileSync } from 'node:fs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const localizationLocale = ref('vi');
const localizationT = vi.fn((key: string) => key);
const mockedRouteSlug = ref('may-nen-khi');
const mockedRoutePath = ref('/danh-muc-san-pham/may-nen-khi');
const mockedProducts = ref([{ id: 101, slug: 'sample-product' }]);
const mockedTotalProducts = ref(1);
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
const NuxtLinkStub = defineComponent({
  props: {
    to: {
      type: String,
      required: false,
    },
  },
  template: '<a :href="to"><slot /></a>',
});

vi.mock('h3', () => ({
  setResponseStatus: vi.fn(),
}));

vi.mock('nuxt/app', () => ({
  useRequestEvent: () => null,
}));

vi.mock('../../composables/useLocalization', () => ({
  useLocalization: () => ({
    t: localizationT,
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
    products: mockedProducts,
    totalProducts: mockedTotalProducts,
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
    params: { slug: mockedRouteSlug.value },
    query: {},
    path: mockedRoutePath.value,
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
    localizationT.mockReset();
    localizationT.mockImplementation((key: string) => key);
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
    mockedRouteSlug.value = 'may-nen-khi';
    mockedRoutePath.value = '/danh-muc-san-pham/may-nen-khi';
    mockedProducts.value = [{ id: 101, slug: 'sample-product' }];
    mockedTotalProducts.value = 1;
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
          NuxtLink: NuxtLinkStub,
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

  it('defines seo support sections for commercial category pages', () => {
    const source = readFileSync('/Users/abc/project/mga/apps/frontend/src/pages/categories/[slug].vue', 'utf8');

    expect(source).toContain('Bao gia nhanh theo nhom nhu cau');
    expect(source).toContain('xe-nang-dau');
    expect(source).toContain('xe-nang-dien');
    expect(source).toContain('phu-tung-xe-nang');
    expect(source).toContain('/dich-vu/cho-thue-xe-nang-tphcm');
    expect(source).toContain('/dich-vu/sua-xe-nang-tphcm');
  });

  it('serializes only lightweight suggested category links into the SSR payload', () => {
    const source = readFileSync('/Users/abc/project/mga/apps/frontend/src/pages/categories/[slug].vue', 'utf8');

    expect(source).toContain('const { data: suggestedCategoryLinks } = await useAsyncData<LocalizedCategoryLink[]>(');
    expect(source).not.toContain('const { data: suggestedCategoriesData } = await useAsyncData<Category[]>(');
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
          NuxtLink: NuxtLinkStub,
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
          NuxtLink: NuxtLinkStub,
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
            NuxtLink: NuxtLinkStub,
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

  it('falls back to literal breadcrumb labels when translations resolve to an empty string', async () => {
    localizationT.mockImplementation(() => '');

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
          NuxtLink: NuxtLinkStub,
          CardGridSkeleton: true,
        },
      },
    });

    await flushPromises();

    expect(wrapper.text()).toContain('Trang chủ');
    expect(wrapper.text()).toContain('Danh mục sản phẩm');
  });

  it('passes quick links to the desktop sidebar with clearer copy and removes the old heading', async () => {
    mockedRouteSlug.value = 'xe-nang-dien';
    mockedRoutePath.value = '/danh-muc-san-pham/xe-nang-dien';
    categoryBySlugQuery.mockResolvedValueOnce({
      id: 2,
      name: 'Xe nâng điện',
      slug: 'xe-nang-dien',
      description: 'Danh mục xe nâng điện',
      translations: [{ locale: 'vi', name: 'Xe nâng điện', slug: 'xe-nang-dien', description: 'Danh mục xe nâng điện' }],
    });

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
          CategorySidebar: {
            props: ['quickLinksHeading', 'quickLinks', 'supportCta'],
            template: '<div data-testid="sidebar-quick-links">{{ quickLinksHeading }}|{{ quickLinks?.length || 0 }}|{{ supportCta?.title || "" }}</div>',
          },
          CategoryMobileSidebar: true,
          ProductCard: true,
          UIcon: true,
          UButton: true,
          UPagination: true,
          Pagination: true,
          NuxtLink: NuxtLinkStub,
          CardGridSkeleton: true,
        },
      },
    });

    await flushPromises();

    expect(wrapper.find('[data-testid="sidebar-quick-links"]').text()).toContain('Xem nhanh theo nhu cầu');
    expect(wrapper.find('[data-testid="sidebar-quick-links"]').text()).toContain('|4|');
    expect(wrapper.find('[data-testid="sidebar-quick-links"]').text()).toContain('Cần tư vấn nhanh?');
    expect(wrapper.text()).toContain('Câu hỏi thường gặp trong nhóm Xe nâng điện');
    expect(wrapper.text()).not.toContain('Link nhanh theo intent thương mại');
  });
});
