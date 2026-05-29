import { describe, expect, it } from 'vitest';
import { resolveAboutSectionComponentName, translateAboutSections } from './aboutPage';

describe('about page utilities', () => {
  it('resolves corporate section types to concrete components', () => {
    expect(resolveAboutSectionComponentName({ type: 'hero' })).toBe('AboutHeroSection');
    expect(resolveAboutSectionComponentName({ type: 'content' })).toBe('AboutContentSection');
    expect(resolveAboutSectionComponentName({ type: 'features' })).toBe('AboutFeaturesSection');
    expect(resolveAboutSectionComponentName({ type: 'tourism_gallery' })).toBe('TourismGallerySection');
    expect(
      resolveAboutSectionComponentName({ type: 'content', componentName: 'CustomAboutSection' }),
    ).toBe('CustomAboutSection');
  });

  it('prefers the active locale translation and falls back to english content', () => {
    const translated = translateAboutSections(
      [
        {
          id: 2,
          type: 'content',
          componentName: 'AboutContentSection',
          isActive: true,
          settings: { imageUrl: '/images/about/mga.jpg' },
          translations: [
            {
              locale: 'en',
              title: 'About MGA Vietnam',
              subtitle: 'Official forklift solutions',
              content: '<p>English content</p>',
              data: { highlights: [{ title: 'Forklifts' }] },
            },
            {
              locale: 'vi',
              title: 'Giới thiệu MGA Việt Nam',
              subtitle: 'Giải pháp xe nâng chính hãng',
              content: '<p>Nội dung tiếng Việt</p>',
              data: { highlights: [{ title: 'Xe nâng' }] },
            },
          ],
        },
        {
          id: 3,
          type: 'features',
          componentName: 'AboutFeaturesSection',
          isActive: true,
          settings: {},
          translations: [
            {
              locale: 'en',
              title: 'Service commitments',
              subtitle: 'Fallback subtitle',
              content: '<p>Fallback content</p>',
              data: { items: [{ title: 'Maintenance' }] },
            },
          ],
        },
      ],
      'vi',
    );

    expect(translated[0]).toMatchObject({
      title: 'Giới thiệu MGA Việt Nam',
      subtitle: 'Giải pháp xe nâng chính hãng',
      content: '<p>Nội dung tiếng Việt</p>',
      data: { highlights: [{ title: 'Xe nâng' }] },
    });

    expect(translated[1]).toMatchObject({
      title: 'Service commitments',
      subtitle: 'Fallback subtitle',
      content: '<p>Fallback content</p>',
      data: { items: [{ title: 'Maintenance' }] },
    });
  });
});
