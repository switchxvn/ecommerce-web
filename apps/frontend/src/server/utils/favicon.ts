import type { RouterOutput } from '../../types/trpc';
import { buildFaviconLinks as buildSharedFaviconLinks } from '../../utils/favicon';

type LogoOutput = RouterOutput['logo']['getActiveLogo'];

export function resolveServerFaviconHref(
  logo: LogoOutput,
  defaultFavicon = '/favicon.ico',
  preferStatic = true,
): string {
  if (preferStatic) {
    return defaultFavicon;
  }

  if (!logo || logo.type !== 'favicon') {
    return defaultFavicon;
  }

  return logo.lightModeUrl || logo.darkModeUrl || defaultFavicon;
}

export function buildFaviconLinks(url: string) {
  return buildSharedFaviconLinks(url);
}
