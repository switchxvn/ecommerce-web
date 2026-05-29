import { createSSRApp } from 'vue';
import { renderToString } from 'vue/server-renderer';
import { describe, expect, it, vi } from 'vitest';

import CompanyIntroSection from './CompanyIntroSection.vue';

vi.mock('~/composables/useDarkMode', () => ({
  useDarkMode: () => ({
    isDark: { value: false },
  }),
}));

vi.mock('~/composables/useColorUtils', () => ({
  useCssColorValue: () => ({
    processColorValue: (value: string) => value,
  }),
}));

describe('CompanyIntroSection SSR', () => {
  it('keeps the embedded heading text when rendering the homepage h1 on the server', async () => {
    const app = createSSRApp(CompanyIntroSection, {
      titleTag: 'h1',
      config: {
        layout: 'full-text',
        title: 'Về chúng tôi',
        description:
          '<h1 style="color: #ff9800; text-align: center;">MGA Việt Nam - Xe nâng điện, xe nâng dầu và phụ tùng xe nâng</h1><p><strong style="color: #ff9800;">MGA Việt Nam</strong> cung cấp <strong style="color: #ff9800;">xe nâng điện, xe nâng dầu, phụ tùng xe nâng</strong> và giải pháp nâng hạ.</p>',
      },
    });

    app.component('UButton', {
      template: '<a><slot /></a>',
    });

    const html = await renderToString(app);

    expect(html).toContain('MGA Việt Nam - Xe nâng điện, xe nâng dầu và phụ tùng xe nâng');
    expect(html).not.toContain('<h1 class="mb-6 text-center text-3xl font-bold md:text-4xl dark:text-white" style="color: #ff9800; text-align: center;"></h1>');
  });
});
