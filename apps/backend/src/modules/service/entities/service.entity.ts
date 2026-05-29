import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, OneToMany, ManyToMany, JoinTable } from 'typeorm';
import { ServiceTranslation } from './service-translation.entity';
import { Category } from '../../category/entities/category.entity';
import { Review } from '../../review/entities/review.entity';

@Entity('services')
export class Service {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  icon: string;

  @Column({ nullable: true })
  thumbnail: string;

  @Column({ default: 0 })
  order: number;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ name: 'is_featured', default: false })
  isFeatured: boolean;

  @Column({ name: 'is_new', default: false })
  isNew: boolean;

  @OneToMany(() => ServiceTranslation, (translation) => translation.service, {
    cascade: true,
    eager: true
  })
  translations: ServiceTranslation[];

  @OneToMany(() => Review, (review) => review.service)
  reviews!: Review[];


  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
} 
