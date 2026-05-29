import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const breadcrumbSource = readFileSync(
  '/Users/abc/project/mga/apps/frontend/src/components/common/Breadcrumb.vue',
  'utf8'
);

describe('breadcrumb mobile layout', () => {
  it('moves the active breadcrumb item onto its own row on mobile', () => {
    expect(breadcrumbSource).toContain(
      'class="breadcrumb__list flex flex-wrap items-center gap-x-1.5 gap-y-2 md:gap-2"'
    );
    expect(breadcrumbSource).toContain(
      `:class="[
            'breadcrumb__item',
            index === items.length - 1 ? 'breadcrumb__item--active' : 'shrink-0',
          ]"`
    );
    expect(breadcrumbSource).toContain(
      'class="breadcrumb__text block text-primary-700 dark:text-primary-300 font-semibold"'
    );
    expect(breadcrumbSource).toContain(
      '@apply basis-full pl-0 text-sm leading-snug md:basis-auto md:pl-0 md:text-base;'
    );
    expect(breadcrumbSource).toContain(
      "index === items.length - 2 ? 'hidden md:list-item' : ''"
    );
  });
});
