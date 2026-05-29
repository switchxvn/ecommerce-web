export function buildTrpcProxyTarget(apiBase: string, requestPath: string): string {
  const normalizedBase = apiBase.replace(/\/+$/, '');
  const normalizedPath = requestPath.startsWith('/') ? requestPath : `/${requestPath}`;

  return `${normalizedBase}${normalizedPath}`;
}
