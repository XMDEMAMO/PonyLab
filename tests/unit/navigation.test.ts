import { describe, expect, it } from 'vitest';

import { createPathHelpers } from '../../src/utils/paths';
import { isNavigationActive } from '../../src/utils/navigation';

const paths = createPathHelpers({
  baseUrl: '/PonyLab/',
  siteUrl: 'https://xmdemamo.github.io',
});

describe('isNavigationActive', () => {
  it('matches the home item only at the project root', () => {
    expect(isNavigationActive('/PonyLab/', '/', paths)).toBe(true);
    expect(isNavigationActive('/PonyLab/blog/', '/', paths)).toBe(false);
  });

  it('keeps a section active for nested routes', () => {
    expect(isNavigationActive('/PonyLab/blog/', '/blog/', paths)).toBe(true);
    expect(
      isNavigationActive('/PonyLab/blog/astro/first-post/', '/blog/', paths),
    ).toBe(true);
  });

  it('does not confuse similarly prefixed sections', () => {
    expect(isNavigationActive('/PonyLab/blogroll/', '/blog/', paths)).toBe(false);
  });

  it('normalizes a missing trailing slash on the current path', () => {
    expect(isNavigationActive('/PonyLab/about', '/about/', paths)).toBe(true);
  });
});
