import { defineEventHandler, getRequestURL, sendRedirect } from 'h3';
import { resolveLegacyRedirectLocation } from '../utils/legacy-redirect';

export default defineEventHandler((event) => {
  const redirect = resolveLegacyRedirectLocation(getRequestURL(event).toString());

  if (!redirect) {
    return;
  }

  return sendRedirect(event, redirect.destination, redirect.statusCode);
});
