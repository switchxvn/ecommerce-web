import { useNuxtApp } from 'nuxt/app';
import { createTRPCProxyClient, httpBatchLink } from '@trpc/client';
import { ensureUniversalFetch } from '~/utils/trpcFetch';

/**
 * Composable for accessing the tRPC client
 * This ensures runtime config is accessed within the Nuxt lifecycle
 */
export const useTrpc = () => {
  const { $trpc } = useNuxtApp();
  return $trpc as any;
};

/**
 * Tạo tRPC client với cấu hình tùy chỉnh
 */
export const createTRPCClient = () => {
  const apiUrl = process.env.NUXT_PUBLIC_TRPC_API_URL || '/api/trpc';
  const universalFetch = ensureUniversalFetch();
  
  return createTRPCProxyClient<any>({
    links: [
      httpBatchLink({
        url: apiUrl,
        fetch(url, options) {
          return universalFetch(url, {
            ...options,
            credentials: 'include',
            headers: {
              ...options?.headers,
              'Accept': 'application/json',
              'Content-Type': 'application/json',
              'Cache-Control': 'no-cache, no-store',
            },
            // Điều này tương đương với timeout
            signal: options?.signal || AbortSignal.timeout(30000),
          });
        },
      }),
    ],
  });
}; 
