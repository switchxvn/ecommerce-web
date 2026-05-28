import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const serviceDetailSource = readFileSync(
  '/Users/abc/project/mga/apps/frontend/src/pages/services/[slug].vue',
  'utf8',
);

const postDetailSource = readFileSync(
  '/Users/abc/project/mga/apps/frontend/src/pages/posts/[slug].vue',
  'utf8',
);

const productDetailSource = readFileSync(
  '/Users/abc/project/mga/apps/frontend/src/pages/products/[slug].vue',
  'utf8',
);

describe('SEO breadcrumb labels', () => {
  it('uses accented Vietnamese labels for service detail breadcrumbs', () => {
    expect(serviceDetailSource).toContain("'Trang chủ'");
    expect(serviceDetailSource).toContain("'Dịch vụ'");
    expect(serviceDetailSource).not.toContain("'Trang chu'");
    expect(serviceDetailSource).not.toContain("'Dich vu'");
  });

  it('uses accented Vietnamese labels for post detail breadcrumbs', () => {
    expect(postDetailSource).toContain("'Trang chủ'");
    expect(postDetailSource).not.toContain("'Trang chu'");
    expect(postDetailSource).not.toContain("'Bai viet'");
    expect(postDetailSource).toContain('postPrimaryCategory');
    expect(postDetailSource).toContain("name: postPrimaryCategory.value?.name || (locale.value === 'vi' ? 'Bài viết' : 'Posts')");
  });

  it('uses accented Vietnamese labels for product detail breadcrumbs', () => {
    expect(productDetailSource).toContain("'Sản phẩm'");
    expect(productDetailSource).not.toContain("'San pham'");
  });
});
