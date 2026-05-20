import { describe, expect, it } from 'vitest';

import { getAuthorName } from './author';

describe('getAuthorName', () => {
  it('returns the fallback label when the post has no author', () => {
    expect(getAuthorName(null as any)).toBe('Không xác định');
  });

  it('falls back to username when profile names are only whitespace', () => {
    expect(
      getAuthorName({
        id: '1',
        email: 'author@example.com',
        username: 'mga-author',
        isEmailVerified: true,
        isActive: true,
        lastLoginAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        profile: {
          firstName: '   ',
          lastName: '\n',
        },
      } as any),
    ).toBe('mga-author');
  });

  it('falls back to the email prefix when username is empty', () => {
    expect(
      getAuthorName({
        id: '1',
        email: 'author@example.com',
        username: '   ',
        isEmailVerified: true,
        isActive: true,
        lastLoginAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        profile: {
          firstName: null,
          lastName: null,
        },
      } as any),
    ).toBe('author');
  });
});
