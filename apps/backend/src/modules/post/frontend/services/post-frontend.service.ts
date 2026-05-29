import { Post as IPost } from '@ew/shared';
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Not, Repository } from 'typeorm';
import { Tag } from '../../../settings/entities/tag.entity';
import { PostTag } from '../../entities/post-tag.entity';
import { PostTranslation } from '../../entities/post-translation.entity';
import { Post } from '../../entities/post.entity';
import { serializeVietnamTimestamp } from '../utils/post-timestamp.util';
import { applyTagSlugFilterToPostQuery } from './post-query-filter.util';

interface PostWhereConditions {
  published: boolean;
  id?: any;
  [key: string]: any;
}

@Injectable()
export class PostFrontendService {
  private readonly logger: Logger;

  constructor(
    @InjectRepository(Post)
    private readonly postRepository: Repository<Post>,
    @InjectRepository(PostTag)
    private readonly tagRepository: Repository<Tag>,
    @InjectRepository(PostTranslation)
    private readonly postTranslationRepository: Repository<PostTranslation>,
  ) {
    this.logger = new Logger(PostFrontendService.name);
  }

  async findAll(): Promise<Post[]> {
    return this.postRepository.find();
  }

  /**
   * Tìm bài viết theo danh sách ID
   * @param ids Danh sách ID của bài viết
   * @returns Danh sách bài viết
   */
  async findByIds(ids: number[]): Promise<Post[]> {
    this.logger.log(`Finding posts by IDs: ${ids.join(', ')}`);
    if (!ids || ids.length === 0) {
      return [];
    }
    
    return this.postRepository.find({
      where: {
        id: In(ids),
        published: true
      },
      relations: ['translations', 'author', 'author.profile', 'postTags', 'postTags.tag'],
      order: {
        createdAt: 'DESC'
      }
    });
  }

  private async formatPostResponse(post: Post, locale?: string): Promise<IPost> {
    // Get current translation if locale is provided
    let currentTranslation = null;
    if (locale) {
      currentTranslation = post.translations?.find(t => t.locale === locale);
      if (!currentTranslation) {
        throw new NotFoundException(`Translation not found for locale "${locale}"`);
      }
    }

    // Format tags if available
    const tags = post.postTags
      ? post.postTags
          .map(pt => pt.tag)
          .filter(tag => tag.isActive)
          .map(tag => ({
            id: tag.id,
            name: tag.name,
            slug: tag.slug,
            color: tag.color,
            description: tag.description,
            isActive: tag.isActive
          }))
      : [];

    // Format author profile if available
    const authorProfile = post.author?.profile instanceof Promise 
      ? await post.author.profile 
      : post.author?.profile;

    const profile = authorProfile ? {
      id: authorProfile.id,
      firstName: authorProfile.firstName,
      lastName: authorProfile.lastName,
      phoneNumber: authorProfile.phoneNumber,
      phoneCode: authorProfile.phoneCode,
      address: authorProfile.address || {
        street: null,
        city: null,
        state: null,
        country: null,
        zipCode: null
      },
      createdAt: authorProfile.createdAt.toISOString(),
      updatedAt: authorProfile.updatedAt.toISOString()
    } : {
      id: null,
      firstName: null,
      lastName: null,
      phoneNumber: null,
      phoneCode: null,
      address: {
        street: null,
        city: null,
        state: null,
        country: null,
        zipCode: null
      },
      createdAt: null,
      updatedAt: null
    };

    return {
      id: post.id,
      title: currentTranslation?.title || '',
      content: currentTranslation?.content || '',
      shortDescription: currentTranslation?.shortDescription || '',
      thumbnail: post.thumbnail,
      published: post.published,
      authorId: String(post.authorId),
      createdAt: serializeVietnamTimestamp(post.createdAt),
      updatedAt: serializeVietnamTimestamp(post.updatedAt),
      tags,
      author: post.author ? {
        id: String(post.author.id),
        email: post.author.email,
        username: post.author.username,
        isEmailVerified: post.author.isEmailVerified,
        isActive: post.author.isActive,
        lastLoginAt: post.author.lastLoginAt,
        createdAt: post.author.createdAt,
        updatedAt: post.author.updatedAt,
        profile
      } : null,
      translations: post.translations?.map(t => ({
        id: t.id,
        locale: t.locale,
        title: t.title,
        content: t.content,
        shortDescription: t.shortDescription,
        slug: t.slug,
        metaTitle: t.metaTitle,
        metaDescription: t.metaDescription,
        metaKeywords: t.metaKeywords,
        ogTitle: t.ogTitle,
        ogDescription: t.ogDescription,
        ogImage: t.ogImage,
        canonicalUrl: t.canonicalUrl,
        postId: t.postId,
        createdAt: serializeVietnamTimestamp(t.createdAt),
        updatedAt: serializeVietnamTimestamp(t.updatedAt)
      })) || []
    };
  }

