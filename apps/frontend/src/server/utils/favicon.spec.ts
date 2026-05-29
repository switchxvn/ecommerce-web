import { describe, expect, it } from 'vitest';

import { buildFaviconLinks, resolveServerFaviconHref } from './favicon';

describe('resolveServerFaviconHref', () => {
  it('keeps the static favicon for SSR by default', () => {
    expect(
      resolveServerFaviconHref({
        type: 'favicon',
        lightModeUrl: 'https://cdn.example.com/favicon.png',
        darkModeUrl: null,
      }),
    ).toBe('/favicon.ico');
  });

  it('uses the favicon logo URL when the backend returns an active favicon', () => {
    expect(
      resolveServerFaviconHref({
        type: 'favicon',
        lightModeUrl: 'https://cdn.example.com/favicon.png',
        darkModeUrl: null,
      }, '/favicon.ico', false),
    ).toBe('https://cdn.example.com/favicon.png');
  });

  it('ignores fallback main logos returned by the API for favicon lookups', () => {
    expect(
      resolveServerFaviconHref({
        type: 'main',
        lightModeUrl: 'https://cdn.example.com/logo.png',
        darkModeUrl: null,
      }, '/favicon.ico', false),
    ).toBe('/favicon.ico');
  });
});

describe('buildFaviconLinks', () => {
  it('creates consistent favicon head links for SSR', () => {
    expect(buildFaviconLinks('https://cdn.example.com/favicon.png')).toEqual([
      { key: 'favicon-main', rel: 'icon', type: 'image/png', href: 'https://cdn.example.com/favicon.png' },
      { key: 'favicon-shortcut', rel: 'shortcut icon', type: 'image/png', href: 'https://cdn.example.com/favicon.png' },
      { key: 'apple-touch-icon', rel: 'apple-touch-icon', sizes: '180x180', href: 'https://cdn.example.com/favicon.png' },
      { key: 'favicon-32', rel: 'icon', type: 'image/png', sizes: '32x32', href: 'https://cdn.example.com/favicon.png' },
      { key: 'favicon-16', rel: 'icon', type: 'image/png', sizes: '16x16', href: 'https://cdn.example.com/favicon.png' },
    ]);
  });
});
