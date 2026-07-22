import { expect, test, type Page } from '@playwright/test';

type SceneSnapshot = {
  currentSrc: string;
  box: { x: number; y: number; width: number; height: number } | null;
  objectPosition: string;
  transform: string;
  filter: string;
};

async function setTheme(page: Page, theme: 'light' | 'dark'): Promise<void> {
  await page.addInitScript((selectedTheme) => {
    localStorage.setItem('ponylab-theme', selectedTheme);
  }, theme);
}

async function readScene(page: Page): Promise<SceneSnapshot> {
  return page.locator('[data-home-hero-image]').evaluate((image) => {
    const element = image as HTMLImageElement;
    const scene = element.closest('[data-home-hero-scene]');
    const box = element.getBoundingClientRect();
    const sceneBox = scene?.getBoundingClientRect();
    const style = getComputedStyle(element);

    return {
      currentSrc: element.currentSrc,
      box: sceneBox ? {
        x: box.x - sceneBox.x,
        y: box.y - sceneBox.y,
        width: box.width,
        height: box.height,
      } : null,
      objectPosition: style.objectPosition,
      transform: style.transform,
      filter: style.filter,
    };
  });
}

test('renders the P4 content in title, profile, and content order', async ({ page }) => {
  await page.goto('./');

  const title = page.getByRole('heading', { level: 1, name: 'PonyLab' });
  const profile = page.getByRole('heading', { level: 2, name: /作者名称待填写/ });
  const latest = page.getByRole('heading', { level: 2, name: '最新文章' });

  await expect(title).toBeVisible();
  await expect(profile).toBeVisible();
  await expect(latest).toBeVisible();
  expect(
    await page
      .locator('[data-home-reading-step]')
      .evaluateAll((nodes) =>
        nodes.map((node) => node.getAttribute('data-home-reading-step')),
      ),
  ).toEqual(['title', 'profile', 'content']);
  await expect(page.getByText('当前还没有已发布文章。')).toBeVisible();
  await expect(page.getByText('0', { exact: true })).toHaveCount(2);
});

for (const theme of ['light', 'dark'] as const) {
  test(`${theme} scene keeps one image instance and static image styles`, async ({
    page,
  }) => {
    await setTheme(page, theme);
    await page.goto('./');

    const scene = page.locator('[data-home-hero-scene]');
    const image = page.locator('[data-home-hero-image]');
    await expect(scene).toHaveAttribute('data-active-theme', theme);
    await expect(image).toHaveCount(1);
    await expect(image).toHaveAttribute('alt', /插画/);
    await expect.poll(async () => (await readScene(page)).currentSrc).toMatch(
      /_astro\//,
    );

    const before = await readScene(page);
    await page.evaluate(() => window.scrollBy(0, 240));
    await page.waitForTimeout(50);
    const after = await readScene(page);

    expect(after.currentSrc).toBe(before.currentSrc);
    expect(after.box).toEqual(before.box);
    expect(after.objectPosition).toBe(before.objectPosition);
    expect(after.transform).toBe(before.transform);
    expect(after.filter).toBe(before.filter);
  });
}

test('switching theme changes the source on the same image element', async ({ page }) => {
  await setTheme(page, 'light');
  await page.goto('./');

  const image = page.locator('[data-home-hero-image]');
  await expect.poll(async () => (await readScene(page)).currentSrc).toMatch(/_astro\//);
  await image.evaluate((element) => {
    (window as Window & { __ponylabHeroImage?: Element }).__ponylabHeroImage =
      element;
  });
  const lightScene = await readScene(page);

  await page.getByRole('button', { name: /主题：浅色/ }).click();
  await expect(page.locator('[data-home-hero-scene]')).toHaveAttribute(
    'data-active-theme',
    'dark',
  );
  await expect.poll(async () => (await readScene(page)).currentSrc).not.toBe(
    lightScene.currentSrc,
  );

  expect(
    await image.evaluate(
      (element) =>
        element ===
        (window as Window & { __ponylabHeroImage?: Element }).__ponylabHeroImage,
    ),
  ).toBe(true);
});

const responsiveCases = [
  { name: 'wide desktop', width: 1440, height: 900 },
  { name: 'desktop tablet', width: 1024, height: 768 },
  { name: 'mobile 390', width: 390, height: 844 },
  { name: 'mobile 360', width: 360, height: 800 },
  { name: 'low landscape', width: 844, height: 390 },
] as const;

for (const viewport of responsiveCases) {
  for (const theme of ['light', 'dark'] as const) {
    test(`${viewport.name} ${theme} keeps the static composition readable`, async ({
      page,
    }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await setTheme(page, theme);
      await page.goto('./');

      const image = page.locator('[data-home-hero-image]');
      const title = page.locator('[data-home-reading-step="title"]');
      const profile = page.locator('[data-home-reading-step="profile"]');
      await expect(page.locator('[data-home-hero-scene]')).toHaveAttribute(
        'data-active-theme',
        theme,
      );
      await expect.poll(async () => (await readScene(page)).currentSrc).toContain(
        `home-hero-scene-${theme}`,
      );

      const [titleBox, profileBox, scene, dimensions] = await Promise.all([
        title.boundingBox(),
        profile.boundingBox(),
        readScene(page),
        page.evaluate(() => ({
          clientWidth: document.documentElement.clientWidth,
          scrollWidth: document.documentElement.scrollWidth,
        })),
      ]);
      expect(titleBox).not.toBeNull();
      expect(profileBox).not.toBeNull();
      expect(scene.box).not.toBeNull();
      expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth + 1);
      expect(scene.objectPosition).toBe(
        viewport.width < 768
          ? theme === 'light' ? '48% 54%' : '43% 46%'
          : theme === 'light' ? '0% 50%' : '50% 48%',
      );

      if (titleBox && profileBox) {
        const overlaps = !(
          titleBox.x + titleBox.width <= profileBox.x ||
          profileBox.x + profileBox.width <= titleBox.x ||
          titleBox.y + titleBox.height <= profileBox.y ||
          profileBox.y + profileBox.height <= titleBox.y
        );
        expect(overlaps).toBe(false);
      }
      await expect(image).toHaveAttribute('alt', /插画/);
    });
  }
}

test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false });

  test('keeps the complete natural reading order and a scene fallback', async ({ page }) => {
    await page.goto('./');

    await expect(page.getByRole('heading', { level: 1, name: 'PonyLab' })).toBeVisible();
    await expect(
      page.getByRole('heading', { level: 2, name: /作者名称待填写/ }),
    ).toBeVisible();
    await expect(page.getByRole('heading', { level: 2, name: '最新文章' })).toBeVisible();
    const hero = page.locator('.home-hero');
    const fallback = page.locator('[data-home-hero-noscript] img');
    await expect(
      page.locator('.home-hero-scene__picture--managed'),
    ).toHaveAttribute('hidden', '');
    await expect(fallback).toBeVisible();

    const [heroBox, fallbackBox] = await Promise.all([
      hero.boundingBox(),
      fallback.boundingBox(),
    ]);
    expect(heroBox).not.toBeNull();
    expect(fallbackBox).not.toBeNull();
    if (heroBox && fallbackBox) {
      expect(Math.min(heroBox.x + heroBox.width, fallbackBox.x + fallbackBox.width) -
        Math.max(heroBox.x, fallbackBox.x)).toBeGreaterThan(0);
      expect(Math.min(heroBox.y + heroBox.height, fallbackBox.y + fallbackBox.height) -
        Math.max(heroBox.y, fallbackBox.y)).toBeGreaterThan(0);
    }
  });
});
