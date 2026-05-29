import { ensureUniversalFetch } from './trpcFetch';

describe('ensureUniversalFetch', () => {
  const originalFetch = globalThis.fetch;
  const originalHeaders = globalThis.Headers;
  const originalRequest = globalThis.Request;
  const originalResponse = globalThis.Response;

  afterEach(() => {
    if (originalFetch) {
      globalThis.fetch = originalFetch;
    } else {
      // @ts-expect-error test cleanup
      delete globalThis.fetch;
    }

    if (originalHeaders) {
      globalThis.Headers = originalHeaders;
    } else {
      // @ts-expect-error test cleanup
      delete globalThis.Headers;
    }

    if (originalRequest) {
      globalThis.Request = originalRequest;
    } else {
      // @ts-expect-error test cleanup
      delete globalThis.Request;
    }

    if (originalResponse) {
      globalThis.Response = originalResponse;
    } else {
      // @ts-expect-error test cleanup
      delete globalThis.Response;
    }
  });

  it('uses the existing global fetch when available', () => {
    const fetchMock = vi.fn();
    globalThis.fetch = fetchMock as typeof fetch;

    const resolvedFetch = ensureUniversalFetch();

    expect(resolvedFetch).toBe(fetchMock);
    expect(globalThis.fetch).toBe(fetchMock);
  });

  it('installs a fallback fetch implementation when global fetch is missing', () => {
    // @ts-expect-error test setup
    delete globalThis.fetch;
    // @ts-expect-error test setup
    delete globalThis.Headers;
    // @ts-expect-error test setup
    delete globalThis.Request;
    // @ts-expect-error test setup
    delete globalThis.Response;

    const resolvedFetch = ensureUniversalFetch();

    expect(typeof resolvedFetch).toBe('function');
    expect(globalThis.fetch).toBe(resolvedFetch);
    expect(globalThis.Headers).toBeDefined();
    expect(globalThis.Request).toBeDefined();
    expect(globalThis.Response).toBeDefined();
  });
});
