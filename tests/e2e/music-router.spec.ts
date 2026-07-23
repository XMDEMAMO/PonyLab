import { expect, test } from '@playwright/test';

test.describe('ClientRouter and persistent music', () => {
  test('keeps one playing audio instance across home, blog, article, and history', async ({ page }) => {
    await page.goto('./');
    const audio = page.locator('[data-music-audio]');
    await expect(audio).toHaveCount(1);
    await audio.evaluate((element: HTMLAudioElement) => {
      element.muted = true;
      (window as Window & { __ponylabAudio?: HTMLAudioElement }).__ponylabAudio = element;
    });

    await page.locator('[data-music-toggle]').click();
    await page.locator('[data-music-play]').click();
    await expect.poll(() => audio.evaluate((element) => (element as HTMLAudioElement).currentTime)).toBeGreaterThan(0.15);
    const timeBeforeRoute = await audio.evaluate((element) => (element as HTMLAudioElement).currentTime);

    await page.getByRole('link', { name: '博客', exact: true }).click();
    await expect(page).toHaveURL(/\/PonyLab\/blog\/$/);
    expect(
      await page.evaluate(
        () =>
          (window as Window & { __ponylabAudio?: HTMLAudioElement }).__ponylabAudio ===
          document.querySelector('[data-music-audio]'),
      ),
    ).toBe(true);
    await expect(page.locator('[data-music-audio]')).toHaveCount(1);
    await expect.poll(() => audio.evaluate((element) => (element as HTMLAudioElement).currentTime)).toBeGreaterThan(timeBeforeRoute);

    await page.locator('[data-blog-post] h3 a').click();
    await expect(page).toHaveURL(/\/PonyLab\/blog\/astro\/ponylab-content-foundation\/$/);
    await expect(page.locator('[data-music-audio]')).toHaveCount(1);
    await expect(page.locator('[data-article-content]')).toBeVisible();

    await page.goBack();
    await expect(page).toHaveURL(/\/PonyLab\/blog\/$/);
    await expect(page.locator('[data-music-audio]')).toHaveCount(1);
  });

  test('restores track position and volume after refresh without resuming playback', async ({ page }) => {
    await page.goto('./blog/');
    const audio = page.locator('[data-music-audio]');
    await expect.poll(() => audio.evaluate((element) => (element as HTMLAudioElement).readyState)).toBeGreaterThan(0);
    await audio.evaluate((element: HTMLAudioElement) => {
      element.volume = 0.4;
      element.currentTime = 2;
      element.dispatchEvent(new Event('timeupdate'));
    });

    await page.reload();
    await expect.poll(() => audio.evaluate((element) => (element as HTMLAudioElement).readyState)).toBeGreaterThan(0);
    await expect.poll(() => audio.evaluate((element) => (element as HTMLAudioElement).currentTime)).toBeGreaterThan(1.7);
    expect(await audio.evaluate((element) => (element as HTMLAudioElement).paused)).toBe(true);
    expect(await audio.evaluate((element) => (element as HTMLAudioElement).volume)).toBeCloseTo(0.4, 1);
  });

  test('reports an unavailable local track without breaking navigation', async ({ page }) => {
    await page.route('**/PonyLab/audio/*.wav', (route) => route.abort());
    await page.goto('./');
    await page.locator('[data-music-toggle]').click();
    await page.locator('[data-music-play]').click();
    await expect(page.locator('[data-music-status]')).toContainText('音频加载失败');

    await page.getByRole('link', { name: '项目', exact: true }).click();
    await expect(page).toHaveURL(/\/PonyLab\/projects\/$/);
    await expect(page.locator('[data-project-explorer]')).toBeVisible();
  });
});
