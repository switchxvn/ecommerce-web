import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ref } from 'vue';

import en from '../i18n/locales/en.json';
import ko from '../i18n/locales/ko.json';
import viLocale from '../i18n/locales/vi.json';

vi.mock('@vueuse/core', () => ({
  useLocalStorage: vi.fn(() => ref('vi')),
}));

vi.mock('./useTrpc', () => ({
  useTrpc: () => ({
    language: {
      getDefaultLanguage: { query: vi.fn(async () => ({ code: 'vi' })) },
      getLanguages: { query: vi.fn(async () => []) },
      getAllTranslations: {
        query: vi.fn(async () => ({
          products: {
            quickPurchase: 'products.quickPurchase',
            requestPrice: 'products.requestPrice',
          },
        })),
      },
    },
  }),
}));

const HOME_CRITICAL_KEYS = [
  'common.sale',
  'errors.failed_to_load',
  'gallery.emptyDescription',
  'gallery.fetchError',
  'gallery.noImages',
  'gallery.noImagesDescription',
  'gallery.noImagesFound',
  'home.latest_posts',
  'home.no_posts',
  'news.no_posts',
  'news.viewAll',
  'products.contactUs',
  'products.no_featured_products',
  'products.tierDiscounts.title',
  'products.viewAll',
  'tickets.ticketType',
] as const;

const getNestedValue = (source: Record<string, any>, key: string) =>
  key.split('.').reduce<any>((value, part) => value?.[part], source);

describe('useLocalization', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('returns bundled translations before async initialization completes', async () => {
    const { useLocalization } = await import('./useLocalization');

    const { t } = useLocalization();

    expect(t('products.contactUs')).toBe('Liên hệ tư vấn');
  });

  it('ignores db values that only repeat the translation key path', async () => {
    const { useLocalization } = await import('./useLocalization');

    const { t, initializeLocalization } = useLocalization();
    await initializeLocalization();

    expect(t('products.quickPurchase')).toBe('Mua hàng nhanh');
    expect(t('products.requestPrice')).toBe('Yêu cầu báo giá');
  });

  it('falls back to bundled locale strings when runtime state misses a key', async () => {
    const { useLocalization } = await import('./useLocalization');

    const localization = useLocalization();
    localization.translations.value.vi = {
      products: {
        contactUs: 'Liên hệ tư vấn',
      },
    } as any;

    expect(localization.t('products.shareProduct')).toBe('Chia sẻ sản phẩm');
    expect(localization.t('products.tableOfContents')).toBe('Nội dung chính');
  });

  it('keeps bundled locale lookup resilient when runtime data is malformed', async () => {
    const { useLocalization } = await import('./useLocalization');

    const localization = useLocalization();
    localization.translations.value.vi = {
      default: {
        products: {
          quickPurchase: 'products.quickPurchase',
        },
      },
    } as any;

    expect(localization.t('language')).toBe('Ngôn ngữ');
    expect(localization.t('products.quickPurchase')).toBe('Mua hàng nhanh');
  });
});

describe('home locale coverage', () => {
  it.each([
    ['vi', viLocale],
    ['en', en],
    ['ko', ko],
  ])('includes critical home-page keys for %s', (_, messages) => {
    for (const key of HOME_CRITICAL_KEYS) {
      expect(getNestedValue(messages as Record<string, any>, key), key).toEqual(expect.any(String));
    }
  });
});
