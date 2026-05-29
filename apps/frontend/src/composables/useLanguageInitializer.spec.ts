import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('./useLocalization', () => ({
  useLocalization: () => ({
    initializeLocalization: vi.fn(async () => undefined),
  }),
}));

describe('useLanguageInitializer', () => {
  beforeEach(async () => {
    vi.resetModules();
  });

  it('returns a defined payload for useAsyncData callers', async () => {
    const { useLanguageInitializer } = await import('./useLanguageInitializer');

    const { initializeOnce } = useLanguageInitializer();

    await expect(initializeOnce()).resolves.toEqual({ initialized: true });
    await expect(initializeOnce()).resolves.toEqual({ initialized: true });
  });
});
