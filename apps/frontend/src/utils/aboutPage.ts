export interface AboutSectionTranslation {
  locale?: string | null;
  title?: string | null;
  subtitle?: string | null;
  content?: string | null;
  data?: Record<string, any> | null;
}

export interface AboutSectionRecord {
  id?: number;
  type?: string | null;
  componentName?: string | null;
  settings?: Record<string, any> | null;
  isActive?: boolean;
  translations?: AboutSectionTranslation[] | null;
  title?: string | null;
  subtitle?: string | null;
  content?: string | null;
  data?: Record<string, any> | null;
}

export const ABOUT_SECTION_COMPONENTS: Record<string, string> = {
  hero: 'AboutHeroSection',
  content: 'AboutContentSection',
  milestone: 'AboutMilestoneSection',
  team: 'AboutTeamSection',
  features: 'AboutFeaturesSection',
  tourism_hero: 'TourismHeroSection',
  tourism_features: 'TourismFeaturesSection',
  tourism_cultural: 'TourismCulturalSection',
  tourism_gallery: 'TourismGallerySection',
};

function resolveSectionTranslation(
  translations: AboutSectionTranslation[] | null | undefined,
  locale: string,
): AboutSectionTranslation {
  if (!Array.isArray(translations) || translations.length === 0) {
    return {};
  }

  return (
    translations.find((translation) => translation?.locale === locale) ||
    translations.find((translation) => translation?.locale === 'en') ||
    translations[0] ||
    {}
  );
}

export function resolveAboutSectionComponentName(section: Pick<AboutSectionRecord, 'type' | 'componentName'>): string | null {
  if (section.componentName) {
    return section.componentName;
  }

  if (!section.type) {
    return null;
  }

  return ABOUT_SECTION_COMPONENTS[section.type] || null;
}

export function translateAboutSections(
  sections: AboutSectionRecord[] | null | undefined,
  locale: string,
): AboutSectionRecord[] {
  if (!Array.isArray(sections)) {
    return [];
  }

  return sections
    .map((section) => {
      if (!section) {
        return null;
      }

      const translation = resolveSectionTranslation(section.translations, locale);

      return {
        ...section,
        title: translation.title || section.title || '',
        subtitle: translation.subtitle || section.subtitle || '',
        content: translation.content || section.content || '',
        data: translation.data || section.data || {},
      };
    })
    .filter((section): section is AboutSectionRecord => Boolean(section));
}
