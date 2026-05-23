import { mount } from '@vue/test-utils';
import { defineComponent, h } from 'vue';
import AppImage from './AppImage.vue';

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
    format: {
      type: String,
      default: undefined,
    },
  },
  setup(props, { attrs }) {
    return () =>
      h('img', {
        ...attrs,
        src: props.src,
        alt: props.alt,
        'data-format': props.format,
        class: ['nuxt-img-stub', attrs.class],
      });
  },
});

describe('AppImage', () => {
  it('does not pass an invalid multi-format string to NuxtImg by default', () => {
    const wrapper = mount(AppImage, {
      props: {
        src: 'https://cdn.mgavietnam.com/posts/example.jpg',
        alt: 'Example image',
      },
      global: {
        stubs: {
          NuxtImg: NuxtImgStub,
        },
      },
    });

    expect(wrapper.find('.nuxt-img-stub').attributes('data-format')).toBeUndefined();
  });

  it('applies consumer classes to the rendered image element', () => {
    const wrapper = mount(AppImage, {
      attrs: {
        class: 'consumer-image-class',
      },
      props: {
        src: 'https://cdn.mgavietnam.com/posts/example.jpg',
        alt: 'Example image',
      },
      global: {
        stubs: {
          NuxtImg: NuxtImgStub,
        },
      },
    });

    expect(wrapper.find('.nuxt-img-stub').classes()).toContain('consumer-image-class');
  });
});
