import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const source = readFileSync(
  '/Users/abc/project/mga/apps/frontend/src/pages/products/[slug].vue',
  'utf8',
);

describe('product detail HTML size guards', () => {
  it('defers secondary product widgets to client-only hydration', () => {
    expect(source).toContain('<ClientOnly>');
    expect(source).toContain('<ProductReviewsSection');
    expect(source).toContain('<CrossSellProducts');
    expect(source).toContain('<GlobalModal :show="isPriceRequestModalOpen" @close="closePriceRequestModal">');
    expect(source).toContain('<QuickPurchaseModal');
  });
});
