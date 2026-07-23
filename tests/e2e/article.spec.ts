import { expect, test } from '@playwright/test';
import { installClipboardMock } from './helpers/clipboard';

const articlePath = './blog/astro/ponylab-content-foundation/';

test('renders the nested article route, metadata, TOC, code, table, and math', async ({
  page,
}) => {
  await installClipboardMock(page);
  const response = await page.goto(articlePath);

  expect(response?.status()).toBe(200);
  await expect(page.locator('html')).toHaveAttribute('lang', 'zh-CN');
  await expect(
    page.getByRole('heading', { level: 1, name: 'PonyLab 内容层搭建记录' }),
  ).toBeVisible();
  await expect(page.getByText('发布于 2026年7月22日')).toBeVisible();
  await expect(page.getByText(/分钟阅读/)).toBeVisible();
  await expect(page.locator('.article-toc--desktop')).toBeVisible();
  await expect(page.locator('.article-toc--mobile')).toBeHidden();
  await expect(page.locator('[data-article-content] table')).toBeVisible();
  await expect(page.locator('[data-article-content] .katex-display')).toBeVisible();

  await page
    .locator('.article-toc--desktop')
    .getByRole('link', { name: '阅读时间如何计算' })
    .click();
  await expect
    .poll(() => page.evaluate(() => decodeURIComponent(window.location.hash)))
    .toBe('#阅读时间如何计算');
  await expect(
    page.getByRole('heading', { level: 2, name: '阅读时间如何计算' }),
  ).toBeInViewport();

  const copyButton = page.locator('.code-copy-button').first();
  await expect(copyButton).toHaveAccessibleName('复制代码');
  await copyButton.focus();
  await expect(copyButton).toBeFocused();
  await copyButton.click();
  await expect(copyButton).toHaveText('已复制');
  expect(await page.evaluate(() => navigator.clipboard.readText())).toContain(
    '/blog/astro/ponylab-content-foundation/',
  );
});

test('uses the collapsible TOC without horizontal overflow on mobile', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(articlePath);

  await expect(page.locator('.article-toc--desktop')).toBeHidden();
  const mobileToc = page.locator('.article-toc--mobile');
  await expect(mobileToc).toBeVisible();
  await mobileToc.getByText('文章目录', { exact: true }).click();
  await expect(
    mobileToc.getByRole('link', { name: '为什么使用内容集合' }),
  ).toBeVisible();

  const width = await page.evaluate(() => ({
    client: document.documentElement.clientWidth,
    scroll: document.documentElement.scrollWidth,
  }));
  expect(width.scroll).toBeLessThanOrEqual(width.client + 1);
});

test.describe('article without JavaScript', () => {
  test.use({ javaScriptEnabled: false });

  test('keeps the article, anchors, and math readable without enhancements', async ({ page }) => {
    await page.goto(articlePath);

    await expect(page.locator('[data-article-content]')).toContainText(
      'PonyLab 使用 Astro Content Collections 管理文章',
    );
    await expect(
      page.locator('.article-toc--desktop').getByRole('link', {
        name: '路径就是文章地址',
      }),
    ).toHaveAttribute('href', '#路径就是文章地址');
    await expect(page.locator('[data-article-content] .katex-display')).toBeVisible();
    await expect(page.locator('.code-copy-button')).toHaveCount(0);
  });
});

test('keeps print output focused on the article', async ({ page }) => {
  await page.goto(articlePath);
  await page.emulateMedia({ media: 'print' });

  await expect(page.locator('.site-header')).toBeHidden();
  await expect(page.locator('.site-footer')).toBeHidden();
  await expect(page.locator('[data-article-content]')).toBeVisible();
  await expect(page.locator('[data-article-toc]:visible')).toHaveCount(0);
  await expect(page.locator('.code-copy-button:visible')).toHaveCount(0);
});

test('returns the static 404 page for an unknown article slug', async ({ page }) => {
  const response = await page.goto('./blog/not-a-real-article/');

  expect(response?.status()).toBe(404);
  await expect(page.locator('main h1')).toBeVisible();
});
