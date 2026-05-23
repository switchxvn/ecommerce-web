export type SeoLocale = 'vi' | 'en';

export type SeoRouteKey =
  | 'home'
  | 'about'
  | 'contact'
  | 'gallery'
  | 'products'
  | 'product-detail'
  | 'tickets'
  | 'ticket-detail'
  | 'posts'
  | 'post-detail'
  | 'services'
  | 'service-detail'
  | 'categories'
  | 'category-detail'
  | 'ticket-pricing'
  | 'menu'
  | 'order-ticket';

export interface SeoRouteMatch {
  key: SeoRouteKey;
  locale: SeoLocale;
  slug?: string;
  path: string;
}

export interface SitemapEntry {
  loc: string;
  lastmod?: string;
  changefreq?: string;
  priority?: number;
}

interface RouteDefinition {
  key: SeoRouteKey;
  vi: string;
  en: string;
  detail?: boolean;
}

const TRACKING_QUERY_PREFIXES = ['utm_', 'fbclid', 'gclid', 'msclkid'];

const ROUTE_DEFINITIONS: RouteDefinition[] = [
  { key: 'home', vi: '/', en: '/' },
  { key: 'about', vi: '/gioi-thieu', en: '/about' },
  { key: 'contact', vi: '/lien-he', en: '/contact' },
  { key: 'gallery', vi: '/thu-vien-hinh-anh', en: '/gallery' },
  { key: 'products', vi: '/san-pham', en: '/products' },
  { key: 'product-detail', vi: '/san-pham', en: '/products', detail: true },
  { key: 'tickets', vi: '/tickets', en: '/tickets' },
  { key: 'ticket-detail', vi: '/tickets', en: '/tickets', detail: true },
  { key: 'posts', vi: '/bai-viet', en: '/posts' },
  { key: 'post-detail', vi: '/bai-viet', en: '/posts', detail: true },
  { key: 'services', vi: '/dich-vu', en: '/services' },
  { key: 'service-detail', vi: '/dich-vu', en: '/services', detail: true },
  { key: 'categories', vi: '/danh-muc-san-pham', en: '/danh-muc-san-pham' },
  { key: 'category-detail', vi: '/danh-muc-san-pham', en: '/danh-muc-san-pham', detail: true },
  { key: 'ticket-pricing', vi: '/bang-gia-ve', en: '/ticket-pricing' },
  { key: 'menu', vi: '/thuc-don', en: '/menu' },
  { key: 'order-ticket', vi: '/dat-ve', en: '/order-ticket' },
];

const INDEXABLE_ROUTE_KEYS = new Set<SeoRouteKey>([
  'home',
  'about',
  'contact',
  'gallery',
  'products',
  'product-detail',
  'tickets',
  'ticket-detail',
  'posts',
  'post-detail',
  'services',
  'service-detail',
  'categories',
  'category-detail',
  'ticket-pricing',
  'menu',
]);

const TECHNICAL_ROUTE_PREFIXES = [
  '/api',
  '/internal-api',
  '/_nuxt',
  '/_ipx',
  '/images',
  '/fonts',
  '/static',
];

const NOINDEX_ROUTE_PREFIXES = [
  '/admin',
  '/dashboard',
  '/auth',
  '/cart',
  '/checkout',
  '/order-refund',
  '/ticket-exchange',
  '/map',
  '/reviews',
  '/test-session',
];

const NOINDEX_ROUTE_EXACT = new Set([
  '/checkout',
  '/checkout/cancel',
  '/checkout/success',
  '/checkout/ticket',
]);

const ENGLISH_ALIAS_ROUTE_KEYS = new Set<SeoRouteKey>([
  'about',
  'contact',
  'gallery',
  'products',
  'product-detail',
  'posts',
  'post-detail',
  'services',
  'service-detail',
  'categories',
  'category-detail',
  'ticket-pricing',
  'menu',
  'order-ticket',
]);

const CMS_SEO_DETAIL_ROUTE_KEYS = new Set<SeoRouteKey>([
  'product-detail',
  'ticket-detail',
  'post-detail',
  'service-detail',
  'category-detail',
]);

export function normalizePath(path: string): string {
  if (!path) {
    return '/';
  }

  const withoutHash = path.split('#')[0] || '/';
  const withoutQuery = withoutHash.split('?')[0] || '/';
  const withLeadingSlash = withoutQuery.startsWith('/') ? withoutQuery : `/${withoutQuery}`;

  if (withLeadingSlash.length > 1 && withLeadingSlash.endsWith('/')) {
    return withLeadingSlash.slice(0, -1);
  }

  return withLeadingSlash;
}

