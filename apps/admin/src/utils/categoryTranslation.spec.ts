import { describe, expect, it } from 'vitest'

import {
  createEmptyCategoryTranslation,
  normalizeCategoryTranslation,
  withSeoFallbacks,
} from './categoryTranslation'

describe('categoryTranslation utils', () => {
  it('creates an empty translation with SEO fields', () => {
    expect(createEmptyCategoryTranslation()).toEqual({
      name: '',
      slug: '',
      description: '',
      metaTitle: '',
      metaDescription: '',
      metaKeywords: '',
      ogTitle: '',
      ogDescription: '',
      ogImage: '',
      canonicalUrl: '',
    })
  })

  it('normalizes partial translations without dropping SEO values', () => {
    expect(normalizeCategoryTranslation({
      name: 'Xe nâng điện',
      slug: 'xe-nang-dien',
      metaTitle: 'Meta title',
      metaDescription: 'Meta description',
      canonicalUrl: 'https://example.com/xe-nang-dien',
    })).toEqual({
      name: 'Xe nâng điện',
      slug: 'xe-nang-dien',
      description: '',
      metaTitle: 'Meta title',
      metaDescription: 'Meta description',
      metaKeywords: '',
      ogTitle: '',
      ogDescription: '',
      ogImage: '',
      canonicalUrl: 'https://example.com/xe-nang-dien',
    })
  })

  it('fills OG title and description from meta fields when they are blank', () => {
    expect(withSeoFallbacks({
      ...createEmptyCategoryTranslation(),
      metaTitle: 'Danh mục xe nâng điện',
      metaDescription: 'Mô tả SEO cho danh mục xe nâng điện',
      ogTitle: '   ',
      ogDescription: '',
    })).toEqual({
      ...createEmptyCategoryTranslation(),
      metaTitle: 'Danh mục xe nâng điện',
      metaDescription: 'Mô tả SEO cho danh mục xe nâng điện',
      ogTitle: 'Danh mục xe nâng điện',
      ogDescription: 'Mô tả SEO cho danh mục xe nâng điện',
    })
  })

  it('normalizes null SEO values into empty strings', () => {
    expect(normalizeCategoryTranslation({
      metaTitle: null as unknown as string,
      metaDescription: null as unknown as string,
      ogTitle: null as unknown as string,
      ogDescription: null as unknown as string,
      canonicalUrl: null as unknown as string,
    })).toEqual({
      ...createEmptyCategoryTranslation(),
      metaTitle: '',
      metaDescription: '',
      ogTitle: '',
      ogDescription: '',
      canonicalUrl: '',
    })
  })
})
