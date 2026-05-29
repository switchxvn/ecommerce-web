import { describe, expect, it } from 'vitest';

import { buildPostListQuery, parsePostListQuery } from './postFilters';

describe('postFilters', () => {
  it('maps the legacy danh-muc query parameter to categories', () => {
    expect(parsePostListQuery({
      'danh-muc': 'ban-giao-xe-nang',
      page: '2',
    })).toMatchObject({
      categories: ['ban-giao-xe-nang'],
      page: 2,
    });
  });

  it('prefers the canonical categories parameter when both query styles are present', () => {
    expect(parsePostListQuery({
      categories: 'tin-tuc-xe-nang,bao-tri-bao-duong',
      'danh-muc': 'ban-giao-xe-nang',
    }).categories).toEqual(['tin-tuc-xe-nang', 'bao-tri-bao-duong']);
  });

  it('clears category state when the next query no longer contains a category filter', () => {
    expect(parsePostListQuery({
      search: 'xe nang',
    }).categories).toEqual([]);
  });

  it('builds a canonical posts query without the legacy danh-muc parameter', () => {
    expect(buildPostListQuery({
      search: '',
      categories: ['ban-giao-xe-nang'],
      sort: 'newest',
      page: 1,
      limit: 12,
      tags: [],
    })).toEqual({
      categories: 'ban-giao-xe-nang',
    });
  });
});
