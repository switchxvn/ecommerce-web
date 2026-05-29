import { getPostByIdSchema } from '@ew/shared';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { protectedProcedure, publicProcedure, router } from '../procedures';

function splitCsv(value?: string): string[] | undefined {
  if (!value) {
    return undefined;
  }

  const items = value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

  return items.length > 0 ? items : undefined;
}

export function buildPostLocaleFilters(input: {
  locale?: string;
  page?: number;
  limit?: number;
  search?: string;
  categories?: string;
  sort?: string;
  category?: string;
  tags?: string;
}) {
  return {
    categorySlugs: input.category ? [input.category] : splitCsv(input.categories),
    search: input.search,
    page: input.page ?? 1,
    limit: input.limit ?? 12,
    sortBy: input.sort ?? 'newest',
    tagSlugs: splitCsv(input.tags),
  };
}

// Admin router for posts
export const adminPostRouter = router({
  getPostById: protectedProcedure
    .input(getPostByIdSchema)
    .query(async ({ input, ctx }) => {
      try {
        ctx.logger.log(`Admin fetching post by ID: ${input}`);
        const post = await ctx.services.postService.findOne(input);

        if (!post) {
          ctx.logger.warn(`Post not found for ID: ${input}`);
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: `Post with ID ${input} not found`,
          });
        }

        ctx.logger.debug(`Successfully retrieved post ID: ${input}`);
        return post;
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        
        ctx.logger.error(`Error fetching post by ID ${input}: ${error instanceof Error ? error.message : String(error)}`);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to retrieve post',
          cause: error,
        });
      }
    }),
});

