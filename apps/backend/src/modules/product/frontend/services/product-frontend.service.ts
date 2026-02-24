import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, Like, FindOptionsWhere, In, IsNull, Not, MoreThanOrEqual, LessThanOrEqual } from 'typeorm';
import { Product, ProductType } from '../../entities/product.entity';
import { ProductTranslation } from '../../entities/product-translation.entity';
import { ProductVariant } from '../../entities/product-variant.entity';
import { ProductVariantTranslation } from '../../entities/product-variant-translation.entity';

const DEFAULT_MAX_PRICE = 10_000_000_000;

export interface ProductFilterOptions {
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  includeNullPrice?: boolean;
  categories?: number[];
  isFeatured?: boolean;
  isNew?: boolean;
  isSale?: boolean;
  sortBy?: 'price_asc' | 'price_desc' | 'newest' | 'oldest';
  page?: number;
  limit?: number;
  type?: ProductType;
}

export interface PaginatedProducts {
  items: Product[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ProductAttributeValue {
  id: number;
  value: string;
  displayValue: string;
  thumbnail?: string | null;
}

export interface ProductAttribute {
  id: number;
  name: string;
  displayName: string;
  values: ProductAttributeValue[];
  required?: boolean;
}

export interface TransformedVariant {
  id: number;
  sku: string;
  price: number | null;
  comparePrice: number | null;
  formattedPrice: string;
  stock: number;
  attributeValues: {
    [attributeId: number]: number; // attributeId -> valueId
  };
}

@Injectable()
export class ProductFrontendService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(ProductTranslation)
    private readonly productTranslationRepository: Repository<ProductTranslation>,
    @InjectRepository(ProductVariant)
    private readonly productVariantRepository: Repository<ProductVariant>,
    @InjectRepository(ProductVariantTranslation)
    private readonly productVariantTranslationRepository: Repository<ProductVariantTranslation>,
  ) {}

  async findAll(locale: string = 'en', options: ProductFilterOptions = {}): Promise<PaginatedProducts> {
    const {
      search,
      minPrice,
      maxPrice,
      includeNullPrice = true,
      categories,
      isFeatured,
      isNew,
      isSale,
      sortBy = 'newest',
      page = 1,
      limit = 12,
      type
    } = options;
      console.log('Type filter added:', type);

    // Create query builder
    const queryBuilder = this.productRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.translations', 'translations')
      .leftJoinAndSelect('product.variants', 'variants')
      .leftJoinAndSelect('variants.translations', 'variantTranslations')
      .leftJoinAndSelect('variants.attributeValues', 'attributeValues')
      .leftJoinAndSelect('attributeValues.attribute', 'attribute')
      .leftJoinAndSelect('attribute.translations', 'attributeTranslations')
      .leftJoinAndSelect('attributeValues.translations', 'attributeValueTranslations');

    // Add base conditions
    queryBuilder.where('product.published = :published', { published: true });

    // Add type filter - ensure this is added before other conditions
    if (type) {

      queryBuilder.andWhere('product.product_type = :type', { type });
      console.log('Type filter added:', type);
      console.log('SQL Query:', queryBuilder.getSql());
      console.log('Parameters:', queryBuilder.getParameters());
    }

    // Add locale condition
    queryBuilder.andWhere('translations.locale = :locale', { locale });

    // Add search condition
    if (search) {
      queryBuilder.andWhere(
        '(translations.title ILIKE :search OR translations.content ILIKE :search OR translations.shortDescription ILIKE :search)',
        { search: `%${search}%` }
      );
    }

    // Add price filter with includeNullPrice option
    if (minPrice !== undefined || maxPrice !== undefined) {
      if (includeNullPrice) {
        const priceConditions = [];
        if (minPrice !== undefined) {
          priceConditions.push('product.price >= :minPrice');
        }
        if (maxPrice !== undefined) {
          priceConditions.push('product.price <= :maxPrice');
        }
        queryBuilder.andWhere(
          `(${priceConditions.join(' AND ')} OR product.price IS NULL)`,
          { minPrice, maxPrice }
        );
      } else {
        if (minPrice !== undefined) {
          queryBuilder.andWhere('product.price >= :minPrice', { minPrice });
        }
        if (maxPrice !== undefined) {
          queryBuilder.andWhere('product.price <= :maxPrice', { maxPrice });
        }
      }
    } else if (!includeNullPrice) {
      queryBuilder.andWhere('product.price IS NOT NULL');
    }

    // Add category filter
    if (categories?.length) {
      queryBuilder
        .innerJoin('product.categories', 'category')
        .andWhere('category.id IN (:...categoryIds)', { categoryIds: categories });
    }

    // Add feature flags
    if (typeof isFeatured === 'boolean') {
      queryBuilder.andWhere('product.isFeatured = :isFeatured', { isFeatured });
    }
    if (typeof isNew === 'boolean') {
      queryBuilder.andWhere('product.isNew = :isNew', { isNew });
    }
    if (typeof isSale === 'boolean') {
      queryBuilder.andWhere('product.isSale = :isSale', { isSale });
    }

    // Add sorting
    switch (sortBy) {
      case 'price_asc':
        queryBuilder.orderBy('product.price', 'ASC', 'NULLS LAST');
        break;
      case 'price_desc':
        queryBuilder.orderBy('product.price', 'DESC', 'NULLS LAST');
        break;
      case 'oldest':
        queryBuilder.orderBy('product.createdAt', 'ASC');
        break;
      case 'newest':
      default:
        queryBuilder.orderBy('product.createdAt', 'DESC');
    }

    // Add pagination
    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);

