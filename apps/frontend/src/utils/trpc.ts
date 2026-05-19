import { createTRPCProxyClient, httpBatchLink } from '@trpc/client';
import { ensureUniversalFetch } from '~/utils/trpcFetch';

// Đường dẫn mặc định đến tRPC API
const apiUrl = process.env.NUXT_PUBLIC_TRPC_API_URL || '/api/trpc';
const universalFetch = ensureUniversalFetch();

// Tạo tRPC client
export const client = createTRPCProxyClient<any>({
  links: [
    httpBatchLink({
      url: apiUrl,
      // Bao gồm cookie trong request (quan trọng cho authentication)
      fetch(url, options) {
        return universalFetch(url, {
          ...options,
          credentials: 'include',
        });
      },
    }),
  ],
});
