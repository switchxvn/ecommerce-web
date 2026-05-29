import type { Post } from '@ew/shared';

/**
 * Get formatted author name from author object
 */
export function getAuthorName(author: Post['author']): string {
  if (!author) return 'Không xác định';

  if (author.profile) {
    const firstName = author.profile.firstName?.trim() || '';
    const lastName = author.profile.lastName?.trim() || '';
    if (firstName || lastName) {
      return `${firstName} ${lastName}`.trim();
    }
  }

  const username = author.username?.trim();
  if (username) {
    return username;
  }

  const emailPrefix = author.email?.split('@')[0]?.trim();
  return emailPrefix || 'Không xác định';
}