export function coalesceSeoText(value: string | null | undefined, fallback: string): string {
  const normalizedValue = typeof value === 'string' ? value.trim() : '';
  const normalizedFallback = fallback.trim();

  return normalizedValue || normalizedFallback;
}

export function normalizeSiteUrl(siteUrl: string): string {
  const trimmed = siteUrl.replace(/\/+$/, '');

  try {
    const parsedUrl = new URL(trimmed);
    const canonicalHost = 'mgavietnam.com';
    const canonicalAliases = new Set([
      canonicalHost,
      `www.${canonicalHost}`,
      'captreonuisam.com',
      'www.captreonuisam.com',
      'captreo.ultron.vn',
    ]);

    if (canonicalAliases.has(parsedUrl.hostname)) {
      parsedUrl.protocol = 'https:';
      parsedUrl.hostname = canonicalHost;

      if (parsedUrl.pathname.length > 1) {
        parsedUrl.pathname = parsedUrl.pathname.replace(/\/+$/, '');
      }

      return parsedUrl.toString().replace(/\/+$/, '');
    }

    return parsedUrl.toString().replace(/\/+$/, '');
  } catch {
    return trimmed;
  }
}

function splitLocalePrefix(path: string): { locale: SeoLocale | null; strippedPath: string } {
  return { locale: null, strippedPath: normalizePath(path) };
}

function resolveRouteLocale(definition: RouteDefinition, explicitLocale: SeoLocale | null, matchedBase: string): SeoLocale {
  if (explicitLocale) {
    return explicitLocale;
  }

  if (matchedBase === definition.vi) {
    return 'vi';
  }

  if (matchedBase === definition.en && ENGLISH_ALIAS_ROUTE_KEYS.has(definition.key)) {
    return 'en';
  }

  return 'vi';
}

export function inferSeoRoute(path: string): SeoRouteMatch | null {
  const normalized = normalizePath(path);
  const { locale: explicitLocale, strippedPath } = splitLocalePrefix(normalized);

  for (const definition of ROUTE_DEFINITIONS) {
    const bases: Array<{ localePath: string; matchedBase: string }> = [
      { localePath: definition.vi, matchedBase: definition.vi },
      { localePath: definition.en, matchedBase: definition.en },
    ];

    for (const base of bases) {
      if (definition.detail) {
        if (strippedPath.startsWith(`${base.localePath}/`)) {
          const slug = strippedPath.slice(base.localePath.length + 1);
          if (slug && !slug.includes('/')) {
            return {
              key: definition.key,
              locale: resolveRouteLocale(definition, explicitLocale, base.matchedBase),
              slug,
              path: normalized,
            };
          }
        }
        continue;
      }

      if (strippedPath === base.localePath) {
        return {
          key: definition.key,
          locale: resolveRouteLocale(definition, explicitLocale, base.matchedBase),
          path: normalized,
        };
      }
    }
  }

  return null;
}

export function shouldUseCmsSeoForRoute(routeKey?: SeoRouteKey): boolean {
  if (!routeKey) {
    return true;
  }

  return !CMS_SEO_DETAIL_ROUTE_KEYS.has(routeKey);
}

export function buildLocalizedPath(routeKey: SeoRouteKey, locale: SeoLocale, slug?: string): string | null {
  const definition = ROUTE_DEFINITIONS.find((item) => item.key === routeKey);

  if (!definition) {
    return null;
  }

  const basePath = locale === 'vi' ? definition.vi : definition.en;

  if (!definition.detail) {
    return basePath;
  }

  if (!slug) {
    return null;
  }

  return `${basePath}/${slug}`;
}

export function resolveSeoCanonicalUrl(options: {
  siteUrl: string;
  currentPath: string;
  locale: SeoLocale;
  routeKey?: SeoRouteKey;
  slugByLocale?: Partial<Record<SeoLocale, string>>;
  candidate?: string | null | undefined;
}): string {
  const fallbackPath = normalizePath(options.currentPath || '/');
  const forceCanonicalCategoryPath = options.routeKey === 'categories' || options.routeKey === 'category-detail';
  const forceVietnameseCanonical = options.routeKey === 'product-detail';
  const canonicalLocale: SeoLocale = forceVietnameseCanonical ? 'vi' : options.locale;
  const localizedFallbackPath =
    options.routeKey
      ? buildLocalizedPath(
          options.routeKey,
          canonicalLocale,
          options.slugByLocale?.[canonicalLocale] || options.slugByLocale?.[options.locale],
        ) || fallbackPath
      : fallbackPath;

  if (forceVietnameseCanonical || forceCanonicalCategoryPath) {
    return buildAbsoluteUrl(options.siteUrl, localizedFallbackPath);
  }

  return sanitizeCanonicalUrl(options.candidate, options.siteUrl) || buildAbsoluteUrl(options.siteUrl, localizedFallbackPath);
}

