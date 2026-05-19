import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, OneToMany, ManyToMany, JoinTable } from 'typeorm';
import { ProductTranslation } from './product-translation.entity';
import { Category } from '../../category/entities/category.entity';
import { CrossSellProduct } from './cross-sell-product.entity';
import { ProductSpecification } from './product-specification.entity';
import { ProductCombo } from './product-combo.entity';
import { PriceRequest } from '../../price-request/entities/price-request.entity';
import { ProductVariant } from './product-variant.entity';
import { ProductStockHistory } from './product-stock-history.entity';
import { ProductTierDiscount } from './product-tier-discount.entity';
import { Review } from '../../review/entities/review.entity';
import { ProductSidebarItem } from './product-sidebar-item.entity';

export enum ProductType {
  PHYSICAL = 'PHYSICAL', // Sản phẩm vật lý
  VOUCHER = 'VOUCHER', // Voucher
  TICKET = 'TICKET', // Vé
  DIGITAL = 'DIGITAL', // Sản phẩm số
  SERVICE = 'SERVICE', // Dịch vụ
  SUBSCRIPTION = 'SUBSCRIPTION', // Đăng ký định kỳ
}

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ nullable: true })
  sku!: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  price!: number | null;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true, name: 'compare_price' })
  comparePrice!: number | null;

  @Column({ nullable: true })
  thumbnail!: string;

  @Column({ type: 'json', nullable: true })
  gallery!: string[];

  @Column({ default: true })
  published!: boolean;

  @Column({ default: 0 })
  quantity!: number;

  @Column({ name: 'is_featured', default: false })
  isFeatured!: boolean;

  @Column({ name: 'is_new', default: false })
  isNew!: boolean;

  @Column({ name: 'is_sale', default: false })
  isSale!: boolean;

  @Column({ 
    type: 'enum', 
    enum: ProductType, 
    default: ProductType.PHYSICAL,
    name: 'product_type'
  })
  type!: ProductType;

  // Video review field
  @Column({ name: 'video_review', nullable: true })
  videoReview!: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  // Relationships
  @OneToMany(() => ProductTranslation, translation => translation.product, { cascade: true })
  translations!: ProductTranslation[];

  @ManyToMany(() => Category, (category) => category.products)
  @JoinTable({
    name: 'product_categories',
    joinColumn: {
      name: 'product_id',
      referencedColumnName: 'id'
    },
    inverseJoinColumn: {
      name: 'category_id',
      referencedColumnName: 'id'
    }
  })
  categories!: Category[];

  // Cross-sell products relationship
  @OneToMany(() => CrossSellProduct, crossSell => crossSell.product)
  crossSellProducts!: CrossSellProduct[];

  // Relationship for products that have this product as a cross-sell
  @OneToMany(() => CrossSellProduct, crossSell => crossSell.relatedProduct)
  crossSellOf!: CrossSellProduct[];

  // Product specifications relationship
  @OneToMany(() => ProductSpecification, specification => specification.product, { cascade: true })
  specifications!: ProductSpecification[];
  
  // Product combos relationship - products that can be bought together with this product
  @OneToMany(() => ProductCombo, combo => combo.mainProduct)
  productCombos!: ProductCombo[];
  
  // Relationship for products that include this product in their combos
  @OneToMany(() => ProductCombo, combo => combo.comboProduct)
  includedInCombos!: ProductCombo[];

  // Relationship with PriceRequest
  @OneToMany(() => PriceRequest, priceRequest => priceRequest.product)
  priceRequests!: PriceRequest[];

  // Product variants relationship
  @OneToMany(() => ProductVariant, variant => variant.product, { cascade: true })
  variants!: ProductVariant[];

  // Product stock history relationship
  @OneToMany(() => ProductStockHistory, stockHistory => stockHistory.product)
  stockHistory!: ProductStockHistory[];
  
  // Product tier discount relationship
  @OneToMany(() => ProductTierDiscount, tierDiscount => tierDiscount.product)
  tierDiscounts!: ProductTierDiscount[];

  @OneToMany(() => Review, (review) => review.product)
  reviews!: Review[];

  @OneToMany(() => ProductSidebarItem, (sidebarItem) => sidebarItem.product, { cascade: true })
  sidebarItems!: ProductSidebarItem[];
}
