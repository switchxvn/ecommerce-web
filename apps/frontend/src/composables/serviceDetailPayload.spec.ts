import { describe, expect, it, vi } from 'vitest';

import { fetchServiceDetailPayload } from './serviceDetailPayload';

describe('fetchServiceDetailPayload', () => {
  it('loads service review aggregate and the latest service reviews during SSR', async () => {
    const bySlug = vi.fn(async () => ({ id: 12, translations: [{ locale: 'vi', title: 'Sua xe nang' }] }));
    const getServiceAggregateRating = vi.fn(async () => ({
      averageRating: '4.9',
      totalReviews: 8,
    }));
    const listReviews = vi.fn(async () => ({
      data: [
        {
          id: 1,
          authorName: 'Nguyen Van A',
          rating: 5,
          createdAt: '2026-05-21T00:00:00.000Z',
          translations: [{ locale: 'vi', title: 'Rat on', content: 'Ky thuat den dung gio.' }],
        },
      ],
    }));

    const result = await fetchServiceDetailPayload({
      slug: 'sua-xe-nang',
      locale: 'vi',
      trpc: {
        service: {
          bySlug: { query: bySlug },
        },
        review: {
          getServiceAggregateRating: { query: getServiceAggregateRating },
          list: { query: listReviews },
        },
      },
    });

    expect(bySlug).toHaveBeenCalledWith({
      slug: 'sua-xe-nang',
      locale: 'vi',
    });
    expect(getServiceAggregateRating).toHaveBeenCalledWith({ serviceId: 12 });
    expect(listReviews).toHaveBeenCalledWith({
      serviceId: 12,
      locale: 'vi',
      limit: 3,
      sortBy: 'latest',
    });
    expect(result.serviceReviewAggregate).toEqual({
      averageRating: '4.9',
      totalReviews: 8,
    });
    expect(result.serviceReviews).toHaveLength(1);
  });

  it('skips review queries when the service is not found', async () => {
    const bySlug = vi.fn(async () => null);
    const getServiceAggregateRating = vi.fn();
    const listReviews = vi.fn();

    const result = await fetchServiceDetailPayload({
      slug: 'missing-service',
      locale: 'vi',
      trpc: {
        service: {
          bySlug: { query: bySlug },
        },
        review: {
          getServiceAggregateRating: { query: getServiceAggregateRating },
          list: { query: listReviews },
        },
      },
    });

    expect(getServiceAggregateRating).not.toHaveBeenCalled();
    expect(listReviews).not.toHaveBeenCalled();
    expect(result.service).toBeNull();
    expect(result.serviceReviewAggregate).toBeNull();
    expect(result.serviceReviews).toEqual([]);
  });
});
