import { expect, test, type Page } from '@playwright/test';

type ImageSnapshot = {
  currentSrc: string;
  relativeBox: { x: number; y: number; width: number; height: number };
  objectPosition: string;
  transform: string;
  filter: string;
  scale: string;
  brightness: string;
  saturation: string;
  blur: string;
};

async function setTheme(page: Page, theme: 'light' | 'dark'): Promise<void> {
  await page.addInitScript((selectedTheme) => {
    localStorage.setItem('ponylab-theme', selectedTheme);
  }, theme);
}

async function scrollSceneTo(page: Page, progress: number): Promise<void> {
  await page.locator('[data-home-scroll-scene]').evaluate((root, targetProgress) => {
    const sticky = root.querySelector<HTMLElement>('[data-home-scroll-visual]');
    if (!sticky) throw new Error('Missing home scroll visual');

    const rootBox = root.getBoundingClientRect();
    const stickyBox = sticky.getBoundingClientRect();
    const stickyTop = Number.parseFloat(getComputedStyle(sticky).top) || 0;
    const documentTop = window.scrollY + rootBox.top;
    const travel = rootBox.height - stickyBox.height;

    window.scrollTo(0, documentTop - stickyTop + (travel * targetProgress));
  }, progress);

  await page.evaluate(
    () => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))),
  );
  await page.waitForTimeout(220);
}

async function readImageSnapshot(page: Page): Promise<ImageSnapshot> {
  return page.locator('[data-home-hero-image]').evaluate((image) => {
    const element = image as HTMLImageElement;
    const scene = element.closest<HTMLElement>('[data-home-hero-scene]');
    if (!scene) throw new Error('Missing home hero scene');

    const box = element.getBoundingClientRect();
    const sceneBox = scene.getBoundingClientRect();
    const style = getComputedStyle(element);

    return {
      currentSrc: element.currentSrc,
      relativeBox: {
        x: box.x - sceneBox.x,
        y: box.y - sceneBox.y,
        width: box.width,
        height: box.height,
      },
      objectPosition: style.objectPosition,
      transform: style.transform,
      filter: style.filter,
      scale: style.scale,
      brightness: style.getPropertyValue('brightness'),
      saturation: style.getPropertyValue('saturation'),
      blur: style.getPropertyValue('blur'),
    };
  });
}

async function readForeground(page: Page) {
  return page.locator('[data-home-scroll-scene]').evaluate((root) => {
    const title = root.querySelector<HTMLElement>('[data-home-title-layer]');
    const profile = root.querySelector<HTMLElement>('[data-home-profile-layer]');
    const profileAvatar = root.querySelector<HTMLElement>('[data-profile-avatar]');
    const profileTerminal = root.querySelector<HTMLElement>('[data-profile-terminal]');
    const visual = root.querySelector<HTMLElement>('[data-home-scroll-visual]');
    if (!title || !profile || !profileAvatar || !profileTerminal || !visual) {
      throw new Error('Missing home foreground layer');
    }

    const titleStyle = getComputedStyle(title);
    const avatarStyle = getComputedStyle(profileAvatar);
    const terminalStyle = getComputedStyle(profileTerminal);
    const visualStyle = getComputedStyle(visual);

    return {
      stage: root.getAttribute('data-home-scroll-stage'),
      title: { opacity: Number(titleStyle.opacity), transform: titleStyle.transform },
      profile: {
        opacity: Math.max(Number(avatarStyle.opacity), Number(terminalStyle.opacity)),
        transform: `${avatarStyle.transform} | ${terminalStyle.transform}`,
        inert: profile.hasAttribute('inert'),
        ariaHidden: profile.getAttribute('aria-hidden'),
      },
      visual: { opacity: Number(visualStyle.opacity), transform: visualStyle.transform },
    };
  });
}

