import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { ProductType } from '../../product/entities/product.entity';
import { protectedProcedure, publicProcedure, router } from '../procedures';

export const productRouter = router({
  getAll: publicProcedure
    .input(
      z.object({
        locale: z.string().default('en'),
        search: z.string().optional(),
        minPrice: z.number().optional(),
        maxPrice: z.number().optional(),
        includeNullPrice: z.boolean().optional(),
        categories: z.array(z.number().nullable()).optional(),
        categorySlug: z.string().optional(),
        isFeatured: z.boolean().optional(),
        isNew: z.boolean().optional(),
        isSale: z.boolean().optional(),
        sortBy: z.enum(['price_asc', 'price_desc', 'newest', 'oldest']).optional(),
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(50).default(12),
        type: z.nativeEnum(ProductType).optional(),
      }).optional(),
    )
    .query(async ({ ctx, input }) => {
      // Nếu có categorySlug, lấy category ID từ slug
      let categoryIds = input?.categories;
      
      if (input?.categorySlug) {
        try {
          const category = await ctx.services.categoryFrontendService.findBySlug(input.categorySlug);
          if (category) {
            categoryIds = [category.id];
          }
        } catch (error) {
          ctx.logger.warn(`Category not found for slug: ${input.categorySlug}`);
        }
      }
      
      // Lọc bỏ các giá trị null trong mảng categories
      const filteredCategoryIds = categoryIds?.filter(id => id !== null) || undefined;
      
      const result = await ctx.services.productFrontendService.findAll(input?.locale, {
        search: input?.search,
        minPrice: input?.minPrice,
        maxPrice: input?.maxPrice,
        includeNullPrice: input?.includeNullPrice,
        categories: filteredCategoryIds,
        isFeatured: input?.isFeatured,
        isNew: input?.isNew,
        isSale: input?.isSale,
        sortBy: input?.sortBy,
        page: input?.page,
        limit: input?.limit,
        type: input?.type,
      });

      return {
        items: result.items.map(product => {
          const translation = ctx.services.productFrontendService.getTranslation(product, input?.locale);
          return {
            ...product,
            title: translation?.title || '',
            content: translation?.content || '',
            shortDescription: translation?.shortDescription || '',
            metaTitle: translation?.metaTitle || '',
            metaDescription: translation?.metaDescription || '',
            metaKeywords: translation?.metaKeywords || '',
            formattedPrice: ctx.services.productFrontendService.formatPrice(product.price),
            variants: product.variants?.map(variant => {
              const variantTranslation = ctx.services.productFrontendService.getVariantTranslation(variant, input?.locale);
              return {
                ...variant,
                name: variantTranslation?.name || '',
                description: variantTranslation?.description || '',
                formattedPrice: ctx.services.productFrontendService.formatPrice(variant.price),
              };
            }) || [],
            variantAttributes: translation?.variantAttributes || { attributes: [], variants: [] }
          };
        }),
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
      };
    }),

  getFeatured: publicProcedure
    .input(
      z.object({
        locale: z.string().default('en'),
        limit: z.number().min(1).max(50).default(8),
      }).optional(),
    )
    .query(async ({ ctx, input }) => {
      const products = await ctx.services.productFrontendService.findFeatured(input?.locale, input?.limit);
      return products.map(product => {
        const translation = ctx.services.productFrontendService.getTranslation(product, input?.locale);
        return {
          ...product,
          title: translation?.title || '',
          content: translation?.content || '',
          shortDescription: translation?.shortDescription || '',
          metaTitle: translation?.metaTitle || '',
          metaDescription: translation?.metaDescription || '',
          metaKeywords: translation?.metaKeywords || '',
          formattedPrice: ctx.services.productFrontendService.formatPrice(product.price),
          variants: product.variants?.map(variant => {
            const variantTranslation = ctx.services.productFrontendService.getVariantTranslation(variant, input?.locale);
            return {
              ...variant,
              name: variantTranslation?.name || '',
              description: variantTranslation?.description || '',
              formattedPrice: ctx.services.productFrontendService.formatPrice(variant.price),
            };
          }) || [],
          variantAttributes: translation?.variantAttributes || { attributes: [], variants: [] }
        };
      });
    }),

  getNew: publicProcedure
    .input(
      z.object({
        locale: z.string().default('en'),
        limit: z.number().min(1).max(50).default(8),
      }).optional(),
    )
    .query(async ({ ctx, input }) => {
      const products = await ctx.services.productFrontendService.findNew(input?.locale, input?.limit);
      return products.map(product => {
        const translation = ctx.services.productFrontendService.getTranslation(product, input?.locale);
        return {
          ...product,
          title: translation?.title || '',
          content: translation?.content || '',
          shortDescription: translation?.shortDescription || '',
          metaTitle: translation?.metaTitle || '',
          metaDescription: translation?.metaDescription || '',
          metaKeywords: translation?.metaKeywords || '',
          formattedPrice: ctx.services.productFrontendService.formatPrice(product.price),
          variants: product.variants?.map(variant => {
            const variantTranslation = ctx.services.productFrontendService.getVariantTranslation(variant, input?.locale);
            return {
              ...variant,
              name: variantTranslation?.name || '',
              description: variantTranslation?.description || '',
              formattedPrice: ctx.services.productFrontendService.formatPrice(variant.price),
            };
          }) || [],
          variantAttributes: translation?.variantAttributes || { attributes: [], variants: [] }
        };
      });
    }),

  getOnSale: publicProcedure
    .input(
      z.object({
        locale: z.string().default('en'),
        limit: z.number().min(1).max(50).default(8),
      }).optional(),
    )
    .query(async ({ ctx, input }) => {
      const products = await ctx.services.productFrontendService.findOnSale(input?.locale, input?.limit);
      return products.map(product => {
        const translation = ctx.services.productFrontendService.getTranslation(product, input?.locale);
        return {
          ...product,
          title: translation?.title || '',
          content: translation?.content || '',
          shortDescription: translation?.shortDescription || '',
          metaTitle: translation?.metaTitle || '',
          metaDescription: translation?.metaDescription || '',
          metaKeywords: translation?.metaKeywords || '',
          formattedPrice: ctx.services.productFrontendService.formatPrice(product.price),
          variants: product.variants?.map(variant => {
            const variantTranslation = ctx.services.productFrontendService.getVariantTranslation(variant, input?.locale);
            return {
              ...variant,
              name: variantTranslation?.name || '',
              description: variantTranslation?.description || '',
              formattedPrice: ctx.services.productFrontendService.formatPrice(variant.price),
            };
          }) || [],
          variantAttributes: translation?.variantAttributes || { attributes: [], variants: [] }
        };
      });
    }),

  getById: publicProcedure
    .input(
      z.object({
        id: z.number(),
        locale: z.string().default('en'),
      }),
    )
    .query(async ({ ctx, input }) => {
      const product = await ctx.services.productFrontendService.findById(input.id, input.locale);
      if (!product) return null;
      
      const translation = ctx.services.productFrontendService.getTranslation(product, input.locale);
      return {
        ...product,
        title: translation?.title || '',
        content: translation?.content || '',
        shortDescription: translation?.shortDescription || '',
        metaTitle: translation?.metaTitle || '',
        metaDescription: translation?.metaDescription || '',
        metaKeywords: translation?.metaKeywords || '',
        formattedPrice: ctx.services.productFrontendService.formatPrice(product.price),
        variants: product.variants?.map(variant => {
          const variantTranslation = ctx.services.productFrontendService.getVariantTranslation(variant, input.locale);
          return {
            ...variant,
            name: variantTranslation?.name || '',
            description: variantTranslation?.description || '',
            formattedPrice: ctx.services.productFrontendService.formatPrice(variant.price),
          };
        }) || [],
        variantAttributes: translation?.variantAttributes || { attributes: [], variants: [] }
      };
    }),

  getBySlug: publicProcedure
    .input(
      z.object({
        slug: z.string(),
        locale: z.string().default('en'),
      }),
    )
    .query(async ({ ctx, input }) => {
      const product = await ctx.services.productFrontendService.findBySlug(input.slug, input.locale);
      
      if (!product) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `Product with slug "${input.slug}" not found`,
        });
      }

      // Check if product is published
      if (!product.published) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `Product with slug "${input.slug}" is not published`,
        });
      }
      
      const translation = ctx.services.productFrontendService.getTranslation(product, input.locale);
      return {
        ...product,
        title: translation?.title || '',
        content: translation?.content || '',
        shortDescription: translation?.shortDescription || '',
        metaTitle: translation?.metaTitle || '',
        metaDescription: translation?.metaDescription || '',
        metaKeywords: translation?.metaKeywords || '',
        formattedPrice: ctx.services.productFrontendService.formatPrice(product.price),
        variantAttributes: translation?.variantAttributes || { attributes: [], variants: [] }
      };
    }),

  getMinMaxPrice: publicProcedure
    .query(async ({ ctx }) => {
      return ctx.services.productFrontendService.getMinMaxPrice();
    }),

  // Lấy sản phẩm bán chéo
  getCrossSellProducts: publicProcedure
    .input(
      z.object({
        productId: z.number(),
        locale: z.string().default('en'),
        limit: z.number().min(1).max(12).default(4),
      }),
    )
    .query(async ({ ctx, input }) => {
      return ctx.services.crossSellService.getCrossSellProducts(
        input.productId,
        input.locale,
        input.limit
      );
    }),

  // Thêm sản phẩm bán chéo (chỉ dành cho admin)
  addCrossSellProduct: protectedProcedure
    .input(
      z.object({
        productId: z.number(),
        relatedProductId: z.number(),
        position: z.number().default(0),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.services.crossSellService.addCrossSellProduct(
        input.productId,
        input.relatedProductId,
        input.position
      );
    }),

  // Xóa sản phẩm bán chéo (chỉ dành cho admin)
  removeCrossSellProduct: protectedProcedure
    .input(
      z.object({
        productId: z.number(),
        relatedProductId: z.number(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.services.crossSellService.removeCrossSellProduct(
        input.productId,
        input.relatedProductId
      );
      return { success: true };
    }),

  // Cập nhật vị trí sản phẩm bán chéo (chỉ dành cho admin)
  updateCrossSellPosition: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        position: z.number(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.services.crossSellService.updateCrossSellPosition(
        input.id,
        input.position
      );
    }),

  // Lấy tất cả sản phẩm bán chéo của một sản phẩm (chỉ dành cho admin)
  getAllCrossSellProducts: protectedProcedure
    .input(
      z.object({
        productId: z.number(),
      }),
    )
    .query(async ({ ctx, input }) => {
      return ctx.services.crossSellService.getAllCrossSellProducts(input.productId);
    }),

  // Lấy thông số kỹ thuật của sản phẩm
  getProductSpecifications: publicProcedure
    .input(
      z.object({
        productId: z.number(),
        locale: z.string().default('en'),
      }),
    )
    .query(async ({ ctx, input }) => {
      return ctx.services.productSpecificationService.findByProductId(
        input.productId,
        input.locale
      );
    }),

  // Thêm thông số kỹ thuật (chỉ dành cho admin)
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
      return ctx.services.productSpecificationService.create(
        input.productId,
        {
          name: input.name,
          value: input.value,
          locale: input.locale,
          position: input.position,
        }
      );
    }),

  // Cập nhật thông số kỹ thuật (chỉ dành cho admin)
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
      return ctx.services.productSpecificationService.update(
        input.id,
        {
          name: input.name,
          value: input.value,
          locale: input.locale,
          position: input.position,
        }
      );
    }),

  // Xóa thông số kỹ thuật (chỉ dành cho admin)
  deleteProductSpecification: protectedProcedure
    .input(
      z.object({
        id: z.number(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.services.productSpecificationService.delete(input.id);
      return { success: true };
    }),

  // Lấy sản phẩm combo
  getProductCombos: publicProcedure
    .input(
      z.object({
        productId: z.number(),
        locale: z.string().default('en'),
        limit: z.number().min(1).max(12).default(4),
      }),
    )
    .query(async ({ ctx, input }) => {
      return ctx.services.productComboService.getProductCombos(
        input.productId,
        input.locale,
        input.limit
      );
    }),

  // Thêm sản phẩm combo (chỉ dành cho admin)
  addProductCombo: protectedProcedure
    .input(
      z.object({
        mainProductId: z.number(),
        comboProductId: z.number(),
        discountAmount: z.number().nullable().default(null),
        discountPercent: z.number().nullable().default(null),
        position: z.number().default(0),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.services.productComboService.addProductCombo(
        input.mainProductId,
        input.comboProductId,
        input.discountAmount,
        input.discountPercent,
        input.position
      );
    }),

  // Xóa sản phẩm combo (chỉ dành cho admin)
  removeProductCombo: protectedProcedure
    .input(
      z.object({
        mainProductId: z.number(),
        comboProductId: z.number(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.services.productComboService.removeProductCombo(
        input.mainProductId,
        input.comboProductId
      );
      return { success: true };
    }),

  // Cập nhật trạng thái active của sản phẩm combo (chỉ dành cho admin)
  updateProductComboStatus: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        active: z.boolean(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.services.productComboService.updateProductComboStatus(
        input.id,
        input.active
      );
    }),

  // Cập nhật vị trí sản phẩm combo (chỉ dành cho admin)
  updateProductComboPosition: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        position: z.number(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.services.productComboService.updateProductComboPosition(
        input.id,
        input.position
      );
    }),

  // Cập nhật giảm giá của sản phẩm combo (chỉ dành cho admin)
  updateProductComboDiscount: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        discountAmount: z.number().nullable(),
        discountPercent: z.number().nullable(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.services.productComboService.updateProductComboDiscount(
        input.id,
        input.discountAmount,
        input.discountPercent
      );
    }),

  // Lấy tất cả sản phẩm combo của một sản phẩm (chỉ dành cho admin)
  getAllProductCombos: protectedProcedure
    .input(
      z.object({
        mainProductId: z.number(),
      }),
    )
    .query(async ({ ctx, input }) => {
      return ctx.services.productComboService.getAllProductCombos(input.mainProductId);
    }),
}); 
