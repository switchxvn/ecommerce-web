import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('products index SEO hub content', () => {
  it('defines commercial sections for high-priority forklift keywords', () => {
    const source = readFileSync('/Users/abc/project/mga/apps/frontend/src/pages/products/index.vue', 'utf8');

    expect(source).toContain('Giải pháp xe nâng theo nhu cầu thực tế');
    expect(source).toContain('Báo giá nhanh theo tải trọng');
    expect(source).toContain('/danh-muc-san-pham/xe-nang-dau');
    expect(source).toContain('/danh-muc-san-pham/xe-nang-dien');
    expect(source).toContain('/san-pham/xe-nang-dau-mga-2-5-tan');
    expect(source).toContain('/san-pham/xe-nang-dien-ngoi-lai-mga-1-5-tan');
  });
});
