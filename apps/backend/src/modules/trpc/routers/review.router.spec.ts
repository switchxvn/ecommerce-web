import { describe, expect, it } from 'vitest';
import {
  buildPublicReviewCreateInput,
  DEFAULT_PUBLIC_PRODUCT_REVIEW_SERVICE_TYPE_ID,
  submitReviewSchema,
} from './review.router';
import { ReviewStatus } from '@ew/shared';

describe('submitReviewSchema', () => {
  it('accepts product detail review payloads without serviceTypeId', () => {
    const parsed = submitReviewSchema.parse({
      authorName: 'Nguyen Van A',
      profession: 'Quan ly kho',
      rating: 5,
      productId: 228,
      translations: [
        {
          locale: 'vi',
          title: 'Rat on',
          content: 'San pham dung on dinh va thao tac de dang.',
        },
      ],
    });

    expect(parsed.productId).toBe(228);
    expect(parsed.serviceTypeId).toBeUndefined();
  });

  it('accepts service detail review payloads with serviceId', () => {
    const parsed = submitReviewSchema.parse({
      authorName: 'Nguyen Van B',
      profession: 'Quan ly van hanh',
      rating: 4,
      serviceId: 12,
      translations: [
        {
          locale: 'vi',
          title: 'Ho tro nhanh',
          content: 'Dich vu phan hoi nhanh va xu ly dung hen.',
        },
      ],
    });

    expect(parsed.serviceId).toBe(12);
    expect(parsed.serviceTypeId).toBeUndefined();
  });
});

describe('buildPublicReviewCreateInput', () => {
  it('defaults serviceTypeId and keeps product reviews pending', () => {
    const result = buildPublicReviewCreateInput({
      authorName: 'Nguyen Van A',
      profession: 'Quan ly kho',
      rating: 5,
      productId: 228,
      visitDate: undefined,
      translations: [
        {
          locale: 'vi',
          title: 'Rat on',
          content: 'San pham dung on dinh va thao tac de dang.',
        },
      ],
    });

    expect(result.serviceTypeId).toBe(DEFAULT_PUBLIC_PRODUCT_REVIEW_SERVICE_TYPE_ID);
    expect(result.productId).toBe(228);
    expect(result.status).toBe(ReviewStatus.PENDING);
    expect(result.featured).toBe(false);
  });

  it('keeps service-linked reviews pending and preserves serviceId', () => {
    const result = buildPublicReviewCreateInput({
      authorName: 'Nguyen Van B',
      profession: 'Quan ly van hanh',
      rating: 4,
      serviceId: 12,
      visitDate: undefined,
      translations: [
        {
          locale: 'vi',
          title: 'Ho tro nhanh',
          content: 'Dich vu phan hoi nhanh va xu ly dung hen.',
        },
      ],
    });

    expect(result.serviceId).toBe(12);
    expect(result.status).toBe(ReviewStatus.PENDING);
    expect(result.featured).toBe(false);
  });
});
