import { flushPromises, mount } from '@vue/test-utils';
import { ref } from 'vue';
import ProductReviewForm from './ProductReviewForm.vue';

const locale = ref('vi');
const mutateSubmitReview = vi.fn();
const translate = vi.fn((key: string) =>
  ({
    'validation.required': 'Bắt buộc',
    'validation.minLength': 'Tối thiểu {min} ký tự',
    'reviews.authorName': 'Tên của bạn',
    'reviews.authorNamePlaceholder': 'Nhập tên của bạn',
    'reviews.professionLabel': 'Nghề nghiệp',
    'reviews.professionPlaceholder': 'Nhập nghề nghiệp của bạn (không bắt buộc)',
    'reviews.rating': 'Đánh giá',
    'reviews.ratingExcellent': 'Xuất sắc',
    'reviews.ratingGood': 'Tốt',
    'reviews.ratingAverage': 'Trung bình',
    'reviews.ratingPoor': 'Kém',
    'reviews.ratingBad': 'Rất kém',
    'reviews.reviewTitle': 'Tiêu đề đánh giá',
    'reviews.reviewTitlePlaceholder': 'Tóm tắt trải nghiệm của bạn trong một câu',
    'reviews.reviewContent': 'Nội dung đánh giá',
    'reviews.reviewContentPlaceholder': 'Mô tả chi tiết trải nghiệm của bạn...',
    'reviews.moderationNotice': 'Đánh giá của bạn sẽ được hiển thị sau khi được kiểm duyệt.',
    'reviews.submitReview': 'Gửi đánh giá',
  }[key] || key),
);

vi.mock('~/composables/useLocalization', () => ({
  useLocalization: () => ({
    t: translate,
    locale,
  }),
}));

vi.mock('~/composables/useTrpc', () => ({
  useTrpc: () => ({
    review: {
      submitReview: {
        mutate: mutateSubmitReview,
      },
    },
  }),
}));

describe('ProductReviewForm', () => {
  beforeEach(() => {
    mutateSubmitReview.mockReset();
    locale.value = 'vi';
    translate.mockReset();
    translate.mockImplementation((key: string) =>
      ({
        'validation.required': 'Bắt buộc',
        'validation.minLength': 'Tối thiểu {min} ký tự',
        'reviews.authorName': 'Tên của bạn',
        'reviews.authorNamePlaceholder': 'Nhập tên của bạn',
        'reviews.professionLabel': 'Nghề nghiệp',
        'reviews.professionPlaceholder': 'Nhập nghề nghiệp của bạn (không bắt buộc)',
        'reviews.rating': 'Đánh giá',
        'reviews.ratingExcellent': 'Xuất sắc',
        'reviews.ratingGood': 'Tốt',
        'reviews.ratingAverage': 'Trung bình',
        'reviews.ratingPoor': 'Kém',
        'reviews.ratingBad': 'Rất kém',
        'reviews.reviewTitle': 'Tiêu đề đánh giá',
        'reviews.reviewTitlePlaceholder': 'Tóm tắt trải nghiệm của bạn trong một câu',
        'reviews.reviewContent': 'Nội dung đánh giá',
        'reviews.reviewContentPlaceholder': 'Mô tả chi tiết trải nghiệm của bạn...',
        'reviews.moderationNotice': 'Đánh giá của bạn sẽ được hiển thị sau khi được kiểm duyệt.',
        'reviews.submitReview': 'Gửi đánh giá',
      }[key] || key),
    );
  });

  it('validates required minimal fields before submit', async () => {
    const wrapper = mount(ProductReviewForm, {
      props: {
        productId: 228,
        locale: 'vi',
      },
      global: {
        stubs: {
          UButton: {
            props: ['loading', 'type'],
            template: '<button :type="type"><slot /></button>',
          },
        },
      },
    });

    await wrapper.find('form').trigger('submit.prevent');

    expect(mutateSubmitReview).not.toHaveBeenCalled();
    expect(wrapper.text()).toContain('Bắt buộc');
  });

  it('submits product reviews without serviceTypeId and emits success', async () => {
    mutateSubmitReview.mockResolvedValue({ id: 999 });

    const wrapper = mount(ProductReviewForm, {
      props: {
        productId: 228,
        locale: 'vi',
      },
      global: {
        stubs: {
          UButton: {
            props: ['loading', 'type'],
            template: '<button :type="type"><slot /></button>',
          },
        },
      },
    });

    await wrapper.find('input').setValue('Nguyễn Văn A');
    await wrapper.findAll('input')[2].setValue('Rất ổn trong kho');
    await wrapper.find('textarea').setValue('Sản phẩm dùng ổn định và thao tác khá dễ cho đội vận hành.');
    await wrapper.find('form').trigger('submit.prevent');
    await flushPromises();

    expect(mutateSubmitReview).toHaveBeenCalledWith({
      authorName: 'Nguyễn Văn A',
      profession: undefined,
      rating: 5,
      productId: 228,
      translations: [
        {
          locale: 'vi',
          title: 'Rất ổn trong kho',
          content: 'Sản phẩm dùng ổn định và thao tác khá dễ cho đội vận hành.',
        },
      ],
    });
    expect(wrapper.emitted('success')).toHaveLength(1);
  });

  it('falls back to literal form labels and placeholders when translations resolve to an empty string', () => {
    translate.mockImplementation(() => '');

    const wrapper = mount(ProductReviewForm, {
      props: {
        productId: 228,
        locale: 'vi',
      },
      global: {
        stubs: {
          UButton: {
            props: ['loading', 'type'],
            template: '<button :type="type"><slot /></button>',
          },
        },
      },
    });

    expect(wrapper.text()).toContain('Tên của bạn');
    expect(wrapper.text()).toContain('Đánh giá');
    expect(wrapper.text()).toContain('Gửi đánh giá');
    expect(wrapper.html()).toContain('Nhập tên của bạn');
  });
});
