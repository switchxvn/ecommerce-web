import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

const source = readFileSync(
  resolve(process.cwd(), 'apps/frontend/src/layouts/default.vue'),
  'utf8'
);

describe('public default layout advertising popup integration', () => {
  it('creates one popup composable instance and initializes it once on mount', () => {
    expect(source.match(/useAdvertisingPopup\(\)/g)).toHaveLength(1);
    expect(source.match(/initializeAdvertisingPopup\(\)/g)).toHaveLength(1);
    expect(source).toMatch(
      /const\s*{[\s\S]*?campaign,[\s\S]*?shouldShow,[\s\S]*?initialize:\s*initializeAdvertisingPopup,[\s\S]*?close:\s*closeAdvertisingPopup,[\s\S]*?}\s*=\s*useAdvertisingPopup\(\)/
    );
  });

  it('renders the popup once outside the loading content branches', () => {
    expect(source.match(/<AdvertisingPopup/g)).toHaveLength(1);
    expect(source).toMatch(
      /<\/template>\s*<AdvertisingPopup\s+v-if="shouldShow && campaign"/
    );
  });
});
