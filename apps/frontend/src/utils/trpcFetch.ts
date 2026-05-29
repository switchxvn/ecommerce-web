import {
  fetch as nativeFetch,
  Headers as NativeHeaders,
  Request as NativeRequest,
  Response as NativeResponse,
} from 'node-fetch-native';

export function ensureUniversalFetch(): typeof fetch {
  if (typeof globalThis.fetch === 'function') {
    return globalThis.fetch;
  }

  Object.assign(globalThis, {
    fetch: nativeFetch,
    Headers: globalThis.Headers || NativeHeaders,
    Request: globalThis.Request || NativeRequest,
    Response: globalThis.Response || NativeResponse,
  });

  return globalThis.fetch;
}
