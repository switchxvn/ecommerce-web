type FaviconLike = {
  lightModeUrl?: string | null;
  darkModeUrl?: string | null;
} | null;

const DEFAULT_FAVICON_ICO = '/favicon.ico';
const DEFAULT_FAVICON_PNG_32 = '/favicon-32x32.png';
const DEFAULT_FAVICON_PNG_16 = '/favicon-16x16.png';
const DEFAULT_APPLE_TOUCH_ICON = '/apple-touch-icon.png';

export function getFaviconMimeType(faviconUrl: string): string {
  if (faviconUrl.endsWith('.svg')) return 'image/svg+xml';
  if (faviconUrl.endsWith('.png')) return 'image/png';
  if (faviconUrl.endsWith('.gif')) return 'image/gif';
  return 'image/x-icon';
}

export function buildFaviconLinks(url: string) {
  const mimeType = getFaviconMimeType(url);
  const isDefaultIcoFallback = url === DEFAULT_FAVICON_ICO;
  const appleTouchHref = isDefaultIcoFallback ? DEFAULT_APPLE_TOUCH_ICON : url;
  const icon32Href = isDefaultIcoFallback ? DEFAULT_FAVICON_PNG_32 : url;
  const icon16Href = isDefaultIcoFallback ? DEFAULT_FAVICON_PNG_16 : url;

  return [
    {
      key: 'favicon-main',
      rel: 'icon',
      type: mimeType,
      href: url,
    },
    {
      key: 'favicon-shortcut',
      rel: 'shortcut icon',
      type: mimeType,
      href: url,
    },
    {
      key: 'apple-touch-icon',
      rel: 'apple-touch-icon',
      sizes: '180x180',
      href: appleTouchHref,
    },
    {
      key: 'favicon-32',
      rel: 'icon',
      type: 'image/png',
      sizes: '32x32',
      href: icon32Href,
    },
    {
      key: 'favicon-16',
      rel: 'icon',
      type: 'image/png',
      sizes: '16x16',
      href: icon16Href,
    },
  ];
}

export function resolveCurrentFaviconUrl(
  favicon: FaviconLike,
  defaultFavicon = DEFAULT_FAVICON_ICO,
): string {
  if (!favicon) return defaultFavicon;

  return favicon.lightModeUrl || favicon.darkModeUrl || defaultFavicon;
}