test('wheel intent rebounds below the threshold and docks as one linked sequence', async ({
  page,
}) => {
  await page.goto('./');

  const root = page.locator('[data-home-scroll-scene]');
  const initialScrollY = await page.evaluate(() => window.scrollY);

  await page.mouse.wheel(0, 64);
  await expect(root).toHaveAttribute('data-home-motion-state', 'pulling');
  await expect(root).toHaveAttribute('data-home-scroll-stage', '1');
  await page.waitForTimeout(760);
  await expect(root).toHaveAttribute('data-home-motion-state', 'intro');
  expect(await page.evaluate(() => window.scrollY)).toBe(initialScrollY);

  await page.mouse.wheel(0, 100);
  await page.mouse.wheel(0, 100);
  await page.mouse.wheel(0, 100);

  await expect(root).toHaveAttribute('data-home-motion-state', 'docking');
  await expect(root).toHaveAttribute('data-home-scroll-stage', '2');
  await expect(page.locator('[data-home-title-layer]')).toHaveCSS('opacity', '0');
  await expect(root).toHaveAttribute('data-home-motion-state', 'profile', {
    timeout: 3_200,
  });
  await expect(page.locator('[data-profile-avatar]')).toBeVisible();
  await expect(page.locator('[data-profile-terminal]')).toBeVisible();
  await expect(page.locator('[data-terminal-typing]')).toContainText('profile@ponylab:~$');
});

for (const theme of ['light', 'dark'] as const) {
  test(`${theme} keeps the same static scene through stages one and two`, async ({
    page,
  }) => {
    const sceneRequests: string[] = [];
    page.on('request', (request) => {
      if (request.url().includes(`home-hero-scene-${theme}`)) {
        sceneRequests.push(request.url());
      }
    });
    await setTheme(page, theme);
    await page.goto('./');
    await expect(page.locator('[data-home-scroll-scene]')).toHaveAttribute(
      'data-home-scroll-mode',
      'enhanced',
    );
    await expect
      .poll(() => page.locator('[data-home-hero-image]').evaluate((image) => (
        (image as HTMLImageElement).complete && (image as HTMLImageElement).naturalWidth > 0
      )))
      .toBe(true);

    await page.locator('[data-home-hero-image]').evaluate((image) => {
      (window as Window & { __ponylabP5Image?: Element }).__ponylabP5Image = image;
    });
    await scrollSceneTo(page, 0.08);
    const stageOneImage = await readImageSnapshot(page);
    const stageOneForeground = await readForeground(page);
    const stageOneRequestCount = sceneRequests.length;

    await scrollSceneTo(page, 0.48);
    const stageTwoImage = await readImageSnapshot(page);
    const stageTwoForeground = await readForeground(page);
    await page.waitForTimeout(100);

    expect(stageOneForeground.stage).toBe('1');
    expect(stageOneForeground.title.opacity).toBeGreaterThan(0.95);
    expect(stageOneForeground.profile.opacity).toBeLessThan(0.05);
    expect(stageOneForeground.profile.inert).toBe(true);
    expect(stageOneForeground.profile.ariaHidden).toBe('true');

    expect(stageTwoForeground.stage).toBe('2');
    expect(stageTwoForeground.title.opacity).toBeLessThan(0.05);
    expect(stageTwoForeground.profile.opacity).toBeGreaterThan(0.9);
    expect(stageTwoForeground.profile.inert).toBe(false);
    expect(stageTwoForeground.profile.ariaHidden).toBe('false');
    expect(stageTwoForeground.visual).toEqual(stageOneForeground.visual);

    expect(stageTwoImage).toEqual(stageOneImage);
    expect(sceneRequests).toHaveLength(stageOneRequestCount);
    expect(
      await page.locator('[data-home-hero-image]').evaluate(
        (image) => image === (window as Window & { __ponylabP5Image?: Element }).__ponylabP5Image,
      ),
    ).toBe(true);
  });
}

test('stage three exits the complete hero visual and reveals content', async ({ page }) => {
  await page.goto('./');
  await scrollSceneTo(page, 0.86);

  const foreground = await readForeground(page);
  expect(foreground.stage).toBe('3');
  // Keep the scene legible until the sticky region releases so there is no blank viewport
  // between the hero and the incoming article content.
  expect(foreground.visual.opacity).toBeGreaterThan(0.7);
  expect(foreground.visual.transform).not.toBe('none');

  await scrollSceneTo(page, 1);
  expect((await readForeground(page)).visual.opacity).toBeGreaterThan(0.7);
  await page.mouse.wheel(0, Math.round(page.viewportSize()!.height * 0.55));
  await expect(page.getByRole('heading', { level: 2, name: '最新文章' })).toBeVisible();
  await expect(page.getByRole('heading', { level: 2, name: '最新文章' })).toBeInViewport();
});

