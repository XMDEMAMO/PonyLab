import type { PostRecord } from '../types/content';
import { normalizeBasePath } from './paths';
import { toArticleSlug } from './posts';

export interface PagefindBundleConfig {
  bundlePath: string;
  scriptUrl: string;
}

export interface PagefindResultData {
  url: string;
  meta?: Record<string, string | undefined>;
}

export function createPagefindBundleConfig(baseUrl: string): PagefindBundleConfig {
  const base = normalizeBasePath(baseUrl);
  const bundlePath = `${base}pagefind/`;

  return {
    bundlePath,
    scriptUrl: `${bundlePath}pagefind.js`,
  };
}

export function normalizeSearchResultPath(url: string, baseUrl: string): string {
  const parsed = new URL(url, 'https://ponylab.local');
  const base = normalizeBasePath(baseUrl);
  let pathname = parsed.pathname.replace(/\/index\.html$/i, '/');

  if (base !== '/' && pathname.startsWith(base)) {
    pathname = `/${pathname.slice(base.length)}`;
  }

  pathname = `/${pathname.split('/').filter(Boolean).join('/')}`;

  return pathname === '/' ? '/' : `${pathname}/`;
}

export function mapPagefindResults<TPost extends PostRecord>(
  results: readonly PagefindResultData[],
  posts: readonly TPost[],
  baseUrl: string,
): TPost[] {
  const postsById = new Map(posts.map((post) => [post.id, post]));
  const postsByPath = new Map(
    posts.map((post) => [`/blog/${toArticleSlug(post.id)}/`, post]),
  );
  const seen = new Set<string>();
  const mapped: TPost[] = [];

  for (const result of results) {
    const postId = result.meta?.postId;
    const post =
      (postId ? postsById.get(postId) : undefined) ??
      postsByPath.get(normalizeSearchResultPath(result.url, baseUrl));

    if (!post || seen.has(post.id)) continue;

    seen.add(post.id);
    mapped.push(post);
  }

  return mapped;
}
