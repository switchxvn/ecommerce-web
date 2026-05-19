import {
  buildAlternateLinks,
  buildProductSchema,
  buildRobotsTxt,
  buildSitemapXml,
  getRouteIndexPolicy,
  inferSeoRoute,
  sanitizeCanonicalUrl,
  shouldUseCmsSeoForRoute,
} from './seo';

describe('seo utils', () => {
  const siteUrl = 'https://example.test';

  it('sanitizes canonical urls and strips tracking params', () => {
    expect(
      sanitizeCanonicalUrl(
        'https://example.test/san-pham/xe-nang?utm_source=google&utm_medium=cpc&page=2',
        siteUrl,
      ),
    ).toBe('https://example.test/san-pham/xe-nang?page=2');
  });

  it('rejects foreign canonical urls', () => {
    expect(
      sanitizeCanonicalUrl('https://example.com/san-pham/xe-nang', siteUrl),
    ).toBeNull();
  });

  it('marks only seo pages as indexable', () => {
    expect(getRouteIndexPolicy('/san-pham').robots).toBe('index,follow');
    expect(getRouteIndexPolicy('/checkout').robots).toBe('noindex,nofollow');
    expect(getRouteIndexPolicy('/order-refund').indexable).toBe(false);
    expect(getRouteIndexPolicy('/dat-ve').indexable).toBe(false);
    expect(getRouteIndexPolicy('/order-ticket').robots).toBe('noindex,nofollow');
  });

  it('infers localized routes for detail pages', () => {
    expect(inferSeoRoute('/products/forklift-3t')).toEqual({
      key: 'product-detail',
      locale: 'en',
      slug: 'forklift-3t',
      path: '/products/forklift-3t',
    });

    expect(inferSeoRoute('/bai-viet/xe-nang-dien')).toEqual({
      key: 'post-detail',
      locale: 'vi',
      slug: 'xe-nang-dien',
      path: '/bai-viet/xe-nang-dien',
    });
  });

  it('uses CMS SEO only for static and listing routes', () => {
    expect(shouldUseCmsSeoForRoute('products')).toBe(true);
    expect(shouldUseCmsSeoForRoute('posts')).toBe(true);
    expect(shouldUseCmsSeoForRoute('product-detail')).toBe(false);
    expect(shouldUseCmsSeoForRoute('ticket-detail')).toBe(false);
    expect(shouldUseCmsSeoForRoute('post-detail')).toBe(false);
    expect(shouldUseCmsSeoForRoute(undefined)).toBe(true);
  });

  it('builds alternate links for localized detail pages', () => {
    expect(
      buildAlternateLinks(siteUrl, 'product-detail', {
        currentLocale: 'vi',
        slugByLocale: {
          vi: 'xe-nang-dau',
          en: 'diesel-forklift',
        },
      }),
    ).toEqual([
      { hreflang: 'vi', href: 'https://example.test/san-pham/xe-nang-dau' },
      { hreflang: 'en', href: 'https://example.test/products/diesel-forklift' },
      { hreflang: 'x-default', href: 'https://example.test/san-pham/xe-nang-dau' },
    ]);
  });

  it('builds robots.txt content with sitemap and disallow rules', () => {
    const robots = buildRobotsTxt(siteUrl);

    expect(robots).toContain('User-agent: *');
    expect(robots).toContain('Disallow: /checkout');
    expect(robots).toContain('Disallow: /reviews');
    expect(robots).toContain('Disallow: /map');
    expect(robots).toContain('Disallow: /dashboard');
    expect(robots).toContain('Disallow: /test-session');
    expect(robots).toContain('Disallow: /dat-ve');
    expect(robots).toContain('Disallow: /order-ticket');
    expect(robots).toContain('Sitemap: https://example.test/sitemap.xml');
  });

  it('builds a deduplicated sitemap xml document', () => {
    const xml = buildSitemapXml([
      { loc: 'https://example.test/san-pham', lastmod: '2026-05-15T00:00:00.000Z' },
      { loc: 'https://example.test/san-pham', lastmod: '2026-05-15T00:00:00.000Z' },
      { loc: 'https://example.test/products' },
    ]);

    expect(xml).toContain('<loc>https://example.test/san-pham</loc>');
    expect(xml).toContain('<loc>https://example.test/products</loc>');
    expect(xml.match(/<url>/g)).toHaveLength(2);
  });

  it('adds aggregateRating to product schema only when valid review stats exist', () => {
    expect(
      buildProductSchema({
        name: 'May nen khi',
        description: 'Mo ta',
        url: 'https://example.test/san-pham/may-nen-khi',
        ratingValue: 4.8,
        reviewCount: 12,
      }),
    ).toMatchObject({
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: 4.8,
        reviewCount: 12,
      },
    });

    expect(
      buildProductSchema({
        name: 'May nen khi',
        description: 'Mo ta',
        url: 'https://example.test/san-pham/may-nen-khi',
        ratingValue: 0,
        reviewCount: 12,
      }).aggregateRating,
    ).toBeUndefined();

    expect(
      buildProductSchema({
        name: 'May nen khi',
        description: 'Mo ta',
        url: 'https://example.test/san-pham/may-nen-khi',
        ratingValue: 4.8,
        reviewCount: 0,
      }).aggregateRating,
    ).toBeUndefined();
  });

  it('builds offers from decimal string prices returned by the API', () => {
    expect(
      buildProductSchema({
        name: 'Bom thuy luc',
        description: 'Mo ta',
        url: 'https://example.test/san-pham/bom-thuy-luc',
        price: '4500000.00' as unknown as number,
      }),
    ).toMatchObject({
      offers: {
        '@type': 'Offer',
        price: 4500000,
        priceCurrency: 'VND',
        availability: 'https://schema.org/InStock',
        url: 'https://example.test/san-pham/bom-thuy-luc',
      },
    });
  });
});
