import { navigateTo, useRuntimeConfig } from '#imports';
import { createTRPCProxyClient, httpBatchLink, TRPCClientError } from '@trpc/client';
import type { AppRouter } from '../types/trpc';

export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig();
  const baseUrl = process.server 
    ? config.public.apiBase 
    : '';

  // Custom error handler function
  const handleAuthError = (error: any) => {
    if (process.client && typeof window !== 'undefined') {
      const errorMessage = error?.message || '';
      const isExpiredToken = 
        errorMessage.includes('jwt expired') || 
        errorMessage.includes('token expired') ||
        errorMessage.includes('Invalid token') ||
        errorMessage.includes('Unauthorized') ||
        errorMessage.includes('Unauthenticated');
      
      if (isExpiredToken) {
        console.error('Token expired or invalid:', errorMessage);
        localStorage.removeItem('accessToken');
        if (!window.location.pathname.endsWith('/auth/login')) {
          navigateTo('/auth/login', { replace: true });
        }
      }
    }
  };

  // SSR handling - return mock client that does nothing
  if (process.server) {
    // Create mock client
    const mockClient = new Proxy({}, {
      get(_, property) {
        // Handle nested properties
        if (typeof property === 'string' && property !== 'then') {
          return new Proxy({}, {
            get(_, nestedProperty) {
              // For query and mutate methods
              if (nestedProperty === 'query' || nestedProperty === 'mutate') {
                return () => Promise.resolve(null);
              }
              
              // For other nested properties
              return new Proxy({}, {
                get() {
                  return () => Promise.resolve(null);
                }
              });
            }
          });
        }
        return undefined;
      }
    });

    return {
      provide: {
        trpc: mockClient
      }
    };
  }

  // Client-side TRPC client
  const client = createTRPCProxyClient<AppRouter>({
    links: [
      httpBatchLink({
        url: `${baseUrl}/api/trpc`,
        fetch: (url, options) => {
          // Use custom fetch to catch errors
          return fetch(url, options).then(response => {
            if (!response.ok) {
              // Xử lý lỗi HTTP response
              if (response.status === 401) {
                handleAuthError({ message: 'Unauthorized' });
              }
            }
            return response;
          }).catch(error => {
            // Xử lý lỗi fetch
            handleAuthError(error);
            throw error;
          });
        },
        headers() {
          // Only access localStorage when on client-side
          const headers: Record<string, string> = {};
          
          if (process.client && typeof window !== 'undefined') {
            const token = localStorage.getItem('accessToken');
            if (token) {
              headers.Authorization = `Bearer ${token}`;
            }
            
            // Add locale from localStorage to headers
            const locale = localStorage.getItem('locale') || 'en';
            headers['Accept-Language'] = locale;
            headers['X-Locale'] = locale;
            
            console.log('📤 tRPC request headers:', { locale, Authorization: !!token });
          }
          
          return headers;
        }
      }),
    ],
  });

  // Bắt lỗi ở mức toàn cục
  if (process.client) {
    window.addEventListener('unhandledrejection', (event) => {
      if (event.reason instanceof TRPCClientError) {
        handleAuthError(event.reason);
      }
    });
  }

  return {
    provide: {
      trpc: client,
    },
  };
});
