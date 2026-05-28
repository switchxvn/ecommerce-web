import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToMany, JoinTable, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { Post } from '../../post/entities/post.entity';
import { Product } from '../../product/entities/product.entity';
import { CategoryTranslation } from './category-translation.entity';
import { CategoryType } from '../../../../../../libs/shared/src/types/category.type';
import { Gallery } from '../../gallery/entities/gallery.entity';

@Entity('categories')
export class Category {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ default: true })
  active!: boolean;

  @Column({ default: false, name: 'is_featured' })
  isFeatured!: boolean;

  @Column({
    type: 'enum',
    enum: CategoryType,
    default: CategoryType.PRODUCT,
    name: 'category_type'
  })
  type!: CategoryType;

  @Column({ nullable: true, length: 50 })
  icon?: string;

  @Column({ name: 'price_range_min', type: 'decimal', precision: 15, scale: 0, nullable: true })
  priceRangeMin!: string | null;

  @Column({ name: 'price_range_max', type: 'decimal', precision: 15, scale: 0, nullable: true })
  priceRangeMax!: string | null;

  // Parent-child relationship
  @Column({ name: 'parent_id', nullable: true })
  parentId!: number | null;

  @ManyToOne(() => Category, category => category.children)
  @JoinColumn({ name: 'parent_id' })
  parent!: Category | null;

  @OneToMany(() => Category, category => category.parent)
  children!: Category[];

  @OneToMany(() => CategoryTranslation, translation => translation.category, {
    cascade: true
  })
  translations!: CategoryTranslation[];

  @ManyToMany(() => Post, (post) => post.categories)
  @JoinTable({
    name: 'post_categories',
    joinColumn: {
      name: 'category_id',
      referencedColumnName: 'id'
    },
    inverseJoinColumn: {
      name: 'post_id',
      referencedColumnName: 'id'
    }
  })
  posts!: Post[];

  @ManyToMany(() => Product, (product) => product.categories)
  products!: Product[];

  @ManyToMany(() => Gallery, (gallery) => gallery.categories)
  galleries!: Gallery[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
} 
