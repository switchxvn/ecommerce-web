import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { adminProcedure, router } from '../../procedures';
import { Permissions } from '../../../auth/constants/permissions.constant';
import { requirePermission } from '../../middlewares/permission.middleware';
import { BadRequestException } from '@nestjs/common';
import { CategoryType } from '@ew/shared';
import { UpdateCategoryData, CategoryTranslationData, CreateCategoryData } from '../../../category/admin/services/category-admin.service';
import type { PrismaClient } from '@prisma/client';

type Category = PrismaClient['category']['create']['data'];
type CategoryTranslation = PrismaClient['categoryTranslation']['create']['data'];

const categoryTranslationSchema = z.object({
  locale: z.string(),
  name: z.string(),
  slug: z.string(),
  description: z.string().optional(),
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
  metaKeywords: z.string().optional(),
  ogTitle: z.string().optional(),
  ogDescription: z.string().optional(),
  ogImage: z.string().optional(),
  canonicalUrl: z.string().optional(),
});

const categoryPriceRangeFields = {
  priceRangeMin: z.number().nonnegative().nullable().optional(),
  priceRangeMax: z.number().nonnegative().nullable().optional(),
};

const validateCategoryPriceRange = <T extends { priceRangeMin?: number | null; priceRangeMax?: number | null }>(
  data: T,
  ctx: z.RefinementCtx,
) => {
  if (
    data.priceRangeMin !== undefined &&
    data.priceRangeMax !== undefined &&
    data.priceRangeMin !== null &&
    data.priceRangeMax !== null &&
    data.priceRangeMin > data.priceRangeMax
  ) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'priceRangeMin must be less than or equal to priceRangeMax',
      path: ['priceRangeMax'],
    });
  }
};

const createCategorySchema = z.object({
  name: z.string(),
  slug: z.string(),
  description: z.string().optional(),
  parentId: z.number().nullable().optional(),
  active: z.boolean().default(true),
  type: z.enum(['news', 'product', 'both', 'gallery']).default('news'),
  icon: z.string().nullable().optional(),
  ...categoryPriceRangeFields,
  translations: z.array(categoryTranslationSchema).optional(),
}).superRefine(validateCategoryPriceRange);

const updateCategorySchema = z.object({
  id: z.number(),
  data: z.object({
    type: z.enum(['news', 'product', 'both', 'gallery']).optional(),
    active: z.boolean().optional(),
    icon: z.string().nullable().optional(),
    ...categoryPriceRangeFields,
    translations: z.array(categoryTranslationSchema).optional(),
  }).superRefine(validateCategoryPriceRange)
});

// Helper function to transform category data
const transformCategory = (category: any) => {
  if (!category) return null;
  
  const transformed = {
    id: category.id,
    type: category.type,
    active: category.active,
    icon: category.icon,
    priceRangeMin: category.priceRangeMin === null || category.priceRangeMin === undefined ? null : Number(category.priceRangeMin),
    priceRangeMax: category.priceRangeMax === null || category.priceRangeMax === undefined ? null : Number(category.priceRangeMax),
    createdAt: category.createdAt,
    updatedAt: category.updatedAt,
    translations: category.translations?.map((translation: any) => ({
      id: translation.id,
      locale: translation.locale,
      name: translation.name,
      slug: translation.slug,
      description: translation.description,
      metaTitle: translation.metaTitle,
      metaDescription: translation.metaDescription,
      metaKeywords: translation.metaKeywords,
      ogTitle: translation.ogTitle,
      ogDescription: translation.ogDescription,
      ogImage: translation.ogImage,
      canonicalUrl: translation.canonicalUrl,
      createdAt: translation.createdAt,
      updatedAt: translation.updatedAt
    })) || [],
    parent: category.parent ? {
      id: category.parent.id,
      type: category.parent.type,
      active: category.parent.active,
      icon: category.parent.icon,
      translations: category.parent.translations?.map((translation: any) => ({
        id: translation.id,
        locale: translation.locale,
        name: translation.name,
        slug: translation.slug,
        description: translation.description,
        metaTitle: translation.metaTitle,
        metaDescription: translation.metaDescription,
        metaKeywords: translation.metaKeywords,
        ogTitle: translation.ogTitle,
        ogDescription: translation.ogDescription,
        ogImage: translation.ogImage,
        canonicalUrl: translation.canonicalUrl,
      })) || []
    } : null,
    children: category.children?.map((child: any) => ({
      id: child.id,
      type: child.type,
      active: child.active,
      icon: child.icon,
      translations: child.translations?.map((translation: any) => ({
        id: translation.id,
        locale: translation.locale,
        name: translation.name,
        slug: translation.slug,
        description: translation.description,
        metaTitle: translation.metaTitle,
        metaDescription: translation.metaDescription,
        metaKeywords: translation.metaKeywords,
        ogTitle: translation.ogTitle,
        ogDescription: translation.ogDescription,
        ogImage: translation.ogImage,
        canonicalUrl: translation.canonicalUrl,
      })) || []
    })) || []
  };
  
  return transformed;
};

