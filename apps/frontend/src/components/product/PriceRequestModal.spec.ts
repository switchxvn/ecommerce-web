import { mount } from '@vue/test-utils';
import PriceRequestModal from './PriceRequestModal.vue';

const translate = vi.fn(() => '');

vi.mock('~/composables/useLocalization', () => ({
  useLocalization: () => ({
    t: translate,
  }),
}));

vi.mock('~/composables/useTrpc', () => ({
  useTrpc: () => ({
    priceRequest: {
      create: {
        mutate: vi.fn(),
      },
    },
  }),
}));

vi.mock('~/composables/useNotification', () => ({
  useNotification: () => ({
    success: vi.fn(),
    error: vi.fn(),
  }),
}));

describe('PriceRequestModal', () => {
  beforeEach(() => {
    translate.mockReset();
    translate.mockImplementation(() => '');
  });

  it('falls back to literal labels and placeholders when translations resolve to empty strings', () => {
    const wrapper = mount(PriceRequestModal, {
      props: {
        isOpen: true,
        productId: 228,
        productName: 'Xe nâng dầu MGA 7.0 Tấn',
      },
      global: {
        stubs: {
          PhoneInput: {
            template: '<div class="phone-input-stub"></div>',
          },
        },
      },
    });

    expect(wrapper.text()).toContain('Yêu cầu báo giá');
    expect(wrapper.text()).toContain('Họ tên');
    expect(wrapper.text()).toContain('Email');
    expect(wrapper.text()).toContain('Số điện thoại');
    expect(wrapper.text()).toContain('Lời nhắn');
    expect(wrapper.text()).toContain('Gửi yêu cầu');
    expect(wrapper.html()).toContain('Nhập họ tên của bạn');
    expect(wrapper.html()).toContain('Nhập email của bạn');
    expect(wrapper.html()).toContain('Nhập lời nhắn của bạn (không bắt buộc)');
  });
});
