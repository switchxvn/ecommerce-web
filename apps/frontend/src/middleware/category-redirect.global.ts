import { resolveLegacyRedirect } from '../utils/legacyRedirects';

export default defineNuxtRouteMiddleware((to) => {
  const redirect = resolveLegacyRedirect(to.path);

  if (!redirect) {
    return;
  }

  return navigateTo(
    {
      path: redirect.destination,
      query: to.query,
      hash: to.hash,
    },
    { redirectCode: redirect.statusCode },
  );
});
