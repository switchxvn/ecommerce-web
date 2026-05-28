import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ReviewTranslation } from './review-translation.entity';
import { ReviewStatus } from '@ew/shared';
import { ReviewServiceType } from './review-service-type.entity';
import { Product } from '../../product/entities/product.entity';
import { Service } from '../../service/entities/service.entity';

@Entity('reviews')
export class Review {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'author_name' })
  authorName!: string;

  @Column({ name: 'author_avatar', nullable: true })
  authorAvatar?: string;

  @Column({ nullable: true })
  profession?: string;

  @Column()
  rating!: number;

  @Column({ name: 'service_type_id', nullable: true })
  serviceTypeId?: number;

  @Column({ name: 'product_id', nullable: true })
  productId?: number | null;

  @Column({ name: 'service_id', nullable: true })
  serviceId?: number | null;

  @ManyToOne(() => ReviewServiceType, (serviceType) => serviceType.reviews)
  @JoinColumn({ name: 'service_type_id' })
  serviceType?: ReviewServiceType;

  @ManyToOne(() => Product, (product) => product.reviews, { nullable: true })
  @JoinColumn({ name: 'product_id' })
  product?: Product | null;

  @ManyToOne(() => Service, (service) => service.reviews, { nullable: true })
  @JoinColumn({ name: 'service_id' })
  service?: Service | null;

  @Column({ name: 'visit_date', type: 'date', nullable: true })
  visitDate?: Date;

  @Column({ default: false })
  featured!: boolean;

  @Column({ type: 'enum', enum: ReviewStatus, default: ReviewStatus.ACTIVE })
  status!: ReviewStatus;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @OneToMany(() => ReviewTranslation, (translation) => translation.review, {
    cascade: true,
    eager: true,
  })
  translations!: ReviewTranslation[];

  // Utility getter methods for content in current locale
  get title(): string | undefined {
    return this.translations?.[0]?.title;
  }

  get content(): string | undefined {
    return this.translations?.[0]?.content;
  }

  get locale(): string | undefined {
    return this.translations?.[0]?.locale;
  }
  
  // Utility getter method for service type name
  get serviceTypeName(): string | undefined {
    return this.serviceType?.name;
  }
  
  get serviceTypeSlug(): string | undefined {
    return this.serviceType?.slug;
  }
} 
