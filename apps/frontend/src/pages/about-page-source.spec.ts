import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const aboutPageSource = readFileSync(
  '/Users/abc/project/mga/apps/frontend/src/pages/about.vue',
  'utf8',
);

describe('about page source', () => {
  it('loads content through SSR-friendly async data and applies page-specific SEO', () => {
    expect(aboutPageSource).toContain('await useAsyncData(');
    expect(aboutPageSource).toContain('usePageSeo({');
    expect(aboutPageSource).toContain("routeKey: 'about'");
    expect(aboutPageSource).not.toContain('onMounted(() => {');
  });
});
