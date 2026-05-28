import { flushPromises, mount } from '@vue/test-utils';
import { ref } from 'vue';
import ServiceReviewForm from './ServiceReviewForm.vue';

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

describe('ServiceReviewForm', () => {
  beforeEach(() => {
    mutateSubmitReview.mockReset();
    locale.value = 'vi';
  });

  it('validates minimal required fields before submit', async () => {
    const wrapper = mount(ServiceReviewForm, {
      props: {
        serviceId: 12,
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

  it('submits service reviews with serviceId and without serviceTypeId', async () => {
    mutateSubmitReview.mockResolvedValue({ id: 501 });

    const wrapper = mount(ServiceReviewForm, {
      props: {
        serviceId: 12,
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
    await wrapper.findAll('input')[2].setValue('Đội kỹ thuật hỗ trợ tốt');
    await wrapper.find('textarea').setValue('Dịch vụ xử lý nhanh, giải thích rõ nguyên nhân và khắc phục đúng hẹn.');
    await wrapper.find('form').trigger('submit.prevent');
    await flushPromises();

    expect(mutateSubmitReview).toHaveBeenCalledWith({
      authorName: 'Nguyễn Văn A',
      profession: undefined,
      rating: 5,
      serviceId: 12,
      translations: [
        {
          locale: 'vi',
          title: 'Đội kỹ thuật hỗ trợ tốt',
          content: 'Dịch vụ xử lý nhanh, giải thích rõ nguyên nhân và khắc phục đúng hẹn.',
        },
      ],
    });
    expect(wrapper.emitted('success')).toHaveLength(1);
  });
});