    // Execute query
    const [items, total] = await queryBuilder.getManyAndCount();

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findFeatured(locale: string = 'en', limit: number = 8): Promise<Product[]> {
    return this.productRepository.find({
      where: { published: true, isFeatured: true },
      relations: [
        'translations', 
        'variants', 
        'variants.translations',
        'variants.attributeValues',
        'variants.attributeValues.attribute',
        'variants.attributeValues.attribute.translations',
        'variants.attributeValues.translations'
      ],
      take: limit,
    });
  }

  async findNew(locale: string = 'en', limit: number = 8): Promise<Product[]> {
    return this.productRepository.find({
      where: { published: true, isNew: true },
      relations: [
        'translations', 
        'variants', 
        'variants.translations',
        'variants.attributeValues',
        'variants.attributeValues.attribute',
        'variants.attributeValues.attribute.translations',
        'variants.attributeValues.translations'
      ],
      take: limit,
      order: { createdAt: 'DESC' },
    });
  }

  async findOnSale(locale: string = 'en', limit: number = 8): Promise<Product[]> {
    return this.productRepository.find({
      where: { published: true, isSale: true },
      relations: [
        'translations', 
        'variants', 
        'variants.translations',
        'variants.attributeValues',
        'variants.attributeValues.attribute',
        'variants.attributeValues.attribute.translations',
        'variants.attributeValues.translations'
      ],
      take: limit,
    });
  }

  /**
   * Find product by slug in translations
   */
  async findBySlug(slug: string, locale: string = 'en'): Promise<Product | null> {
    const translation = await this.productTranslationRepository.findOne({
      where: { slug, locale },
      relations: [
        'product', 
        'product.translations', 
        'product.variants', 
        'product.variants.translations',
        'product.variants.attributeValues',
        'product.variants.attributeValues.attribute',
        'product.variants.attributeValues.attribute.translations',
        'product.variants.attributeValues.translations'
      ],
    });

    if (!translation) {
      // Try to find in any locale if not found in specified locale
      const anyTranslation = await this.productTranslationRepository.findOne({
        where: { slug },
        relations: [
          'product', 
          'product.translations', 
          'product.variants', 
          'product.variants.translations',
          'product.variants.attributeValues',
          'product.variants.attributeValues.attribute',
          'product.variants.attributeValues.attribute.translations',
          'product.variants.attributeValues.translations'
        ],
      });
      
      return anyTranslation?.product || null;
    }

    return translation.product;
  }

