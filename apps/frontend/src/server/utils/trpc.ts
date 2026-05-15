import { useRuntimeConfig } from '#imports';
import type { H3Event } from 'h3';

export async function fetchTrpcQuery<T>(event: H3Event, procedure: string, input?: unknown): Promise<T> {
  const config = useRuntimeConfig(event);
  const response = await $fetch<unknown>(`${config.public.apiBase}/api/trpc/${procedure}`, {
    query: {
      batch: '1',
      input: JSON.stringify({ 0: input ?? null }),
    },
    headers: getForwardedHeaders(event),
  });

  const result = Array.isArray(response) ? response[0] : response;
  const data = (result as any)?.result?.data;

  if (data?.json !== undefined) {
    return data.json as T;
  }

  return data as T;
}

function getForwardedHeaders(event: H3Event): Record<string, string> {
  const headers = event.node.req.headers;
  const forwarded: Record<string, string> = {};

  if (typeof headers.cookie === 'string') {
    forwarded.cookie = headers.cookie;
  }

  if (typeof headers['user-agent'] === 'string') {
    forwarded['user-agent'] = headers['user-agent'];
  }

  if (typeof headers.host === 'string') {
    forwarded.host = headers.host;
  }

  return forwarded;
}
