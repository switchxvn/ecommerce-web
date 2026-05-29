import { defineComponent, ref } from 'vue';
import { flushPromises, mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockedLocale = ref('vi');
const mockedT = vi.fn((key: string) => key);
const mockedRouteSlug = ref('xe-nang-container');
const mockedRoutePath = ref('/tags/xe-nang-container');
const mockedTagQuery = vi.fn();
const mockedPostByLocaleQuery = vi.fn();
const mockedRouterReplace = vi.fn();
const mockedSetResponseStatus = vi.fn();
const mockedUsePageSeo = vi.fn();

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
  setResponseStatus: mockedSetResponseStatus,
}));

vi.mock('nuxt/app', () => ({
  useRequestEvent: () => ({ node: {} }),
}));

vi.mock('../../composables/useLocalization', () => ({
  useLocalization: () => ({
    t: mockedT,
    locale: mockedLocale,
  }),
}));

vi.mock('../../composables/useTrpc', () => ({
  useTrpc: () => ({
    settings: {
      getTagBySlug: {
        query: mockedTagQuery,
      },
    },
    post: {
      byLocale: {
        query: mockedPostByLocaleQuery,
      },
    },
  }),
}));

vi.mock('vue-router', () => ({
  useRoute: () => ({
    params: { slug: mockedRouteSlug.value },
    query: {},
    path: mockedRoutePath.value,
  }),
  useRouter: () => ({
    replace: mockedRouterReplace,
  }),
}));

vi.mock('~/composables/usePageSeo', () => ({
  usePageSeo: mockedUsePageSeo,
}));

Object.assign(globalThis, {
  definePageMeta: vi.fn(),
  useRuntimeConfig: () => ({
    public: {
      siteUrl: 'https://example.test',
    },
  }),
  useAsyncData: async (_key: string, handler: () => Promise<unknown>, options?: { default?: () => unknown }) => {
    try {
      return {
        data: ref(handler ? await handler() : options?.default?.()),
        pending: ref(false),
        error: ref(null),
        refresh: vi.fn(),
      };
    } catch (error) {
      return {
        data: ref(options?.default?.() ?? null),
        pending: ref(false),
        error: ref(error),
        refresh: vi.fn(),
      };
    }
  },
});

describe('tag slug page', () => {
  beforeEach(() => {
    mockedLocale.value = 'vi';
    mockedRouteSlug.value = 'xe-nang-container';
    mockedRoutePath.value = '/tags/xe-nang-container';
    mockedT.mockReset();
    mockedT.mockImplementation((key: string) => key);
    mockedTagQuery.mockReset();
    mockedTagQuery.mockResolvedValue({
      id: 9,
      name: 'Xe nang container',
      slug: 'xe-nang-container',
      description: 'Noi dung tag',
    });
    mockedPostByLocaleQuery.mockReset();
    mockedPostByLocaleQuery.mockResolvedValue({
      items: [],
      total: 0,
      page: 1,
      limit: 12,
      totalPages: 0,
    });
    mockedRouterReplace.mockReset();
    mockedSetResponseStatus.mockReset();
    mockedUsePageSeo.mockReset();
  });

  it('fetches the tag by slug and scopes the post query to that tag', async () => {
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
          Breadcrumb: true,
          PostSidebar: true,
          PostCard: true,
          PostCardSkeleton: true,
          Pagination: true,
          SearchX: true,
          FilterX: true,
          NuxtLink: NuxtLinkStub,
        },
      },
    });

    await flushPromises();

    expect(mockedTagQuery).toHaveBeenCalledWith('xe-nang-container');
    expect(mockedPostByLocaleQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        locale: 'vi',
        page: 1,
        limit: 12,
        sort: 'newest',
        tags: 'xe-nang-container',
      }),
    );
  });

  it('returns an SSR 404 status when the tag is invalid', async () => {
    mockedTagQuery.mockRejectedValueOnce(new Error('missing'));

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
          Breadcrumb: true,
          PostSidebar: true,
          PostCard: true,
          PostCardSkeleton: true,
          Pagination: true,
          SearchX: true,
          FilterX: true,
          NuxtLink: NuxtLinkStub,
        },
      },
    });

    await flushPromises();

    expect(mockedSetResponseStatus).toHaveBeenCalledWith(expect.anything(), 404);
  });

  it('uses tag metadata for page seo', async () => {
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
          Breadcrumb: true,
          PostSidebar: true,
          PostCard: true,
          PostCardSkeleton: true,
          Pagination: true,
          SearchX: true,
          FilterX: true,
          NuxtLink: NuxtLinkStub,
        },
      },
    });

    await flushPromises();

    expect(mockedUsePageSeo).toHaveBeenCalled();
  });
});
