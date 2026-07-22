import { describe, expect, it } from 'vitest';

import { createPathHelpers, normalizeBasePath } from '../../src/utils/paths';

describe('normalizeBasePath', () => {
  it.each([
    ['/', '/'],
    ['', '/'],
    ['PonyLab', '/PonyLab/'],
    ['/PonyLab', '/PonyLab/'],
    ['/PonyLab/', '/PonyLab/'],
  ])('normalizes %s to %s', (input, expected) => {
    expect(normalizeBasePath(input)).toBe(expected);
  });
});

describe('createPathHelpers', () => {
  const rootPaths = createPathHelpers({
    baseUrl: '/',
    siteUrl: 'https://example.com',
  });
  const projectPaths = createPathHelpers({
    baseUrl: '/PonyLab/',
    siteUrl: 'https://xmdemamo.github.io',
  });

  it('builds trailing-slash page URLs for root and project deployments', () => {
    expect(rootPaths.page('/')).toBe('/');
    expect(rootPaths.page('blog')).toBe('/blog/');
    expect(projectPaths.page('/')).toBe('/PonyLab/');
    expect(projectPaths.page('/blog')).toBe('/PonyLab/blog/');
  });

  it('preserves query strings and hashes after normalizing a page URL', () => {
    expect(projectPaths.page('/blog?q=astro#results')).toBe(
      '/PonyLab/blog/?q=astro#results',
    );
  });

  it.each([
    ['favicon.ico', '/PonyLab/favicon.ico'],
    ['/images/cover.webp', '/PonyLab/images/cover.webp'],
    ['audio/theme.mp3', '/PonyLab/audio/theme.mp3'],
    ['pagefind/pagefind.js', '/PonyLab/pagefind/pagefind.js'],
    ['rss.xml', '/PonyLab/rss.xml'],
  ])('builds base-aware asset URL %s', (input, expected) => {
    expect(projectPaths.asset(input)).toBe(expected);
  });

  it('builds canonical absolute URLs from the configured site and base', () => {
    expect(projectPaths.absolutePage('/blog')).toBe(
      'https://xmdemamo.github.io/PonyLab/blog/',
    );
    expect(projectPaths.absoluteAsset('rss.xml')).toBe(
      'https://xmdemamo.github.io/PonyLab/rss.xml',
    );
  });

  it('does not emit duplicate slashes in internal paths', () => {
    expect(projectPaths.page('///blog///')).toBe('/PonyLab/blog/');
    expect(projectPaths.asset('///favicon.ico')).toBe(
      '/PonyLab/favicon.ico',
    );
  });

  it('rejects absolute and protocol-relative inputs', () => {
    expect(() => projectPaths.page('https://example.com/blog')).toThrow(
      /internal path/i,
    );
    expect(() => projectPaths.asset('//cdn.example.com/a.png')).toThrow(
      /internal path/i,
    );
  });
});
