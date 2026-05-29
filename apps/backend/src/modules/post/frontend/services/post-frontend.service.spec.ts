import { describe, expect, it, vi } from 'vitest';

import { applyTagSlugFilterToPostQuery } from './post-query-filter.util';

describe('applyTagSlugFilterToPostQuery', () => {
  it('joins tag relations and constrains the query by active tag slugs', () => {
    const qb = {
      innerJoin: vi.fn().mockReturnThis(),
      andWhere: vi.fn().mockReturnThis(),
    };

    applyTagSlugFilterToPostQuery(qb as any, ['xe-nang-container']);

    expect(qb.innerJoin).toHaveBeenCalledWith('post.postTags', 'filteredPostTags');
    expect(qb.innerJoin).toHaveBeenCalledWith('filteredPostTags.tag', 'filteredTag');
    expect(qb.andWhere).toHaveBeenCalledWith(
      'filteredTag.slug IN (:...tagSlugs)',
      { tagSlugs: ['xe-nang-container'] },
    );
    expect(qb.andWhere).toHaveBeenCalledWith('filteredTag.isActive = :tagActive', { tagActive: true });
  });

  it('does nothing when tag filters are empty', () => {
    const qb = {
      innerJoin: vi.fn().mockReturnThis(),
      andWhere: vi.fn().mockReturnThis(),
    };

    applyTagSlugFilterToPostQuery(qb as any, []);

    expect(qb.innerJoin).not.toHaveBeenCalled();
    expect(qb.andWhere).not.toHaveBeenCalled();
  });
});
