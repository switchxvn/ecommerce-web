import { readFileSync } from 'node:fs';
import { fileURLToPath, URL } from 'node:url';
import { describe, expect, it } from 'vitest';

const popupVueFiles = [
  './AdvertisingPopupForm.vue',
  '../../pages/settings/advertising-popups/index.vue',
  '../../pages/settings/advertising-popups/new.vue',
  '../../pages/settings/advertising-popups/[id].vue',
];

describe('advertising popup theme utilities', () => {
  it.each(popupVueFiles)(
    '%s uses semantic primary utilities',
    (relativePath) => {
      const source = readFileSync(
        fileURLToPath(new URL(relativePath, import.meta.url)),
        'utf8'
      );

      expect(source).not.toMatch(/primary-(?:[1-9]\d{1,2}|950)\b/);
      expect(source).toMatch(/(?:bg|text|border|ring)-primary(?:\b|\/)/);
    }
  );
});
