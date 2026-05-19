import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { adminProcedure, router } from '../../procedures/index';
import { ReviewStatus } from '@ew/shared';
import { CreateReviewInput, UpdateReviewInput } from '../../../review/admin/services/admin-review.service';

const translationSchema = z.object({
  locale: z.string().length(2),
  title: z.string().optional(),
  content: z.string(),
});

const createSchema = z.object({
  authorName: z.string().min(2),
  authorAvatar: z.string().url().optional(),
  profession: z.string().optional(),
  rating: z.number().min(1).max(5),
  serviceTypeId: z.number().optional(),
  productId: z.number().optional(),
  visitDate: z.string().optional().transform(val => val ? new Date(val) : undefined),
  featured: z.boolean().optional(),
  status: z.nativeEnum(ReviewStatus).optional(),
  translations: z.array(translationSchema),
});

const updateSchema = z.object({
  authorName: z.string().min(2).optional(),
  authorAvatar: z.string().url().optional().nullable(),
  profession: z.string().optional().nullable(),
  rating: z.number().min(1).max(5).optional(),
  serviceTypeId: z.number().optional().nullable(),
  productId: z.number().optional().nullable(),
  visitDate: z.string().optional().nullable().transform(val => {
    if (val === null) return null;
    return val ? new Date(val) : undefined;
  }),
  featured: z.boolean().optional(),
  status: z.nativeEnum(ReviewStatus).optional(),
  translations: z.array(translationSchema).optional(),
});

const paginationSchema = z.object({
  page: z.number().optional(),
  limit: z.number().optional(),
  search: z.string().optional(),
  featured: z.boolean().optional(),
  serviceTypeId: z.number().optional(),
  minRating: z.number().optional(),
  maxRating: z.number().optional(),
  status: z.nativeEnum(ReviewStatus).optional(),
  locale: z.string().optional(),
});

export const adminReviewRouter = router({
  list: adminProcedure
    .input(paginationSchema.optional())
    .query(async ({ ctx, input }) => {
      const adminReviewService = ctx.services.admin.review;
      return adminReviewService.findAll(input || {});
    }),

  getById: adminProcedure
    .input(z.object({
      id: z.number(),
      locale: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const adminReviewService = ctx.services.admin.review;
      const review = await adminReviewService.findById(input.id, input.locale);
      
      if (!review) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Review not found',
        });
      }
      
      return review;
    }),

  getServiceTypes: adminProcedure
    .input(z.object({
      locale: z.string().optional(),
    }).optional())
    .query(async ({ ctx, input }) => {
      const frontendReviewService = ctx.services.frontend.review;
      return frontendReviewService.getServiceTypes(input?.locale || 'vi');
    }),

  create: adminProcedure
    .input(createSchema)
    .mutation(async ({ ctx, input }) => {
      const adminReviewService = ctx.services.admin.review;
      return adminReviewService.create(input as CreateReviewInput);
    }),

  update: adminProcedure
    .input(z.object({
      id: z.number(),
      data: updateSchema,
    }))
    .mutation(async ({ ctx, input }) => {
      const adminReviewService = ctx.services.admin.review;
      const updated = await adminReviewService.update(input.id, input.data as UpdateReviewInput);
      
      if (!updated) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Review not found',
        });
      }
      
      return updated;
    }),

  toggleFeatured: adminProcedure
    .input(z.object({
      id: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      const adminReviewService = ctx.services.admin.review;
      const updated = await adminReviewService.toggleFeatured(input.id);
      
      if (!updated) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Review not found',
        });
      }
      
      return updated;
    }),

  updateStatus: adminProcedure
    .input(z.object({
      id: z.number(),
      status: z.nativeEnum(ReviewStatus),
    }))
    .mutation(async ({ ctx, input }) => {
      const adminReviewService = ctx.services.admin.review;
      const updated = await adminReviewService.updateStatus(input.id, input.status);
      
      if (!updated) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Review not found',
        });
      }
      
      return updated;
    }),

  delete: adminProcedure
    .input(z.object({
      id: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      const adminReviewService = ctx.services.admin.review;
      const success = await adminReviewService.delete(input.id);
      
      if (!success) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Review not found',
        });
      }
      
      return { success };
    }),
}); 
