import { normalizePath } from './seo';

export interface LegacyRedirectResult {
  destination: string;
  statusCode: 301;
}

const EXACT_REDIRECTS = new Map<string, string>([
  ['/en/products/mga-16-ton-diesel-forklift', '/products/mga-16-ton-diesel-forklift'],
  ['/tat-ca-san-pham', '/san-pham'],
  ['/danh-muc-san-pham/xe-nang/xe-nang-dau', '/danh-muc-san-pham/xe-nang-dau'],
  ['/danh-muc-san-pham/xe-nang/xe-nang-dien/xe-nang-dien-dung-lai', '/danh-muc-san-pham/xe-nang-dien-dung-lai'],
]);

export function resolveLegacyRedirect(path: string): LegacyRedirectResult | null {
  const normalizedPath = normalizePath(path);
  const exactDestination = EXACT_REDIRECTS.get(normalizedPath);

  if (exactDestination) {
    return {
      destination: exactDestination,
      statusCode: 301,
    };
  }

  if (normalizedPath === '/products' || normalizedPath.startsWith('/products/')) {
    return {
      destination: normalizedPath.replace(/^\/products/, '/san-pham'),
      statusCode: 301,
    };
  }

  if (normalizedPath === '/categories' || normalizedPath.startsWith('/categories/')) {
    return {
      destination: normalizedPath.replace(/^\/categories/, '/danh-muc-san-pham'),
      statusCode: 301,
    };
  }

  return null;
}
