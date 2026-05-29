import { describe, expect, it } from 'vitest';

import { buildTrpcProxyTarget } from './trpcProxy';

describe('buildTrpcProxyTarget', () => {
  it('preserves procedure paths and query strings for tRPC proxying', () => {
    expect(
      buildTrpcProxyTarget(
        'http://localhost:3333',
        '/api/trpc/theme.getActiveTheme?batch=1&input=%7B%7D',
      ),
    ).toBe('http://localhost:3333/api/trpc/theme.getActiveTheme?batch=1&input=%7B%7D');
  });

  it('supports the root tRPC endpoint', () => {
    expect(
      buildTrpcProxyTarget(
        'http://localhost:3333/',
        '/api/trpc',
      ),
    ).toBe('http://localhost:3333/api/trpc');
  });
});
