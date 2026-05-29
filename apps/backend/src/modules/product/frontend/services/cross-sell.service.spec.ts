import 'reflect-metadata';
import { describe, expect, it, vi } from 'vitest';

vi.mock('../../entities/cross-sell-product.entity', () => ({
  CrossSellProduct: class CrossSellProduct {},
}));

vi.mock('../../entities/product.entity', () => ({
  Product: class Product {},
}));

describe('CrossSellService', () => {
  const createService = async () => {
    const { CrossSellService } = await import('./cross-sell.service');
    const crossSellRepository = {
      find: vi.fn(),
      findOne: vi.fn(),
      save: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
    };
    const productRepository = {
      find: vi.fn(),
      findOne: vi.fn(),
    };
    const productFrontendService = {
      getTranslation: vi.fn(),
      formatPrice: vi.fn(),
    };

    const service = new CrossSellService(
      crossSellRepository as any,
      productRepository as any,
      productFrontendService as any,
    );

    return { service, crossSellRepository, productRepository, productFrontendService };
  };

  it('returns configured cross-sell products without using category fallback', async () => {
    const { service, crossSellRepository, productRepository, productFrontendService } = await createService();
    const relatedProduct = {
      id: 2,
      published: true,
      price: 150000,
      translations: [{ locale: 'vi', title: 'Xe nang B' }],
    };

    crossSellRepository.find.mockResolvedValue([
      { relatedProduct },
      { relatedProduct: { id: 3, published: false, price: 200000, translations: [] } },
    ]);
    productFrontendService.getTranslation.mockReturnValue({
      title: 'Xe nang B',
      content: 'Mo ta',
      shortDescription: 'Ngan',
      metaTitle: 'Meta title',
      metaDescription: 'Meta description',
      metaKeywords: 'xe nang',
    });
    productFrontendService.formatPrice.mockReturnValue('150.000 VND');

    const result = await service.getCrossSellProducts(1, 'vi', 4);

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      id: 2,
      title: 'Xe nang B',
      formattedPrice: '150.000 VND',
    });
    expect(productRepository.findOne).not.toHaveBeenCalled();
    expect(productRepository.find).not.toHaveBeenCalled();
  });

  it('falls back to published products in the same categories when no cross-sell is configured', async () => {
    const { service, crossSellRepository, productRepository, productFrontendService } = await createService();
    const sourceProduct = {
      id: 1,
      categories: [{ id: 10 }, { id: 20 }],
    };
    const fallbackProduct = {
      id: 4,
      published: true,
      price: 250000,
      translations: [{ locale: 'vi', title: 'Xe nang C' }],
    };

    crossSellRepository.find.mockResolvedValue([]);
    productRepository.findOne.mockResolvedValue(sourceProduct);
    productRepository.find.mockResolvedValue([
      fallbackProduct,
      { id: 5, published: false, price: 300000, translations: [] },
    ]);
    productFrontendService.getTranslation.mockReturnValue({
      title: 'Xe nang C',
      content: 'Mo ta C',
      shortDescription: 'Mo ta ngan C',
      metaTitle: 'Meta C',
      metaDescription: 'Meta desc C',
      metaKeywords: 'xe nang c',
    });
    productFrontendService.formatPrice.mockReturnValue('250.000 VND');

    const result = await service.getCrossSellProducts(1, 'vi', 4);

    expect(productRepository.findOne).toHaveBeenCalledWith({
      where: { id: 1, published: true },
      relations: ['categories'],
    });
    expect(productRepository.find).toHaveBeenCalledWith({
      where: {
        published: true,
        id: expect.any(Object),
        categories: {
          id: expect.any(Object),
        },
      },
      relations: ['translations'],
      take: 4,
      order: { createdAt: 'DESC' },
    });
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      id: 4,
      title: 'Xe nang C',
      formattedPrice: '250.000 VND',
    });
  });
});
