import { useHead, useRuntimeConfig, useSeoMeta } from 'nuxt/app';
import { computed, toValue, type MaybeRefOrGetter } from 'vue';
import {
  buildAbsoluteUrl,
  buildAlternateLinks,
  buildBreadcrumbSchema,
  buildCollectionPageSchema,
  buildOrganizationSchema,
  buildWebSiteSchema,
  coalesceSeoText,
  normalizePath,
  resolveSeoCanonicalUrl,
  sanitizeCanonicalUrl,
  type SeoLocale,
  type SeoRouteKey,
} from '../utils/seo';

interface BreadcrumbInput {
  name: string;
  item?: string;
}

interface PageSeoOptions {
  title: MaybeRefOrGetter<string>;
  description: MaybeRefOrGetter<string>;
  locale: MaybeRefOrGetter<SeoLocale>;
  routeKey?: SeoRouteKey;
  slugByLocale?: MaybeRefOrGetter<Partial<Record<SeoLocale, string>> | undefined>;
  currentPath?: MaybeRefOrGetter<string | undefined>;
  image?: MaybeRefOrGetter<string | undefined>;
  keywords?: MaybeRefOrGetter<string | undefined>;
  ogTitle?: MaybeRefOrGetter<string | undefined>;
  ogDescription?: MaybeRefOrGetter<string | undefined>;
  ogType?: MaybeRefOrGetter<string | undefined>;
  robots?: MaybeRefOrGetter<string | undefined>;
  canonicalUrl?: MaybeRefOrGetter<string | null | undefined>;
  schemas?: MaybeRefOrGetter<Record<string, unknown>[] | undefined>;
  breadcrumbs?: MaybeRefOrGetter<BreadcrumbInput[] | undefined>;
}

function toAbsoluteMediaUrl(siteUrl: string, image?: string): string | undefined {
  if (!image) {
    return undefined;
  }

  if (image.startsWith('http://') || image.startsWith('https://')) {
    return image;
  }

  return buildAbsoluteUrl(siteUrl, image);
}

function buildDefaultSchemas(
  siteUrl: string,
  siteName: string,
  canonicalUrl: string,
  routeKey: SeoRouteKey | undefined,
  title: string,
  description: string,
): Record<string, unknown>[] {
  if (routeKey === 'home') {
    return [
      buildOrganizationSchema(siteUrl, siteName),
      buildWebSiteSchema(siteUrl, siteName),
    ];
  }

  if (routeKey === 'posts') {
    return [buildCollectionPageSchema(siteUrl, title, description, canonicalUrl, true)];
  }

  if (routeKey && ['products', 'tickets', 'services', 'categories', 'gallery'].includes(routeKey)) {
    return [buildCollectionPageSchema(siteUrl, title, description, canonicalUrl)];
  }

  return [];
}

export function usePageSeo(options: PageSeoOptions) {
  const config = useRuntimeConfig();
  const siteUrl = config.public.siteUrl;
  const siteName = config.public.siteName || 'Website';
  const fallbackPath = computed(() => normalizePath(toValue(options.currentPath) || '/'));
  const normalizedLocale = computed(() => toValue(options.locale));
  const normalizedSlugByLocale = computed(() => toValue(options.slugByLocale));
  const fallbackTitle = computed(() => coalesceSeoText(siteName, 'Website'));
  const resolvedTitle = computed(() =>
    coalesceSeoText(toValue(options.title), fallbackTitle.value),
  );
  const resolvedDescription = computed(() =>
    coalesceSeoText(toValue(options.description), resolvedTitle.value),
  );
  const resolvedOgTitle = computed(() =>
    coalesceSeoText(toValue(options.ogTitle), resolvedTitle.value),
  );
  const resolvedOgDescription = computed(() =>
    coalesceSeoText(toValue(options.ogDescription), resolvedDescription.value),
  );
  const canonicalUrl = computed(() => {
    return resolveSeoCanonicalUrl({
      siteUrl,
      currentPath: fallbackPath.value,
      locale: normalizedLocale.value,
      routeKey: options.routeKey,
      slugByLocale: normalizedSlugByLocale.value,
      candidate: toValue(options.canonicalUrl),
    });
  });
  const alternates = computed(() =>
    options.routeKey
      ? buildAlternateLinks(siteUrl, options.routeKey, {
          currentLocale: normalizedLocale.value,
          slugByLocale: normalizedSlugByLocale.value,
        })
      : [],
  );
  const imageUrl = computed(() => toAbsoluteMediaUrl(siteUrl, toValue(options.image)));
  const breadcrumbItems = computed(() =>
    toValue(options.breadcrumbs)
      ?.map((item, index, items) => {
        const itemUrl = item.item
        ? sanitizeCanonicalUrl(item.item, siteUrl) || buildAbsoluteUrl(siteUrl, item.item)
        : index === items.length - 1
          ? canonicalUrl.value
          : null;

        if (!itemUrl) {
          return null;
        }

        return { name: item.name, item: itemUrl };
      })
      .filter((item): item is { name: string; item: string } => Boolean(item)),
  );
  const schemas = computed(() => [
    ...buildDefaultSchemas(
      siteUrl,
      siteName,
      canonicalUrl.value,
      options.routeKey,
      resolvedTitle.value,
      resolvedDescription.value,
    ),
    ...(breadcrumbItems.value && breadcrumbItems.value.length > 1 ? [buildBreadcrumbSchema(breadcrumbItems.value)] : []),
    ...(toValue(options.schemas) || []),
  ].filter(Boolean));

  useSeoMeta({
    title: resolvedTitle,
    description: resolvedDescription,
    keywords: () => toValue(options.keywords),
    robots: () => toValue(options.robots),
    ogTitle: resolvedOgTitle,
    ogDescription: resolvedOgDescription,
    ogImage: imageUrl,
    ogUrl: canonicalUrl,
    ogType: () => toValue(options.ogType) || 'website',
    ogSiteName: siteName,
    twitterCard: 'summary_large_image',
    twitterTitle: resolvedOgTitle,
    twitterDescription: resolvedOgDescription,
    twitterImage: imageUrl,
  });

  useHead(() => ({
    htmlAttrs: {
      lang: toValue(options.locale),
    },
    link: [
      {
        key: 'canonical',
        rel: 'canonical',
        href: canonicalUrl.value,
      },
      ...alternates.value.map((alternate) => ({
        key: `alternate-${alternate.hreflang}`,
        rel: 'alternate',
        hreflang: alternate.hreflang,
        href: alternate.href,
      })),
    ],
    script: schemas.value.map((schema, index) => ({
      key: `schema-${options.routeKey || 'page'}-${String((schema as { '@type'?: string })['@type'] || index)}-${index}`,
      type: 'application/ld+json',
      children: JSON.stringify(schema),
    })),
  }));

  return {
    canonicalUrl,
    alternates,
  };
}
