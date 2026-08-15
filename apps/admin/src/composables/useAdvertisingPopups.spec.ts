import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useAdvertisingPopups } from './useAdvertisingPopups';
import type { AdvertisingPopup } from '@/types/advertising-popup';

const trpc = vi.hoisted(() => ({
  advertisingPopup: {
    list: { query: vi.fn() },
    getActive: { query: vi.fn() },
    getById: { query: vi.fn() },
    create: { mutate: vi.fn() },
    update: { mutate: vi.fn() },
    setActive: { mutate: vi.fn() },
    delete: { mutate: vi.fn() },
  },
}));

vi.mock('./useTrpc', () => ({ useTrpc: () => trpc }));

const campaign = (id: number, isActive = false): AdvertisingPopup => ({
  id,
  name: `Campaign ${id}`,
  title: `Title ${id}`,
  content: 'Content',
  ctaLabel: 'Go',
  ctaUrl: '/go',
  isActive,
  startsAt: null,
  endsAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
});

const deferred = <T>() => {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
};

describe('useAdvertisingPopups', () => {
  beforeEach(() => vi.clearAllMocks());

  it('keeps global loading true until all concurrent operations settle', async () => {
    const first = deferred<AdvertisingPopup[]>();
    const second = deferred<AdvertisingPopup | null>();
    trpc.advertisingPopup.list.query.mockReturnValueOnce(first.promise);
    trpc.advertisingPopup.getActive.query.mockReturnValueOnce(second.promise);
    const state = useAdvertisingPopups();

    const listPromise = state.refresh();
    const activePromise = state.getActive();
    expect(state.loading.value).toBe(true);

    first.resolve([]);
    await listPromise;
    expect(state.loading.value).toBe(true);

    second.resolve(null);
    await activePromise;
    expect(state.loading.value).toBe(false);
  });

  it('tracks row mutation pending state and prevents duplicate mutation calls', async () => {
    const pending = deferred<AdvertisingPopup>();
    trpc.advertisingPopup.setActive.mutate.mockReturnValueOnce(pending.promise);
    const state = useAdvertisingPopups();

    const first = state.setActive(1, true);
    const duplicate = state.setActive(1, true);
    expect(state.isActionPending(1)).toBe(true);
    expect(trpc.advertisingPopup.setActive.mutate).toHaveBeenCalledTimes(1);

    pending.resolve(campaign(1, true));
    await expect(first).resolves.toMatchObject({ id: 1, isActive: true });
    await expect(duplicate).resolves.toMatchObject({ id: 1, isActive: true });
    expect(state.isActionPending(1)).toBe(false);
  });

  it('rejects activation of a different campaign while one activation is pending', async () => {
    const pending = deferred<AdvertisingPopup>();
    trpc.advertisingPopup.setActive.mutate.mockReturnValueOnce(pending.promise);
    const state = useAdvertisingPopups();

    const first = state.setActive(1, true);
    expect(state.isActivationPending.value).toBe(true);
    await expect(state.setActive(2, true)).rejects.toThrow(
      'Một thay đổi trạng thái khác đang được xử lý'
    );
    expect(trpc.advertisingPopup.setActive.mutate).toHaveBeenCalledTimes(1);

    pending.resolve(campaign(1, true));
    await first;
    expect(state.isActivationPending.value).toBe(false);
  });

  it('applies successful activation locally without a follow-up list request', async () => {
    trpc.advertisingPopup.list.query.mockResolvedValueOnce([
      campaign(1, true),
      campaign(2),
    ]);
    trpc.advertisingPopup.setActive.mutate.mockResolvedValueOnce(
      campaign(2, true)
    );
    const state = useAdvertisingPopups();
    await state.refresh();

    await state.setActive(2, true);

    expect(
      state.campaigns.value.map(({ id, isActive }) => ({ id, isActive }))
    ).toEqual([
      { id: 1, isActive: false },
      { id: 2, isActive: true },
    ]);
    expect(trpc.advertisingPopup.list.query).toHaveBeenCalledTimes(1);
  });

  it('filters a successfully deleted campaign locally without a follow-up list request', async () => {
    trpc.advertisingPopup.list.query.mockResolvedValueOnce([
      campaign(1),
      campaign(2),
    ]);
    trpc.advertisingPopup.delete.mutate.mockResolvedValueOnce({
      success: true,
    });
    const state = useAdvertisingPopups();
    await state.refresh();

    await state.remove(1);

    expect(state.campaigns.value.map((item) => item.id)).toEqual([2]);
    expect(trpc.advertisingPopup.list.query).toHaveBeenCalledTimes(1);
  });

  it('does not let a concurrent success clear a fetch error', async () => {
    const failedFetch = deferred<AdvertisingPopup[]>();
    const successfulMutation = deferred<AdvertisingPopup>();
    trpc.advertisingPopup.list.query.mockReturnValueOnce(failedFetch.promise);
    trpc.advertisingPopup.setActive.mutate.mockReturnValueOnce(
      successfulMutation.promise
    );
    const state = useAdvertisingPopups();
    const fetchPromise = state.refresh();
    const mutationPromise = state.setActive(1, true);

    failedFetch.reject(new Error('fetch failed'));
    await expect(fetchPromise).rejects.toThrow('fetch failed');
    successfulMutation.resolve(campaign(1, true));
    await mutationPromise;

    expect(state.error.value).toBe('fetch failed');
  });
});
