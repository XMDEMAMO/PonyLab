import { expect, test } from '@playwright/test';

test('renders the shared zh-CN shell and base-aware metadata', async ({ page }) => {
  await page.goto('./');

  await expect(page.locator('html')).toHaveAttribute('lang', 'zh-CN');
  await expect(page).toHaveTitle('PonyLab');
  await expect(page.locator('meta[name="description"]')).toHaveAttribute(
    'content',
    /技术学习/,
  );
  await expect(page.locator('link[rel="icon"]')).toHaveAttribute(
    'href',
    '/PonyLab/favicon.ico',
  );
  await expect(page.locator('link[rel="icon"]')).toHaveAttribute(
    'type',
    'image/x-icon',
  );
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    'href',
    'https://xmdemamo.github.io/PonyLab/',
  );

  const faviconHref = await page.locator('link[rel="icon"]').getAttribute('href');
  const faviconResponse = await page.evaluate(async (href) => {
    const response = await fetch(href, { cache: 'no-store' });

    return {
      contentType: response.headers.get('content-type'),
      status: response.status,
      url: response.url,
    };
  }, faviconHref!);
  expect(faviconResponse.status).toBe(200);
  expect(faviconResponse.url).toMatch(/\/PonyLab\/favicon\.ico$/);
  expect(faviconResponse.contentType).toContain('image/x-icon');
});

test('provides a working skip link and base-aware navigation links', async ({
  page,
}) => {
  await page.goto('./');
  const skipLink = page.getByRole('link', { name: '跳到主要内容' });
  const restingSkipLinkBox = await skipLink.boundingBox();

  expect(restingSkipLinkBox).not.toBeNull();
  expect(restingSkipLinkBox!.y + restingSkipLinkBox!.height).toBeLessThanOrEqual(0);

  await page.keyboard.press('Tab');
  await expect(skipLink).toBeFocused();
  await skipLink.press('Enter');
  await expect(page.locator('#main-content')).toBeFocused();

  const primaryNavigation = page.getByRole('navigation', { name: '主导航' });
  await expect(primaryNavigation.getByRole('link', { name: '首页' })).toHaveAttribute(
    'href',
    '/PonyLab/',
  );
  await expect(primaryNavigation.getByRole('link', { name: '博客' })).toHaveAttribute(
    'href',
    '/PonyLab/blog/',
  );
  await expect(primaryNavigation.getByRole('link', { name: '项目' })).toHaveAttribute(
    'href',
    '/PonyLab/projects/',
  );
  await expect(primaryNavigation.getByRole('link', { name: '关于' })).toHaveAttribute(
    'href',
    '/PonyLab/about/',
  );
  await expect(primaryNavigation.getByRole('link', { name: '首页' })).toHaveAttribute(
    'aria-current',
    'page',
  );
});

test('reflows without overflow at 320px and an effective 400% zoom viewport', async ({
  page,
}) => {
  const baselineDesktopWidth = 1280;
  const zoomFactor = 4;
  const effectiveCssWidth = baselineDesktopWidth / zoomFactor;

  await page.setViewportSize({ width: effectiveCssWidth, height: 720 });
  await page.goto('./');

  await expect(page.locator('#main-content')).toBeVisible();
  await expect(page.getByRole('button', { name: '打开导航菜单' })).toBeVisible();

  const dimensions = await page.evaluate(() => ({
    innerWidth: window.innerWidth,
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));

  expect(dimensions.innerWidth).toBe(effectiveCssWidth);
  expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth + 1);
});
