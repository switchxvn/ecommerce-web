import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Review } from './entities/review.entity';
import { ReviewTranslation } from './entities/review-translation.entity';
import { ReviewServiceType } from './entities/review-service-type.entity';
import { ReviewServiceTypeTranslation } from './entities/review-service-type-translation.entity';
import { AdminReviewService } from './admin/services/admin-review.service';
import { FrontendReviewService } from './frontend/services/frontend-review.service';
import { Product } from '../product/entities/product.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Review, 
      ReviewTranslation,
      ReviewServiceType,
      ReviewServiceTypeTranslation,
      Product,
    ]),
  ],
  providers: [
    AdminReviewService,
    FrontendReviewService,
  ],
  exports: [
    AdminReviewService,
    FrontendReviewService,
  ],
})
export class ReviewModule {} 
