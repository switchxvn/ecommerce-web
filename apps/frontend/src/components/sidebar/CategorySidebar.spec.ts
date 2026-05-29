import { flushPromises, mount } from '@vue/test-utils';
import { nextTick, ref } from 'vue';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import CategorySidebar from './CategorySidebar.vue';

const fetchProductCategories = vi.fn();
const getAttributesQuery = vi.fn();

vi.mock('~/composables/useLocalization', () => ({
  useLocalization: () => ({
    t: (key: string) => key,
    locale: ref('vi'),
  }),
}));

vi.mock('~/composables/useCategory', () => ({
  useCategory: () => ({
    productCategories: ref([]),
    loading: ref(false),
    uniqueCategories: ref([]),
    getCategoryTranslation: (category: { name?: string }) => ({
      name: category.name || '',
    }),
    fetchProductCategories,
  }),
}));

vi.mock('~/composables/useProduct', () => ({
  useProduct: (initialFilters: Record<string, unknown>) => ({
    filters: ref({ ...initialFilters }),
    priceRange: ref({ min: 0, max: 1_000_000 }),
    isLoadingPriceRange: ref(false),
    isSearching: ref(false),
    formatPrice: (price: number) => `${price}`,
    formatPriceSimple: (price: number) => `${price}`,
    parsePriceInput: (value: string) => Number(value),
    fetchPriceRange: vi.fn(),
    updatePriceRange: vi.fn(),
    handleSearch: vi.fn(),
    toggleCategory: vi.fn(),
    resetFilters: vi.fn(),
  }),
}));

vi.mock('~/composables/useTrpc', () => ({
  useTrpc: () => ({
    category: {
      getAttributes: {
        query: getAttributesQuery,
      },
    },
  }),
}));

describe('CategorySidebar', () => {
  beforeEach(() => {
    fetchProductCategories.mockReset();
    getAttributesQuery.mockReset();
  });

  it('renders caller-provided attributes without querying legacy category attribute procedures', async () => {
    const wrapper = mount(CategorySidebar, {
      props: {
        initialFilters: {
          categories: [],
          includeNullPrice: true,
          sortBy: 'newest',
          page: 1,
          limit: 12,
        },
        categoryId: 7,
        availableAttributes: [
          {
            id: '12',
            name: 'Tải trọng',
            values: ['2.5 tấn', '3.0 tấn'],
          },
        ],
      },
      shallow: true,
      global: {
        stubs: {
          UInput: true,
          UCheckbox: true,
          UIcon: true,
          UButton: true,
          NuxtLink: true,
          Slider: true,
        },
      },
    });

    await flushPromises();
    (wrapper.vm as unknown as { toggleSection: (section: string) => void }).toggleSection('attributes');
    await nextTick();

    expect(getAttributesQuery).not.toHaveBeenCalled();
    expect(wrapper.text()).toContain('Tải trọng');
    expect(wrapper.text()).toContain('2.5 tấn');
    expect(wrapper.text()).toContain('3.0 tấn');
  });
});
