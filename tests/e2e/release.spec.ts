import { expect, test } from '@playwright/test';

test('publishes canonical, social, RSS, and Sitemap metadata under the project base', async ({
  request,
  page,
}) => {
  await page.goto('./blog/astro/ponylab-content-foundation/');
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    'href',
    'https://xmdemamo.github.io/PonyLab/blog/astro/ponylab-content-foundation/',
  );
  await expect(page.locator('meta[property="og:type"]')).toHaveAttribute('content', 'article');
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
    'content',
    /^https:\/\/xmdemamo\.github\.io\/PonyLab\/_astro\//,
  );
  await expect(page.locator('link[rel="alternate"][type="application/rss+xml"]')).toHaveAttribute(
    'href',
    'https://xmdemamo.github.io/PonyLab/rss.xml',
  );

  const rss = await request.get('./rss.xml');
  expect(rss.status()).toBe(200);
  expect(rss.headers()['content-type']).toMatch(/xml/);
  expect(await rss.text()).toContain(
    'https://xmdemamo.github.io/PonyLab/blog/astro/ponylab-content-foundation/',
  );

  const sitemapIndex = await request.get('./sitemap-index.xml');
  expect(sitemapIndex.status()).toBe(200);
  expect(await sitemapIndex.text()).toContain(
    'https://xmdemamo.github.io/PonyLab/sitemap-0.xml',
  );
  const sitemap = await request.get('./sitemap-0.xml');
  expect(sitemap.status()).toBe(200);
  expect(await sitemap.text()).toContain('https://xmdemamo.github.io/PonyLab/blog/');
});

test('serves the custom project-site 404 page with recovery links', async ({ page }) => {
  const response = await page.goto('./not-a-real-page/');
  expect(response?.status()).toBe(404);
  await expect(page.getByRole('heading', { level: 1, name: '这里暂时没有记录' })).toBeVisible();
  await expect(page.getByRole('link', { name: '返回首页' })).toHaveAttribute('href', '/PonyLab/');
});