  async findById(id: number, locale: string = 'en'): Promise<Product> {
    return this.productRepository.findOne({
      where: { id, published: true },
      relations: [
        'translations', 
        'categories', 
        'variants', 
        'variants.translations',
        'variants.attributeValues',
        'variants.attributeValues.attribute',
        'variants.attributeValues.attribute.translations',
        'variants.attributeValues.translations'
      ],
    });
  }

  async getMinMaxPrice(): Promise<{ min: number; max: number }> {
    const result = await this.productRepository
      .createQueryBuilder('product')
      .select('MIN(product.price)', 'min')
      .addSelect('MAX(product.price)', 'max')
      .where('product.published = :published', { published: true })
      .andWhere('product.price IS NOT NULL')
      .getRawOne();

    return {
      min: result?.min ? parseFloat(result.min) : 0,
      max: result?.max ? parseFloat(result.max) : DEFAULT_MAX_PRICE,
    };
  }

  /**
   * Get translation for a product
   */
  getTranslation(product: Product, locale: string = 'en'): ProductTranslation & {
    variantAttributes?: {
      attributes: ProductAttribute[];
      variants: TransformedVariant[];
    }
  } {
    const translation = product.translations?.find(t => t.locale === locale) || product.translations?.[0];
    
    if (!translation) {
      return null;
    }

    // Transform variants if they exist
    if (product.variants?.length) {
      const { attributes, transformedVariants } = this.transformVariantsToAttributes(product.variants, locale);
      return {
        ...translation,
        variantAttributes: {
          attributes,
          variants: transformedVariants
        }
      };
    }

    return translation;
  }

  /**
   * Get translation for a product variant
   */
  getVariantTranslation(variant: ProductVariant, locale: string = 'en'): ProductVariantTranslation | null {
    if (!variant.translations || variant.translations.length === 0) {
      return null;
    }

    const translation = variant.translations.find(t => t.locale === locale);
    return translation || variant.translations[0];
  }

  /**
   * Format price to VND
   */
  formatPrice(price: number | null): string {
    if (price === null) {
      return 'Liên hệ';
    }
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  }

  /**
   * Transform variants to attributes structure
   */
  private transformVariantsToAttributes(variants: ProductVariant[], locale: string): {
    attributes: ProductAttribute[];
    transformedVariants: TransformedVariant[];
  } {
    const attributesMap = new Map<string, ProductAttribute>();
    const transformedVariants: TransformedVariant[] = [];

    variants.forEach(variant => {
      const translation = this.getVariantTranslation(variant, locale);

      // Process each attribute value
      const attributeValues: { [attributeId: number]: number } = {};
      
      // Check if variant has attribute values
      if (variant.attributeValues && variant.attributeValues.length > 0) {
        variant.attributeValues.forEach(value => {
          const attribute = value.attribute;
          const attributeId = attribute.id;

          // Add attribute to map if not exists
          if (!attributesMap.has(String(attributeId))) {
            attributesMap.set(String(attributeId), {
              id: attributeId,
              name: attribute.code || '',
              displayName: attribute.translations?.find(t => t.locale === locale)?.name || attribute.code || '',
              values: [],
              required: true
            });
          }

          // Add value to attribute if not exists
          const existingAttribute = attributesMap.get(String(attributeId));
          if (!existingAttribute.values.some(v => v.id === value.id)) {
            existingAttribute.values.push({
              id: value.id,
              value: value.code || '',
              displayValue: value.translations?.find(t => t.locale === locale)?.name || value.code || '',
              thumbnail: null
            });
          }

          // Add to variant's attribute values
          attributeValues[attributeId] = value.id;
        });
      }

      transformedVariants.push({
        id: variant.id,
        sku: variant.sku || '',
        price: variant.price,
        comparePrice: variant.comparePrice || null,
        formattedPrice: this.formatPrice(variant.price),
        stock: variant.quantity || 0,
        attributeValues
      });
    });

    return {
      attributes: Array.from(attributesMap.values()),
      transformedVariants
    };
  }
}
