import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Review } from '../../entities/review.entity';
import { ReviewServiceType } from '../../entities/review-service-type.entity';
import { ReviewStatus } from '@ew/shared';

export interface ReviewsFilterParams {
  page?: number;
  limit?: number;
  featured?: boolean;
  serviceTypeId?: number;
  productId?: number;
  serviceId?: number;
  locale?: string;
  minRating?: number;
  sortBy?: 'latest' | 'highest_rating' | 'lowest_rating';
}

@Injectable()
export class FrontendReviewService {
  constructor(
    @InjectRepository(Review)
    private readonly reviewRepository: Repository<Review>,
    @InjectRepository(ReviewServiceType)
    private readonly reviewServiceTypeRepository: Repository<ReviewServiceType>,
  ) {}

  async findAll(params: ReviewsFilterParams = {}) {
    const {
      page = 1,
      limit = 10,
      featured,
      serviceTypeId,
      productId,
      serviceId,
      locale = 'vi',
      minRating,
      sortBy = 'latest',
    } = params;

    const query = this.reviewRepository.createQueryBuilder('review')
      .leftJoinAndSelect('review.translations', 'translations')
      .leftJoinAndSelect('review.serviceType', 'serviceType')
      .leftJoinAndSelect('serviceType.translations', 'serviceTypeTranslations')
      .where('review.status = :status', { status: ReviewStatus.ACTIVE });

    // Filter by locale
    if (locale) {
      query.andWhere('translations.locale = :locale', { locale });
    }

    // Filter by featured
    if (featured !== undefined) {
      query.andWhere('review.featured = :featured', { featured });
    }

    // Filter by service type
    if (serviceTypeId) {
      query.andWhere('review.serviceTypeId = :serviceTypeId', { serviceTypeId });
    }

    if (productId) {
      query.andWhere('review.productId = :productId', { productId });
    }

    if (serviceId) {
      query.andWhere('review.serviceId = :serviceId', { serviceId });
    }

    // Filter by minimum rating
    if (minRating !== undefined) {
      query.andWhere('review.rating >= :minRating', { minRating });
    }

    // Count total before pagination
    const total = await query.getCount();

    // Apply sorting
    switch (sortBy) {
      case 'highest_rating':
        query.orderBy('review.rating', 'DESC');
        break;
      case 'lowest_rating':
        query.orderBy('review.rating', 'ASC');
        break;
      case 'latest':
      default:
        query.orderBy('review.createdAt', 'DESC');
        break;
    }

    // Apply secondary sort by createdAt for consistent ordering
    if (sortBy !== 'latest') {
      query.addOrderBy('review.createdAt', 'DESC');
    }

    // Apply pagination
    const reviews = await query
      .skip((page - 1) * limit)
      .take(limit)
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

  async findFeatured(limit: number = 6, locale: string = 'vi') {
    const query = this.reviewRepository.createQueryBuilder('review')
      .leftJoinAndSelect('review.translations', 'translations')
      .leftJoinAndSelect('review.serviceType', 'serviceType')
      .leftJoinAndSelect('serviceType.translations', 'serviceTypeTranslations')
      .where('review.status = :status', { status: ReviewStatus.ACTIVE })
      .andWhere('review.featured = :featured', { featured: true });

    if (locale) {
      query.andWhere('translations.locale = :locale', { locale });
    }

    const reviews = await query
      .orderBy('review.rating', 'DESC')
      .addOrderBy('review.createdAt', 'DESC')
      .take(limit)
      .getMany();

    return reviews;
  }

  async findById(id: number, locale: string = 'vi') {
    const query = this.reviewRepository.createQueryBuilder('review')
      .leftJoinAndSelect('review.translations', 'translations')
      .leftJoinAndSelect('review.serviceType', 'serviceType')
      .leftJoinAndSelect('serviceType.translations', 'serviceTypeTranslations')
      .where('review.id = :id', { id })
      .andWhere('review.status = :status', { status: ReviewStatus.ACTIVE });

    if (locale) {
      query.andWhere('translations.locale = :locale', { locale });
    }

    return query.getOne();
  }

  async getAverageRating(serviceTypeId?: number) {
    const query = this.reviewRepository.createQueryBuilder('review')
      .where('review.status = :status', { status: ReviewStatus.ACTIVE });

    if (serviceTypeId) {
      query.andWhere('review.serviceTypeId = :serviceTypeId', { serviceTypeId });
    }

    const result = await query
      .select('AVG(review.rating)', 'avgRating')
      .addSelect('COUNT(review.id)', 'totalReviews')
      .getRawOne();

    return {
      averageRating: result.avgRating ? parseFloat(result.avgRating).toFixed(1) : '0.0',
      totalReviews: parseInt(result.totalReviews) || 0,
    };
  }

  async getProductAggregateRating(productId: number) {
    const result = await this.reviewRepository
      .createQueryBuilder('review')
      .where('review.status = :status', { status: ReviewStatus.ACTIVE })
      .andWhere('review.productId = :productId', { productId })
      .select('AVG(review.rating)', 'avgRating')
      .addSelect('COUNT(review.id)', 'totalReviews')
      .getRawOne();

    return {
      averageRating: result?.avgRating ? parseFloat(result.avgRating).toFixed(1) : '0.0',
      totalReviews: parseInt(result?.totalReviews, 10) || 0,
    };
  }

  async getServiceAggregateRating(serviceId: number) {
    const result = await this.reviewRepository
      .createQueryBuilder('review')
      .where('review.status = :status', { status: ReviewStatus.ACTIVE })
      .andWhere('review.serviceId = :serviceId', { serviceId })
      .select('AVG(review.rating)', 'avgRating')
      .addSelect('COUNT(review.id)', 'totalReviews')
      .getRawOne();

    return {
      averageRating: result?.avgRating ? parseFloat(result.avgRating).toFixed(1) : '0.0',
      totalReviews: parseInt(result?.totalReviews, 10) || 0,
    };
  }

  async getRatingDistribution(serviceTypeId?: number) {
    const query = this.reviewRepository.createQueryBuilder('review')
      .where('review.status = :status', { status: ReviewStatus.ACTIVE });

    if (serviceTypeId) {
      query.andWhere('review.serviceTypeId = :serviceTypeId', { serviceTypeId });
    }

    const result = await query
      .select('review.rating', 'rating')
      .addSelect('COUNT(review.id)', 'count')
      .groupBy('review.rating')
      .orderBy('review.rating', 'DESC')
      .getRawMany();

    // Initialize distribution with zeros
    const distribution = {
      5: 0,
      4: 0,
      3: 0,
      2: 0,
      1: 0,
    };

    // Fill in actual counts
    result.forEach(item => {
      distribution[item.rating] = parseInt(item.count);
    });

    return distribution;
  }
  
  async getServiceTypes(locale: string = 'vi') {
    const query = this.reviewServiceTypeRepository.createQueryBuilder('serviceType')
      .leftJoinAndSelect('serviceType.translations', 'translations');
    
    if (locale) {
      query.andWhere('translations.locale = :locale', { locale });
    }
    
    return query
      .orderBy('serviceType.id', 'ASC')
      .getMany();
  }
} 
