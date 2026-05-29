import { resolveLegacyRedirect, type LegacyRedirectResult } from '../../utils/legacyRedirects';

export function resolveLegacyRedirectLocation(requestPath: string): LegacyRedirectResult | null {
  const requestUrl = new URL(requestPath, 'https://mgavietnam.com');
  const redirect = resolveLegacyRedirect(requestUrl.pathname);

  if (!redirect) {
    return null;
  }

  const search = requestUrl.search || '';

  return {
    destination: `${redirect.destination}${search}`,
    statusCode: redirect.statusCode,
  };
}
