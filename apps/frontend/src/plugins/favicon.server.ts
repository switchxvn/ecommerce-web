import { buildFaviconLinks } from '../server/utils/favicon';

export default defineNuxtPlugin(() => {
  const defaultFavicon = '/favicon.ico';

  useHead({
    link: buildFaviconLinks(defaultFavicon),
  });
});