export const categoryAdminRouter = router({
  getCategories: adminProcedure
    .use(requirePermission(Permissions.VIEW_CONTENT))
    .query(async ({ ctx }) => {
      try {
        const categories = await ctx.services.categoryAdminService.findAll();
        // Transform the categories to remove circular references
        return categories.map(transformCategory);
      } catch (error) {
        ctx.logger.error('Failed to fetch categories:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch categories',
          cause: error,
        });
      }
    }),

  getCategoryById: adminProcedure
    .use(requirePermission(Permissions.VIEW_CONTENT))
    .input(z.number())
    .query(async ({ ctx, input }) => {
      try {
        const category = await ctx.services.categoryAdminService.findOne(input);
        if (!category) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: `Category with ID ${input} not found`,
          });
        }
        // Transform the category to remove circular references
        return transformCategory(category);
      } catch (error) {
        ctx.logger.error('Failed to fetch category:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch category',
          cause: error,
        });
      }
    }),

  getAllCategories: adminProcedure
    .use(requirePermission(Permissions.VIEW_CONTENT))
    .input(
      z.object({
        page: z.number().min(1).default(1),
        limit: z.number().min(1).default(100),
        search: z.string().default(''),
        active: z.boolean().nullable().default(null),
        type: z.enum(['news', 'product', 'both', 'gallery']).optional(),
        sortBy: z.string().optional(),
        sortOrder: z.enum(['asc', 'desc']).optional(),
        locale: z.string().optional()
      })
    )
    .query(async ({ ctx, input }) => {
      try {
        console.log('getAllCategories called with input:', input);
        
        const result = await ctx.services.categoryAdminService.getCategories({
          page: input.page,
          limit: input.limit,
          search: input.search,
          active: input.active,
          type: input.type as CategoryType,
          sortBy: input.sortBy,
          sortOrder: input.sortOrder,
          locale: input.locale
        });

        console.log('getAllCategories result:', {
          totalItems: result.total,
          itemsCount: result.items.length,
          currentPage: input.page,
          limit: input.limit
        });

        return {
          categories: result.items.map(transformCategory),
          total: result.total,
          totalPages: Math.ceil(result.total / input.limit),
          currentPage: input.page,
          limit: input.limit
        };
      } catch (error) {
        console.error('Error in getAllCategories:', error);
        ctx.logger.error('Failed to fetch categories:', {
          error,
          input,
          stack: error instanceof Error ? error.stack : undefined
        });
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch categories',
          cause: error,
        });
      }
    }),

  deleteCategory: adminProcedure
    .use(requirePermission(Permissions.DELETE_CONTENT))
    .input(z.number())
    .mutation(async ({ ctx, input }) => {
      try {
        await ctx.services.categoryAdminService.remove(input);
        return { success: true };
      } catch (error) {
        ctx.logger.error('Failed to delete category:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to delete category',
          cause: error,
        });
      }
    }),

  createCategory: adminProcedure
    .use(requirePermission(Permissions.CREATE_CONTENT))
    .input(createCategorySchema)
    .mutation(async ({ ctx, input }) => {
      try {
        const newCategory = await ctx.services.categoryAdminService.create(input as CreateCategoryData);
        // Transform the category to remove circular references
        return transformCategory(newCategory);
      } catch (error) {
        ctx.logger.error('Failed to create category:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create category',
          cause: error,
        });
      }
    }),

  getByType: adminProcedure
    .use(requirePermission(Permissions.VIEW_CONTENT))
    .input(z.object({
      type: z.enum(['news', 'product', 'both', 'gallery'])
    }))
    .query(async ({ ctx, input }) => {
      try {
        console.log('getByType called with input:', input);
        
        const result = await ctx.services.categoryAdminService.getCategories({
          page: 1,
          limit: 100,
          active: true,
          type: input.type as CategoryType
        });

        // Transform the categories to remove circular references
        return result.items.map(transformCategory);
      } catch (error) {
        ctx.logger.error('Failed to fetch categories by type:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch categories by type',
          cause: error,
        });
      }
    }),

  updateCategory: adminProcedure
    .use(requirePermission(Permissions.EDIT_CONTENT))
    .input(updateCategorySchema)
    .mutation(async ({ ctx, input }) => {
      try {
        const updatedCategory = await ctx.services.categoryAdminService.updateCategory(input.id, input.data as UpdateCategoryData);
        // Transform the category to remove circular references
        return transformCategory(updatedCategory);
      } catch (error) {
        ctx.logger.error('Failed to update category:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update category',
          cause: error,
        });
      }
    })
}); 