export function stripTrackingParams(url: URL): URL {
  const cloned = new URL(url.toString());

  for (const key of [...cloned.searchParams.keys()]) {
    if (TRACKING_QUERY_PREFIXES.some((prefix) => key === prefix || key.startsWith(prefix))) {
      cloned.searchParams.delete(key);
    }
  }

  return cloned;
}

export function sanitizeCanonicalUrl(candidate: string | null | undefined, siteUrl: string, allowedHosts: string[] = []): string | null {
  if (!candidate) {
    return null;
  }

  try {
    const baseSiteUrl = new URL(normalizeSiteUrl(siteUrl));
    const canonicalUrl = new URL(candidate, `${baseSiteUrl.origin}/`);
    const normalizedAllowedHosts = new Set([baseSiteUrl.host, ...allowedHosts]);

    if (!normalizedAllowedHosts.has(canonicalUrl.host)) {
      return null;
    }

    canonicalUrl.hash = '';

    const sanitized = stripTrackingParams(canonicalUrl);
    const pathname = sanitized.pathname.length > 1 ? sanitized.pathname.replace(/\/+$/, '') : sanitized.pathname;
    const search = sanitized.searchParams.toString();

    return `${sanitized.origin}${pathname}${search ? `?${search}` : ''}`;
  } catch {
    return null;
  }
}

export function buildAbsoluteUrl(siteUrl: string, path: string): string {
  const normalizedSiteUrl = normalizeSiteUrl(siteUrl);
  const normalizedPath = normalizePath(path);
  return normalizedPath === '/' ? normalizedSiteUrl : `${normalizedSiteUrl}${normalizedPath}`;
}

export function buildAlternateLinks(
  siteUrl: string,
  routeKey: SeoRouteKey,
  options: {
    currentLocale: SeoLocale;
    slugByLocale?: Partial<Record<SeoLocale, string>>;
  },
): Array<{ hreflang: 'vi' | 'en' | 'x-default'; href: string }> {
  const alternates: Array<{ hreflang: 'vi' | 'en' | 'x-default'; href: string }> = [];
  const viPath = buildLocalizedPath(routeKey, 'vi', options.slugByLocale?.vi);
  const enPath = ['product-detail', 'categories', 'category-detail'].includes(routeKey)
    ? null
    : buildLocalizedPath(routeKey, 'en', options.slugByLocale?.en);

  if (viPath) {
    alternates.push({ hreflang: 'vi', href: buildAbsoluteUrl(siteUrl, viPath) });
  }

  if (enPath) {
    alternates.push({ hreflang: 'en', href: buildAbsoluteUrl(siteUrl, enPath) });
  }

  const xDefaultHref =
    alternates.find((item) => item.hreflang === 'vi')?.href ||
    alternates.find((item) => item.hreflang === options.currentLocale)?.href;

  if (xDefaultHref) {
    alternates.push({ hreflang: 'x-default', href: xDefaultHref });
  }

  return alternates;
}

export function getRouteIndexPolicy(path: string): { indexable: boolean; robots: string } {
  const normalized = normalizePath(path);
  const { strippedPath } = splitLocalePrefix(normalized);

  if (TECHNICAL_ROUTE_PREFIXES.some((prefix) => strippedPath === prefix || strippedPath.startsWith(`${prefix}/`))) {
    return { indexable: false, robots: 'noindex,nofollow' };
  }

  if (NOINDEX_ROUTE_EXACT.has(strippedPath) || NOINDEX_ROUTE_PREFIXES.some((prefix) => strippedPath === prefix || strippedPath.startsWith(`${prefix}/`))) {
    return { indexable: false, robots: 'noindex,nofollow' };
  }

  const route = inferSeoRoute(normalized);

  if (route && INDEXABLE_ROUTE_KEYS.has(route.key)) {
    return { indexable: true, robots: 'index,follow' };
  }

  return { indexable: false, robots: 'noindex,nofollow' };
}

