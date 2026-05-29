import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const useNuxtAppMock = vi.fn(() => ({
  $gtag: undefined,
  $fbq: undefined,
  $trackEvent: undefined,
  $trackConversion: undefined,
}));

describe('useTracking', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    vi.stubGlobal('useNuxtApp', () => useNuxtAppMock());
    (globalThis as any).window = {
      location: { href: 'https://mgavietnam.com/products/demo' },
      dataLayer: [],
    };
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    delete (globalThis as any).window;
  });

  it('pushes a page_view event to dataLayer when gtag is unavailable', async () => {
    const { useTracking } = await import('./useTracking');

    useTracking().trackPageView('Demo Page', 'https://mgavietnam.com/products/demo');

    expect((globalThis as any).window.dataLayer).toContainEqual({
      event: 'page_view',
      page_title: 'Demo Page',
      page_location: 'https://mgavietnam.com/products/demo',
    });
  });
});
