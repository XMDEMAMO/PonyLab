import { describe, expect, it } from 'vitest';

import {
  createPagefindBundleConfig,
  mapPagefindResults,
  normalizeSearchResultPath,
} from '../../src/utils/search';
import { postFixtures } from '../fixtures/posts';

describe('Pagefind bundle paths', () => {
  it('builds both URLs from the project base before Pagefind initializes', () => {
    expect(createPagefindBundleConfig('/PonyLab/')).toEqual({
      bundlePath: '/PonyLab/pagefind/',
      scriptUrl: '/PonyLab/pagefind/pagefind.js',
    });
  });
});

describe('Pagefind result mapping', () => {
  it('normalizes project-site and index.html result URLs', () => {
    expect(
      normalizeSearchResultPath(
        'https://xmdemamo.github.io/PonyLab/blog/astro/older-post/index.html?x=1',
        '/PonyLab/',
      ),
    ).toBe('/blog/astro/older-post/');
  });

  it('preserves relevance order and ignores unknown URLs safely', () => {
    const results = mapPagefindResults(
      [
        {
          url: '/PonyLab/blog/astro/older-post/',
          meta: { postId: 'astro/older-post' },
        },
        {
          url: '/PonyLab/blog/unknown/',
          meta: {},
        },
        {
          url: '/blog/astro/same-date-alpha/',
          meta: {},
        },
      ],
      postFixtures,
      '/PonyLab/',
    );

    expect(results.map((post) => post.id)).toEqual([
      'astro/older-post',
      'astro/same-date-alpha',
    ]);
  });
});
