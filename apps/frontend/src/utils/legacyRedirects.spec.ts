import { describe, expect, it } from 'vitest';
import { resolveLegacyRedirect } from './legacyRedirects';

describe('legacy redirects', () => {
  it('maps known exact legacy urls to approved replacements', () => {
    expect(resolveLegacyRedirect('/en/products/mga-16-ton-diesel-forklift')).toEqual({
      destination: '/products/mga-16-ton-diesel-forklift',
      statusCode: 301,
    });

    expect(resolveLegacyRedirect('/tat-ca-san-pham/')).toEqual({
      destination: '/san-pham',
      statusCode: 301,
    });

    expect(resolveLegacyRedirect('/xe-nang-dau')).toEqual({
      destination: '/danh-muc-san-pham/xe-nang-dau',
      statusCode: 301,
    });

    expect(resolveLegacyRedirect('/danh-muc-san-pham/xe-nang/xe-nang-dau/')).toEqual({
      destination: '/danh-muc-san-pham/xe-nang-dau',
      statusCode: 301,
    });
  });

  it('redirects english category aliases to the canonical vietnamese category path', () => {
    expect(resolveLegacyRedirect('/categories/xe-nang-dien')).toEqual({
      destination: '/danh-muc-san-pham/xe-nang-dien',
      statusCode: 301,
    });

    expect(resolveLegacyRedirect('/categories')).toEqual({
      destination: '/danh-muc-san-pham',
      statusCode: 301,
    });
  });

  it('redirects english product aliases to the canonical vietnamese product path', () => {
    expect(resolveLegacyRedirect('/products/mga-16-ton-diesel-forklift')).toEqual({
      destination: '/san-pham/mga-16-ton-diesel-forklift',
      statusCode: 301,
    });

    expect(resolveLegacyRedirect('/products')).toEqual({
      destination: '/san-pham',
      statusCode: 301,
    });
  });

  it('redirects english post aliases to the canonical vietnamese post path', () => {
    expect(resolveLegacyRedirect('/posts/safe-forklift-operation-guide')).toEqual({
      destination: '/bai-viet/safe-forklift-operation-guide',
      statusCode: 301,
    });

    expect(resolveLegacyRedirect('/posts')).toEqual({
      destination: '/bai-viet',
      statusCode: 301,
    });
  });

  it('redirects english service aliases to the canonical vietnamese service path', () => {
    expect(resolveLegacyRedirect('/services/diesel-forklift-rental')).toEqual({
      destination: '/dich-vu/diesel-forklift-rental',
      statusCode: 301,
    });

    expect(resolveLegacyRedirect('/services')).toEqual({
      destination: '/dich-vu',
      statusCode: 301,
    });
  });

  it('redirects trailing-slash canonical routes to the slashless vietnamese url', () => {
    expect(resolveLegacyRedirect('/san-pham/bo-cang-gat-gu/')).toEqual({
      destination: '/san-pham/bo-cang-gat-gu',
      statusCode: 301,
    });

    expect(resolveLegacyRedirect('/bai-viet/huong-dan-van-hanh-xe-nang-an-toan/')).toEqual({
      destination: '/bai-viet/huong-dan-van-hanh-xe-nang-an-toan',
      statusCode: 301,
    });
  });

  it('returns null for unmapped legacy urls', () => {
    expect(resolveLegacyRedirect('/khong-ton-tai')).toBeNull();
    expect(resolveLegacyRedirect('/bai-viet/slug-hop-le')).toBeNull();
  });
});
