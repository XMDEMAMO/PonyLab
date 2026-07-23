import { describe, expect, it } from 'vitest';

import {
  getBlogResults,
  getCategoryCounts,
  getTagCounts,
  groupPostsByArchive,
  parseBlogSearchParams,
  serializeBlogSearchParams,
} from '../../src/utils/blog';
import { FIXTURE_PAGE_SIZE, postFixtures } from '../fixtures/posts';

describe('blog taxonomy query', () => {
  it('filters the canonical published order by tag and category slugs', () => {
    const result = getBlogResults(
      postFixtures,
      { tag: 'astro', category: 'technology', page: 1 },
      FIXTURE_PAGE_SIZE,
    );

    expect(result.totalItems).toBe(2);
    expect(result.items.map((post) => post.id)).toEqual([
      'astro/same-date-alpha',
      'astro/older-post',
    ]);
  });

  it('counts only published posts for every declared taxonomy entry', () => {
    expect(getTagCounts(postFixtures)).toEqual([
      { displayName: 'Astro', slug: 'astro', count: 4 },
      { displayName: 'TypeScript', slug: 'typescript', count: 1 },
      { displayName: '前端开发', slug: 'frontend-development', count: 0 },
      { displayName: '性能优化', slug: 'performance', count: 0 },
    ]);
    expect(getCategoryCounts(postFixtures)).toEqual([
      { displayName: '技术', slug: 'technology', count: 3 },
      { displayName: '随笔', slug: 'notes', count: 2 },
      { displayName: '项目', slug: 'projects', count: 0 },
    ]);
  });
});

describe('blog pagination and URL state', () => {
  it('paginates after filtering and clamps an out-of-range page', () => {
    const secondPage = getBlogResults(
      postFixtures,
      { page: 2 },
      FIXTURE_PAGE_SIZE,
    );
    const clampedPage = getBlogResults(
      postFixtures,
      { page: 99 },
      FIXTURE_PAGE_SIZE,
    );

    expect(secondPage.items.map((post) => post.id)).toEqual([
      'astro/same-date-alpha',
      'astro/same-date-beta',
    ]);
    expect(secondPage).toMatchObject({ page: 2, totalItems: 5, totalPages: 3 });
    expect(clampedPage.items.map((post) => post.id)).toEqual([
      'astro/older-post',
    ]);
    expect(clampedPage.page).toBe(3);
  });

  it('accepts only declared slugs and positive integer pages from the URL', () => {
    expect(
      parseBlogSearchParams(
        new URLSearchParams('tag=astro&category=notes&page=3'),
      ),
    ).toEqual({ tag: 'astro', category: 'notes', page: 3 });
    expect(
      parseBlogSearchParams(
        new URLSearchParams('tag=unknown&category=missing&page=-4&q=ignored'),
      ),
    ).toEqual({ page: 1 });
  });

  it('serializes a stable progressive-enhancement query and omits page one', () => {
    expect(
      serializeBlogSearchParams({
        tag: 'astro',
        category: 'technology',
        page: 2,
      }).toString(),
    ).toBe('tag=astro&category=technology&page=2');
    expect(serializeBlogSearchParams({ page: 1 }).toString()).toBe('');
  });
});

describe('blog archive', () => {
  it('groups published posts by calendar year and month in date order, not pin order', () => {
    const archive = groupPostsByArchive(postFixtures);

    expect(archive.map((group) => group.year)).toEqual(['2026', '2025']);
    expect(archive[0]?.months.map((month) => month.label)).toEqual([
      '6月',
      '5月',
      '1月',
    ]);
    expect(archive[0]?.months.flatMap((month) => month.posts.map((post) => post.id))).toEqual([
      'notes/pinned-newer',
      'astro/same-date-alpha',
      'astro/same-date-beta',
      'notes/pinned-older',
    ]);
  });
});
