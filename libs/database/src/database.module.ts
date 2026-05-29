import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from '../../../apps/backend/src/modules/product/entities/product.entity';
import { ProductTranslation } from '../../../apps/backend/src/modules/product/entities/product-translation.entity';
import { ProductVariant } from '../../../apps/backend/src/modules/product/entities/product-variant.entity';
import { ProductVariantTranslation } from '../../../apps/backend/src/modules/product/entities/product-variant-translation.entity';
import { ProductAttribute } from '../../../apps/backend/src/modules/product/entities/product-attribute.entity';
import { ProductAttributeTranslation } from '../../../apps/backend/src/modules/product/entities/product-attribute-translation.entity';
import { ProductAttributeValue } from '../../../apps/backend/src/modules/product/entities/product-attribute-value.entity';
import { ProductAttributeValueTranslation } from '../../../apps/backend/src/modules/product/entities/product-attribute-value-translation.entity';
import { ProductSidebarItem } from '../../../apps/backend/src/modules/product/entities/product-sidebar-item.entity';
import { dataSourceOptions } from './config/typeorm.config';

@Module({
  imports: [
    TypeOrmModule.forRoot(dataSourceOptions),
    TypeOrmModule.forFeature([
      Product,
      ProductTranslation,
      ProductVariant,
      ProductVariantTranslation,
      ProductAttribute,
      ProductAttributeTranslation,
      ProductAttributeValue,
      ProductAttributeValueTranslation,
      ProductSidebarItem,
    ]),
  ],
  exports: [
    TypeOrmModule,
  ],
})
export class DatabaseModule {} 
