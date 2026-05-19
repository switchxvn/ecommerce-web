import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import nuxtConfig from '../../nuxt.config';

const frontendRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');

describe('nuxt startup config', () => {
  it('only registers component directories that exist', () => {
    expect(nuxtConfig.components?.extensions).toEqual(['vue']);

    const componentDirs = nuxtConfig.components?.dirs ?? [];

    for (const dir of componentDirs) {
      const componentPath =
        typeof dir === 'string'
          ? dir
          : 'path' in dir && typeof dir.path === 'string'
            ? dir.path
            : null;

      expect(componentPath).not.toBeNull();

      const relativePath = componentPath!.replace(/^~\//, 'src/');
      expect(existsSync(resolve(frontendRoot, relativePath))).toBe(true);
    }
  });

  it('explicitly configures i18n translation directive optimization', () => {
    expect(typeof nuxtConfig.i18n).toBe('object');
    expect(nuxtConfig.i18n).toMatchObject({
      restructureDir: 'src',
      langDir: 'i18n/locales',
      vueI18n: './i18n/vue-i18n.config.ts',
      defaultLocale: 'vi',
      strategy: 'no_prefix',
      detectBrowserLanguage: false,
      bundle: {
        optimizeTranslationDirective: false,
      },
    });
  });
});
