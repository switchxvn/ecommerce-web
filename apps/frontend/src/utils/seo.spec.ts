import {
  buildAlternateLinks,
  buildArticleSchema,
  buildLlmsTxt,
  buildProductSchema,
  buildRobotsTxt,
  buildSitemapXml,
  coalesceSeoText,
  getRouteIndexPolicy,
  inferSeoRoute,
  resolveSeoCanonicalUrl,
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

  it('normalizes site urls to https non-www origins', async () => {
    const { normalizeSiteUrl } = await import('./seo');

    expect(normalizeSiteUrl('http://www.mgavietnam.com/')).toBe('https://mgavietnam.com');
    expect(normalizeSiteUrl('https://www.mgavietnam.com/path/')).toBe('https://mgavietnam.com/path');
    expect(normalizeSiteUrl('http://mgavietnam.com')).toBe('https://mgavietnam.com');
    expect(normalizeSiteUrl('https://captreonuisam.com/dich-vu')).toBe('https://mgavietnam.com/dich-vu');
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
      { hreflang: 'x-default', href: 'https://example.test/san-pham/xe-nang-dau' },
    ]);
  });

  it('uses only the vietnamese canonical category path', () => {
    expect(
      resolveSeoCanonicalUrl({
        siteUrl,
        currentPath: '/categories/electric-forklift',
        locale: 'en',
        routeKey: 'category-detail',
        slugByLocale: {
          vi: 'xe-nang-dien',
          en: 'electric-forklift',
        },
        candidate: 'https://example.test/categories/electric-forklift',
      }),
    ).toBe('https://example.test/danh-muc-san-pham/electric-forklift');

    expect(
      buildAlternateLinks(siteUrl, 'category-detail', {
        currentLocale: 'en',
        slugByLocale: {
          vi: 'xe-nang-dien',
          en: 'electric-forklift',
        },
      }),
    ).toEqual([
      { hreflang: 'vi', href: 'https://example.test/danh-muc-san-pham/xe-nang-dien' },
      { hreflang: 'x-default', href: 'https://example.test/danh-muc-san-pham/xe-nang-dien' },
    ]);
  });

  it('forces product detail canonical urls to the vietnamese route', () => {
    expect(
      resolveSeoCanonicalUrl({
        siteUrl,
        currentPath: '/products/diesel-forklift',
        locale: 'en',
        routeKey: 'product-detail',
        slugByLocale: {
          vi: 'xe-nang-dau',
          en: 'diesel-forklift',
        },
        candidate: 'https://example.test/products/diesel-forklift?utm_source=google',
      }),
    ).toBe('https://example.test/san-pham/xe-nang-dau');
  });

  it('falls back when SEO title values are blank', () => {
    expect(coalesceSeoText('   ', 'Default title')).toBe('Default title');
    expect(coalesceSeoText('', 'Default title')).toBe('Default title');
    expect(coalesceSeoText('Posts', 'Default title')).toBe('Posts');
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
      { loc: 'https://example.test/llms.txt' },
    ]);

    expect(xml).toContain('<loc>https://example.test/san-pham</loc>');
    expect(xml).toContain('<loc>https://example.test/products</loc>');
    expect(xml).toContain('<loc>https://example.test/llms.txt</loc>');
    expect(xml.match(/<url>/g)).toHaveLength(3);
  });

  it('builds bilingual llms.txt content with prioritized canonical urls', () => {
    const llms = buildLlmsTxt(siteUrl);

    expect(llms).toContain('# MGA Vietnam');
    expect(llms).toContain('MGA Vietnam là website chính thức về xe nâng MGA Forklift');
    expect(llms).toContain('xe nâng dầu, xe nâng điện, thiết bị nâng hạ, phụ tùng');
    expect(llms).toContain('MGA Vietnam is the official website for MGA Forklift');
    expect(llms).toContain('diesel forklifts, electric forklifts, material handling equipment, spare parts');
    expect(llms).toContain('Preferred URLs:');
    expect(llms).toContain('- https://example.test/');
    expect(llms).toContain('- https://example.test/gioi-thieu');
    expect(llms).toContain('- https://example.test/about');
    expect(llms).toContain('- https://example.test/danh-muc-san-pham');
    expect(llms).toContain('- https://example.test/lien-he');
    expect(llms).toContain('- https://example.test/contact');
    expect(llms).toContain('Avoid transactional, quote-request, or session-specific flows');
    expect(llms).toContain('- https://example.test/order-ticket');
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

  it('adds review objects to product schema when product reviews exist', () => {
    expect(
      buildProductSchema({
        name: 'May nen khi',
        description: 'Mo ta',
        url: 'https://example.test/san-pham/may-nen-khi',
        reviews: [
          {
            authorName: 'Nguyen Van A',
            rating: 5,
            createdAt: '2026-05-21T00:00:00.000Z',
            translations: [
              {
                title: 'Rat tot',
                content: 'San pham van hanh on dinh va dung nhu mo ta.',
              },
            ],
          },
        ],
      }),
    ).toMatchObject({
      review: [
        {
          '@type': 'Review',
          author: {
            '@type': 'Person',
            name: 'Nguyen Van A',
          },
          name: 'Rat tot',
          reviewBody: 'San pham van hanh on dinh va dung nhu mo ta.',
          datePublished: '2026-05-21T00:00:00.000Z',
          reviewRating: {
            '@type': 'Rating',
            ratingValue: 5,
            bestRating: 5,
            worstRating: 1,
          },
        },
      ],
    });
  });

  it('builds offers from decimal string prices returned by the API', () => {
    expect(
      buildProductSchema({
        name: 'Bom thuy luc',
        description: 'Mo ta',
        url: 'https://example.test/san-pham/bom-thuy-luc',
        price: '4500000.00' as unknown as number,
        sku: 'BOM-001',
      }),
    ).toMatchObject({
      sku: 'BOM-001',
      offers: {
        '@type': 'Offer',
        price: 4500000,
        priceCurrency: 'VND',
        availability: 'https://schema.org/InStock',
        url: 'https://example.test/san-pham/bom-thuy-luc',
      },
    });
  });

  it('builds a blog posting schema with Google-recommended article fields', () => {
    expect(
      buildArticleSchema({
        headline: 'Cach chon xe nang dien',
        description: 'Huong dan chon xe nang dien cho kho xuong.',
        url: 'https://example.test/bai-viet/cach-chon-xe-nang-dien',
        image: [
          'https://cdn.example.test/posts/forklift-1x1.jpg',
          'https://cdn.example.test/posts/forklift-4x3.jpg',
          'https://cdn.example.test/posts/forklift-16x9.jpg',
        ],
        datePublished: '2026-05-21T09:30:00.000Z',
        dateModified: '2026-05-22T07:15:00.000Z',
        authorName: 'Nguyen Van A',
        authorUrl: 'https://example.test/tac-gia/nguyen-van-a',
        publisherName: 'MGA Vietnam',
        publisherLogoUrl: 'https://cdn.example.test/logo.png',
      }),
    ).toMatchObject({
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      headline: 'Cach chon xe nang dien',
      description: 'Huong dan chon xe nang dien cho kho xuong.',
      url: 'https://example.test/bai-viet/cach-chon-xe-nang-dien',
      mainEntityOfPage: {
        '@type': 'WebPage',
        '@id': 'https://example.test/bai-viet/cach-chon-xe-nang-dien',
      },
      image: [
        'https://cdn.example.test/posts/forklift-1x1.jpg',
        'https://cdn.example.test/posts/forklift-4x3.jpg',
        'https://cdn.example.test/posts/forklift-16x9.jpg',
      ],
      datePublished: '2026-05-21T09:30:00.000Z',
      dateModified: '2026-05-22T07:15:00.000Z',
      author: {
        '@type': 'Person',
        name: 'Nguyen Van A',
        url: 'https://example.test/tac-gia/nguyen-van-a',
      },
      publisher: {
        '@type': 'Organization',
        name: 'MGA Vietnam',
        logo: {
          '@type': 'ImageObject',
          url: 'https://cdn.example.test/logo.png',
        },
      },
    });
  });
});
