import { expect, test } from '@playwright/test';

const projectUrl = 'http://127.0.0.1:4321/PonyLab/';

test('mobile dialog supports keyboard close and focus restoration', async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 720 });
  await page.goto('./');

  const trigger = page.getByRole('button', { name: '打开导航菜单' });
  const dialog = page.getByRole('dialog', { name: '移动导航' });

  await trigger.click();
  await expect(dialog).toBeVisible();
  await expect(page.locator('html')).toHaveClass(/is-dialog-open/);
  await expect(dialog.getByRole('button', { name: '关闭导航菜单' })).toBeFocused();

  await page.keyboard.press('Escape');
  await expect(dialog).not.toBeVisible();
  await expect(trigger).toBeFocused();
  await expect(page.locator('html')).not.toHaveClass(/is-dialog-open/);
});

test('keeps navigation and core content available without JavaScript', async ({
  browser,
}) => {
  const context = await browser.newContext({
    javaScriptEnabled: false,
    viewport: { width: 375, height: 720 },
  });
  const page = await context.newPage();

  await page.goto(projectUrl);
  await expect(page.getByRole('navigation', { name: '无脚本导航' })).toBeVisible();
  await expect(page.locator('#main-content')).toContainText('PonyLab');

  await context.close();
});

test('uses the desktop navigation above the mobile breakpoint', async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 768 });
  await page.goto('./');

  await expect(page.getByRole('navigation', { name: '主导航' })).toBeVisible();
  await expect(page.getByRole('button', { name: '打开导航菜单' })).not.toBeVisible();
});
