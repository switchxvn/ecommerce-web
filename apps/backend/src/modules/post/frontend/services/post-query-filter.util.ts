interface PostQueryBuilderLike {
  innerJoin: (entity: string, alias: string, condition?: string, parameters?: Record<string, unknown>) => PostQueryBuilderLike;
  andWhere: (condition: string, parameters?: Record<string, unknown>) => PostQueryBuilderLike;
}

export function applyTagSlugFilterToPostQuery(
  qb: PostQueryBuilderLike,
  tagSlugs?: string[],
): PostQueryBuilderLike {
  if (!tagSlugs?.length) {
    return qb;
  }

  qb.innerJoin('post.postTags', 'filteredPostTags');
  qb.innerJoin('filteredPostTags.tag', 'filteredTag');
  qb.andWhere('filteredTag.slug IN (:...tagSlugs)', { tagSlugs });
  qb.andWhere('filteredTag.isActive = :tagActive', { tagActive: true });

  return qb;
}
