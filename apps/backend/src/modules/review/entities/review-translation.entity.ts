import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Review } from './review.entity';

@Entity('review_translations')
export class ReviewTranslation {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'review_id', type: 'integer' })
  reviewId!: number;

  @Column({ length: 5 })
  locale!: string;

  @Column({ nullable: true })
  title?: string;

  @Column({ type: 'text' })
  content!: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @ManyToOne(() => Review, (review) => review.translations, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'review_id' })
  review!: Review;
} 
