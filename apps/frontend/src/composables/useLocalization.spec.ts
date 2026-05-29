import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ref } from 'vue';

import en from '../i18n/locales/en.json';
import ko from '../i18n/locales/ko.json';
import viLocale from '../i18n/locales/vi.json';

const mockGetDefaultLanguage = vi.fn(async () => ({ code: 'vi' }));
const mockGetLanguages = vi.fn(async () => []);
const mockGetAllTranslations = vi.fn(async () => ({
  products: {
    quickPurchase: 'products.quickPurchase',
    requestPrice: 'products.requestPrice',
  },
}));

vi.mock('@vueuse/core', () => ({
  useLocalStorage: vi.fn(() => ref('vi')),
}));

vi.mock('./useTrpc', () => ({
  useTrpc: () => ({
    language: {
      getDefaultLanguage: { query: mockGetDefaultLanguage },
      getLanguages: { query: mockGetLanguages },
      getAllTranslations: { query: mockGetAllTranslations },
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

const SERVICE_LISTING_KEYS = [
  'services.showing',
  'services.items',
  'services.sortBy',
  'sort.newest',
  'sort.oldest',
  'sort.title_asc',
  'sort.title_desc',
] as const;

const getNestedValue = (source: Record<string, any>, key: string) =>
  key.split('.').reduce<any>((value, part) => value?.[part], source);

describe('useLocalization', () => {
  beforeEach(() => {
    vi.resetModules();
    mockGetDefaultLanguage.mockResolvedValue({ code: 'vi' });
    mockGetLanguages.mockResolvedValue([]);
    mockGetAllTranslations.mockResolvedValue({
      products: {
        quickPurchase: 'products.quickPurchase',
        requestPrice: 'products.requestPrice',
      },
    });
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

  it('returns an empty string for missing keys so UI literal fallbacks can render', async () => {
    const { useLocalization } = await import('./useLocalization');

    const localization = useLocalization();

    expect(localization.t('products.missingKey')).toBe('');
  });

  it('resolves service listing keys from bundled translations without inline fallbacks', async () => {
    const { useLocalization } = await import('./useLocalization');

    const localization = useLocalization();

    expect(localization.t('services.showing')).toBe('Đang hiển thị');
    expect(localization.t('services.items')).toBe('dịch vụ');
    expect(localization.t('services.sortBy')).toBe('Sắp xếp theo');
    expect(localization.t('sort.newest')).toBe('Mới nhất');
  });

  it('normalizes runtime locale codes returned by the language API', async () => {
    mockGetDefaultLanguage.mockResolvedValue({ code: 'vi-VN' });
    mockGetLanguages.mockResolvedValue([
      {
        id: 1,
        code: 'vi-VN',
        name: 'Vietnamese',
        nativeName: 'Tiếng Việt',
        flagCode: 'vn',
        isActive: true,
        isDefault: true,
      },
      {
        id: 2,
        code: 'en-US',
        name: 'English',
        nativeName: 'English',
        flagCode: 'us',
        isActive: true,
        isDefault: false,
      },
    ]);

    const { useLocalization } = await import('./useLocalization');

    const localization = useLocalization();
    await localization.initializeLocalization();

    expect(localization.locale.value).toBe('vi');
    expect(localization.locales.value.map((language) => language.code)).toEqual(['vi', 'en']);
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

describe('service listing locale coverage', () => {
  it.each([
    ['vi', viLocale],
    ['en', en],
    ['ko', ko],
  ])('includes service listing keys for %s', (_, messages) => {
    for (const key of SERVICE_LISTING_KEYS) {
      expect(getNestedValue(messages as Record<string, any>, key), key).toEqual(expect.any(String));
    }
  });
});
