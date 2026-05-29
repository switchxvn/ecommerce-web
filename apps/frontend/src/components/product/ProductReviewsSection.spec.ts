import { mount } from '@vue/test-utils';
import ProductReviewsSection from './ProductReviewsSection.vue';

const translate = vi.fn((key: string) =>
  ({
    'reviews.title': 'Đánh giá',
    'reviews.basedOn': 'Dựa trên',
    'reviews.reviews': 'đánh giá',
    'reviews.writeReview': 'Viết đánh giá',
    'reviews.shareYourExperience': 'Chia sẻ trải nghiệm của bạn',
    'reviews.noReviews': 'Không tìm thấy đánh giá nào',
    'reviews.thankYou': 'Cảm ơn bạn!',
    'reviews.reviewSubmitSuccessDetail': 'Đánh giá của bạn đã được gửi thành công!',
    'reviews.moderationNotice': 'Đánh giá của bạn sẽ được hiển thị sau khi được kiểm duyệt.',
    'reviews.reviewSubmitError': 'Đã xảy ra lỗi khi gửi đánh giá của bạn. Vui lòng thử lại sau.',
  }[key] || key),
);

vi.mock('~/composables/useLocalization', () => ({
  useLocalization: () => ({
    t: translate,
  }),
}));

vi.mock('./ProductReviewForm.vue', () => ({
  default: {
    name: 'ProductReviewForm',
    emits: ['success', 'error'],
    template: '<button class="mock-review-form" @click="$emit(\'success\', { id: 999 })">submit</button>',
  },
}));

const makeReview = (id: number) => ({
  id,
  authorName: `Reviewer ${id}`,
  rating: 5,
  createdAt: '2026-05-21T00:00:00.000Z',
  translations: [
    {
      locale: 'vi',
      title: `Danh gia ${id}`,
      content: `Noi dung danh gia ${id}`,
    },
  ],
});

describe('ProductReviewsSection', () => {
  beforeEach(() => {
    translate.mockReset();
    translate.mockImplementation((key: string) =>
      ({
        'reviews.title': 'Đánh giá',
        'reviews.basedOn': 'Dựa trên',
        'reviews.reviews': 'đánh giá',
        'reviews.writeReview': 'Viết đánh giá',
        'reviews.shareYourExperience': 'Chia sẻ trải nghiệm của bạn',
        'reviews.noReviews': 'Không tìm thấy đánh giá nào',
        'reviews.thankYou': 'Cảm ơn bạn!',
        'reviews.reviewSubmitSuccessDetail': 'Đánh giá của bạn đã được gửi thành công!',
        'reviews.moderationNotice': 'Đánh giá của bạn sẽ được hiển thị sau khi được kiểm duyệt.',
        'reviews.reviewSubmitError': 'Đã xảy ra lỗi khi gửi đánh giá của bạn. Vui lòng thử lại sau.',
      }[key] || key),
    );
  });

  it('renders up to three product reviews', () => {
    const wrapper = mount(ProductReviewsSection, {
      props: {
        productId: 228,
        reviews: [makeReview(1), makeReview(2), makeReview(3), makeReview(4)],
        locale: 'vi',
        averageRating: 4.8,
        totalReviews: 12,
      },
      global: {
        stubs: {
          UButton: {
            props: ['color', 'variant', 'icon'],
            template: '<button><slot /></button>',
          },
        },
      },
    });

    expect(wrapper.text()).toContain('Đánh giá');
    expect(wrapper.text()).toContain('4.8');
    expect(wrapper.text()).toContain('12');
    expect(wrapper.findAll('[data-testid=\"product-review-card\"]')).toHaveLength(3);
    expect(wrapper.findAll('svg').length).toBeGreaterThan(0);
    expect(wrapper.text()).toContain('Reviewer 1');
    expect(wrapper.text()).toContain('Reviewer 3');
    expect(wrapper.text()).not.toContain('Reviewer 4');
  });

  it('shows the inline form by default when there are no reviews', () => {
    const wrapper = mount(ProductReviewsSection, {
      props: {
        productId: 228,
        reviews: [],
        locale: 'vi',
        averageRating: 0,
        totalReviews: 0,
      },
      global: {
        stubs: {
          UButton: {
            props: ['color', 'variant', 'icon'],
            template: '<button><slot /></button>',
          },
        },
      },
    });

    expect(wrapper.find('section').exists()).toBe(true);
    expect(wrapper.find('.mock-review-form').exists()).toBe(true);
  });

  it('shows success message and closes the form after submit success', async () => {
    const wrapper = mount(ProductReviewsSection, {
      props: {
        productId: 228,
        reviews: [makeReview(1)],
        locale: 'vi',
        averageRating: 5,
        totalReviews: 1,
      },
      global: {
        stubs: {
          UButton: {
            props: ['color', 'variant', 'icon'],
            template: '<button><slot /></button>',
          },
        },
      },
    });

    await wrapper.findAll('button')[0].trigger('click');
    expect(wrapper.find('button.mock-review-form').exists()).toBe(true);
    await wrapper.find('button.mock-review-form').trigger('click');

    expect(wrapper.find('[data-testid="product-review-success"]').exists()).toBe(true);
    expect(wrapper.find('button.mock-review-form').exists()).toBe(false);
  });

  it('falls back to literal review labels when translations resolve to an empty string', () => {
    translate.mockImplementation(() => '');

    const wrapper = mount(ProductReviewsSection, {
      props: {
        productId: 228,
        reviews: [],
        locale: 'vi',
        averageRating: 0,
        totalReviews: 0,
      },
      global: {
        stubs: {
          UButton: {
            props: ['color', 'variant', 'icon'],
            template: '<button><slot /></button>',
          },
        },
      },
    });

    expect(wrapper.text()).toContain('Đánh giá');
    expect(wrapper.text()).toContain('Viết đánh giá');
    expect(wrapper.text()).toContain('Chia sẻ trải nghiệm của bạn');
  });
});
