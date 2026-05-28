import type { Service } from '@ew/shared';

export interface ServiceReviewAggregate {
  averageRating: string;
  totalReviews: number;
}

export interface ServiceReviewItem {
  id: number;
  authorName: string;
  profession?: string;
  rating: number;
  createdAt?: string;
  translations: Array<{
    locale: string;
    title?: string;
    content: string;
  }>;
}

export interface ServiceDetailPayload {
  service: Service | null;
  serviceReviewAggregate: ServiceReviewAggregate | null;
  serviceReviews: ServiceReviewItem[];
}

interface TrpcServiceQueries {
  bySlug: {
    query: (input: { slug: string; locale: string }) => Promise<Service | null>;
  };
}

interface TrpcReviewQueries {
  getServiceAggregateRating: {
    query: (input: { serviceId: number }) => Promise<ServiceReviewAggregate>;
  };
  list: {
    query: (input: {
      serviceId: number;
      locale: string;
      limit?: number;
      sortBy?: 'latest' | 'highest_rating' | 'lowest_rating';
    }) => Promise<{
      data: ServiceReviewItem[];
    }>;
  };
}

export interface ServiceDetailPayloadDependencies {
  service: TrpcServiceQueries;
  review: TrpcReviewQueries;
}

export async function fetchServiceDetailPayload(input: {
  slug: string;
  locale: string;
  trpc: ServiceDetailPayloadDependencies;
}): Promise<ServiceDetailPayload> {
  const service = await input.trpc.service.bySlug.query({
    slug: input.slug,
    locale: input.locale,
  });

  const serviceReviewAggregate = service?.id
    ? await input.trpc.review.getServiceAggregateRating.query({
        serviceId: service.id,
      })
    : null;

  const serviceReviews = service?.id
    ? (
        await input.trpc.review.list.query({
          serviceId: service.id,
          locale: input.locale,
          limit: 3,
          sortBy: 'latest',
        })
      ).data ?? []
    : [];

  return {
    service,
    serviceReviewAggregate,
    serviceReviews,
  };
}
