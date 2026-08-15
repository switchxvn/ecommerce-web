import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useAdvertisingPopup } from './useAdvertisingPopup';
import { useTrpc } from './useTrpc';

vi.mock('./useTrpc', () => ({
  useTrpc: vi.fn(),
}));

const validCampaign = {
  id: 1,
  name: 'Summer campaign',
  title: 'Summer sale',
  content: 'Save on selected products.',
  ctaLabel: 'Shop now',
  ctaUrl: '/sale',
  isActive: true,
  startsAt: new Date('2026-08-01T00:00:00.000Z'),
  endsAt: null,
};

const query = vi.fn();
const mockedUseTrpc = vi.mocked(useTrpc);

describe('useAdvertisingPopup', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    sessionStorage.clear();
    query.mockReset();
    mockedUseTrpc.mockReturnValue({
      advertisingPopup: { getActive: { query } },
    } as never);
  });

  it('writes the session marker before showing a valid campaign', async () => {
    query.mockResolvedValue(validCampaign);
    const popup = useAdvertisingPopup();
    const setItem = vi
      .spyOn(Storage.prototype, 'setItem')
      .mockImplementation(() => {
        expect(popup.shouldShow.value).toBe(false);
      });

    await popup.initialize();

    expect(setItem).toHaveBeenCalledWith('advertising-popup-shown', 'true');
    expect(popup.campaign.value).toEqual(validCampaign);
    expect(popup.shouldShow.value).toBe(true);
    expect(popup.isLoading.value).toBe(false);
  });

  it('skips the API when the session marker exists', async () => {
    sessionStorage.setItem('advertising-popup-shown', 'true');
    const popup = useAdvertisingPopup();

    await popup.initialize();

    expect(query).not.toHaveBeenCalled();
    expect(popup.shouldShow.value).toBe(false);
  });

  it('closes the popup without removing the marker', async () => {
    query.mockResolvedValue(validCampaign);
    const popup = useAdvertisingPopup();
    await popup.initialize();

    popup.close();

    expect(popup.shouldShow.value).toBe(false);
    expect(sessionStorage.getItem('advertising-popup-shown')).toBe('true');
  });

  it('does not show when no campaign is active', async () => {
    query.mockResolvedValue(null);
    const popup = useAdvertisingPopup();

    await expect(popup.initialize()).resolves.toBeUndefined();

    expect(popup.campaign.value).toBeNull();
    expect(popup.shouldShow.value).toBe(false);
  });

  it.each([
    { ...validCampaign, id: 0 },
    { ...validCampaign, id: Number.NaN },
    { ...validCampaign, name: '' },
    { ...validCampaign, name: undefined },
    { ...validCampaign, title: '   ' },
    { ...validCampaign, content: '' },
    { ...validCampaign, ctaLabel: '' },
    { ...validCampaign, ctaUrl: 'javascript:alert(1)' },
    { ...validCampaign, ctaUrl: '//evil.example/path' },
    { ...validCampaign, ctaUrl: String.raw`/\evil.example/path` },
    { ...validCampaign, ctaUrl: String.raw`/sale\checkout` },
    { ...validCampaign, ctaUrl: 'http://example.com/sale' },
    { ...validCampaign, isActive: false },
    { ...validCampaign, isActive: 'true' },
    { ...validCampaign, startsAt: 'not-a-date' },
    { ...validCampaign, startsAt: 123 },
    { ...validCampaign, startsAt: undefined },
    { ...validCampaign, endsAt: '2026-99-99' },
    { ...validCampaign, endsAt: {} },
    { ...validCampaign, endsAt: undefined },
    (({ startsAt: _startsAt, ...campaign }) => campaign)(validCampaign),
    (({ endsAt: _endsAt, ...campaign }) => campaign)(validCampaign),
  ])('does not show an invalid campaign response', async (campaign) => {
    query.mockResolvedValue(campaign);
    const popup = useAdvertisingPopup();

    await popup.initialize();

    expect(popup.campaign.value).toBeNull();
    expect(popup.shouldShow.value).toBe(false);
    expect(sessionStorage.getItem('advertising-popup-shown')).toBeNull();
  });

  it('accepts an absolute HTTPS CTA URL', async () => {
    query.mockResolvedValue({
      ...validCampaign,
      ctaUrl: 'https://example.com/sale',
    });
    const popup = useAdvertisingPopup();

    await popup.initialize();

    expect(popup.shouldShow.value).toBe(true);
  });

  it('swallows API errors and keeps the popup hidden', async () => {
    query.mockRejectedValue(new Error('network failure'));
    const popup = useAdvertisingPopup();

    await expect(popup.initialize()).resolves.toBeUndefined();

    expect(popup.shouldShow.value).toBe(false);
    expect(popup.error.value).toBeInstanceOf(Error);
    expect(popup.isLoading.value).toBe(false);
  });

  it('skips the API and stays hidden when reading storage fails', async () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('storage denied');
    });
    const popup = useAdvertisingPopup();

    await expect(popup.initialize()).resolves.toBeUndefined();

    expect(query).not.toHaveBeenCalled();
    expect(popup.shouldShow.value).toBe(false);
  });

  it('stays hidden when writing the marker fails', async () => {
    query.mockResolvedValue(validCampaign);
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('storage full');
    });
    const popup = useAdvertisingPopup();

    await expect(popup.initialize()).resolves.toBeUndefined();

    expect(popup.campaign.value).toEqual(validCampaign);
    expect(popup.shouldShow.value).toBe(false);
  });

  it('deduplicates concurrent initialization calls', async () => {
    let resolveQuery!: (value: typeof validCampaign) => void;
    query.mockReturnValue(new Promise((resolve) => (resolveQuery = resolve)));
    const popup = useAdvertisingPopup();

    const first = popup.initialize();
    const second = popup.initialize();
    resolveQuery(validCampaign);
    await Promise.all([first, second]);

    expect(query).toHaveBeenCalledTimes(1);
    expect(popup.shouldShow.value).toBe(true);
  });

  it('does not repeat across composable instances in the same session', async () => {
    query.mockResolvedValue(validCampaign);
    const first = useAdvertisingPopup();
    await first.initialize();
    const second = useAdvertisingPopup();

    await second.initialize();

    expect(query).toHaveBeenCalledTimes(1);
    expect(second.shouldShow.value).toBe(false);
  });

  it('does not access storage or the API during SSR', async () => {
    const getItem = vi.spyOn(Storage.prototype, 'getItem');
    vi.stubGlobal('window', undefined);

    try {
      const popup = useAdvertisingPopup();
      await popup.initialize();

      expect(getItem).not.toHaveBeenCalled();
      expect(query).not.toHaveBeenCalled();
      expect(popup.shouldShow.value).toBe(false);
    } finally {
      vi.unstubAllGlobals();
    }
  });
});
