import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const readSource = (path: string) => readFileSync(path, 'utf8');

const homePageSource = readSource('/Users/abc/project/mga/apps/frontend/src/pages/index.vue');
const galleryPageSource = readSource('/Users/abc/project/mga/apps/frontend/src/pages/gallery.vue');
const heroSliderSource = readSource('/Users/abc/project/mga/apps/frontend/src/components/sliders/HeroSlider.vue');
const heroFullWidthSource = readSource('/Users/abc/project/mga/apps/frontend/src/components/sections/home_page/HeroSectionFullWidth.vue');
const orderTicketBannerSource = readSource('/Users/abc/project/mga/apps/frontend/src/components/sections/order-ticket/OrderTicketBannerSection.vue');
const companyIntroSource = readSource('/Users/abc/project/mga/apps/frontend/src/components/sections/home_page/CompanyIntroSection.vue');

describe('public page heading semantics', () => {
  it('uses the company intro section as the homepage h1 source instead of a fallback heading block', () => {
    expect(homePageSource).not.toContain('<h1 class="text-3xl font-bold text-gray-900 dark:text-white md:text-4xl">');
    expect(homePageSource).toContain("titleTag: 'h2'");
    expect(homePageSource).toContain("fallbackTitleTag: 'div'");
  });

  it('keeps gallery page at one page heading with section headings below it', () => {
    expect(galleryPageSource).toContain('<h1');
    expect(galleryPageSource.match(/<h2\b/g)?.length ?? 0).toBeGreaterThanOrEqual(2);
  });

  it('avoids rendering every homepage hero slide as a top-level heading', () => {
    expect(heroSliderSource).toContain("index === 0 ? titleTag : fallbackTitleTag");
    expect(heroFullWidthSource).toContain("index === 0 ? titleTag : fallbackTitleTag");
  });

  it('avoids multiple page-level headings inside the order-ticket banner slider', () => {
    expect(orderTicketBannerSource).toContain("index === 0 ? titleTag : fallbackTitleTag");
  });

  it('promotes the intro section heading html into a configurable semantic heading without losing inline styles', () => {
    expect(companyIntroSource).toContain('titleTag?: string;');
    expect(companyIntroSource).toContain('const extractedHeading = computed(() => {');
    expect(companyIntroSource).toContain(':style="extractedHeading.style"');
    expect(companyIntroSource).toContain('v-html="extractedHeading.content"');
    expect(companyIntroSource).toContain(":is=\"titleTag || 'h2'\"");
  });
});
