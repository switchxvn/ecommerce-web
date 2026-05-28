import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { publicProcedure, router } from '../procedures/index';
import { ReviewStatus } from '@ew/shared';
import { CreateReviewInput } from '../../review/admin/services/admin-review.service';

const reviewsFilterSchema = z.object({
  page: z.number().optional(),
  limit: z.number().optional(),
  featured: z.boolean().optional(),
  serviceTypeId: z.number().optional(),
  productId: z.number().optional(),
  serviceId: z.number().optional(),
  locale: z.string().optional(),
  minRating: z.number().optional(),
  sortBy: z.enum(['latest', 'highest_rating', 'lowest_rating']).optional(),
});

const translationSchema = z.object({
  locale: z.string().min(2),
  title: z.string().optional(),
  content: z.string().min(10),
});

export const DEFAULT_PUBLIC_PRODUCT_REVIEW_SERVICE_TYPE_ID = 4;

export const submitReviewSchema = z.object({
  authorName: z.string().min(2),
  authorAvatar: z.string().url().optional(),
  profession: z.string().optional(),
  rating: z.number().min(1).max(5),
  serviceTypeId: z.number().min(1).optional(),
  productId: z.number().min(1).optional(),
  serviceId: z.number().min(1).optional(),
  visitDate: z.string().optional().transform(val => val ? new Date(val) : undefined),
  translations: z.array(translationSchema).min(1),
});

export function buildPublicReviewCreateInput(input: z.infer<typeof submitReviewSchema>): CreateReviewInput {
  return {
    authorName: input.authorName,
    authorAvatar: input.authorAvatar,
    profession: input.profession,
    rating: input.rating,
    serviceTypeId: input.serviceTypeId ?? (input.productId ? DEFAULT_PUBLIC_PRODUCT_REVIEW_SERVICE_TYPE_ID : undefined),
    productId: input.productId,
    serviceId: input.serviceId,
    visitDate: input.visitDate,
    status: ReviewStatus.PENDING,
    featured: false,
    translations: input.translations.map(t => ({
      locale: t.locale,
      title: t.title,
      content: t.content
    }))
  };
}

export const reviewRouter = router({
  list: publicProcedure
    .input(reviewsFilterSchema.optional())
    .query(async ({ ctx, input }) => {
      const frontendReviewService = ctx.services.frontend.review;
      return frontendReviewService.findAll(input || {});
    }),

  featured: publicProcedure
    .input(z.object({
      limit: z.number().optional(),
      locale: z.string().optional(),
    }).optional())
    .query(async ({ ctx, input }) => {
      const frontendReviewService = ctx.services.frontend.review;
      const limit = input?.limit || 6;
      const locale = input?.locale || 'vi';
      
      return frontendReviewService.findFeatured(limit, locale);
    }),

  getById: publicProcedure
    .input(z.object({
      id: z.number(),
      locale: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const frontendReviewService = ctx.services.frontend.review;
      const review = await frontendReviewService.findById(input.id, input.locale);
      
      if (!review) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Review not found',
        });
      }
      
      return review;
    }),

  getAverageRating: publicProcedure
    .input(z.object({
      serviceTypeId: z.number().optional(),
    }).optional())
    .query(async ({ ctx, input }) => {
      const frontendReviewService = ctx.services.frontend.review;
      return frontendReviewService.getAverageRating(input?.serviceTypeId);
    }),

  getProductAggregateRating: publicProcedure
    .input(z.object({
      productId: z.number().min(1),
    }))
    .query(async ({ ctx, input }) => {
      const frontendReviewService = ctx.services.frontend.review;
      return frontendReviewService.getProductAggregateRating(input.productId);
    }),

  getServiceAggregateRating: publicProcedure
    .input(z.object({
      serviceId: z.number().min(1),
    }))
    .query(async ({ ctx, input }) => {
      const frontendReviewService = ctx.services.frontend.review;
      return frontendReviewService.getServiceAggregateRating(input.serviceId);
    }),

  getRatingDistribution: publicProcedure
    .input(z.object({
      serviceTypeId: z.number().optional(),
    }).optional())
    .query(async ({ ctx, input }) => {
      const frontendReviewService = ctx.services.frontend.review;
      return frontendReviewService.getRatingDistribution(input?.serviceTypeId);
    }),

  getServiceTypes: publicProcedure
    .input(z.object({
      locale: z.string().optional(),
    }).optional())
    .query(async ({ ctx, input }) => {
      const frontendReviewService = ctx.services.frontend.review;
      return frontendReviewService.getServiceTypes(input?.locale || 'vi');
    }),

  submitReview: publicProcedure
    .input(submitReviewSchema)
    .mutation(async ({ ctx, input }) => {
      const adminReviewService = ctx.services.admin.review;
      return adminReviewService.create(buildPublicReviewCreateInput(input));
    }),
}); 
