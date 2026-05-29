import type { Product } from '@ew/shared';

export interface ProductReviewAggregate {
  averageRating: string;
  totalReviews: number;
}

export interface ProductReviewItem {
  id: number;
  authorName: string;
  rating: number;
  createdAt?: string;
  translations: Array<{
    locale: string;
    title?: string;
    content: string;
  }>;
}

export interface ProductDetailPayload {
  product: Product | null;
  productReviewAggregate: ProductReviewAggregate | null;
  productReviews: ProductReviewItem[];
}

interface TrpcProductQueries {
  getById: {
    query: (input: { id: number; locale: string }) => Promise<Product | null>;
  };
  getBySlug: {
    query: (input: { slug: string; locale: string }) => Promise<Product | null>;
  };
}

interface TrpcReviewQueries {
  getProductAggregateRating: {
    query: (input: { productId: number }) => Promise<ProductReviewAggregate>;
  };
  list: {
    query: (input: {
      productId: number;
      locale: string;
      limit?: number;
      sortBy?: 'latest' | 'highest_rating' | 'lowest_rating';
    }) => Promise<{
      data: ProductReviewItem[];
    }>;
  };
}

export interface ProductDetailPayloadDependencies {
  product: TrpcProductQueries;
  review: TrpcReviewQueries;
}

export async function fetchProductDetailPayload(input: {
  slug: string;
  locale: string;
  isTicketRoute: boolean;
  trpc: ProductDetailPayloadDependencies;
}): Promise<ProductDetailPayload> {
  const product = Number.isNaN(Number(input.slug))
    ? await input.trpc.product.getBySlug.query({
        slug: input.slug,
        locale: input.locale,
      })
    : await input.trpc.product.getById.query({
        id: Number(input.slug),
        locale: input.locale,
      });

  const productReviewAggregate =
    !input.isTicketRoute && product?.id
      ? await input.trpc.review.getProductAggregateRating.query({
          productId: product.id,
        })
      : null;
  const productReviews =
    !input.isTicketRoute && product?.id
      ? (
          await input.trpc.review.list.query({
            productId: product.id,
            locale: input.locale,
            limit: 3,
            sortBy: 'latest',
          })
        ).data ?? []
      : [];

  return {
    product,
    productReviewAggregate,
    productReviews,
  };
}
