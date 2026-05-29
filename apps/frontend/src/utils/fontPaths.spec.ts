import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('Inter font stylesheet', () => {
  it('uses URL-safe public paths without spaces for hosted font files', () => {
    const stylesheetPath = resolve(__dirname, '../assets/styles/base/_fonts.scss');
    const stylesheet = readFileSync(stylesheetPath, 'utf8');

    expect(stylesheet).not.toContain('/fonts/inter/Inter Web/');
    expect(stylesheet).toContain("/fonts/inter/web/Inter-Regular.woff2");
    expect(stylesheet).toContain("/fonts/inter/web/Inter.var.woff2");
  });

  it('keeps Nuxt public assets rooted at the app public directory outside srcDir', () => {
    const nuxtConfigPath = resolve(__dirname, '../../nuxt.config.ts');
    const nuxtConfig = readFileSync(nuxtConfigPath, 'utf8');

    expect(nuxtConfig).toMatch(/dir:\s*\{[\s\S]*public:\s*['"]\.\.\/public['"]/);
  });
});
