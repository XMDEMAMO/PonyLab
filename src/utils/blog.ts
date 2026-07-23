import {
  categories,
  getTaxonomyByName,
  getTaxonomyBySlug,
  tags,
  type TaxonomyEntry,
} from '../config/taxonomy';
import { siteConfig } from '../config/site';
import type { PostRecord } from '../types/content';
import { filterPublishedPosts, sortPosts } from './posts';

export const BLOG_PAGE_SIZE = 8;

export interface BlogSearchState {
  tag?: string;
  category?: string;
  page: number;
}

export interface BlogResults<TPost extends PostRecord = PostRecord> {
  items: TPost[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

export interface TaxonomyCount {
  displayName: string;
  slug: string;
  count: number;
}

export interface ArchiveMonth<TPost extends PostRecord = PostRecord> {
  month: string;
  label: string;
  posts: TPost[];
}

export interface ArchiveYear<TPost extends PostRecord = PostRecord> {
  year: string;
  months: ArchiveMonth<TPost>[];
}

function normalizePage(page: number): number {
  return Number.isSafeInteger(page) && page > 0 ? page : 1;
}

function getPostTagSlugs(post: PostRecord): string[] {
  return post.data.tags.flatMap((name) => {
    const entry = getTaxonomyByName(tags, name);

    return entry ? [entry.slug] : [];
  });
}

function getPostCategorySlug(post: PostRecord): string | undefined {
  return getTaxonomyByName(categories, post.data.category)?.slug;
}

function matchesSearchState(post: PostRecord, state: BlogSearchState): boolean {
  return (
    (!state.tag || getPostTagSlugs(post).includes(state.tag)) &&
    (!state.category || getPostCategorySlug(post) === state.category)
  );
}

export function getBlogResults<TPost extends PostRecord>(
  posts: readonly TPost[],
  state: BlogSearchState,
  pageSize = BLOG_PAGE_SIZE,
): BlogResults<TPost> {
  if (!Number.isSafeInteger(pageSize) || pageSize < 1) {
    throw new RangeError('Blog page size must be a positive integer.');
  }

  const filteredPosts = sortPosts(filterPublishedPosts(posts)).filter((post) =>
    matchesSearchState(post, state),
  );
  const totalItems = filteredPosts.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const page = Math.min(normalizePage(state.page), totalPages);
  const start = (page - 1) * pageSize;

  return {
    items: filteredPosts.slice(start, start + pageSize),
    page,
    pageSize,
    totalItems,
    totalPages,
  };
}

function getTaxonomyCounts<TPost extends PostRecord>(
  posts: readonly TPost[],
  entries: readonly TaxonomyEntry[],
  selectNames: (post: TPost) => readonly string[],
): TaxonomyCount[] {
  const publishedPosts = filterPublishedPosts(posts);

  return entries.map(({ displayName, slug }) => ({
    displayName,
    slug,
    count: publishedPosts.filter((post) =>
      selectNames(post).includes(displayName),
    ).length,
  }));
}

export function getTagCounts<TPost extends PostRecord>(
  posts: readonly TPost[],
): TaxonomyCount[] {
  return getTaxonomyCounts(posts, tags, (post) => post.data.tags);
}

export function getCategoryCounts<TPost extends PostRecord>(
  posts: readonly TPost[],
): TaxonomyCount[] {
  return getTaxonomyCounts(posts, categories, (post) => [post.data.category]);
}

export function parseBlogSearchParams(
  params: URLSearchParams,
): BlogSearchState {
  const tag = params.get('tag') ?? undefined;
  const category = params.get('category') ?? undefined;
  const pageText = params.get('page');
  const page = pageText && /^\d+$/.test(pageText) ? Number(pageText) : 1;

  return {
    ...(tag && getTaxonomyBySlug(tags, tag) ? { tag } : {}),
    ...(category && getTaxonomyBySlug(categories, category)
      ? { category }
      : {}),
    page: normalizePage(page),
  };
}

export function serializeBlogSearchParams(
  state: BlogSearchState,
): URLSearchParams {
  const params = new URLSearchParams();

  if (state.tag && getTaxonomyBySlug(tags, state.tag)) {
    params.set('tag', state.tag);
  }

  if (state.category && getTaxonomyBySlug(categories, state.category)) {
    params.set('category', state.category);
  }

  const page = normalizePage(state.page);

  if (page > 1) {
    params.set('page', String(page));
  }

  return params;
}

const archiveDateFormatter = new Intl.DateTimeFormat(siteConfig.language, {
  timeZone: siteConfig.timeZone,
  year: 'numeric',
  month: 'numeric',
});

function getArchiveDateParts(date: Date): {
  year: string;
  month: string;
  label: string;
} {
  const parts = archiveDateFormatter.formatToParts(date);
  const year = parts.find((part) => part.type === 'year')?.value;
  const month = parts.find((part) => part.type === 'month')?.value;

  if (!year || !month) {
    throw new TypeError(`Could not format archive date "${date.toISOString()}".`);
  }

  return { year, month, label: `${month}月` };
}

export function groupPostsByArchive<TPost extends PostRecord>(
  posts: readonly TPost[],
): ArchiveYear<TPost>[] {
  const publishedByDate = filterPublishedPosts(posts).sort((left, right) => {
    const dateDifference =
      right.data.pubDate.getTime() - left.data.pubDate.getTime();

    return dateDifference !== 0
      ? dateDifference
      : left.id.localeCompare(right.id, 'en');
  });
  const years = new Map<string, Map<string, ArchiveMonth<TPost>>>();

  for (const post of publishedByDate) {
    const { year, month, label } = getArchiveDateParts(post.data.pubDate);
    const months = years.get(year) ?? new Map<string, ArchiveMonth<TPost>>();
    const archiveMonth = months.get(month) ?? { month, label, posts: [] };

    archiveMonth.posts.push(post);
    months.set(month, archiveMonth);
    years.set(year, months);
  }

  return [...years.entries()].map(([year, months]) => ({
    year,
    months: [...months.values()],
  }));
}
