import { defineEventHandler, getRequestURL, proxyRequest } from 'h3';
import { useRuntimeConfig } from '#imports';

import { buildTrpcProxyTarget } from '../../utils/trpcProxy';

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  const requestUrl = getRequestURL(event);
  const target = buildTrpcProxyTarget(
    config.public.apiBase,
    `${requestUrl.pathname}${requestUrl.search}`,
  );

  return proxyRequest(event, target);
});
