import { expect, test, type Page } from '@playwright/test';
import { installClipboardMock } from './helpers/clipboard';

const fixturePosts = Array.from({ length: 10 }, (_, index) => ({
  id: `fixture-${index + 1}`,
  title: `测试文章 ${index + 1}`,
  category: index === 9 ? 'notes' : 'technology',
  tags:
    index === 9
      ? ['typescript']
      : index === 8
        ? ['astro', 'frontend-development']
        : ['astro'],
}));

function fixtureMarkup() {
  return fixturePosts
    .map(
      (post) =>
        `<article data-blog-post data-post-id="${post.id}" data-post-category="${post.category}" data-post-tags="${post.tags.join(' ')}"><h3>${post.title}</h3></article>`,
    )
    .join('');
}

async function injectFixturePosts(page: Page): Promise<void> {
  await page.addInitScript((posts) => {
    const inject = () => {
      const list = document.querySelector<HTMLElement>('[data-post-list]');

      if (!list || list.dataset.fixturePosts === 'true') return;
      list.dataset.fixturePosts = 'true';
      list.replaceChildren();

      for (const post of posts) {
        const card = document.createElement('article');
        card.dataset.blogPost = '';
        card.dataset.postId = post.id;
        card.dataset.postCategory = post.category;
        card.dataset.postTags = post.tags.join(' ');
        const title = document.createElement('h3');
        title.textContent = post.title;
        card.append(title);
        list.append(card);
      }
    };

    const observer = new MutationObserver(inject);
    observer.observe(document, { childList: true, subtree: true });
    inject();
  }, fixturePosts);
}

test.describe('blog progressive enhancement', () => {
  test.beforeEach(async ({ page }) => {
    await injectFixturePosts(page);
  });

  test('paginates after the complete static list and restores a direct page URL', async ({
    page,
  }) => {
    await page.goto('./blog/');

    await expect(page.locator('[data-filter-status]')).toContainText('共 10 篇文章');
    await expect(page.locator('[data-blog-post]:visible')).toHaveCount(8);
    await page.getByRole('button', { name: '下一页' }).click();
    await expect(page).toHaveURL(/\/PonyLab\/blog\/\?page=2$/);
    await expect(page.locator('[data-blog-post]:visible')).toHaveCount(2);
    await expect(page.locator('[data-pagination-status]')).toHaveText('第 2 / 2 页');

    await page.reload();
    await expect(page.locator('[data-blog-post]:visible')).toHaveCount(2);
    await expect(page.locator('[data-pagination-status]')).toHaveText('第 2 / 2 页');
  });

  test('combines filters, restores history, clears state, and copies the share URL', async ({
    page,
  }) => {
    await installClipboardMock(page);
    await page.goto('./blog/');

    await page.locator('[data-filter-kind="tag"][data-filter-value="typescript"]').click();
    await expect(page).toHaveURL(/tag=typescript/);
    await expect(page.locator('[data-blog-post]:visible')).toHaveCount(1);

    await page.locator('[data-filter-kind="category"][data-filter-value="notes"]').click();
    await expect(page).toHaveURL(/tag=typescript&category=notes/);
    await expect(page.locator('[data-blog-post]:visible')).toHaveCount(1);

    await page.locator('[data-filter-kind="category"][data-filter-value="technology"]').click();
    await expect(page.locator('[data-blog-post]:visible')).toHaveCount(0);
    await expect(page.locator('[data-blog-empty]')).toBeVisible();

    await page.goBack();
    await expect(page).toHaveURL(/category=notes/);
    await expect(page.locator('[data-blog-post]:visible')).toHaveCount(1);

    await page.locator('[data-filter-clear]').click();
    await expect(page).toHaveURL(/\/PonyLab\/blog\/$/);
    await expect(page.locator('[data-blog-post]:visible')).toHaveCount(8);

    await page.locator('[data-filter-kind="tag"][data-filter-value="astro"]').click();
    await page.locator('[data-filter-copy]').click();
    await expect(page.locator('[data-filter-copy]')).toHaveText('链接已复制');
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(page.url());
  });

  test('keeps long filter labels and list cards inside a 320px viewport', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 720 });
    await page.goto('./blog/');
    await page
      .locator('[data-filter-kind="tag"][data-filter-value="frontend-development"]')
      .click();

    await expect(page.locator('[data-blog-post]:visible')).toHaveCount(1);
    const width = await page.evaluate(() => ({
      client: document.documentElement.clientWidth,
      scroll: document.documentElement.scrollWidth,
    }));
    expect(width.scroll).toBeLessThanOrEqual(width.client + 1);
  });
});

test('builds direct, shareable tag, category, and archive routes', async ({ page }) => {
  const routes = [
    './tags/astro/',
    './tags/frontend-development/',
    './categories/technology/',
    './categories/projects/',
    './archive/',
  ];

  for (const route of routes) {
    const response = await page.goto(route);
    expect(response?.status()).toBe(200);
    await expect(page.locator('main h1')).toBeVisible();
  }
});

test.describe('blog without JavaScript', () => {
  test.use({ javaScriptEnabled: false });

  test('shows the complete HTML list and does not pretend query pagination is static', async ({
    page,
  }) => {
    await page.route('**/PonyLab/blog/**', async (route) => {
      const response = await route.fetch();
      const html = (await response.text()).replaceAll(
        'data-blog-post',
        'data-blog-post hidden',
      );
      const listMarker = '<div class="post-list" data-post-list';
      const markerIndex = html.indexOf(listMarker);
      const openingEnd = markerIndex >= 0 ? html.indexOf('>', markerIndex) : -1;

      expect(markerIndex).toBeGreaterThanOrEqual(0);
      expect(openingEnd).toBeGreaterThan(markerIndex);
      await route.fulfill({
        response,
        body: `${html.slice(0, openingEnd + 1)}${fixtureMarkup()}${html.slice(openingEnd + 1)}`,
      });
    });

    await page.goto('./blog/?page=2&tag=astro');

    await expect(page.locator('[data-blog-post]:visible')).toHaveCount(10);
    await expect(page.getByRole('link', { name: /浏览完整归档/ })).toHaveAttribute(
      'href',
      '/PonyLab/archive/',
    );
    await expect(page.locator('[data-pagination]')).toBeHidden();
    await expect(page.locator('[data-filter-copy]')).toBeHidden();
  });
});
