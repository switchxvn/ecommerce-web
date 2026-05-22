import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const productDetailSource = readFileSync(
  '/Users/abc/project/mga/apps/frontend/src/pages/products/[slug].vue',
  'utf8'
);

const ticketDetailSource = readFileSync(
  '/Users/abc/project/mga/apps/frontend/src/pages/tickets/[slug].vue',
  'utf8'
);

describe('product detail main gallery image layout', () => {
  it('uses a fixed-height main image on the product detail page', () => {
    expect(productDetailSource).toContain(
      'customClass="h-72 md:h-[26rem] lg:h-[32rem] w-full rounded-lg bg-white object-contain"'
    );
  });

  it('uses a fixed-height main image on the ticket detail page', () => {
    expect(ticketDetailSource).toContain(
      'customClass="h-72 md:h-[26rem] lg:h-[32rem] w-full rounded-lg bg-white object-contain"'
    );
  });

  it('uses horizontally scrollable pill tabs on mobile for the product detail page', () => {
    expect(productDetailSource).toContain(
      'class="product-tabs-scroll flex gap-2 overflow-x-auto pb-1 md:flex-wrap md:gap-0 md:space-x-8 md:pb-0"'
    );
    expect(productDetailSource).toContain(
      "class=\"product-tab-button inline-flex shrink-0 items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold transition-all md:rounded-none md:px-1 md:py-4 md:text-base md:font-medium md:uppercase md:tracking-wide\""
    );
  });
});
