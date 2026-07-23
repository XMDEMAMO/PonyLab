import { expect, test } from '@playwright/test';

test.describe('Pagefind production search', () => {
  test('loads the base-aware bundle and searches Chinese article content', async ({
    page,
  }) => {
    const pagefindRequests: string[] = [];
    page.on('response', (response) => {
      if (response.url().includes('/PonyLab/pagefind/')) {
        pagefindRequests.push(`${response.status()} ${response.url()}`);
      }
    });

    await page.goto('./blog/');
    await page.locator('[data-search-input]').fill('内容集合');
    await page.locator('[data-search-form]').press('Enter');

    await expect(page).toHaveURL(/q=%E5%86%85%E5%AE%B9%E9%9B%86%E5%90%88/);
    await expect(page.locator('[data-search-runtime]')).toContainText('Pagefind');
    await expect(page.locator('[data-blog-post]:visible')).toHaveCount(1);
    expect(pagefindRequests.some((request) => request.includes('200 http://127.0.0.1:4321/PonyLab/pagefind/pagefind.js'))).toBe(true);
  });

  test('combines search with static filters and restores query history', async ({ page }) => {
    await page.goto('./blog/');
    await page.locator('[data-search-input]').fill('PonyLab');
    await page.locator('[data-search-form]').press('Enter');
    await page.locator('[data-filter-kind="tag"][data-filter-value="astro"]').click();

    await expect(page).toHaveURL(/q=PonyLab&tag=astro/);
    await expect(page.locator('[data-blog-post]:visible')).toHaveCount(1);

    await page.locator('[data-search-input]').fill('zzzxqvnotfound');
    await page.locator('[data-search-form]').press('Enter');
    await expect(page.locator('[data-blog-empty]')).toBeVisible();

    await page.goBack();
    await expect(page).toHaveURL(/q=PonyLab&tag=astro/);
    await expect(page.locator('[data-search-input]')).toHaveValue('PonyLab');
    await expect(page.locator('[data-blog-post]:visible')).toHaveCount(1);
  });

  test('degrades to metadata browsing when the Pagefind bundle fails', async ({ page }) => {
    await page.route('**/PonyLab/pagefind/pagefind.js', (route) => route.abort());
    await page.goto('./blog/');
    await page.locator('[data-search-input]').fill('PonyLab');
    await page.locator('[data-search-form]').press('Enter');

    await expect(page.locator('[data-search-runtime]')).toContainText('全文索引暂时不可用');
    await expect(page.locator('[data-blog-post]:visible')).toHaveCount(1);
    await expect(page.getByRole('link', { name: /浏览完整归档/ })).toBeVisible();
  });
});
