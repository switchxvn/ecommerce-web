import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const source = readFileSync(
  '/Users/abc/project/mga/apps/frontend/src/composables/useHomePage.ts',
  'utf8',
);

describe('useHomePage locale priority', () => {
  it('prefers Vietnamese for SSR homepage locale resolution', () => {
    expect(source).toContain("const defaultLocale = ref('vi');");
    expect(source).toContain('trpc.language.getDefaultLanguage.query()');
    expect(source).toContain("return defaultLang?.code || 'vi';");
    expect(source).toContain("return 'vi';");
  });

  it('keeps the SSR payload lightweight instead of serializing the full active theme', () => {
    expect(source).toContain('return { themeId: activeTheme?.id ?? null };');
    expect(source).not.toContain('return { theme: activeTheme };');
  });
});
