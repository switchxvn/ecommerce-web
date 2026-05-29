import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const initializeOnce = vi.fn(async () => ({ initialized: true }));
const defineNuxtPlugin = vi.fn((plugin: any) => plugin);

vi.mock('nuxt/app', () => ({
  defineNuxtPlugin,
}));

vi.mock('../composables/useLanguageInitializer', () => ({
  useLanguageInitializer: () => ({
    initializeOnce,
  }),
}));

describe('localization plugin', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    (process as any).server = true;
    (process as any).client = false;
  });

  afterEach(() => {
    delete (process as any).server;
    delete (process as any).client;
  });

  it('skips server-side localization initialization during SSR', async () => {
    const plugin = (await import('./localization')).default;

    await plugin({});

    expect(initializeOnce).not.toHaveBeenCalled();
  });
});
