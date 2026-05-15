import { useRequestURL, useRuntimeConfig } from '#imports';
import { createTRPCProxyClient, httpBatchLink } from '@trpc/client';
import type { AppRouter } from '../types/trpc';
import { ensureUniversalFetch } from '../utils/trpcFetch';
import { isLocalRuntimeUrl, joinUrl } from '../utils/runtimeOrigin';

export default defineNuxtPlugin(async () => {
  const universalFetch = ensureUniversalFetch();

  const config = useRuntimeConfig();
  const requestOrigin = process.server ? useRequestURL().origin : '';
  const baseUrl = process.server
    ? (isLocalRuntimeUrl(config.public.apiBase) ? requestOrigin : config.public.apiBase)
    : '';

  // Cache session ID to prevent creating new ones on every request
  let cachedSessionId: string | null = null;
  
  const getOrCreateSessionId = (): string => {
    if (cachedSessionId) {
      return cachedSessionId;
    }
    
    if (typeof window !== 'undefined') {
      cachedSessionId = localStorage.getItem('cart_session_id');
      if (!cachedSessionId) {
        cachedSessionId = `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        localStorage.setItem('cart_session_id', cachedSessionId);
      }
    }
    
    return cachedSessionId || '';
  };

  /**
   * createTRPCNuxtClient adds a `useQuery` composable
   * built on top of `useAsyncData`.
   */
  const client = createTRPCProxyClient<AppRouter>({
    links: [
      httpBatchLink({
        url: baseUrl ? joinUrl(baseUrl, '/api/trpc') : '/api/trpc',
        headers() {
          const headers: Record<string, string> = {};
          
          // Add authorization token if available
          if (typeof window !== 'undefined') {
            const token = localStorage.getItem('accessToken');
            if (token) {
              headers.Authorization = `Bearer ${token}`;
            }
            
            // Use cached session ID
            const sessionId = getOrCreateSessionId();
            if (sessionId) {
              headers['x-session-id'] = sessionId;
            }
          }
          
          return headers;
        },
        fetch(url, options) {
          const timeoutSignal =
            typeof AbortSignal !== 'undefined' && typeof AbortSignal.timeout === 'function'
              ? AbortSignal.timeout(30000)
              : options?.signal;

          return universalFetch(url, {
            ...options,
            signal: timeoutSignal,
            credentials: 'include',
          }).catch(error => {
            console.error('TRPC fetch error:', error);
            throw error;
          });
        },
      }),
    ],
  });

  return {
    provide: {
      trpc: client,
    },
  };
});
