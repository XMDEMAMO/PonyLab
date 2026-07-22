import type { PostRecord } from '../types/content';
import { filterPublishedPosts, sortPosts } from './posts';

export interface HomePostStats {
  postCount: number;
  tagCount: number;
}

export function selectHomePosts<TPost extends PostRecord>(
  posts: readonly TPost[],
  limit: number,
): TPost[] {
  if (!Number.isInteger(limit) || limit < 0) {
    throw new TypeError('Homepage post limit must be a non-negative integer.');
  }

  return sortPosts(filterPublishedPosts(posts)).slice(0, limit);
}

export function getHomePostStats(
  posts: readonly PostRecord[],
): HomePostStats {
  const publishedPosts = filterPublishedPosts(posts);
  const uniqueTags = new Set(
    publishedPosts.flatMap((post) => post.data.tags),
  );

  return {
    postCount: publishedPosts.length,
    tagCount: uniqueTags.size,
  };
}
