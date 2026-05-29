import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Not, Repository } from 'typeorm';
import { CrossSellProduct } from '../../entities/cross-sell-product.entity';
import { Product } from '../../entities/product.entity';
import { ProductFrontendService } from './product-frontend.service';

@Injectable()
export class CrossSellService {
  constructor(
    @InjectRepository(CrossSellProduct)
    private crossSellRepository: Repository<CrossSellProduct>,
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    private productFrontendService: ProductFrontendService,
  ) {}

  /**
   * Lấy danh sách sản phẩm bán chéo cho một sản phẩm
   */
  async getCrossSellProducts(productId: number, locale: string = 'en', limit: number = 4): Promise<Product[]> {
    const crossSellProducts = await this.crossSellRepository.find({
      where: { productId },
      relations: ['relatedProduct', 'relatedProduct.translations'],
      order: { position: 'ASC' },
      take: limit,
    });

    // Lọc các sản phẩm đã xuất bản
    const products = crossSellProducts
      .map(cs => cs.relatedProduct)
      .filter(product => product.published);

    if (products.length > 0) {
      return this.mapProductsForFrontend(products, locale);
    }

    const sourceProduct = await this.productRepository.findOne({
      where: { id: productId, published: true },
      relations: ['categories'],
    });

    const categoryIds = sourceProduct?.categories?.map((category) => category.id).filter(Boolean) || [];
    if (categoryIds.length === 0) {
      return [];
    }

    const fallbackProducts = await this.productRepository.find({
      where: {
        published: true,
        id: Not(productId),
        categories: {
          id: In(categoryIds),
        },
      },
      relations: ['translations'],
      order: { createdAt: 'DESC' },
      take: limit,
    });

    return this.mapProductsForFrontend(
      fallbackProducts.filter((product) => product.published),
      locale,
    );
  }

  private mapProductsForFrontend(products: Product[], locale: string): Product[] {
    return products.map(product => {
      const translation = this.productFrontendService.getTranslation(product, locale);
      return {
        ...product,
        title: translation?.title || '',
        content: translation?.content || '',
        shortDescription: translation?.shortDescription || '',
        metaTitle: translation?.metaTitle || '',
        metaDescription: translation?.metaDescription || '',
        metaKeywords: translation?.metaKeywords || '',
        formattedPrice: this.productFrontendService.formatPrice(product.price),
      };
    });
  }

  /**
   * Thêm sản phẩm bán chéo
   */
  async addCrossSellProduct(productId: number, relatedProductId: number, position: number = 0): Promise<CrossSellProduct> {
    // Kiểm tra sản phẩm tồn tại
    const product = await this.productRepository.findOne({ where: { id: productId } });
    const relatedProduct = await this.productRepository.findOne({ where: { id: relatedProductId } });

    if (!product || !relatedProduct) {
      throw new Error('Product not found');
    }

    // Kiểm tra xem đã tồn tại cross-sell này chưa
    const existing = await this.crossSellRepository.findOne({
      where: { productId, relatedProductId }
    });

    if (existing) {
      // Cập nhật position nếu đã tồn tại
      existing.position = position;
      return this.crossSellRepository.save(existing);
    }

    // Tạo mới nếu chưa tồn tại
    const crossSell = this.crossSellRepository.create({
      productId,
      relatedProductId,
      position
    });

    return this.crossSellRepository.save(crossSell);
  }

  /**
   * Xóa sản phẩm bán chéo
   */
  async removeCrossSellProduct(productId: number, relatedProductId: number): Promise<void> {
    await this.crossSellRepository.delete({
      productId,
      relatedProductId
    });
  }

  /**
   * Cập nhật vị trí của sản phẩm bán chéo
   */
  async updateCrossSellPosition(id: number, position: number): Promise<CrossSellProduct> {
    const crossSell = await this.crossSellRepository.findOne({ where: { id } });
    
    if (!crossSell) {
      throw new Error('Cross-sell product not found');
    }

    crossSell.position = position;
    return this.crossSellRepository.save(crossSell);
  }

  /**
   * Lấy tất cả sản phẩm bán chéo của một sản phẩm (cho admin)
   */
  async getAllCrossSellProducts(productId: number): Promise<CrossSellProduct[]> {
    return this.crossSellRepository.find({
      where: { productId },
      relations: ['relatedProduct', 'relatedProduct.translations'],
      order: { position: 'ASC' },
    });
  }
} 
