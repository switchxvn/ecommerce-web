import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from '../../entities/product.entity';
import { ProductTranslation } from '../../entities/product-translation.entity';
import { ProductVariant } from '../../entities/product-variant.entity';
import { ProductVariantTranslation } from '../../entities/product-variant-translation.entity';
import { ProductSidebarItem } from '../../entities/product-sidebar-item.entity';

@Injectable()
export class ProductAdminService {
  constructor(
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    @InjectRepository(ProductTranslation)
    private productTranslationRepository: Repository<ProductTranslation>,
    @InjectRepository(ProductVariant)
    private productVariantRepository: Repository<ProductVariant>,
    @InjectRepository(ProductVariantTranslation)
    private productVariantTranslationRepository: Repository<ProductVariantTranslation>,
    @InjectRepository(ProductSidebarItem)
    private productSidebarItemRepository: Repository<ProductSidebarItem>,
  ) {}

  async findAll(): Promise<Product[]> {
    return this.productRepository.find({
      relations: ['translations'],
    });
  }

  async getProducts({ page, limit, search, published, sortBy = 'createdAt', sortOrder = 'desc' }: { 
    page: number; 
    limit: number; 
    search?: string; 
    published?: boolean | null;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) {
    const queryBuilder = this.productRepository.createQueryBuilder('product')
      .leftJoinAndSelect('product.translations', 'translations')
      .leftJoinAndSelect('product.variants', 'variants')
      .leftJoinAndSelect('variants.translations', 'variantTranslations');

    if (search) {
      queryBuilder.andWhere('translations.name ILIKE :search', { search: `%${search}%` });
    }

    if (published !== null) {
      queryBuilder.andWhere('product.published = :published', { published });
    }

    // Chuyển đổi sortOrder sang định dạng viết hoa theo yêu cầu của TypeORM
    const order = sortOrder?.toUpperCase() as 'ASC' | 'DESC';

    // Xử lý sắp xếp
    switch (sortBy) {
      case 'title':
        queryBuilder.orderBy('translations.name', order);
        break;
      case 'sku':
        queryBuilder.orderBy('product.sku', order);
        break;
      case 'price':
        queryBuilder.orderBy('product.price', order);
        break;
      case 'published':
        queryBuilder.orderBy('product.published', order);
        break;
      case 'createdAt':
      default:
        queryBuilder.orderBy('product.createdAt', order);
        break;
    }

    const [items, total] = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: number): Promise<Product> {
    return this.productRepository.findOne({
      where: { id },
      relations: [
        'translations', 
        'categories', 
        'variants', 
        'variants.translations',
        'specifications',
        'specifications.translations',
        'sidebarItems',
      ],
    });
  }

  async create(productData: Partial<Product>): Promise<Product> {
    const { sidebarItems, ...productDetails } = productData as Partial<Product> & {
      sidebarItems?: Partial<ProductSidebarItem>[];
    };

    const product = this.productRepository.create(productDetails);
    const savedProduct = await this.productRepository.save(product);

    if (sidebarItems?.length) {
      const sidebarEntities = sidebarItems.map((item, index) =>
        this.productSidebarItemRepository.create({
          productId: savedProduct.id,
          itemType: item.itemType,
          itemId: item.itemId,
          position: item.position ?? index,
        })
      );

      await this.productSidebarItemRepository.save(sidebarEntities);
    }

    return this.findOne(savedProduct.id);
  }

  async update(id: number, productData: Partial<Product>): Promise<Product> {
    // Tách dữ liệu relations và các trường khác ra khỏi productData
    const { translations, categories, variants, sidebarItems, ...productDetails } = productData as Partial<Product> & {
      sidebarItems?: Partial<ProductSidebarItem>[];
    };
    
    // Lấy product hiện tại với relations cần thiết
    const existingProduct = await this.productRepository.findOne({
      where: { id },
      relations: ['translations', 'categories', 'variants', 'variants.translations', 'sidebarItems'],
    });
    
    if (!existingProduct) {
      throw new Error(`Product with ID ${id} not found`);
    }
    
    // Cập nhật thông tin cơ bản của product
    Object.assign(existingProduct, productDetails);
    
    // Xử lý translations nếu có
    if (translations && translations.length > 0) {
      // Đối với mỗi translation mới, tìm và cập nhật hoặc thêm mới
      if (existingProduct.translations) {
        for (const newTranslation of translations) {
          const existingTranslation = existingProduct.translations.find(
            t => t.locale === newTranslation.locale
          );
          
          if (existingTranslation) {
            // Cập nhật translation hiện có
            Object.assign(existingTranslation, newTranslation);
          } else {
            // Thêm translation mới
            const translationToAdd = this.productTranslationRepository.create({
              ...newTranslation,
              productId: id
            });
            existingProduct.translations.push(translationToAdd);
          }
        }
      } else {
        // Nếu chưa có translations, tạo mới
        existingProduct.translations = translations.map(translation => 
          this.productTranslationRepository.create({
            ...translation,
            productId: id
          })
        );
      }
    }
    
    // Xử lý categories nếu có
    if (categories) {
      existingProduct.categories = categories;
    }
    
    // Xử lý variants nếu có
    if (variants && Array.isArray(variants)) {
      // Kiểm tra nếu cần xóa variants hiện tại
      if (variants.length === 0 && existingProduct.variants && existingProduct.variants.length > 0) {
        // Xóa tất cả variants hiện tại
        for (const variant of existingProduct.variants) {
          await this.productVariantRepository.delete(variant.id);
        }
        existingProduct.variants = [];
      } else if (existingProduct.variants && existingProduct.variants.length > 0) {
        // Lấy IDs của variant hiện có và variant mới
        const existingVariantIds = existingProduct.variants.map(v => v.id);
        const newVariantIds = variants.filter(v => v.id).map(v => v.id);
        
        // Tìm các variant cần xóa (có trong existing nhưng không có trong new)
        const variantsToRemove = existingProduct.variants.filter(
          v => !newVariantIds.includes(v.id)
        );
        
        // Xóa các variant không còn trong danh sách mới
        if (variantsToRemove.length > 0) {
          for (const variant of variantsToRemove) {
            await this.productVariantRepository.delete(variant.id);
          }
        }
        
        // Cập nhật các variant hiện có và thêm mới nếu cần
        for (const newVariant of variants) {
          if (newVariant.id) {
            // Cập nhật variant hiện có
            const updatedVariant = await this.updateVariant(newVariant.id, newVariant);
            
            // Cập nhật lại variant trong danh sách hiện có
            const variantIndex = existingProduct.variants.findIndex(v => v.id === newVariant.id);
            if (variantIndex !== -1) {
              existingProduct.variants[variantIndex] = updatedVariant;
            }
          } else {
            // Thêm variant mới
            try {
              // Tạo một variant mới với productId
              const variantToAdd = this.productVariantRepository.create({
                ...newVariant,
                productId: id
              });
              
              // Xử lý translations nếu có
              if (newVariant.translations && newVariant.translations.length > 0) {
                variantToAdd.translations = [];
                for (const translation of newVariant.translations) {
                  const translationEntity = this.productVariantTranslationRepository.create({
                    ...translation,
                    // Không đặt variantId ở đây vì chưa có id (sẽ được đặt tự động khi lưu variant)
                  });
                  variantToAdd.translations.push(translationEntity);
                }
              }
              
              // Lưu variant mới
              const savedVariant = await this.productVariantRepository.save(variantToAdd);
              
              // Kiểm tra nếu existingProduct.variants chưa được khởi tạo
              if (!existingProduct.variants) {
                existingProduct.variants = [];
              }
              
              existingProduct.variants.push(savedVariant);
            } catch (error) {
              throw error;
            }
          }
        }
      } else {
        // Nếu chưa có variants, tạo mới tất cả
        existingProduct.variants = [];
        
        for (const newVariant of variants) {
          try {
            // Tạo một variant mới với productId
            const variantToAdd = this.productVariantRepository.create({
              ...newVariant,
              productId: id
            });
            
            // Xử lý translations nếu có
            if (newVariant.translations && newVariant.translations.length > 0) {
              variantToAdd.translations = [];
              for (const translation of newVariant.translations) {
                const translationEntity = this.productVariantTranslationRepository.create({
                  ...translation,
                  // Không đặt variantId ở đây vì chưa có id (sẽ được đặt tự động khi lưu variant)
                });
                variantToAdd.translations.push(translationEntity);
              }
            }
            
            // Lưu variant mới
            const savedVariant = await this.productVariantRepository.save(variantToAdd);
            
            existingProduct.variants.push(savedVariant);
          } catch (error) {
            throw error;
          }
        }
      }
    }

    if (sidebarItems) {
      await this.productSidebarItemRepository.delete({ productId: id });
      existingProduct.sidebarItems = [];

      if (sidebarItems.length > 0) {
        existingProduct.sidebarItems = await this.productSidebarItemRepository.save(
          sidebarItems.map((item, index) =>
            this.productSidebarItemRepository.create({
              productId: id,
              itemType: item.itemType,
              itemId: item.itemId,
              position: item.position ?? index,
            })
          )
        );
      }
    }
    
    // Lưu toàn bộ product với relations
    await this.productRepository.save(existingProduct);
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    await this.productRepository.delete(id);
  }

  async createTranslation(translation: Partial<ProductTranslation>): Promise<ProductTranslation> {
    const newTranslation = this.productTranslationRepository.create(translation);
    return this.productTranslationRepository.save(newTranslation);
  }

  async updateTranslation(id: number, translation: Partial<ProductTranslation>): Promise<ProductTranslation> {
    await this.productTranslationRepository.update(id, translation);
    return this.productTranslationRepository.findOne({ where: { id } });
  }

  async removeTranslation(id: number): Promise<void> {
    await this.productTranslationRepository.delete(id);
  }

  // Phương thức tìm biến thể sản phẩm theo ID
  async findVariantById(id: number): Promise<ProductVariant> {
    return this.productVariantRepository.findOne({
      where: { id },
      relations: [
        'translations',
        'product',
        'attributeValues',
        'attributeValues.attribute',
        'attributeValues.translations',
      ],
    });
  }

  // Phương thức cập nhật biến thể sản phẩm
  async updateVariant(id: number, variantData: Partial<ProductVariant>): Promise<ProductVariant> {
    // Tách dữ liệu relations và các trường khác ra khỏi variantData
    const { translations, attributeValues, ...variantDetails } = variantData;
    
    // Lấy variant hiện tại với relations cần thiết
    const existingVariant = await this.productVariantRepository.findOne({
      where: { id },
      relations: ['translations', 'attributeValues'],
    });
    
    if (!existingVariant) {
      throw new Error(`Variant with ID ${id} not found`);
    }
    
    // Cập nhật từng trường một cách rõ ràng, đảm bảo xử lý đúng cả giá trị null
    if ('price' in variantDetails) {
      existingVariant.price = variantDetails.price !== null ? Number(variantDetails.price) : null;
    }
    
    if ('comparePrice' in variantDetails) {
      existingVariant.comparePrice = variantDetails.comparePrice !== null ? Number(variantDetails.comparePrice) : null;
    }
    
    if ('quantity' in variantDetails) {
      existingVariant.quantity = variantDetails.quantity !== null ? Number(variantDetails.quantity) : null;
    }
    
    if ('sku' in variantDetails) {
      existingVariant.sku = variantDetails.sku;
    }
    
    if ('published' in variantDetails) {
      existingVariant.published = !!variantDetails.published;
    }
    
    if ('thumbnail' in variantDetails) {
      existingVariant.thumbnail = variantDetails.thumbnail;
    }
    
    if ('gallery' in variantDetails) {
      // Đảm bảo gallery luôn là một mảng, ngay cả khi nhận giá trị null
      existingVariant.gallery = Array.isArray(variantDetails.gallery) ? variantDetails.gallery : [];
    }
    
    if ('isFeatured' in variantDetails) {
      existingVariant.isFeatured = !!variantDetails.isFeatured;
    }
    
    if ('isNew' in variantDetails) {
      existingVariant.isNew = !!variantDetails.isNew;
    }
    
    if ('isSale' in variantDetails) {
      existingVariant.isSale = !!variantDetails.isSale;
    }
    
    // Xử lý translations nếu có
    if (translations && translations.length > 0) {
      // Đối với mỗi translation mới, tìm và cập nhật hoặc thêm mới
      if (existingVariant.translations) {
        for (const newTranslation of translations) {
          const existingTranslation = existingVariant.translations.find(
            t => t.locale === newTranslation.locale
          );
          
          if (existingTranslation) {
            // Cập nhật translation hiện có
            Object.assign(existingTranslation, newTranslation);
          } else {
            // Thêm translation mới
            const translationToAdd = this.productVariantTranslationRepository.create({
              ...newTranslation,
              variantId: id
            });
            existingVariant.translations.push(translationToAdd);
          }
        }
      } else {
        // Nếu chưa có translations, tạo mới
        existingVariant.translations = translations.map(translation => 
          this.productVariantTranslationRepository.create({
            ...translation,
            variantId: id
          })
        );
      }
    }
    
    // Xử lý attributeValues nếu có
    if (attributeValues) {
      existingVariant.attributeValues = attributeValues;
    }
    
    // Lưu toàn bộ variant với relations
    try {
      const savedVariant = await this.productVariantRepository.save(existingVariant);
      return savedVariant;
    } catch (error) {
      throw error;
    }
  }
} 
