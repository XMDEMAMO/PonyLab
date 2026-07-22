import { describe, expect, it } from 'vitest';

import { createPathHelpers } from '../../src/utils/paths';
import {
  filterPublishedPosts,
  formatContentDate,
  getAdjacentPosts,
  isContentDateInput,
  parseContentDate,
  sortPosts,
  toArticlePath,
  toArticleSlug,
} from '../../src/utils/posts';
import { FIXTURE_PAGE_SIZE, postFixtures } from '../fixtures/posts';

describe('article URL helpers', () => {
  it.each([
    ['hello-world', 'hello-world'],
    ['astro/content-collections', 'astro/content-collections'],
    ['astro/content-collections/index', 'astro/content-collections'],
    ['astro/content-collections/index.md', 'astro/content-collections'],
    ['hello-world.md', 'hello-world'],
  ])('normalizes %s to %s', (entryId, expected) => {
    expect(toArticleSlug(entryId)).toBe(expected);
  });

  it('rejects an empty slug produced by a root index file', () => {
    expect(() => toArticleSlug('index.md')).toThrow(/empty article slug/i);
  });

  it('builds a nested, base-aware article URL through the shared API', () => {
    const paths = createPathHelpers({
      baseUrl: '/PonyLab/',
      siteUrl: 'https://xmdemamo.github.io',
    });

    expect(toArticlePath('astro/content-collections/index.md', paths)).toBe(
      '/PonyLab/blog/astro/content-collections/',
    );
  });
});

describe('post selection and order', () => {
  it('removes drafts unless explicitly included', () => {
    expect(filterPublishedPosts(postFixtures).some((post) => post.data.draft)).toBe(
      false,
    );
    expect(filterPublishedPosts(postFixtures, true)).toHaveLength(postFixtures.length);
  });

  it('sorts pinned posts first, then dates descending, then ids deterministically', () => {
    expect(sortPosts(filterPublishedPosts(postFixtures)).map((post) => post.id)).toEqual([
      'notes/pinned-newer',
      'notes/pinned-older',
      'astro/same-date-alpha',
      'astro/same-date-beta',
      'astro/older-post',
    ]);
  });

  it('keeps the P2 boundary fixture small without creating production pagination', () => {
    expect(sortPosts(filterPublishedPosts(postFixtures)).slice(0, FIXTURE_PAGE_SIZE)).toHaveLength(
      2,
    );
  });

  it('returns older and newer neighbors from the canonical order', () => {
    const posts = sortPosts(filterPublishedPosts(postFixtures));

    expect(getAdjacentPosts(posts, 'astro/same-date-alpha')).toEqual({
      previous: posts[3],
      next: posts[1],
    });
  });
});

describe('content dates', () => {
  it.each([
    '2026-01-02',
    '2026-01-01T23:30:00-05:00',
    '2026-01-02T04:30:00Z',
    '2026-01-02T12:30:00+08:00',
  ])('accepts supported ISO input %s', (value) => {
    expect(isContentDateInput(value)).toBe(true);
  });

  it.each([
    '2026/01/02',
    '2026-01-02T12:30:00',
    '2026-02-30T12:00:00+08:00',
    '2026-01-02T24:00:00+08:00',
    '2026-01-02T12:60:00+08:00',
    'January 2, 2026',
    '',
  ]) (
    'rejects ambiguous date input %s',
    (value) => {
      expect(isContentDateInput(value)).toBe(false);
      expect(() => parseContentDate(value)).toThrow(/ISO date/i);
    },
  );

  it('interprets a date-only value as midnight in Asia/Hong_Kong', () => {
    expect(parseContentDate('2026-01-02').toISOString()).toBe(
      '2026-01-01T16:00:00.000Z',
    );
  });

  it('formats in zh-CN and Asia/Hong_Kong independent of the source offset', () => {
    const instant = parseContentDate('2026-01-01T23:30:00-05:00');

    expect(formatContentDate(instant)).toBe('2026年1月2日');
  });

  it('does not drift when the build process uses another local time zone', () => {
    const originalTimeZone = process.env.TZ;

    try {
      process.env.TZ = 'America/Los_Angeles';
      expect(formatContentDate('2026-01-02')).toBe('2026年1月2日');

      process.env.TZ = 'Pacific/Auckland';
      expect(formatContentDate('2026-01-02')).toBe('2026年1月2日');
    } finally {
      if (originalTimeZone === undefined) {
        delete process.env.TZ;
      } else {
        process.env.TZ = originalTimeZone;
      }
    }
  });
});