  async findByLocale(locale: string, filters?: {
    categories?: number[];
    categorySlugs?: string[];
    tagSlugs?: string[];
    search?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
  }): Promise<{
    items: IPost[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    this.logger.debug(`Finding posts for locale: ${locale}`);

    try {
      const page = filters?.page || 1;
      const limit = filters?.limit || 12;
      const skip = (page - 1) * limit;

      const qb = this.postRepository.createQueryBuilder('post')
        .innerJoinAndSelect('post.translations', 'translations', 'translations.locale = :locale', { locale })
        .leftJoinAndSelect('post.author', 'author')
        .leftJoinAndSelect('author.profile', 'profile')
        .leftJoinAndSelect('post.postTags', 'postTags')
        .leftJoinAndSelect('postTags.tag', 'tag')
        .where('post.published = :published', { published: true });

      // Thêm điều kiện categories nếu có
      if (filters?.categories?.length) {
        qb.innerJoin('post.categories', 'category', 'category.id IN (:...categoryIds)', { 
          categoryIds: filters.categories 
        });
      }

      // Thêm điều kiện categorySlugs nếu có
      if (filters?.categorySlugs?.length) {
        qb.innerJoin('post.categories', 'category')
          .innerJoin('category.translations', 'categoryTranslations', 'categoryTranslations.locale = :locale', { locale })
          .andWhere('categoryTranslations.slug IN (:...categorySlugs)', { 
            categorySlugs: filters.categorySlugs 
          });
      }

      applyTagSlugFilterToPostQuery(qb, filters?.tagSlugs);

      // Thêm điều kiện tìm kiếm nếu có
      if (filters?.search?.trim()) {
        qb.andWhere('translations.title ILIKE :search', { 
          search: `%${filters.search.trim()}%` 
        });
      }

      // Xử lý sắp xếp
      if (filters?.sortBy) {
        const [field, order] = filters.sortBy.split(':');
        if (field && order) {
          qb.orderBy(`post.${field}`, order.toUpperCase() as 'ASC' | 'DESC');
        } else {
          qb.orderBy('post.createdAt', 'DESC');
        }
      } else {
        qb.orderBy('post.createdAt', 'DESC');
      }

      // Đếm tổng số bài viết
      const total = await qb.getCount();
      
      // Lấy bài viết với phân trang
      const posts = await qb
        .skip(skip)
        .take(limit)
        .getMany();

      this.logger.debug(`Found ${posts.length} published posts for locale ${locale} (page ${page}, limit ${limit})`);

      // Format each post
      const formattedPosts = await Promise.all(
        posts.map(post => this.formatPostResponse(post, locale))
      );

      return {
        items: formattedPosts,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      };
    } catch (error) {
      this.logger.error(`Error finding posts by locale ${locale}:`, error);
      throw error;
    }
  }

  async findPublished(): Promise<Post[]> {
    return this.postRepository.find({
      where: { published: true }
    });
  }

  async findOne(id: number): Promise<Post> {
    const post = await this.postRepository.findOne({
      where: { id, published: true }
    });

    if (!post) {
      throw new NotFoundException(`Post with ID ${id} not found`);
    }
    return post;
  }

  async findOneWithAuthor(id: number): Promise<Post> {
    const post = await this.postRepository.findOne({
      where: { id, published: true },
      relations: ['author', 'author.profile']
    });

    if (!post) {
      throw new NotFoundException(`Post with ID ${id} not found`);
    }

    // Ensure author is loaded if it's a Promise
    if (post.author && post.author instanceof Promise) {
      await post.author;
    }

    return post;
  }

  async findRelatedPosts(id: number, locale: string, limit = 3): Promise<IPost[]> {
    try {
      // Get current post
      const currentPost = await this.postRepository.findOne({
        where: { id, published: true },
        relations: ['translations']
      });

      if (!currentPost) {
        throw new NotFoundException(`Post with ID ${id} not found`);
      }

      // Get related posts by author
      const relatedPosts = await this.postRepository.find({
        where: { 
          authorId: currentPost.authorId,
          published: true,
          id: Not(id)
        },
        relations: ['translations', 'author', 'author.profile', 'postTags', 'postTags.tag'],
        order: { createdAt: 'DESC' },
        take: limit
      });

      // If not enough posts, get recent posts
      if (relatedPosts.length < limit) {
        const recentPosts = await this.postRepository.find({
          where: { 
            published: true,
            id: Not(In([id, ...relatedPosts.map(p => p.id)]))
          },
          relations: ['translations', 'author', 'author.profile', 'postTags', 'postTags.tag'],
          order: { createdAt: 'DESC' },
          take: limit - relatedPosts.length
        });

        relatedPosts.push(...recentPosts);
      }

      // Format all posts
      return Promise.all(relatedPosts.map(post => this.formatPostResponse(post, locale)));
    } catch (error) {
      this.logger.error('Error in findRelatedPosts:', error);
      throw error;
    }
  }

  async findPopularPosts(locale: string, limit = 5, excludeId?: number): Promise<Post[]> {
    try {
      const whereCondition: any = { published: true };
      if (excludeId) {
        whereCondition.id = Not(excludeId);
      }

      const posts = await this.postRepository.find({
        where: whereCondition,
        relations: ['translations', 'author', 'author.profile', 'postTags', 'postTags.tag'],
        order: { createdAt: 'DESC' },
        take: limit
      });

      return posts;
    } catch (error) {
      this.logger.error('Error in findPopularPosts:', error);
      throw error;
    }
  }

  async findByAuthorId(authorId: string): Promise<Post[]> {
    return this.postRepository.find({
      where: { authorId },
      order: { createdAt: 'DESC' }
    });
  }

  async findBySlug(slug: string, locale = 'vi'): Promise<Post> {
    // Find translation first
    const translation = await this.postTranslationRepository.findOne({
      where: { slug, locale },
      relations: ['post']
    });

    if (!translation || !translation.post) {
      throw new NotFoundException(`Post with slug "${slug}" not found`);
    }

    const post = await this.postRepository.findOne({
      where: { 
        id: translation.post.id,
        published: true 
      }
    });

    if (!post) {
      throw new NotFoundException(`Post with slug "${slug}" not found`);
    }

    return post;
  }

  async findBySlugWithAuthor(slug: string, locale = 'vi'): Promise<Post> {
    // Find translation first
    const translation = await this.postTranslationRepository.findOne({
      where: { slug, locale },
      relations: ['post']
    });

    if (!translation || !translation.post) {
      throw new NotFoundException(`Post with slug "${slug}" not found`);
    }

    const post = await this.postRepository.findOne({
      where: { 
        id: translation.post.id,
        published: true 
      },
      relations: ['author', 'author.profile']
    });

    if (!post) {
      throw new NotFoundException(`Post with slug "${slug}" not found`);
    }

    // Đảm bảo author đã được load
    if (post.author) {
      await post.author;
    }

    return post;
  }

  async findBySlugWithAuthorAndTags(slug: string): Promise<IPost> {
    try {
      // First, find the translation to get the postId
      const translation = await this.postTranslationRepository.findOne({
        where: { slug },
        relations: ['post']
      });

      if (!translation || !translation.post) {
        throw new NotFoundException(`Post with slug "${slug}" not found`);
      }

      // Then use the postId to get all data including all translations
      const qb = this.postRepository.createQueryBuilder('post')
        .innerJoinAndSelect('post.translations', 'translations')
        .leftJoinAndSelect('post.author', 'author')
        .leftJoinAndSelect('author.profile', 'profile')
        .leftJoinAndSelect('post.postTags', 'postTags')
        .leftJoinAndSelect('postTags.tag', 'tag')
        .where('post.id = :postId', { postId: translation.post.id })
        .andWhere('post.published = :published', { published: true });

      const post = await qb.getOne();

      if (!post) {
        throw new NotFoundException(`Post with id "${translation.post.id}" not found`);
      }

      // Format response without locale filtering
      return this.formatPostResponse(post);
    } catch (error) {
      this.logger.error('Error in findBySlugWithAuthorAndTags:', error);
      throw new NotFoundException(`Failed to retrieve post with slug "${slug}"`);
    }
  }

  async findByIdWithAuthorAndTags(id: number, locale?: string): Promise<IPost> {
    try {
      const post = await this.postRepository.findOne({
        where: { id, published: true },
        relations: ['translations', 'author', 'author.profile', 'postTags', 'postTags.tag']
      });

      if (!post) {
        throw new NotFoundException(`Post with id "${id}" not found`);
      }

      return this.formatPostResponse(post, locale);
    } catch (error) {
      this.logger.error('Error in findByIdWithAuthorAndTags:', error);
      throw new NotFoundException(`Failed to retrieve post with id "${id}"`);
    }
  }

  async findByLocaleAndCategories(locale: string, categoryIds: number[], search?: string): Promise<IPost[]> {
    this.logger.debug(`Finding posts for locale: ${locale} and categories: ${categoryIds.join(',')}`);

    try {
      const qb = this.postRepository.createQueryBuilder('post')
        .innerJoin('post.categories', 'category', 'category.id IN (:...categoryIds)', { categoryIds })
        .innerJoinAndSelect('post.translations', 'translations', 'translations.locale = :locale', { locale })
        .leftJoinAndSelect('post.author', 'author')
        .leftJoinAndSelect('author.profile', 'profile')
        .leftJoinAndSelect('post.postTags', 'postTags')
        .leftJoinAndSelect('postTags.tag', 'tag')
        .where('post.published = :published', { published: true });

      // Add search condition if provided
      if (search?.trim()) {
        qb.andWhere('translations.title ILIKE :search', { search: `%${search.trim()}%` });
      }

      qb.orderBy('post.createdAt', 'DESC');

      const posts = await qb.getMany();

      this.logger.debug(`Found ${posts.length} published posts with categories ${categoryIds.join(',')}`);

      // Format each post
      const formattedPosts = await Promise.all(
        posts.map(post => this.formatPostResponse(post, locale))
      );

      return formattedPosts;
    } catch (error) {
      this.logger.error(`Error finding posts by locale ${locale} and categories ${categoryIds.join(',')}:`, error);
      throw error;
    }
  }

  async findByCategories(categoryIds: number[]): Promise<IPost[]> {
    this.logger.debug(`Finding posts for categories: ${categoryIds.join(',')}`);

    try {
      const posts = await this.postRepository.createQueryBuilder('post')
        .innerJoin('post.categories', 'category', 'category.id IN (:...categoryIds)', { categoryIds })
        .innerJoinAndSelect('post.translations', 'translations')
        .leftJoinAndSelect('post.author', 'author')
        .leftJoinAndSelect('author.profile', 'profile')
        .leftJoinAndSelect('post.postTags', 'postTags')
        .leftJoinAndSelect('postTags.tag', 'tag')
        .where('post.published = :published', { published: true })
        .orderBy('post.createdAt', 'DESC')
        .getMany();

      this.logger.debug(`Found ${posts.length} published posts with categories ${categoryIds.join(',')}`);

      // Format each post
      const formattedPosts = await Promise.all(
        posts.map(post => this.formatPostResponse(post))
      );

      return formattedPosts;
    } catch (error) {
      this.logger.error(`Error finding posts by categories ${categoryIds.join(',')}:`, error);
      throw error;
    }
  }

  async findLatestPosts(params: {
    locale?: string;
    categories?: string;
    categoryId?: number;
    category?: string;
    search?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
  }): Promise<{
    posts: IPost[];
    total: number;
    totalPages: number;
    currentPage: number;
    limit: number;
  }> {
    try {
      const { 
        locale, 
        categories, 
        categoryId, 
        category, 
        search, 
        page = 1, 
        limit = 12, 
        sortBy = 'newest' 
      } = params;

      const whereConditions: PostWhereConditions = { published: true };
      
      const relations = ['translations', 'author', 'author.profile', 'postTags', 'postTags.tag'];
      
      const order: Record<string, 'ASC' | 'DESC'> = { createdAt: 'DESC' };
      if (sortBy) {
        const [field, direction] = sortBy.split(':');
        order[field] = direction.toUpperCase() as 'ASC' | 'DESC';
      }

      const allPosts = await this.postRepository.find({
        where: whereConditions,
        relations: relations,
        order: order
      });

      let filteredPosts = allPosts;
      if (locale) {
        filteredPosts = allPosts.filter(post => 
          post.translations?.some(trans => trans.locale === locale)
        );
      }

      if (categories) {
        const categoryIds = categories.split(',').map(Number);
        filteredPosts = filteredPosts.filter(post => 
          post.categories?.some(cat => categoryIds.includes(cat.id))
        );
      }

      if (search) {
        const searchLower = search.toLowerCase();
        filteredPosts = filteredPosts.filter(post => {
          const translation = post.translations?.find(t => t.locale === locale) || post.translations?.[0];
          if (!translation) return false;
          
          return (
            translation.title.toLowerCase().includes(searchLower) ||
            (translation.shortDescription?.toLowerCase().includes(searchLower)) ||
            (translation.content?.toLowerCase().includes(searchLower))
          );
        });
      }

      const total = filteredPosts.length;
      const totalPages = Math.ceil(total / limit);
      const startIndex = (page - 1) * limit;
      const endIndex = Math.min(startIndex + limit, total);
      
      const paginatedPosts = filteredPosts.slice(startIndex, endIndex);

      const formattedPosts = await Promise.all(
        paginatedPosts.map(post => this.formatPostResponse(post, locale))
      );

      return { 
        posts: formattedPosts, 
        total, 
        totalPages,
        currentPage: page,
        limit
      };
    } catch (error) {
      this.logger.error('Error in findLatestPosts:', error);
      throw error;
    }
  }
} 
