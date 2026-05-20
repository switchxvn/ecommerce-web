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

  it('returns null for unmapped legacy urls', () => {
    expect(resolveLegacyRedirect('/khong-ton-tai')).toBeNull();
    expect(resolveLegacyRedirect('/bai-viet/slug-hop-le')).toBeNull();
  });
});
