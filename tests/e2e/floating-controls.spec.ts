import { expect, test } from '@playwright/test';

const articlePath = './blog/astro/ponylab-content-foundation/';

test('uses one auxiliary right-side progress control without replacing native scrolling', async ({ page }) => {
  await page.goto(articlePath);
  const control = page.locator('[data-scroll-progress-control]');
  await expect(control).toBeVisible();
  expect(
    await page.evaluate(() => getComputedStyle(document.documentElement).overflowY),
  ).not.toBe('hidden');

  await control.getByRole('button', { name: '跳到页面底部' }).click();
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(300);
  await expect
    .poll(async () =>
      Number(await control.locator('[data-scroll-progress]').getAttribute('aria-valuenow')),
    )
    .toBeGreaterThan(80);
});

test('hides the auxiliary control on a narrow viewport', async ({ page }) => {
  await page.setViewportSize({ width: 600, height: 800 });
  await page.goto(articlePath);
  await expect(page.locator('[data-scroll-progress-control]')).toBeHidden();
});

test('returns to the top and honors reduced motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(articlePath);
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  const button = page.getByRole('button', { name: '返回页面顶部' });
  await expect(button).toBeVisible();
  await button.click();
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
});
