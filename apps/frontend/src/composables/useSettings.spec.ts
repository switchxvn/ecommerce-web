import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const query = vi.fn(async () => []);
const queryByKey = vi.fn(async () => null);

vi.mock('./useTrpc', () => ({
  useTrpc: () => ({
    settings: {
      getPublicSettings: { query },
      getPublicSettingByKey: { query: queryByKey },
    },
  }),
}));

describe('useSettings', () => {
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

  it('does not auto-fetch public settings during SSR composable creation', async () => {
    const { useSettings } = await import('./useSettings');

    useSettings();

    expect(query).not.toHaveBeenCalled();
  });

  it('returns the cached public setting value without querying by key again', async () => {
    (process as any).server = false;
    (process as any).client = true;
    query.mockResolvedValueOnce([
      { key: 'google_tag_manager_id', value: 'GTM-API123' },
    ]);

    const { useSettings } = await import('./useSettings');
    const { getPublicSettingValueByKey } = useSettings();

    const value = await getPublicSettingValueByKey('google_tag_manager_id', '');

    expect(value).toBe('GTM-API123');
    expect(query).toHaveBeenCalledTimes(1);
    expect(queryByKey).not.toHaveBeenCalled();
  });
});
