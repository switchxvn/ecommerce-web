import { normalizeLocaleCode } from './locale';

export const ROUTE_NAMES = {
  // Products
  PRODUCTS_LIST: {
    en: 'products',
    vi: 'san-pham'
  },
  PRODUCT_DETAIL: {
    en: 'products-detail',
    vi: 'san-pham-chi-tiet'
  },
  // Posts
  POSTS_LIST: {
    en: 'posts',
    vi: 'bai-viet'
  },
  POST_DETAIL: {
    en: 'posts-detail',
    vi: 'bai-viet-chi-tiet'
  },
  // Services
  SERVICES_LIST: {
    en: 'services',
    vi: 'dich-vu'
  },
  SERVICE_DETAIL: {
    en: 'services-detail',
    vi: 'dich-vu-chi-tiet'
  },
  // Categories
  CATEGORIES_LIST: {
    en: 'categories',
    vi: 'danh-muc-san-pham'
  },
  CATEGORY_DETAIL: {
    en: 'categories-detail',
    vi: 'danh-muc-san-pham-chi-tiet'
  },
  HOME: {
    en: 'home',
    vi: 'trang-chu'
  },
  ABOUT: {
    en: 'about',
    vi: 'gioi-thieu'
  },
  CONTACT: {
    en: 'contact',
    vi: 'lien-he'
  },
  GALLERY: {
    en: 'gallery',
    vi: 'thu-vien-hinh-anh'
  },
  TICKET_PRICING: {
    en: 'ticket-pricing',
    vi: 'bang-gia-ve'
  },
  MENU: {
    en: 'menu',
    vi: 'thuc-don'
  },
  ORDER_TICKET: {
    en: 'order-ticket',
    vi: 'dat-ve'
  }
} as const;

export const ROUTE_PATHS = {
  // Products
  PRODUCTS_LIST: {
    en: '/products',
    vi: '/san-pham'
  },
  PRODUCT_DETAIL: {
    en: '/products/:slug',
    vi: '/san-pham/:slug'
  },
  // Posts
  POSTS_LIST: {
    en: '/posts',
    vi: '/bai-viet'
  },
  POST_DETAIL: {
    en: '/posts/:slug',
    vi: '/bai-viet/:slug'
  },
  // Services
  SERVICES_LIST: {
    en: '/services',
    vi: '/dich-vu'
  },
  SERVICE_DETAIL: {
    en: '/services/:slug',
    vi: '/dich-vu/:slug'
  },
  // Categories
  CATEGORIES_LIST: {
    en: '/categories',
    vi: '/danh-muc-san-pham'
  },
  CATEGORY_DETAIL: {
    en: '/categories/:slug',
    vi: '/danh-muc-san-pham/:slug'
  },
  HOME: {
    en: '/',
    vi: '/'
  },
  ABOUT: {
    en: '/about',
    vi: '/gioi-thieu'
  },
  CONTACT: {
    en: '/contact',
    vi: '/lien-he'
  },
  GALLERY: {
    en: '/gallery',
    vi: '/thu-vien-hinh-anh'
  },
  TICKET_PRICING: {
    en: '/ticket-pricing',
    vi: '/bang-gia-ve'
  },
  MENU: {
    en: '/menu',
    vi: '/thuc-don'
  },
  ORDER_TICKET: {
    en: '/order-ticket',
    vi: '/dat-ve'
  } 
} as const;

export type LocaleType = 'en' | 'vi';
type RouteType = keyof typeof ROUTE_PATHS;

type RoutePath = typeof ROUTE_PATHS[RouteType][LocaleType];

/**
 * Get localized route path
 * @param routeType - Type of route from ROUTE_PATHS
 * @param locale - Current locale
 * @param params - Route parameters (e.g., slug)
 */
export function getLocalizedRoute(routeType: RouteType, locale: LocaleType, params?: Record<string, string>): string {
  let path = ROUTE_PATHS[routeType][locale] as string;
  
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      path = path.replace(`:${key}`, value);
    });
  }
  
  return path;
}

/**
 * Get localized route name
 * @param routeType - Type of route from ROUTE_NAMES
 * @param locale - Current locale
 */
export function getLocalizedRouteName(routeType: RouteType, locale: LocaleType): string {
  return ROUTE_NAMES[routeType][locale];
}

export const AUTH_ROUTE_PATHS = {
  login: '/auth/login',
  register: '/auth/register',
  dashboard: '/dashboard',
} as const;

export function getRouteLocale(locale: string | null | undefined): LocaleType {
  return normalizeLocaleCode(locale) === 'en' ? 'en' : 'vi';
}

export function getCategoryDetailRoute(slug: string, locale: string | null | undefined): string {
  return getLocalizedRoute('CATEGORY_DETAIL', getRouteLocale(locale), { slug });
}

export function getCategoryListRoute(locale: string | null | undefined): string {
  return getLocalizedRoute('CATEGORIES_LIST', getRouteLocale(locale));
}

export function getContactRoute(locale: string | null | undefined): string {
  return getLocalizedRoute('CONTACT', getRouteLocale(locale));
}

export function getBookingRoute(locale: string | null | undefined): string {
  return getLocalizedRoute('ORDER_TICKET', getRouteLocale(locale));
}
