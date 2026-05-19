import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { Permissions } from '../../../auth/constants/permissions.constant';
import { Category } from '../../../category/entities/category.entity';
import { ProductTranslation } from '../../../product/entities/product-translation.entity';
import { ProductSidebarItem, ProductSidebarItemType } from '../../../product/entities/product-sidebar-item.entity';
import { Product, ProductType } from '../../../product/entities/product.entity';
import { requirePermission } from '../../middlewares/permission.middleware';
import { adminProcedure, protectedProcedure, router } from '../../procedures';
import { ProductAdminService } from '../../../product/admin/services/product-admin.service';
import { ProductStockHistoryService } from '../../../product/services/product-stock-history.service';
import { StockAdjustmentType } from '../../../product/entities/product-stock-history.entity';
import { ProductSpecificationService } from '../../../product/services/product-specification.service';

// Base translation input schema
const productTranslationSchema = z.object({
  locale: z.string().length(2),
  title: z.string(),
  content: z.string().optional(),
  shortDescription: z.string().optional(),
  slug: z.string().optional(),
  videoTitle: z.string().optional(),
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
  metaKeywords: z.string().optional(),
  ogTitle: z.string().optional(),
  ogDescription: z.string().optional()
});

// Category input schema
const categoryInputSchema = z.object({
  id: z.number()
});

// Specification input schema
const specificationInputSchema = z.object({
  name: z.string(),
  value: z.string(),
  position: z.number().optional(),
  locale: z.string().length(2)
});

const sidebarItemInputSchema = z.object({
  itemType: z.nativeEnum(ProductSidebarItemType),
  itemId: z.number(),
  position: z.number().optional(),
});

