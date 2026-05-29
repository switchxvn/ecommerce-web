import { NotFoundException } from '@nestjs/common';
import { TRPCError } from '@trpc/server';
import { describe, expect, it } from 'vitest';
import { mapSeoLookupError } from './seo.router';

describe('mapSeoLookupError', () => {
  it('converts missing SEO records into NOT_FOUND errors', () => {
    const error = mapSeoLookupError(new NotFoundException('missing'));

    expect(error).toBeInstanceOf(TRPCError);
    expect(error.code).toBe('NOT_FOUND');
    expect(error.message).toBe('missing');
  });

  it('returns other errors unchanged', () => {
    const error = new Error('boom');

    expect(mapSeoLookupError(error)).toBe(error);
  });
});
