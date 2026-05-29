import { describe, expect, it } from 'vitest';

import { buildPostLocaleFilters } from './post.router';

describe('buildPostLocaleFilters', () => {
  it('forwards tag slugs from the public byLocale input', () => {
    expect(
      buildPostLocaleFilters({
        locale: 'vi',
        page: 2,
        limit: 24,
        search: 'container',
        categories: 'tin-tuc,thu-thuat',
        sort: 'newest',
        tags: 'xe-nang-container,xe-nang-diesel',
      }),
    ).toEqual({
      categorySlugs: ['tin-tuc', 'thu-thuat'],
      search: 'container',
      page: 2,
      limit: 24,
      sortBy: 'newest',
      tagSlugs: ['xe-nang-container', 'xe-nang-diesel'],
    });
  });

  it('prefers the single category shortcut and omits empty tags', () => {
    expect(
      buildPostLocaleFilters({
        locale: 'vi',
        page: 1,
        limit: 12,
        sort: 'oldest',
        category: 'tin-noi-bo',
        categories: 'ignored',
        tags: '',
      }),
    ).toEqual({
      categorySlugs: ['tin-noi-bo'],
      search: undefined,
      page: 1,
      limit: 12,
      sortBy: 'oldest',
      tagSlugs: undefined,
    });
  });
});
