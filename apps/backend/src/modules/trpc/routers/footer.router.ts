import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { createFooterSchema, updateFooterSchema } from '@ew/shared';
import { protectedProcedure, publicProcedure, router } from '../procedures';

export const footerRouter = router({
  // Public endpoints
  getActiveFooter: publicProcedure.query(async ({ ctx }) => {
    try {
      const footer = await ctx.services.footerFrontendService.getActiveFooter();
      
      if (!footer) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Không tìm thấy footer',
        });
      }

      return {
        id: footer.id,
        name: footer.name,
        componentName: footer.componentName,
        addresses: footer.addresses,
        mapUrl: footer.mapUrl,
        fanpageUrl: footer.fanpageUrl,
        companyInfo: footer.companyInfo,
        quickLinks: footer.quickLinks,
        backgroundLightColor: footer.backgroundLightColor,
        backgroundDarkColor: footer.backgroundDarkColor,
        copyrightStyle: footer.copyrightStyle,
        socialIcons: footer.socialIcons,
        logoUrl: footer.logoUrl,
        logoAlt: footer.logoAlt,
        isActive: footer.isActive,
        branchInfo: footer.branchInfo,
        settings: footer.settings,
        createdAt: footer.createdAt,
        updatedAt: footer.updatedAt,
      };
    } catch (error) {
      console.error('Failed to get active footer:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Không thể tải thông tin footer',
        cause: error,
      });
    }
  }),

  // Admin endpoints
  getAllFooters: protectedProcedure.query(async ({ ctx }) => {
    try {
      return await ctx.services.footerAdminService.findAll();
    } catch (error) {
      console.error('Failed to fetch footers:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Không thể tải danh sách footer',
        cause: error,
      });
    }
  }),

  createFooter: protectedProcedure
    .input(createFooterSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        return await ctx.services.footerAdminService.create(input);
      } catch (error) {
        console.error('Failed to create footer:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Không thể tạo footer',
          cause: error,
        });
      }
    }),

  updateFooter: protectedProcedure
    .input(z.object({
      id: z.number(),
      data: updateFooterSchema,
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        const updated = await ctx.services.footerAdminService.update(input.id, input.data);

        if (!updated) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Footer không tồn tại',
          });
        }

        return updated;
      } catch (error) {
        if (error instanceof TRPCError) throw error;

        console.error(`Failed to update footer ${input.id}:`, error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Không thể cập nhật footer',
          cause: error,
        });
      }
    }),

  deleteFooter: protectedProcedure
    .input(z.number())
    .mutation(async ({ input, ctx }) => {
      try {
        await ctx.services.footerAdminService.delete(input);
        return { success: true };
      } catch (error) {
        console.error(`Failed to delete footer ${input}:`, error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Không thể xóa footer',
          cause: error,
        });
      }
    }),

  setActiveFooter: protectedProcedure
    .input(z.number())
    .mutation(async ({ input, ctx }) => {
      try {
        const footer = await ctx.services.footerAdminService.setActive(input);

        if (!footer) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Footer không tồn tại',
          });
        }

        return footer;
      } catch (error) {
        if (error instanceof TRPCError) throw error;

        console.error(`Failed to activate footer ${input}:`, error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Không thể kích hoạt footer',
          cause: error,
        });
      }
    }),
});
