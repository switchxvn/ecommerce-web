import { describe, expect, it } from 'vitest';

import { buildFaviconLinks, resolveCurrentFaviconUrl } from './favicon';

describe('buildFaviconLinks', () => {
  it('uses dedicated PNG assets for default favicon fallbacks', () => {
    expect(buildFaviconLinks('/favicon.ico')).toEqual([
      { key: 'favicon-main', rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
      { key: 'favicon-shortcut', rel: 'shortcut icon', type: 'image/x-icon', href: '/favicon.ico' },
      { key: 'apple-touch-icon', rel: 'apple-touch-icon', sizes: '180x180', href: '/apple-touch-icon.png' },
      { key: 'favicon-32', rel: 'icon', type: 'image/png', sizes: '32x32', href: '/favicon-32x32.png' },
      { key: 'favicon-16', rel: 'icon', type: 'image/png', sizes: '16x16', href: '/favicon-16x16.png' },
    ]);
  });

  it('reuses a remote favicon URL when the backend provides one', () => {
    expect(buildFaviconLinks('https://cdn.example.com/favicon.png')).toEqual([
      { key: 'favicon-main', rel: 'icon', type: 'image/png', href: 'https://cdn.example.com/favicon.png' },
      { key: 'favicon-shortcut', rel: 'shortcut icon', type: 'image/png', href: 'https://cdn.example.com/favicon.png' },
      { key: 'apple-touch-icon', rel: 'apple-touch-icon', sizes: '180x180', href: 'https://cdn.example.com/favicon.png' },
      { key: 'favicon-32', rel: 'icon', type: 'image/png', sizes: '32x32', href: 'https://cdn.example.com/favicon.png' },
      { key: 'favicon-16', rel: 'icon', type: 'image/png', sizes: '16x16', href: 'https://cdn.example.com/favicon.png' },
    ]);
  });
});

describe('resolveCurrentFaviconUrl', () => {
  it('falls back to the default favicon when there is no active favicon', () => {
    expect(resolveCurrentFaviconUrl(null)).toBe('/favicon.ico');
  });
});
