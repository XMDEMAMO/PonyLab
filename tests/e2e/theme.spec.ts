import { expect, test } from '@playwright/test';

test.use({ colorScheme: 'dark' });

test('resolves the system theme before interaction', async ({ page }) => {
  await page.goto('./');

  await expect(page.locator('html')).toHaveAttribute('data-theme-mode', 'system');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute(
    'content',
    '#111A21',
  );
});

test('cycles, stores, and restores the selected theme', async ({ page }) => {
  await page.addInitScript(() => {
    if (localStorage.getItem('ponylab-theme') === null) {
      localStorage.setItem('ponylab-theme', 'light');
    }
  });
  await page.goto('./');

  const toggle = page.getByRole('button', { name: /主题：浅色/ });
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await toggle.click();
  await expect(page.locator('html')).toHaveAttribute('data-theme-mode', 'dark');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await expect
    .poll(() => page.evaluate(() => localStorage.getItem('ponylab-theme')))
    .toBe('dark');

  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme-mode', 'dark');
  await expect(page.getByRole('button', { name: /主题：深色/ })).toBeVisible();
});
