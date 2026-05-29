import { mount } from '@vue/test-utils';
import CardGridSkeleton from './CardGridSkeleton.vue';
import DetailPageSkeleton from './DetailPageSkeleton.vue';
import GallerySkeleton from './GallerySkeleton.vue';
import SectionHeaderSkeleton from './SectionHeaderSkeleton.vue';

const mountOptions = {
  global: {
    stubs: {
      USkeleton: {
        template: '<div class="u-skeleton-stub" />',
      },
      SectionHeaderSkeleton: false,
      SidebarSkeleton: false,
    },
  },
};

describe('SectionHeaderSkeleton', () => {
  it('hides optional rows when props disable them', () => {
    const wrapper = mount(SectionHeaderSkeleton, {
      props: {
        showSubtitle: false,
        showAction: false,
      },
      ...mountOptions,
    });

    expect(wrapper.findAll('.u-skeleton-stub')).toHaveLength(2);
  });
});

describe('CardGridSkeleton', () => {
  it('renders the requested number of cards', () => {
    const wrapper = mount(CardGridSkeleton, {
      props: {
        itemCount: 5,
        columns: 3,
      },
      ...mountOptions,
    });

    expect(wrapper.findAll('[data-testid="card-grid-skeleton-item"]')).toHaveLength(5);
  });
});

describe('DetailPageSkeleton', () => {
  it('can render without gallery or sidebar blocks', () => {
    const wrapper = mount(DetailPageSkeleton, {
      props: {
        showGallery: false,
        showSidebar: false,
        showMeta: false,
      },
      ...mountOptions,
    });

    expect(wrapper.findComponent({ name: 'SidebarSkeleton' }).exists()).toBe(false);
    expect(wrapper.findAll('.u-skeleton-stub').length).toBeGreaterThan(0);
  });
});

describe('GallerySkeleton', () => {
  it('renders the requested number of gallery tiles', () => {
    const wrapper = mount(GallerySkeleton, {
      props: {
        itemCount: 7,
      },
      ...mountOptions,
    });

    expect(wrapper.findAll('[data-testid="gallery-skeleton-item"]')).toHaveLength(7);
  });
});
