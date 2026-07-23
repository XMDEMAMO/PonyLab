import { expect, test } from '@playwright/test';

test('filters the complete project wall as a progressive enhancement', async ({ page }) => {
  const response = await page.goto('./projects/');

  expect(response?.status()).toBe(200);
  await expect(page.getByRole('heading', { level: 1, name: '项目' })).toBeVisible();
  await expect(page.locator('[data-project-card]:visible')).toHaveCount(4);
  await expect(page.locator('[data-project-filter]')).toBeVisible();

  const toolFilter = page.getByRole('button', { name: /工具 1/ });
  await toolFilter.focus();
  await expect(toolFilter).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(toolFilter).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('[data-project-card]:visible')).toHaveCount(1);
  await expect(page.locator('[data-project-filter-status]')).toHaveText(
    '当前显示工具项目 1 个。',
  );

  const allFilter = page.getByRole('button', { name: /全部 4/ });
  await allFilter.focus();
  await page.keyboard.press('Space');
  await expect(page.locator('[data-project-card]:visible')).toHaveCount(4);

  const externalLink = page.getByRole('link', { name: /源代码/ });
  await expect(externalLink).toHaveAttribute('target', '_blank');
  await expect(externalLink).toHaveAttribute('rel', 'noopener noreferrer');
});

test.describe('projects without JavaScript', () => {
  test.use({ javaScriptEnabled: false });

  test('keeps every project visible and hides non-functional filters', async ({ page }) => {
    await page.goto('./projects/');

    await expect(page.locator('[data-project-filter]')).toBeHidden();
    await expect(page.locator('[data-project-card]:visible')).toHaveCount(4);
    await expect(page.getByRole('heading', { level: 2, name: 'PonyLab' })).toBeVisible();
  });
});

test.describe('about without JavaScript', () => {
  test.use({ javaScriptEnabled: false });

  test('keeps the profile, status, and every hobby readable', async ({ page }) => {
    await page.goto('./about/');

    await expect(page.getByRole('heading', { level: 2, name: '作者名称待填写' })).toBeVisible();
    await expect(page.getByRole('heading', { level: 2, name: '当前状态' })).toBeVisible();
    await expect(page.locator('[data-hobby-card]')).toHaveCount(9);
  });
});

test('renders the profile, status terminal, and three hobby shelves', async ({ page }) => {
  const response = await page.goto('./about/');

  expect(response?.status()).toBe(200);
  await expect(page.getByRole('heading', { level: 1, name: '关于我' })).toBeVisible();
  await expect(
    page.getByRole('heading', { level: 2, name: '作者名称待填写' }),
  ).toBeVisible();
  await expect(page.getByRole('heading', { level: 2, name: '当前状态' })).toBeVisible();
  await expect(page.getByRole('heading', { level: 3, name: '喜欢的作品' })).toBeVisible();
  await expect(page.getByRole('heading', { level: 3, name: '喜欢的角色' })).toBeVisible();
  await expect(page.getByRole('heading', { level: 3, name: '正在玩的游戏' })).toBeVisible();
  await expect(page.locator('[data-hobby-card]')).toHaveCount(9);

  const hobbyAlts = await page.locator('[data-hobby-card] img').evaluateAll((images) =>
    images.map((image) => image.getAttribute('alt')),
  );
  expect(hobbyAlts).toHaveLength(9);
  expect(hobbyAlts.every((alt) => Boolean(alt?.trim()))).toBe(true);
});

for (const route of ['./projects/', './about/'] as const) {
  test(`${route} stays inside a 320px viewport`, async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 720 });
    await page.goto(route);

    const width = await page.evaluate(() => ({
      client: document.documentElement.clientWidth,
      scroll: document.documentElement.scrollWidth,
    }));
    expect(width.scroll).toBeLessThanOrEqual(width.client + 1);
  });
}

test('uses the planned one, two, and three-column project grid', async ({ page }) => {
  await page.goto('./projects/');

  for (const [width, expectedColumns] of [[390, 1], [768, 2], [1440, 3]] as const) {
    await page.setViewportSize({ width, height: 900 });
    const columns = await page.locator('[data-project-grid]').evaluate((grid) =>
      getComputedStyle(grid).gridTemplateColumns.split(' ').length,
    );
    expect(columns).toBe(expectedColumns);
  }
});

test('adds the P8 project count to the existing home statistics', async ({ page }) => {
  await page.goto('./');

  const stats = page.locator('.site-stats');
  await expect(stats.getByText('项目记录')).toBeVisible();
  await expect(stats.getByText('4', { exact: true })).toBeVisible();
});
