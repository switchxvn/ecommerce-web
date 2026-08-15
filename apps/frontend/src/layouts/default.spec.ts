import { mount } from '@vue/test-utils';
import { defineComponent, ref } from 'vue';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import AdvertisingPopupHost from '../components/modals/AdvertisingPopupHost.vue';

const popupMocks = vi.hoisted(() => ({
  campaign: null as ReturnType<typeof ref> | null,
  shouldShow: null as ReturnType<typeof ref> | null,
  initialize: vi.fn(),
  close: vi.fn(),
}));

vi.mock('../composables/useAdvertisingPopup', async () => {
  const { ref: vueRef } = await import('vue');
  popupMocks.campaign = vueRef({
    id: 1,
    name: 'Campaign',
    title: 'Thông báo',
    content: 'Nội dung',
    ctaLabel: 'Xem',
    ctaUrl: '/sale',
    isActive: true,
    startsAt: null,
    endsAt: null,
  });
  popupMocks.shouldShow = vueRef(true);
  return {
    useAdvertisingPopup: () => ({
      campaign: popupMocks.campaign,
      shouldShow: popupMocks.shouldShow,
      initialize: popupMocks.initialize,
      close: popupMocks.close,
    }),
  };
});

vi.mock('../components/modals/AdvertisingPopup.vue', () => ({
  default: defineComponent({
    name: 'AdvertisingPopup',
    props: ['campaign'],
    emits: ['close'],
    template:
      '<button data-testid="layout-popup" @click="$emit(\'close\')">popup</button>',
  }),
}));

describe('public layout advertising popup host', () => {
  beforeEach(() => {
    popupMocks.initialize.mockReset().mockResolvedValue(undefined);
    popupMocks.close.mockReset();
    popupMocks.shouldShow!.value = true;
  });

  it('initializes exactly once and renders whenever campaign state is visible', () => {
    const wrapper = mount(AdvertisingPopupHost);

    expect(popupMocks.initialize).toHaveBeenCalledTimes(1);
    expect(wrapper.find('[data-testid="layout-popup"]').exists()).toBe(true);
  });

  it('routes close to the composable and reacts to visibility independently', async () => {
    const wrapper = mount(AdvertisingPopupHost);
    await wrapper.get('[data-testid="layout-popup"]').trigger('click');
    expect(popupMocks.close).toHaveBeenCalledTimes(1);

    popupMocks.shouldShow!.value = false;
    await wrapper.vm.$nextTick();
    expect(wrapper.find('[data-testid="layout-popup"]').exists()).toBe(false);
  });
});