// Tạo router thay vì sử dụng class với @injectable
export const productAdminRouter = router({
  getAllProducts: adminProcedure
    .use(requirePermission(Permissions.VIEW_CONTENT))
    .input(
      z.object({
        page: z.number().min(1).default(1),
        limit: z.number().min(1).default(10),
        search: z.string().optional(),
        published: z.boolean().nullable().default(null),
        sortBy: z.string().optional().default('createdAt'),
        sortOrder: z.enum(['asc', 'desc']).optional().default('desc')
      })
    )
    .query(async ({ ctx, input }) => {
      try {
        const result = await ctx.services.productAdminService.getProducts({
          page: input.page,
          limit: input.limit,
          search: input.search,
          published: input.published,
          sortBy: input.sortBy,
          sortOrder: input.sortOrder
        });

        return {
          products: result.items,
          total: result.total,
          totalPages: Math.ceil(result.total / result.limit),
          currentPage: input.page,
          limit: input.limit
        };
      } catch (error) {
        ctx.logger.error('Failed to fetch products:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch products',
          cause: error,
        });
      }
    }),

  getProductById: adminProcedure
    .use(requirePermission(Permissions.VIEW_CONTENT))
    .input(z.number())
    .query(async ({ ctx, input }) => {
      try {
        const product = await ctx.services.productAdminService.findOne(input);
        if (!product) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: `Product with ID ${input} not found`,
          });
        }
        return product;
      } catch (error) {
        ctx.logger.error('Failed to fetch product:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch product',
          cause: error,
        });
      }
    }),

  createProduct: protectedProcedure
    .input(z.object({
      sku: z.string().optional(),
      price: z.number().nullable().optional(),
      comparePrice: z.number().nullable().optional(),
      thumbnail: z.string().optional(),
      gallery: z.array(z.string()).optional(),
      published: z.boolean().optional(),
      quantity: z.number().optional(),
      isFeatured: z.boolean().optional(),
      isNew: z.boolean().optional(),
      isSale: z.boolean().optional(),
      type: z.nativeEnum(ProductType).optional(),
      videoReview: z.string().optional(),
      translations: z.array(productTranslationSchema),
      categories: z.array(categoryInputSchema).optional(),
      categoryIds: z.array(z.number()).optional(),
      specifications: z.array(specificationInputSchema).optional(),
      sidebarItems: z.array(sidebarItemInputSchema).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { translations, categories, categoryIds, specifications, sidebarItems, ...productData } = input;
      
      // Tạo đối tượng dữ liệu sản phẩm
      const productCreateData: any = {
        ...productData,
        translations: translations as unknown as ProductTranslation[],
      };

      // Xử lý categories hoặc categoryIds
      if (categories) {
        productCreateData.categories = categories.map(({ id }) => ({ id } as unknown as Category));
      } else if (categoryIds && categoryIds.length > 0) {
        productCreateData.categories = categoryIds.map(id => ({ id } as unknown as Category));
      }

      if (sidebarItems) {
        productCreateData.sidebarItems = sidebarItems as unknown as ProductSidebarItem[];
      }
      
      // Tạo sản phẩ
      const product = await ctx.services.productAdminService.create(productCreateData);
      
      // Xử lý thông số kỹ thuật nếu có
      if (specifications && specifications.length > 0) {
        for (const spec of specifications) {
          await ctx.services.productSpecificationService.create(
            product.id,
            {
              name: spec.name,
              value: spec.value,
              locale: spec.locale,
              position: spec.position
            }
          );
        }
      }
      
      return product;
    }),

  updateProduct: protectedProcedure
    .input(z.object({
      id: z.number(),
      data: z.object({
        sku: z.string().optional(),
        price: z.number().nullable().optional(),
        comparePrice: z.number().nullable().optional(),
        thumbnail: z.string().optional(),
        gallery: z.array(z.string()).optional(),
        published: z.boolean().optional(),
        quantity: z.number().optional(),
        isFeatured: z.boolean().optional(),
        isNew: z.boolean().optional(),
        isSale: z.boolean().optional(),
        type: z.nativeEnum(ProductType).optional(),
        videoReview: z.string().optional(),
        translations: z.array(productTranslationSchema).optional(),
        categories: z.array(categoryInputSchema).optional(),
        categoryIds: z.array(z.number()).optional(),
        sidebarItems: z.array(sidebarItemInputSchema).optional(),
        hasVariants: z.boolean().optional(),
        variants: z.array(z.object({
          id: z.number().optional(),
          sku: z.string().optional(),
          price: z.number().nullable().optional(),
          comparePrice: z.number().nullable().optional(),
          quantity: z.number().optional(),
          published: z.boolean().optional(),
          isFeatured: z.boolean().optional(),
          isNew: z.boolean().optional(),
          isSale: z.boolean().optional(),
          gallery: z.array(z.string()).optional(),
          thumbnail: z.string().optional(),
          options: z.record(z.string()).optional(),
          translations: z.array(z.object({
            locale: z.string(),
            name: z.string(),
            variantId: z.number().optional()
          })).optional()
        })).optional()
      })
    }))
    .mutation(async ({ ctx, input }) => {
      const { translations, categories, categoryIds, variants, sidebarItems, ...updateData } = input.data;
      
      // Tạo đối tượng dữ liệu cập nhật
      const productUpdateData: any = {
        ...updateData
      };

      // Xử lý translations nếu có
      if (translations) {
        productUpdateData.translations = translations as unknown as ProductTranslation[];
      }

      // Xử lý categories hoặc categoryIds
      if (categories) {
        productUpdateData.categories = categories.map(({ id }) => ({ id } as unknown as Category));
      } else if (categoryIds && categoryIds.length > 0) {
        productUpdateData.categories = categoryIds.map(id => ({ id } as unknown as Category));
      }

      if (sidebarItems) {
        productUpdateData.sidebarItems = sidebarItems as unknown as ProductSidebarItem[];
      }
      
      // Xử lý variants nếu có
      if (variants && variants.length > 0) {
        productUpdateData.variants = variants;
      }
      
      return ctx.services.productAdminService.update(input.id, productUpdateData);
    }),

  deleteProduct: adminProcedure
    .use(requirePermission(Permissions.DELETE_CONTENT))
    .input(z.number())
    .mutation(async ({ ctx, input }) => {
      try {
        await ctx.services.productAdminService.remove(input);
        return { success: true };
      } catch (error) {
        ctx.logger.error('Failed to delete product:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to delete product',
          cause: error,
        });
      }
    }),

  getProductStockHistory: protectedProcedure
    .input(
      z.object({
        productId: z.number(),
        limit: z.number().optional(),
        offset: z.number().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      try {
        const { productId, limit, offset } = input;
        
        const history = await ctx.services.productStockHistoryService.getProductStockHistory(
          productId,
          { limit, offset }
        );
        
        return history;
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Không thể lấy lịch sử tồn kho: ${error.message}`,
          cause: error,
        });
      }
    }),

  getVariantStockHistory: protectedProcedure
    .input(
      z.object({
        variantId: z.number(),
        limit: z.number().optional(),
        offset: z.number().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      try {
        const { variantId, limit, offset } = input;
        
        const history = await ctx.services.productStockHistoryService.getVariantStockHistory(
          variantId,
          { limit, offset }
        );
        
        return history;
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Không thể lấy lịch sử tồn kho của biến thể: ${error.message}`,
          cause: error,
        });
      }
    }),

  adjustProductStock: protectedProcedure
    .input(
      z.object({
        productId: z.number(),
        adjustmentQuantity: z.number(),
        note: z.string().optional(),
        userId: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const { productId, adjustmentQuantity, note, userId } = input;
        
        const adjustment = await ctx.services.productStockHistoryService.recordAdminAdjustment({
          productId,
          adjustmentQuantity,
          note,
          userId,
        });
        
        return adjustment;
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Không thể điều chỉnh tồn kho sản phẩm: ${error.message}`,
          cause: error,
        });
      }
    }),

  adjustVariantStock: protectedProcedure
    .input(
      z.object({
        variantId: z.number(),
        adjustmentQuantity: z.number(),
        note: z.string().optional(),
        userId: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const { variantId, adjustmentQuantity, note, userId } = input;
        
        const adjustment = await ctx.services.productStockHistoryService.recordAdminAdjustment({
          variantId,
          adjustmentQuantity,
          note,
          userId,
        });
        
        return adjustment;
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Không thể điều chỉnh tồn kho biến thể: ${error.message}`,
          cause: error,
        });
      }
    }),

  // Lấy thông số kỹ thuật của sản phẩm (cho admin)
  getProductSpecifications: protectedProcedure
    .input(
      z.object({
        productId: z.number(),
        locale: z.string().default('en'),
      }),
    )
    .query(async ({ ctx, input }) => {
      try {
        return ctx.services.productSpecificationService.findByProductId(
          input.productId,
          input.locale
        );
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Không thể lấy thông số kỹ thuật: ${error.message}`,
          cause: error,
        });
      }
    }),

  // Thêm thông số kỹ thuật mới
  addProductSpecification: protectedProcedure
    .input(
      z.object({
        productId: z.number(),
        name: z.string(),
        value: z.string(),
        locale: z.string().default('en'),
        position: z.number().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      try {
        return ctx.services.productSpecificationService.create(
          input.productId,
          {
            name: input.name,
            value: input.value,
            locale: input.locale,
            position: input.position,
          }
        );
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Không thể thêm thông số kỹ thuật: ${error.message}`,
          cause: error,
        });
      }
    }),

  // Cập nhật thông số kỹ thuật
  updateProductSpecification: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        name: z.string().optional(),
        value: z.string().optional(),
        locale: z.string().optional(),
        position: z.number().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      try {
        return ctx.services.productSpecificationService.update(
          input.id,
          {
            name: input.name,
            value: input.value,
            locale: input.locale,
            position: input.position,
          }
        );
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Không thể cập nhật thông số kỹ thuật: ${error.message}`,
          cause: error,
        });
      }
    }),

  // Xóa thông số kỹ thuật
  deleteProductSpecification: protectedProcedure
    .input(
      z.object({
        id: z.number(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      try {
        await ctx.services.productSpecificationService.delete(input.id);
        return { success: true };
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Không thể xóa thông số kỹ thuật: ${error.message}`,
          cause: error,
        });
      }
    }),

  // Thêm endpoint mới để cập nhật trạng thái published
  updateProductStatus: protectedProcedure
    .input(z.object({
      id: z.number(),
      published: z.boolean()
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        const product = await ctx.services.productAdminService.findOne(input.id);
        
        if (!product) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: `Product with ID ${input.id} not found`,
          });
        }
        
        product.published = input.published;
        return ctx.services.productAdminService.update(input.id, { published: input.published });
      } catch (error) {
        ctx.logger.error('Failed to update product status:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update product status',
          cause: error,
        });
      }
    }),

  // Cập nhật trạng thái biến thể sản phẩm
  updateVariantStatus: protectedProcedure
    .input(z.object({
      id: z.number(),
      published: z.boolean()
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        const variant = await ctx.services.productAdminService.findVariantById(input.id);
        
        if (!variant) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: `Variant with ID ${input.id} not found`,
          });
        }
        
        return ctx.services.productAdminService.updateVariant(input.id, { published: input.published });
      } catch (error) {
        ctx.logger.error('Failed to update variant status:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update variant status',
          cause: error,
        });
      }
    }),
    
  // Cập nhật thông tin biến thể sản phẩm
  updateVariant: protectedProcedure
    .input(z.object({
      id: z.number(),
      data: z.object({
        sku: z.string().optional(),
        price: z.number().nullable().optional(),
        comparePrice: z.number().nullable().optional(),
        quantity: z.number().optional(),
        published: z.boolean().optional(),
        thumbnail: z.string().optional(),
        gallery: z.array(z.string()).optional(),
      })
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        // Log input data với format đầy đủ
        console.log('updateVariant input:', JSON.stringify(input, null, 2));
        
        // Log giá trị price và gallery riêng biệt
        console.log(`Variant ${input.id} - Specific values:`, {
          price: input.data.price === undefined ? 'undefined' : input.data.price === null ? 'null' : input.data.price,
          comparePrice: input.data.comparePrice === undefined ? 'undefined' : input.data.comparePrice === null ? 'null' : input.data.comparePrice,
          gallery: input.data.gallery === undefined ? 'undefined' : (input.data.gallery === null ? 'null' : (Array.isArray(input.data.gallery) ? `array[${input.data.gallery.length}]` : 'not array'))
        });
        
        const variant = await ctx.services.productAdminService.findVariantById(input.id);
        
        if (!variant) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: `Variant with ID ${input.id} not found`,
          });
        }
        
        // Đảm bảo dữ liệu price và gallery được giữ nguyên giá trị, kể cả khi là 0, null, hoặc []
        const dataToUpdate = { ...input.data };
        
        // Ghi log rõ ràng trước khi cập nhật
        console.log(`Variant ${input.id} - Data to send to service:`, JSON.stringify(dataToUpdate, null, 2));
        
        const updatedVariant = await ctx.services.productAdminService.updateVariant(input.id, dataToUpdate);
        
        // Log kết quả sau khi cập nhật
        console.log(`Variant ${input.id} updated successfully:`, {
          price: updatedVariant.price,
          comparePrice: updatedVariant.comparePrice,
          gallery: updatedVariant.gallery ? `array[${updatedVariant.gallery.length}]` : 'null/empty'
        });
        
        return updatedVariant;
      } catch (error) {
        ctx.logger.error('Failed to update variant:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update variant',
          cause: error,
        });
      }
    }),
}); 
