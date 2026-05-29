export interface CategoryTranslationFormValues {
  name: string
  slug: string
  description: string
  metaTitle: string
  metaDescription: string
  metaKeywords: string
  ogTitle: string
  ogDescription: string
  ogImage: string
  canonicalUrl: string
}

export const createEmptyCategoryTranslation = (): CategoryTranslationFormValues => ({
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

export const normalizeCategoryTranslation = (
  translation?: Partial<CategoryTranslationFormValues> | null,
): CategoryTranslationFormValues => {
  const merged = {
    ...createEmptyCategoryTranslation(),
    ...translation,
  }

  return Object.fromEntries(
    Object.entries(merged).map(([key, value]) => [key, value ?? '']),
  ) as CategoryTranslationFormValues
}

export const withSeoFallbacks = (
  translation: CategoryTranslationFormValues,
): CategoryTranslationFormValues => ({
  ...translation,
  ogTitle: translation.ogTitle.trim() || translation.metaTitle.trim(),
  ogDescription: translation.ogDescription.trim() || translation.metaDescription.trim(),
})
