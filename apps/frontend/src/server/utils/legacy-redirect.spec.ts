import { describe, expect, it } from 'vitest';
import { resolveLegacyRedirectLocation } from './legacy-redirect';

describe('legacy redirect server helper', () => {
  it('preserves query string and hash-independent redirect destination', () => {
    expect(
      resolveLegacyRedirectLocation('/en/products/mga-16-ton-diesel-forklift?ref=gsc&page=2'),
    ).toEqual({
      destination: '/products/mga-16-ton-diesel-forklift?ref=gsc&page=2',
      statusCode: 301,
    });
  });

  it('redirects product aliases to canonical vietnamese product urls while preserving query strings', () => {
    expect(
      resolveLegacyRedirectLocation('/products/may-nen-khi-mga-15hp?ref=gsc&page=2'),
    ).toEqual({
      destination: '/san-pham/may-nen-khi-mga-15hp?ref=gsc&page=2',
      statusCode: 301,
    });
  });

  it('redirects bare legacy category slugs to canonical category urls while preserving query strings', () => {
    expect(
      resolveLegacyRedirectLocation('/xe-nang-dau?ref=gsc&page=2'),
    ).toEqual({
      destination: '/danh-muc-san-pham/xe-nang-dau?ref=gsc&page=2',
      statusCode: 301,
    });
  });

  it('redirects english post aliases to the canonical vietnamese path while preserving query strings', () => {
    expect(
      resolveLegacyRedirectLocation('/posts/safe-forklift-operation-guide?ref=gsc&page=2'),
    ).toEqual({
      destination: '/bai-viet/safe-forklift-operation-guide?ref=gsc&page=2',
      statusCode: 301,
    });
  });

  it('redirects trailing-slash canonical urls to the slashless canonical path', () => {
    expect(
      resolveLegacyRedirectLocation('/san-pham/bo-cang-gat-gu/?ref=gsc&page=2'),
    ).toEqual({
      destination: '/san-pham/bo-cang-gat-gu?ref=gsc&page=2',
      statusCode: 301,
    });
  });

  it('returns null when there is no redirect match', () => {
    expect(resolveLegacyRedirectLocation('/khong-ton-tai?page=2')).toBeNull();
  });
});
