import { siteConfig } from '../config/site';
import type { AdjacentPosts, PostRecord } from '../types/content';
import { parseContentDate } from './content-date';
import { sitePaths, type PathHelpers } from './paths';

const ARTICLE_SEGMENT_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export { isContentDateInput, parseContentDate } from './content-date';

const dateFormatter = new Intl.DateTimeFormat(siteConfig.language, {
  timeZone: siteConfig.timeZone,
  year: 'numeric',
  month: 'long',
  day: 'numeric',
});

export function formatContentDate(value: string | Date): string {
  return dateFormatter.format(parseContentDate(value));
}

export function toArticleSlug(entryId: string): string {
  const normalized = entryId
    .trim()
    .replaceAll('\\', '/')
    .replace(/^\/+|\/+$/g, '')
    .replace(/\.md$/i, '');
  const segments = normalized.split('/').filter(Boolean);

  if (segments.at(-1) === 'index') {
    segments.pop();
  }

  if (segments.length === 0) {
    throw new TypeError(`Entry id "${entryId}" produces an empty article slug.`);
  }

  for (const segment of segments) {
    if (!ARTICLE_SEGMENT_PATTERN.test(segment)) {
      throw new TypeError(
        `Entry id "${entryId}" contains an invalid article path segment "${segment}".`,
      );
    }
  }

  return segments.join('/');
}

export function toArticlePath(
  entryId: string,
  paths: PathHelpers = sitePaths,
): string {
  return paths.page(`/blog/${toArticleSlug(entryId)}`);
}

export function filterPublishedPosts<TPost extends PostRecord>(
  posts: readonly TPost[],
  includeDrafts = false,
): TPost[] {
  return includeDrafts ? [...posts] : posts.filter((post) => !post.data.draft);
}

export function sortPosts<TPost extends PostRecord>(posts: readonly TPost[]): TPost[] {
  return [...posts].sort((left, right) => {
    const pinnedDifference = Number(right.data.pinned) - Number(left.data.pinned);

    if (pinnedDifference !== 0) {
      return pinnedDifference;
    }

    const dateDifference = right.data.pubDate.getTime() - left.data.pubDate.getTime();

    return dateDifference !== 0
      ? dateDifference
      : left.id.localeCompare(right.id, 'en');
  });
}

export function getAdjacentPosts<TPost extends PostRecord>(
  posts: readonly TPost[],
  currentId: string,
): AdjacentPosts<TPost> {
  const currentIndex = posts.findIndex((post) => post.id === currentId);

  if (currentIndex < 0) {
    return {};
  }

  return {
    previous: posts[currentIndex + 1],
    next: posts[currentIndex - 1],
  };
}