export function buildRobotsTxt(siteUrl: string): string {
  const disallowPaths = new Set<string>();
  const noindexPaths = new Set([
    ...NOINDEX_ROUTE_PREFIXES,
    ...NOINDEX_ROUTE_EXACT,
  ]);

  const addDisallowPath = (path: string | null) => {
    if (!path) {
      return;
    }

    disallowPaths.add(normalizePath(path));
  };

  for (const path of noindexPaths) {
    addDisallowPath(path);
  }

  addDisallowPath(buildLocalizedPath('order-ticket', 'vi'));
  addDisallowPath(buildLocalizedPath('order-ticket', 'en'));

  const lines = [
    'User-agent: *',
    'Allow: /',
    ...[...disallowPaths].map((path) => `Disallow: ${path}`),
    `Sitemap: ${normalizeSiteUrl(siteUrl)}/sitemap.xml`,
  ];

  return `${lines.join('\n')}\n`;
}

export function buildLlmsTxt(siteUrl: string): string {
  const preferredRouteKeys: SeoRouteKey[] = [
    'home',
    'about',
    'products',
    'categories',
    'services',
    'posts',
    'contact',
  ];
  const avoidRouteKeys: SeoRouteKey[] = ['order-ticket'];

  const preferredUrls = preferredRouteKeys.flatMap((routeKey) => {
    const viPath = buildLocalizedPath(routeKey, 'vi');
    const enPath = buildLocalizedPath(routeKey, 'en');
    const paths = [viPath];

    if (enPath && enPath !== viPath) {
      paths.push(enPath);
    }

    return paths.filter((path): path is string => Boolean(path)).map((path) => buildAbsoluteUrl(siteUrl, path));
  });

  const avoidUrls = avoidRouteKeys.flatMap((routeKey) => {
    const viPath = buildLocalizedPath(routeKey, 'vi');
    const enPath = buildLocalizedPath(routeKey, 'en');

    return [viPath, enPath]
      .filter((path): path is string => Boolean(path))
      .map((path) => buildAbsoluteUrl(siteUrl, path));
  });

  const lines = [
    '# MGA Vietnam',
    '',
    'MGA Vietnam là website chính thức về xe nâng MGA Forklift tại Việt Nam.',
    'Website cung cấp thông tin tham khảo về xe nâng dầu, xe nâng điện, thiết bị nâng hạ, phụ tùng, dịch vụ, danh mục sản phẩm, bài viết chuyên môn và thông tin liên hệ chính thức.',
    '',
    'MGA Vietnam is the official website for MGA Forklift in Vietnam.',
    'The site provides reference information about diesel forklifts, electric forklifts, material handling equipment, spare parts, services, product categories, editorial content, and official contact details.',
    '',
    'Preferred URLs:',
    ...preferredUrls.map((url) => `- ${url}`),
    '',
    'Avoid transactional, quote-request, or session-specific flows:',
    '- Forms, booking, checkout, and session-dependent flows should not be treated as durable reference content.',
    ...avoidUrls.map((url) => `- ${url}`),
  ];

  return `${lines.join('\n')}\n`;
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export function buildSitemapXml(entries: SitemapEntry[]): string {
  const uniqueEntries = [...new Map(entries.map((entry) => [entry.loc, entry])).values()];
  const body = uniqueEntries
    .map((entry) => {
      const lines = ['  <url>', `    <loc>${escapeXml(entry.loc)}</loc>`];

      if (entry.lastmod) {
        lines.push(`    <lastmod>${escapeXml(entry.lastmod)}</lastmod>`);
      }

      if (entry.changefreq) {
        lines.push(`    <changefreq>${escapeXml(entry.changefreq)}</changefreq>`);
      }

      if (typeof entry.priority === 'number') {
        lines.push(`    <priority>${entry.priority.toFixed(1)}</priority>`);
      }

      lines.push('  </url>');
      return lines.join('\n');
    })
    .join('\n');

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    body,
    '</urlset>',
  ].join('\n');
}

export function buildOrganizationSchema(siteUrl: string, siteName: string, logoUrl?: string) {
  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: siteName,
    url: normalizeSiteUrl(siteUrl),
  };

  if (logoUrl) {
    schema.logo = logoUrl;
  }

  return schema;
}

export function buildWebSiteSchema(siteUrl: string, siteName: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: siteName,
    url: normalizeSiteUrl(siteUrl),
  };
}

export function buildBreadcrumbSchema(items: Array<{ name: string; item: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((entry, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: entry.name,
      item: entry.item,
    })),
  };
}

