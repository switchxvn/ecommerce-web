import { normalizeLocaleCode } from './locale';
import { getLocalizedRoute } from './routes';

interface CategoryTranslationLike {
  locale?: string | null;
  name?: string | null;
  slug?: string | null;
}

interface CategoryLike {
  id: number;
  translations?: CategoryTranslationLike[] | null;
  parent?: CategoryLike | null;
}

interface BreadcrumbCategoryLink {
  label: string;
  to: string;
}

export const resolveCategoryTranslation = (
  category: CategoryLike | null | undefined,
  locale: string,
): CategoryTranslationLike | null => {
  if (!category?.translations?.length) {
    return null;
  }

  const normalizedLocale = normalizeLocaleCode(locale);

  return (
    category.translations.find(
      (translation) => normalizeLocaleCode(translation.locale, 'vi') === normalizedLocale,
    ) ||
    category.translations[0] ||
    null
  );
};

export const resolveProductCategoryLink = (
  category: CategoryLike | null | undefined,
  locale: string,
): BreadcrumbCategoryLink | null => {
  const routeLocale = normalizeLocaleCode(locale) === 'en' ? 'en' : 'vi';
  const translation = resolveCategoryTranslation(category, locale);

  if (!translation?.slug || !translation.name) {
    return null;
  }

  return {
    label: translation.name,
    to: getLocalizedRoute('CATEGORY_DETAIL', routeLocale, { slug: translation.slug }),
  };
};

export const resolveProductBreadcrumbCategory = (
  categories: CategoryLike[] | null | undefined,
  locale: string,
): BreadcrumbCategoryLink | null => {
  if (!categories?.length) {
    return null;
  }

  const routeLocale = normalizeLocaleCode(locale) === 'en' ? 'en' : 'vi';

  for (const category of categories) {
    const parentTranslation = resolveCategoryTranslation(category.parent, locale);
    if (parentTranslation?.slug && parentTranslation.name) {
      return {
        label: parentTranslation.name,
        to: getLocalizedRoute('CATEGORY_DETAIL', routeLocale, { slug: parentTranslation.slug }),
      };
    }

    const categoryLink = resolveProductCategoryLink(category, locale);
    if (categoryLink) {
      return categoryLink;
    }
  }

  return null;
};
