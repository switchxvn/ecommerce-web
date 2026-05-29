import { mount } from '@vue/test-utils';
import { defineComponent, h } from 'vue';
import { describe, expect, it } from 'vitest';
import ServiceCardWithThumbnail from './ServiceCardWithThumbnail.vue';

const NuxtLinkStub = defineComponent({
  name: 'NuxtLink',
  inheritAttrs: false,
  props: {
    to: {
      type: String,
      required: true,
    },
  },
  setup(props, { attrs, slots }) {
    return () => h('a', { ...attrs, href: props.to }, slots.default?.());
  },
});

const NuxtImgStub = defineComponent({
  name: 'NuxtImg',
  inheritAttrs: false,
  props: {
    src: {
      type: String,
      required: true,
    },
    alt: {
      type: String,
      required: true,
    },
  },
  setup(props, { attrs }) {
    return () => h('img', { ...attrs, src: props.src, alt: props.alt });
  },
});

describe('ServiceCardWithThumbnail', () => {
  it('renders the featured badge with strong contrast over the thumbnail', () => {
    const wrapper = mount(ServiceCardWithThumbnail, {
      props: {
        locale: 'vi',
        service: {
          id: 11,
          icon: 'package',
          thumbnail: 'https://cdn.mgavietnam.com/services/test.jpg',
          order: 1,
          isActive: true,
          isFeatured: true,
          isNew: true,
          createdAt: '2026-05-29T00:00:00.000Z',
          updatedAt: '2026-05-29T00:00:00.000Z',
          translations: [
            {
              id: 1,
              title: 'Sua xe nang',
              description: 'Mo ta',
              shortDescription: 'Tom tat',
              locale: 'vi',
              slug: 'sua-xe-nang',
              metaTitle: '',
              metaDescription: '',
              metaKeywords: '',
              ogTitle: '',
              ogDescription: '',
              ogImage: null,
              canonicalUrl: '',
              serviceId: 11,
              createdAt: '2026-05-29T00:00:00.000Z',
              updatedAt: '2026-05-29T00:00:00.000Z',
            },
          ],
        },
      },
      global: {
        config: {
          globalProperties: {
            $t: (key: string) => {
              if (key === 'common.new') return 'Moi';
              if (key === 'common.featured') return 'Noi bat';
              if (key === 'common.learnMore') return 'Xem them';
              return key;
            },
          },
        },
        stubs: {
          NuxtLink: NuxtLinkStub,
          NuxtImg: NuxtImgStub,
        },
      },
    });

    const featuredBadge = wrapper.findAll('span').find(node => node.text() === 'Noi bat');

    expect(featuredBadge).toBeDefined();
    expect(featuredBadge?.classes()).toContain('bg-amber-500/90');
    expect(featuredBadge?.classes()).toContain('text-white');
  });
});
