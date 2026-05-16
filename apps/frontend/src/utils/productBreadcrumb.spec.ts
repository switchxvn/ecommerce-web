import { describe, expect, it } from 'vitest';

import {
  resolveCategoryTranslation,
  resolveProductBreadcrumbCategory,
  resolveProductCategoryLink,
} from './productBreadcrumb';

describe('resolveProductBreadcrumbCategory', () => {
  it('prefers the first category parent when the parent has a slug', () => {
    const result = resolveProductBreadcrumbCategory(
      [
        {
          id: 10,
          translations: [
            { locale: 'vi', name: 'Xe nang dien', slug: 'xe-nang-dien' },
          ],
          parent: {
            id: 5,
            translations: [
              { locale: 'vi', name: 'Xe nang', slug: 'xe-nang' },
            ],
          },
        },
      ],
      'vi',
    );

    expect(result).toEqual({
      label: 'Xe nang',
      to: '/danh-muc-san-pham/xe-nang',
    });
  });

  it('falls back to the first category when there is no parent slug', () => {
    const result = resolveProductBreadcrumbCategory(
      [
        {
          id: 10,
          translations: [
            { locale: 'en', name: 'Electric Forklift', slug: 'electric-forklift' },
          ],
          parent: null,
        },
      ],
      'en',
    );

    expect(result).toEqual({
      label: 'Electric Forklift',
      to: '/categories/electric-forklift',
    });
  });

  it('skips categories without usable slugs and keeps searching', () => {
    const result = resolveProductBreadcrumbCategory(
      [
        {
          id: 10,
          translations: [
            { locale: 'vi', name: 'Khong hop le', slug: '' },
          ],
          parent: null,
        },
        {
          id: 11,
          translations: [
            { locale: 'vi', name: 'Xe dien', slug: 'xe-dien' },
          ],
          parent: null,
        },
      ],
      'vi',
    );

    expect(result).toEqual({
      label: 'Xe dien',
      to: '/danh-muc-san-pham/xe-dien',
    });
  });

  it('maps unsupported content locales to the default vi route set', () => {
    const result = resolveProductBreadcrumbCategory(
      [
        {
          id: 12,
          translations: [
            { locale: 'ko', name: '디젤 지게차', slug: 'dizel-jigecha' },
          ],
          parent: null,
        },
      ],
      'ko',
    );

    expect(result).toEqual({
      label: '디젤 지게차',
      to: '/danh-muc-san-pham/dizel-jigecha',
    });
  });
});

describe('resolveCategoryTranslation', () => {
  it('prefers the exact locale translation before falling back to the first item', () => {
    const result = resolveCategoryTranslation(
      {
        id: 15,
        translations: [
          { locale: 'en', name: 'Diesel Forklift', slug: 'diesel-forklift' },
          { locale: 'ko', name: '디젤 지게차', slug: 'dizel-jigecha' },
        ],
      },
      'ko',
    );

    expect(result).toEqual({
      locale: 'ko',
      name: '디젤 지게차',
      slug: 'dizel-jigecha',
    });
  });
});

describe('resolveProductCategoryLink', () => {
  it('returns a locale-aware category badge link', () => {
    const result = resolveProductCategoryLink(
      {
        id: 21,
        translations: [
          { locale: 'en', name: 'Diesel Forklift', slug: 'diesel-forklift' },
          { locale: 'ko', name: '디젤 지게차', slug: 'dizel-jigecha' },
        ],
      },
      'ko',
    );

    expect(result).toEqual({
      label: '디젤 지게차',
      to: '/danh-muc-san-pham/dizel-jigecha',
    });
  });
});
