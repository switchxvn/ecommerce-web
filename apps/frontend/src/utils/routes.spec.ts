import { describe, expect, it } from 'vitest';

import {
  AUTH_ROUTE_PATHS,
  getBookingRoute,
  getCategoryDetailRoute,
  getCategoryListRoute,
  getContactRoute,
  getRouteLocale,
} from './routes';

describe('routes helpers', () => {
  it('normalizes supported locales to frontend route locales', () => {
    expect(getRouteLocale('vi')).toBe('vi');
    expect(getRouteLocale('en')).toBe('en');
    expect(getRouteLocale('ko')).toBe('vi');
    expect(getRouteLocale('en-US')).toBe('en');
  });

  it('builds localized category detail routes', () => {
    expect(getCategoryDetailRoute('xe-nang-dien', 'vi')).toBe('/danh-muc-san-pham/xe-nang-dien');
    expect(getCategoryDetailRoute('electric-forklift', 'en')).toBe('/danh-muc-san-pham/electric-forklift');
  });

  it('builds localized category listing routes', () => {
    expect(getCategoryListRoute('vi')).toBe('/danh-muc-san-pham');
    expect(getCategoryListRoute('en')).toBe('/danh-muc-san-pham');
  });

  it('builds localized contact routes', () => {
    expect(getContactRoute('vi')).toBe('/lien-he');
    expect(getContactRoute('en')).toBe('/contact');
  });

  it('builds the public booking route from existing pages', () => {
    expect(getBookingRoute('vi')).toBe('/dat-ve');
    expect(getBookingRoute('en')).toBe('/order-ticket');
  });

  it('keeps auth paths on their existing pages', () => {
    expect(AUTH_ROUTE_PATHS.login).toBe('/auth/login');
    expect(AUTH_ROUTE_PATHS.register).toBe('/auth/register');
    expect(AUTH_ROUTE_PATHS.dashboard).toBe('/dashboard');
  });
});
