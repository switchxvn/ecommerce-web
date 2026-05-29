import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from './entities/product.entity';
import { ProductTranslation } from './entities/product-translation.entity';
import { CrossSellProduct } from './entities/cross-sell-product.entity';
import { ProductSpecification } from './entities/product-specification.entity';
import { ProductSpecificationTranslation } from './entities/product-specification-translation.entity';
import { ProductCombo } from './entities/product-combo.entity';
import { ProductVariant } from './entities/product-variant.entity';
import { ProductVariantTranslation } from './entities/product-variant-translation.entity';
import { ProductAttribute } from './entities/product-attribute.entity';
import { ProductAttributeTranslation } from './entities/product-attribute-translation.entity';
import { ProductAttributeValue } from './entities/product-attribute-value.entity';
import { ProductAttributeValueTranslation } from './entities/product-attribute-value-translation.entity';
import { ProductStockHistory } from './entities/product-stock-history.entity';
import { ProductTierDiscount } from './entities/product-tier-discount.entity';
import { ProductSidebarItem } from './entities/product-sidebar-item.entity';
import { ProductFrontendController } from './frontend/controllers/frontend.controller';
import { ProductAdminService } from './admin/services/product-admin.service';
import { ProductFrontendService } from './frontend/services/product-frontend.service';
import { CrossSellService } from './frontend/services/cross-sell.service';
import { ProductSpecificationService } from './services/product-specification.service';
import { ProductComboService } from './frontend/services/product-combo.service';
import { ProductStockHistoryService } from './services/product-stock-history.service';
import { AdminProductTierDiscountService } from './admin/services/product-tier-discount.service';
import { FrontendProductTierDiscountService } from './frontend/services/product-tier-discount.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Product, 
      ProductTranslation, 
      CrossSellProduct,
      ProductSpecification,
      ProductSpecificationTranslation,
      ProductCombo,
      ProductVariant,
      ProductVariantTranslation,
      ProductAttribute,
      ProductAttributeTranslation,
      ProductAttributeValue,
      ProductAttributeValueTranslation,
      ProductStockHistory,
      ProductTierDiscount,
      ProductSidebarItem
    ])
  ],
  controllers: [ProductFrontendController],
  providers: [
    ProductAdminService, 
    ProductFrontendService, 
    CrossSellService,
    ProductSpecificationService,
    ProductComboService,
    ProductStockHistoryService,
    AdminProductTierDiscountService,
    FrontendProductTierDiscountService
  ],
  exports: [
    ProductAdminService, 
    ProductFrontendService, 
    CrossSellService,
    ProductSpecificationService,
    ProductComboService,
    ProductStockHistoryService,
    AdminProductTierDiscountService,
    FrontendProductTierDiscountService
  ],
})
export class ProductModule {} 
