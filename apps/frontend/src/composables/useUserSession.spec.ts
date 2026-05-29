import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const getSessionQuery = vi.fn();
const startSessionMutate = vi.fn();
const updateSessionMutate = vi.fn();
const endSessionMutate = vi.fn();

vi.mock('./useTrpc', () => ({
  useTrpc: () => ({
    userSession: {
      getSession: { query: getSessionQuery },
      startSession: { mutate: startSessionMutate },
      updateSession: { mutate: updateSessionMutate },
      endSession: { mutate: endSessionMutate },
    },
  }),
}));

vi.mock('@/stores/useUserStore', () => ({
  useUserStore: () => ({
    user: null,
  }),
}));

describe('useUserSession', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-05-29T03:00:00.000Z'));
    localStorage.clear();
    (process as any).client = true;
    (process as any).server = false;

    getSessionQuery.mockResolvedValue(null);
    startSessionMutate.mockResolvedValue({});
    updateSessionMutate.mockResolvedValue({});
    endSessionMutate.mockResolvedValue({});
  });

  afterEach(() => {
    vi.useRealTimers();
    delete (process as any).client;
    delete (process as any).server;
  });

  it('does not send updateSession requests during client-side session tracking', async () => {
    const { useUserSession } = await import('./useUserSession');

    const userSession = useUserSession();

    await userSession.initSession();
    vi.setSystemTime(new Date('2026-05-29T03:00:20.000Z'));
    userSession.trackPageView('/products');
    userSession.pingActivity();
    await Promise.resolve();
    await Promise.resolve();

    expect(startSessionMutate).toHaveBeenCalledTimes(1);
    expect(updateSessionMutate).not.toHaveBeenCalled();
  });
});
