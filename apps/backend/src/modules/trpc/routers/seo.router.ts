import { NotFoundException } from '@nestjs/common';
import { TRPCError } from '@trpc/server';
import { publicProcedure, protectedProcedure, router } from '../procedures';
import { z } from 'zod';

export const seoRouter = router({
  // Public endpoints
  getSeoByPath: publicProcedure
    .input(z.string())
    .query(async ({ input, ctx }) => {
      try {
        ctx.logger.log(`Fetching SEO for path: ${input}`);
        const seo = await ctx.services.seoFrontendService.findActiveSeoByPath(input);

        if (!seo) {
          ctx.logger.warn(`SEO not found for path: ${input}`);
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: `SEO for path ${input} not found`,
          });
        }

        return seo;
      } catch (error) {
        const mappedError = mapSeoLookupError(error);

        if (mappedError instanceof TRPCError) {
          throw mappedError;
        }
        
        ctx.logger.error(`Error fetching SEO for path ${input}: ${mappedError instanceof Error ? mappedError.message : String(mappedError)}`);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to retrieve SEO information',
          cause: mappedError,
        });
      }
    }),

  // Admin endpoints
  getAllSeo: protectedProcedure
    .input(z.object({
      pagePath: z.string().optional(),
      isActive: z.boolean().optional(),
    }).optional())
    .query(async ({ input, ctx }) => {
      try {
        ctx.logger.log('Fetching all SEO entries');
        return ctx.services.seoAdminService.findAll(input);
      } catch (error) {
        ctx.logger.error(`Error fetching SEO entries: ${error instanceof Error ? error.message : String(error)}`);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to retrieve SEO entries',
          cause: error,
        });
      }
    }),

  createSeo: protectedProcedure
    .input(z.object({
      title: z.string().optional(),
      description: z.string().optional(),
      ogTitle: z.string().optional(),
      ogDescription: z.string().optional(),
      ogImage: z.string().optional(),
      keywords: z.string().optional(),
      canonicalUrl: z.string().optional(),
      pagePath: z.string(),
      robotsTxt: z.string().optional(),
      isActive: z.boolean().optional().default(true),
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        ctx.logger.log(`Creating new SEO entry for path: ${input.pagePath}`);
        const newSeo = await ctx.services.seoAdminService.create(input);
        ctx.logger.log(`Successfully created SEO ID: ${newSeo.id}`);
        return newSeo;
      } catch (error) {
        ctx.logger.error(`Error creating SEO entry: ${error instanceof Error ? error.message : String(error)}`);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create SEO entry',
          cause: error,
        });
      }
    }),

  updateSeo: protectedProcedure
    .input(z.object({
      id: z.number(),
      data: z.object({
        title: z.string().optional(),
        description: z.string().optional(),
        ogTitle: z.string().optional(),
        ogDescription: z.string().optional(),
        ogImage: z.string().optional(),
        keywords: z.string().optional(),
        canonicalUrl: z.string().optional(),
        pagePath: z.string().optional(),
        robotsTxt: z.string().optional(),
        isActive: z.boolean().optional(),
      }),
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        ctx.logger.log(`Updating SEO ID: ${input.id}`);
        const updatedSeo = await ctx.services.seoAdminService.update(input.id, input.data);
        
        if (!updatedSeo) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: `SEO with ID ${input.id} not found`,
          });
        }
        
        ctx.logger.log(`Successfully updated SEO ID: ${updatedSeo.id}`);
        return updatedSeo;
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        
        ctx.logger.error(`Error updating SEO ID ${input.id}: ${error instanceof Error ? error.message : String(error)}`);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update SEO entry',
          cause: error,
        });
      }
    }),

  deleteSeo: protectedProcedure
    .input(z.number())
    .mutation(async ({ input, ctx }) => {
      try {
        ctx.logger.log(`Deleting SEO ID: ${input}`);
        await ctx.services.seoAdminService.delete(input);
        ctx.logger.log(`Successfully deleted SEO ID: ${input}`);
        return { success: true, message: 'SEO entry deleted successfully' };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        
        ctx.logger.error(`Error deleting SEO ID ${input}: ${error instanceof Error ? error.message : String(error)}`);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to delete SEO entry',
          cause: error,
        });
      }
    }),
});

export function mapSeoLookupError(error: unknown): TRPCError | unknown {
  if (error instanceof TRPCError) {
    return error;
  }

  if (error instanceof NotFoundException) {
    return new TRPCError({
      code: 'NOT_FOUND',
      message: error.message,
      cause: error,
    });
  }

  return error;
}
