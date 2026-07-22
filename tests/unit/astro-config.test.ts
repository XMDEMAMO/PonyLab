import { describe, expect, it } from 'vitest';

import astroConfig from '../../astro.config.mjs';

describe('Astro deployment configuration', () => {
  it('uses the frozen GitHub Pages project-site values', () => {
    expect(astroConfig).toMatchObject({
      site: 'https://xmdemamo.github.io',
      base: '/PonyLab',
      trailingSlash: 'always',
    });
  });

  it('keeps the site statically generated without an adapter', () => {
    expect(astroConfig.output ?? 'static').toBe('static');
    expect(astroConfig.adapter).toBeUndefined();
  });
});