export function buildCollectionPageSchema(siteUrl: string, name: string, description: string, url: string, isBlog = false) {
  return {
    '@context': 'https://schema.org',
    '@type': isBlog ? 'Blog' : 'CollectionPage',
    name,
    description,
    url,
    isPartOf: normalizeSiteUrl(siteUrl),
  };
}

export function buildArticleSchema(input: {
  headline: string;
  description: string;
  url: string;
  image?: string | string[];
  datePublished?: string;
  dateModified?: string;
  authorName?: string;
  authorUrl?: string;
  publisherName?: string;
  publisherLogoUrl?: string;
  inLanguage?: string;
}) {
  const images = Array.isArray(input.image) ? input.image.filter(Boolean) : input.image ? [input.image] : [];

  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: input.headline,
    description: input.description,
    url: input.url,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': input.url,
    },
    image: images.length === 0 ? undefined : images.length === 1 ? images[0] : images,
    datePublished: input.datePublished || undefined,
    dateModified: input.dateModified || undefined,
    inLanguage: input.inLanguage || undefined,
    author: input.authorName
      ? {
          '@type': 'Person',
          name: input.authorName,
          url: input.authorUrl || undefined,
        }
      : undefined,
    publisher: input.publisherName
      ? {
          '@type': 'Organization',
          name: input.publisherName,
          logo: input.publisherLogoUrl
            ? {
                '@type': 'ImageObject',
                url: input.publisherLogoUrl,
              }
            : undefined,
        }
      : undefined,
  };
}

export function buildServiceSchema(input: {
  name: string;
  description: string;
  url: string;
  image?: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: input.name,
    description: input.description,
    url: input.url,
    image: input.image || undefined,
  };
}

export function buildProductSchema(input: {
  name: string;
  description: string;
  url: string;
  image?: string;
  sku?: string;
  brand?: string;
  price?: number | string | null;
  priceCurrency?: string;
  availability?: string;
  ratingValue?: number | null;
  reviewCount?: number | null;
  reviews?: Array<{
    authorName: string;
    rating: number;
    createdAt?: string;
    translations: Array<{
      title?: string;
      content: string;
    }>;
  }>;
}) {
  const normalizedPrice =
    typeof input.price === 'number'
      ? input.price
      : typeof input.price === 'string'
        ? Number.parseFloat(input.price)
        : null;
  const hasValidPrice = typeof normalizedPrice === 'number' && Number.isFinite(normalizedPrice);
  const hasValidAggregateRating =
    typeof input.ratingValue === 'number' &&
    Number.isFinite(input.ratingValue) &&
    input.ratingValue > 0 &&
    typeof input.reviewCount === 'number' &&
    Number.isFinite(input.reviewCount) &&
    input.reviewCount > 0;
  const review =
    input.reviews
      ?.map((item) => {
        const translation = item.translations?.find((entry) => entry.content?.trim()) || item.translations?.[0];
        const reviewBody = translation?.content?.trim();
        const reviewTitle = translation?.title?.trim();

        if (
          !reviewBody ||
          typeof item.rating !== 'number' ||
          !Number.isFinite(item.rating) ||
          item.rating <= 0 ||
          !item.authorName?.trim()
        ) {
          return null;
        }

        return {
          '@type': 'Review',
          author: {
            '@type': 'Person',
            name: item.authorName.trim(),
          },
          name: reviewTitle || undefined,
          reviewBody,
          datePublished: item.createdAt || undefined,
          reviewRating: {
            '@type': 'Rating',
            ratingValue: item.rating,
            bestRating: 5,
            worstRating: 1,
          },
        };
      })
      .filter((item): item is NonNullable<typeof item> => Boolean(item)) || [];

  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: input.name,
    description: input.description,
    url: input.url,
    image: input.image || undefined,
    sku: input.sku || undefined,
    brand: input.brand
      ? {
          '@type': 'Brand',
          name: input.brand,
        }
      : undefined,
    offers:
      hasValidPrice
        ? {
            '@type': 'Offer',
            price: normalizedPrice,
            priceCurrency: input.priceCurrency || 'VND',
            availability: input.availability || 'https://schema.org/InStock',
            url: input.url,
          }
        : undefined,
    aggregateRating:
      hasValidAggregateRating
        ? {
            '@type': 'AggregateRating',
            ratingValue: input.ratingValue,
            reviewCount: input.reviewCount,
          }
        : undefined,
    review: review.length > 0 ? review : undefined,
  };
}