test('theme switching in stage two changes only the source and keeps the stage', async ({
  page,
}) => {
  await setTheme(page, 'light');
  await page.goto('./');
  await scrollSceneTo(page, 0.48);

  const image = page.locator('[data-home-hero-image]');
  await image.evaluate((element) => {
    (window as Window & { __ponylabP5ThemeImage?: Element }).__ponylabP5ThemeImage = element;
  });
  const before = await readImageSnapshot(page);

  await page.getByRole('button', { name: /主题：浅色/ }).click();
  await expect(page.locator('[data-home-scroll-scene]')).toHaveAttribute(
    'data-home-scroll-stage',
    '2',
  );
  await expect(page.locator('[data-home-hero-scene]')).toHaveAttribute(
    'data-active-theme',
    'dark',
  );
  await expect.poll(async () => (await readImageSnapshot(page)).currentSrc).not.toBe(
    before.currentSrc,
  );
  expect(
    await image.evaluate(
      (element) => element === (
        window as Window & { __ponylabP5ThemeImage?: Element }
      ).__ponylabP5ThemeImage,
    ),
  ).toBe(true);
});

test('mobile keeps all three stages without horizontal overflow', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('./');

  for (const [progress, stage] of [[0.08, '1'], [0.48, '2'], [0.86, '3']] as const) {
    await scrollSceneTo(page, progress);
    await expect(page.locator('[data-home-scroll-scene]')).toHaveAttribute(
      'data-home-scroll-stage',
      stage,
    );
    expect(
      await page.evaluate(() => ({
        clientWidth: document.documentElement.clientWidth,
        scrollWidth: document.documentElement.scrollWidth,
      })),
    ).toEqual({ clientWidth: 390, scrollWidth: 390 });
  }
});

test('low-height landscape uses the natural-flow fallback', async ({ page }) => {
  await page.setViewportSize({ width: 844, height: 390 });
  await page.goto('./');

  const root = page.locator('[data-home-scroll-scene]');
  await expect(root).toHaveAttribute('data-home-scroll-mode', 'natural');
  await expect(root).toHaveAttribute('data-home-scroll-stage', 'all');
  await expect(page.locator('[data-home-profile-layer]')).toHaveAttribute(
    'aria-hidden',
    'false',
  );
});

test('re-evaluates the scroll mode when the viewport is resized', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('./');
  await scrollSceneTo(page, 0.48);

  const root = page.locator('[data-home-scroll-scene]');
  await expect(root).toHaveAttribute('data-home-scroll-mode', 'enhanced');
  await expect(root).toHaveAttribute('data-home-scroll-stage', '2');

  await page.setViewportSize({ width: 844, height: 390 });
  await expect(root).toHaveAttribute('data-home-scroll-mode', 'natural');
  await expect(root).toHaveAttribute('data-home-scroll-stage', 'all');

  await page.setViewportSize({ width: 1440, height: 900 });
  await expect(root).toHaveAttribute('data-home-scroll-mode', 'enhanced');
  await expect(root).not.toHaveAttribute('data-home-scroll-stage', 'all');
});

test('constrained devices use the natural-flow fallback', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'hardwareConcurrency', {
      configurable: true,
      get: () => 2,
    });
  });
  await page.goto('./');

  await expect(page.locator('[data-home-scroll-scene]')).toHaveAttribute(
    'data-home-scroll-mode',
    'natural',
  );
});

test.describe('reduced motion', () => {
  test.use({ contextOptions: { reducedMotion: 'reduce' } });

  test('keeps title, profile, and content in natural reading order', async ({ page }) => {
    await page.goto('./');

    const root = page.locator('[data-home-scroll-scene]');
    expect(
      await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches),
    ).toBe(true);
    await expect(root).toHaveAttribute('data-home-scroll-mode', 'natural');
    await expect(root).toHaveAttribute('data-home-scroll-stage', 'all');
    await expect(page.getByRole('heading', { level: 1, name: 'PonyLab' })).toBeVisible();
    await expect(
      page.getByRole('heading', { level: 2, name: /作者名称待填写/ }),
    ).toBeVisible();
    await expect(page.getByRole('heading', { level: 2, name: '最新文章' })).toBeVisible();
    await expect(page.locator('[data-home-profile-layer]')).not.toHaveAttribute('inert', '');
  });
});
