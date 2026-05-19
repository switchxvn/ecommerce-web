import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Review } from '../../entities/review.entity';
import { ReviewTranslation } from '../../entities/review-translation.entity';
import { ReviewServiceType } from '../../entities/review-service-type.entity';
import { ReviewStatus } from '@ew/shared';
import { Product } from '../../../product/entities/product.entity';

export interface CreateReviewInput {
  authorName: string;
  authorAvatar?: string;
  profession?: string;
  rating: number;
  serviceTypeId?: number;
  productId?: number;
  visitDate?: Date;
  featured?: boolean;
  status?: ReviewStatus;
  translations: {
    locale: string;
    title?: string;
    content: string;
  }[];
}

export interface UpdateReviewInput {
  authorName?: string;
  authorAvatar?: string;
  profession?: string;
  rating?: number;
  serviceTypeId?: number;
  productId?: number | null;
  visitDate?: Date;
  featured?: boolean;
  status?: ReviewStatus;
  translations?: {
    locale: string;
    title?: string;
    content: string;
  }[];
}

export interface ReviewsPaginationParams {
  page?: number;
  limit?: number;
  search?: string;
  featured?: boolean;
  serviceTypeId?: number;
  minRating?: number;
  maxRating?: number;
  status?: ReviewStatus;
  locale?: string;
}

@Injectable()
export class AdminReviewService {
  constructor(
    @InjectRepository(Review)
    private readonly reviewRepository: Repository<Review>,
    @InjectRepository(ReviewTranslation)
    private readonly reviewTranslationRepository: Repository<ReviewTranslation>,
    @InjectRepository(ReviewServiceType)
    private readonly reviewServiceTypeRepository: Repository<ReviewServiceType>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}

  private async assertProductExists(productId: number) {
    const product = await this.productRepository.findOne({
      where: { id: productId },
      select: ['id'],
    });

    if (!product) {
      throw new Error(`Product with ID ${productId} not found`);
    }
  }

  async findAll(params: ReviewsPaginationParams = {}) {
    const {
      page = 1,
      limit = 10,
      search = '',
      featured,
      serviceTypeId,
      minRating,
      maxRating,
      status,
      locale,
    } = params;

    const query = this.reviewRepository.createQueryBuilder('review')
      .leftJoinAndSelect('review.translations', 'translations')
      .leftJoinAndSelect('review.serviceType', 'serviceType')
      .leftJoinAndSelect('serviceType.translations', 'serviceTypeTranslations');

    if (locale) {
      query.andWhere('translations.locale = :locale', { locale });
    }

    if (search) {
      query.andWhere(
        '(translations.title ILIKE :search OR translations.content ILIKE :search OR review.authorName ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    if (featured !== undefined) {
      query.andWhere('review.featured = :featured', { featured });
    }

    if (serviceTypeId) {
      query.andWhere('review.serviceTypeId = :serviceTypeId', { serviceTypeId });
    }

    if (minRating !== undefined) {
      query.andWhere('review.rating >= :minRating', { minRating });
    }

    if (maxRating !== undefined) {
      query.andWhere('review.rating <= :maxRating', { maxRating });
    }

    if (status !== undefined) {
      query.andWhere('review.status = :status', { status });
    }

    const total = await query.getCount();
    
    const reviews = await query
      .skip((page - 1) * limit)
      .take(limit)
      .orderBy('review.createdAt', 'DESC')
      .getMany();

    return {
      data: reviews,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findById(id: number, locale?: string) {
    const query = this.reviewRepository.createQueryBuilder('review')
      .leftJoinAndSelect('review.translations', 'translations')
      .leftJoinAndSelect('review.serviceType', 'serviceType')
      .leftJoinAndSelect('serviceType.translations', 'serviceTypeTranslations')
      .where('review.id = :id', { id });

    if (locale) {
      query.andWhere('translations.locale = :locale', { locale });
    }

    return query.getOne();
  }

  async create(data: CreateReviewInput) {
    if (typeof data.productId === 'number') {
      await this.assertProductExists(data.productId);
    }

    const review = this.reviewRepository.create({
      authorName: data.authorName,
      authorAvatar: data.authorAvatar,
      profession: data.profession,
      rating: data.rating,
      serviceTypeId: data.serviceTypeId,
      productId: data.productId,
      visitDate: data.visitDate,
      featured: data.featured,
      status: data.status ?? ReviewStatus.ACTIVE,
      translations: data.translations.map(translation => 
        this.reviewTranslationRepository.create({
          locale: translation.locale,
          title: translation.title,
          content: translation.content,
        })
      ),
    });

    return this.reviewRepository.save(review);
  }

  async update(id: number, data: UpdateReviewInput) {
    const review = await this.findById(id);
    
    if (!review) {
      return null;
    }

    if (data.authorName !== undefined) review.authorName = data.authorName;
    if (data.authorAvatar !== undefined) review.authorAvatar = data.authorAvatar;
    if (data.profession !== undefined) review.profession = data.profession;
    if (data.rating !== undefined) review.rating = data.rating;
    if (data.serviceTypeId !== undefined) review.serviceTypeId = data.serviceTypeId;
    if (data.productId !== undefined) {
      if (data.productId === null) {
        review.productId = null;
      } else {
        await this.assertProductExists(data.productId);
        review.productId = data.productId;
      }
    }
    if (data.visitDate !== undefined) review.visitDate = data.visitDate;
    if (data.featured !== undefined) review.featured = data.featured;
    if (data.status !== undefined) review.status = data.status;

    // Handle translations update
    if (data.translations) {
      // Get current translations
      const currentTranslations = review.translations || [];
      
      // Update or create translations
      for (const translationData of data.translations) {
        const existingTranslation = currentTranslations.find(
          t => t.locale === translationData.locale
        );

        if (existingTranslation) {
          // Update existing translation
          if (translationData.title !== undefined) {
            existingTranslation.title = translationData.title;
          }
          if (translationData.content !== undefined) {
            existingTranslation.content = translationData.content;
          }
          await this.reviewTranslationRepository.save(existingTranslation);
        } else {
          // Create new translation
          const newTranslation = this.reviewTranslationRepository.create({
            reviewId: review.id,
            locale: translationData.locale,
            title: translationData.title,
            content: translationData.content,
          });
          await this.reviewTranslationRepository.save(newTranslation);
        }
      }
    }

    return this.reviewRepository.save(review);
  }

  async toggleFeatured(id: number) {
    const review = await this.findById(id);
    
    if (!review) {
      return null;
    }

    review.featured = !review.featured;
    return this.reviewRepository.save(review);
  }

  async updateStatus(id: number, status: ReviewStatus) {
    const review = await this.findById(id);
    
    if (!review) {
      return null;
    }

    review.status = status;
    return this.reviewRepository.save(review);
  }

  async delete(id: number) {
    const review = await this.findById(id);
    
    if (!review) {
      return false;
    }

    await this.reviewRepository.remove(review);
    return true;
  }
} 
