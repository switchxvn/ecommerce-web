import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const fixturesDir = dirname(fileURLToPath(import.meta.url));

const provide = vi.fn();
const query = vi.fn(async () => []);
const useState = vi.fn((_: string, init: () => string | null) => {
  let value = init();
  return {
    get value() {
      return value;
    },
    set value(nextValue: string | null) {
      value = nextValue;
    },
  };
});

describe('gtm server plugin', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    vi.stubGlobal('defineNuxtPlugin', (plugin: any) => plugin);
    vi.stubGlobal('useState', useState);
    (process as any).server = true;
    (process as any).client = false;
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    delete (process as any).server;
    delete (process as any).client;
  });

  it('loads a valid GTM id from public settings and stores it in shared state', async () => {
    const plugin = (await import('./gtm.server')).default;
    const stateStore: Record<string, string | null> = {};

    useState.mockImplementation((key: string, init: () => string | null) => {
      if (!(key in stateStore)) {
        stateStore[key] = init();
      }

      return {
        get value() {
          return stateStore[key];
        },
        set value(value: string | null) {
          stateStore[key] = value;
        },
      };
    });

    query.mockResolvedValueOnce([
      { key: 'google_tag_manager_id', value: 'GTM-API123' },
    ]);

    await plugin({
      ssrContext: {},
      provide,
      $trpc: {
        settings: {
          getPublicSettings: {
            query,
          },
        },
      },
    });

    expect(query).toHaveBeenCalledTimes(1);
    expect(provide).toHaveBeenCalledWith('gtmId', 'GTM-API123');
    expect(stateStore['gtm-id']).toBe('GTM-API123');
    expect(useState).toHaveBeenCalled();
  });

  it('does not require delayed interaction flags to expose GTM state', async () => {
    const source = await readFile(resolve(fixturesDir, '../layouts/default.vue'), 'utf8');

    expect(source).not.toContain('shouldLoadTracking');
    expect(source).not.toContain('requestIdleCallback');
  });

  it('does not keep the old hardcoded GTM container id in frontend sources', async () => {
    const files = await Promise.all([
      readFile(resolve(fixturesDir, './gtm.server.ts'), 'utf8'),
      readFile(resolve(fixturesDir, '../composables/useGoogleAnalytics.ts'), 'utf8'),
    ]);

    expect(files.join('\n')).not.toContain('GTM-T89X4CKH');
  });
});
