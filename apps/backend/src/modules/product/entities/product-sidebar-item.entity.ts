import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { Product } from './product.entity';

export enum ProductSidebarItemType {
  POST = 'post',
  SERVICE = 'service',
}

@Entity('product_sidebar_items')
export class ProductSidebarItem {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'product_id' })
  productId!: number;

  @Column({
    name: 'item_type',
    type: 'enum',
    enum: ProductSidebarItemType,
  })
  itemType!: ProductSidebarItemType;

  @Column({ name: 'item_id' })
  itemId!: number;

  @Column({ default: 0 })
  position!: number;

  @ManyToOne(() => Product, (product) => product.sidebarItems, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'product_id' })
  product!: Product;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
