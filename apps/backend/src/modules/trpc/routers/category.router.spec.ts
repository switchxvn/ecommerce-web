import { NotFoundException } from '@nestjs/common';
import { TRPCError } from '@trpc/server';
import { EntityNotFoundError } from 'typeorm';
import { describe, expect, it } from 'vitest';

import { mapCategoryLookupError } from './category.router';

describe('mapCategoryLookupError', () => {
  it('converts entity lookup misses into NOT_FOUND errors', () => {
    const error = mapCategoryLookupError(new EntityNotFoundError(Object, { slug: 'xe-nang-dien' }));

    expect(error).toBeInstanceOf(TRPCError);
    expect(error.code).toBe('NOT_FOUND');
  });

  it('converts explicit not found exceptions into NOT_FOUND errors', () => {
    const error = mapCategoryLookupError(new NotFoundException('missing category'));

    expect(error).toBeInstanceOf(TRPCError);
    expect(error.code).toBe('NOT_FOUND');
    expect(error.message).toBe('missing category');
  });

  it('returns non-lookup errors unchanged', () => {
    const error = new Error('column category.price_range_min does not exist');

    expect(mapCategoryLookupError(error)).toBe(error);
  });
});
