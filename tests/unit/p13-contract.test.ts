import { access, readFile } from 'node:fs/promises';

import { describe, expect, it } from 'vitest';

const projectRoot = new URL('../../', import.meta.url);
const read = (pathname: string) => readFile(new URL(pathname, projectRoot), 'utf8');
const exists = async (pathname: string) => {
  try {
    await access(new URL(pathname, projectRoot));
    return true;
  } catch {
    return false;
  }
};

describe('P13 release contract', () => {
  it('adds sitemap, RSS, 404, and social metadata', async () => {
    const [config, layout] = await Promise.all([
      read('astro.config.mjs'),
      read('src/layouts/BaseLayout.astro'),
    ]);

    expect(config).toContain('@astrojs/sitemap');
    expect(config).toContain('sitemap()');
    expect(layout).toContain('property="og:title"');
    expect(layout).toContain('name="twitter:card"');
    await expect(
      Promise.all([exists('src/pages/rss.xml.ts'), exists('src/pages/404.astro')]),
    ).resolves.toEqual([true, true]);
    await expect(exists('public/robots.txt')).resolves.toBe(false);
  });

  it('uses one quality-gated Pages workflow and the same production build command', async () => {
    const deploy = await read('.github/workflows/deploy.yml');

    expect(deploy).toContain('pages: write');
    expect(deploy).toContain('id-token: write');
    expect(deploy).toContain('npm run validate:content');
    expect(deploy).toContain('npm run check');
    expect(deploy).toContain('npm run test:unit');
    expect(deploy).toContain('npm run build');
    expect(deploy).toContain('npm run test:e2e');
    expect(deploy).toContain('actions/upload-pages-artifact');
    expect(deploy).toContain('actions/deploy-pages');
  });

  it('runs the production E2E suite in Chromium and Firefox', async () => {
    const [playwright, ci] = await Promise.all([
      read('playwright.config.ts'),
      read('.github/workflows/ci.yml'),
    ]);

    expect(playwright).toContain("name: 'firefox'");
    expect(ci).toContain('chromium firefox');
  });
});