export const postRouter = router({
  latest: publicProcedure
    .input(z.object({
      filters: z.object({
        categoryId: z.number().optional(),
        categories: z.string().optional(),
        locale: z.string().optional(),
        category: z.string().optional(),
        search: z.string().optional(),
        page: z.number().optional().default(1),
        limit: z.number().optional().default(12),
        sortBy: z.string().optional().default('newest'),
      }).optional()
    }))
    .query(async ({ input, ctx }) => {
      try {
        const { filters } = input || {};
        const { locale = 'vi', categories, search, page = 1, limit = 12, sortBy = 'newest' } = filters || {};

        // Chuẩn bị filters cho service
        const serviceFilters = {
          categorySlugs: categories ? categories.split(',') : undefined,
          search,
          page,
          limit,
          sortBy
        };

        // Lấy bài viết với phân trang
        const result = await ctx.services.postService.findByLocale(locale, serviceFilters);

        return { 
          posts: result.items, 
          total: result.total, 
          totalPages: result.totalPages,
          currentPage: result.page,
          limit: result.limit
        };
      } catch (error) {
        console.error('Failed to fetch latest posts:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch latest posts',
          cause: error,
        });
      }
    }),

  byLocale: publicProcedure
    .input(z.object({ 
      locale: z.string(),
      page: z.number().optional().default(1),
      limit: z.number().optional().default(12),
      search: z.string().optional(),
      categories: z.string().optional(),
      sort: z.string().optional().default('newest'),
      category: z.string().optional(),
      tags: z.string().optional()
    }))
    .query(async ({ ctx, input }) => {
      try {
        const { locale } = input;
        const serviceFilters = buildPostLocaleFilters(input);

        // Lấy bài viết với phân trang
        const result = await ctx.services.postService.findByLocale(locale, serviceFilters);
        
        return result;
      } catch (error) {
        console.error(`Failed to fetch posts by locale ${input.locale}:`, error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch posts by locale',
          cause: error,
        });
      }
    }),

  byIds: publicProcedure
    .input(z.object({ 
      ids: z.array(z.number()),
      locale: z.string()
    }))
    .query(async ({ ctx, input }) => {
      try {
        ctx.logger.log(`Fetching posts by IDs: ${input.ids.join(', ')}`);
        const posts = await ctx.services.postService.findByIds(input.ids);
        
        // Lọc bài viết theo locale nếu cần
        if (input.locale) {
          return posts.filter(post => 
            post.translations?.some(trans => trans.locale === input.locale)
          );
        }
        
        return posts;
      } catch (error) {
        ctx.logger.error(`Error fetching posts by IDs: ${error instanceof Error ? error.message : String(error)}`);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch posts by IDs',
          cause: error,
        });
      }
    }),

  bySlug: publicProcedure
    .input(z.object({ 
      slug: z.string(),
      locale: z.string().optional()
    }))
    .query(async ({ ctx, input }) => {
      try {
        const post = await ctx.services.postService.findBySlug(input.slug);
        if (!post) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: `Post with slug ${input.slug} not found`,
          });
        }
        return post;
      } catch (error) {
        console.error(`Failed to fetch post by slug ${input.slug}:`, error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch post by slug',
          cause: error,
        });
      }
    }),

  related: publicProcedure
    .input(z.object({ 
      id: z.number(),
      locale: z.string(),
      limit: z.number().optional().default(3)
    }))
    .query(async ({ ctx, input }) => {
      try {
        const posts = await ctx.services.postService.findRelatedPosts(input.id, input.locale, input.limit);
        return posts;
      } catch (error) {
        console.error(`Failed to fetch related posts for post ${input.id}:`, error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch related posts',
          cause: error,
        });
      }
    }),

  popular: publicProcedure
    .input(z.object({
      locale: z.string(),
      limit: z.number().min(1).max(20).default(5),
      excludeId: z.number().optional()
    }))
    .query(async ({ ctx, input }) => {
      try {
        const posts = await ctx.services.postService.findPopularPosts(input.locale, input.limit, input.excludeId);
        return posts;
      } catch (error) {
        console.error('Failed to fetch popular posts:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch popular posts',
          cause: error,
        });
      }
    }),

  byId: publicProcedure
    .input(getPostByIdSchema)
    .query(async ({ input, ctx }) => {
      try {
        ctx.logger.log(`Fetching post by ID: ${input}`);
        const post = await ctx.services.postService.findOne(input);

        if (!post) {
          ctx.logger.warn(`Post not found for ID: ${input}`);
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: `Post with ID ${input} not found`,
          });
        }

        ctx.logger.debug(`Successfully retrieved post ID: ${input}`);
        return post;
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        
        ctx.logger.error(`Error fetching post by ID ${input}: ${error instanceof Error ? error.message : String(error)}`);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to retrieve post',
          cause: error,
        });
      }
    }),

  byIdWithAuthor: publicProcedure
    .input(getPostByIdSchema)
    .query(async ({ input, ctx }) => {
      try {
        ctx.logger.log(`Fetching post with author by ID: ${input}`);
        const post = await ctx.services.postService.findOneWithAuthor(input);

        if (!post) {
          ctx.logger.warn(`Post not found for ID: ${input}`);
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: `Post with ID ${input} not found`,
          });
        }

        ctx.logger.debug(`Successfully retrieved post with author ID: ${input}`);
        return post;
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        
        ctx.logger.error(`Error fetching post with author by ID ${input}: ${error instanceof Error ? error.message : String(error)}`);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to retrieve post with author',
          cause: error,
        });
      }
    }),

  bySlugWithAuthor: publicProcedure
    .input(z.object({
      slug: z.string(),
      locale: z.string().optional()
    }))
    .query(async ({ input, ctx }) => {
      try {
        ctx.logger.log(`Fetching post with author by slug: ${input.slug}`);
        const post = await ctx.services.postService.findBySlugWithAuthor(input.slug);

        if (!post) {
          ctx.logger.warn(`Post not found for slug: ${input.slug}`);
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: `Post with slug "${input.slug}" not found`,
          });
        }

        ctx.logger.debug(`Successfully retrieved post with author by slug: ${input.slug}`);
        return post;
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        
        ctx.logger.error(`Error fetching post with author by slug ${input.slug}: ${error instanceof Error ? error.message : String(error)}`);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to retrieve post with author',
          cause: error,
        });
      }
    }),

  bySlugWithAuthorAndTags: publicProcedure
    .input(z.object({
      slug: z.string()
    }))
    .query(async ({ input, ctx }) => {
      try {
        ctx.logger.log(`Fetching post with author and tags by slug: ${input.slug}`);
        const post = await ctx.services.postService.findBySlugWithAuthorAndTags(input.slug);

        if (!post) {
          ctx.logger.warn(`Post not found for slug: ${input.slug}`);
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: `Post with slug "${input.slug}" not found`,
          });
        }

        ctx.logger.debug(`Successfully retrieved post with author and tags by slug: ${input.slug}`);
        return post;
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        
        ctx.logger.error(`Error fetching post with author and tags by slug ${input.slug}: ${error instanceof Error ? error.message : String(error)}`);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to retrieve post with author and tags',
          cause: error,
        });
      }
    }),

  byIdWithAuthorAndTags: publicProcedure
    .input(z.number())
    .query(async ({ input, ctx }) => {
      try {
        ctx.logger.log(`Fetching post with author and tags by id: ${input}`);
        const post = await ctx.services.postService.findByIdWithAuthorAndTags(input);

        if (!post) {
          ctx.logger.warn(`Post not found for id: ${input}`);
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: `Post with id "${input}" not found`,
          });
        }

        ctx.logger.debug(`Successfully retrieved post with author and tags by id: ${input}`);
        return post;
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        
        ctx.logger.error(`Error fetching post with author and tags by id ${input}: ${error instanceof Error ? error.message : String(error)}`);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to retrieve post with author and tags',
          cause: error,
        });
      }
    }),

  byIdsAndCategories: publicProcedure
    .input(z.object({
      postIds: z.array(z.number()).optional(),
      categoryIds: z.array(z.number()).optional(),
      locale: z.string().optional(),
      limit: z.number().optional().default(12),
      page: z.number().optional().default(1),
    }))
    .query(async ({ input, ctx }) => {
      try {
        const { postIds, categoryIds, locale, limit, page } = input;
        
        // Nếu có postIds, ưu tiên lấy theo postIds
        if (postIds && postIds.length > 0) {
          const posts = await ctx.services.postService.findByIds(postIds);
          return {
            items: posts,
            total: posts.length,
            totalPages: 1,
            page: 1,
            limit: posts.length
          };
        }
        
        // Nếu có categoryIds, lấy theo categoryIds
        if (categoryIds && categoryIds.length > 0) {
          // Gọi hàm findByCategories với mảng categoryIds
          const posts = await ctx.services.postService.findByCategories(categoryIds);
          
          // Áp dụng phân trang thủ công
          const startIndex = (page - 1) * limit;
          const endIndex = startIndex + limit;
          const paginatedPosts = posts.slice(startIndex, endIndex);
          
          return {
            items: paginatedPosts,
            total: posts.length,
            totalPages: Math.ceil(posts.length / limit),
            page,
            limit
          };
        }
        
        // Nếu không có cả hai, trả về lỗi
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Either postIds or categoryIds must be provided',
        });
      } catch (error) {
        console.error('Failed to fetch posts by IDs and categories:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch posts by IDs and categories',
          cause: error,
        });
      }
    }),
}); 
