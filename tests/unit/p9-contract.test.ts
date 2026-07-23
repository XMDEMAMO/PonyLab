import { readFile } from 'node:fs/promises';

import { describe, expect, it } from 'vitest';

const projectRoot = new URL('../../', import.meta.url);
const read = (pathname: string) => readFile(new URL(pathname, projectRoot), 'utf8');

describe('P9 Pagefind build contract', () => {
  it('makes Pagefind part of the single production build entrypoint', async () => {
    const packageJson = JSON.parse(await read('package.json')) as {
      scripts: Record<string, string>;
      devDependencies: Record<string, string>;
    };

    expect(packageJson.devDependencies).toHaveProperty('pagefind');
    expect(packageJson.scripts.build).toContain('build:astro');
    expect(packageJson.scripts.build).toContain('build:search');
    expect(packageJson.scripts['build:search']).toContain('pagefind --site dist');
  });

  it('indexes only the article body and configures the base path before init', async () => {
    const [markdown, explorer] = await Promise.all([
      read('src/components/article/MarkdownContent.astro'),
      read('src/components/blog/BlogExplorer.astro'),
    ]);

    expect(markdown).toContain('data-pagefind-body');
    expect(markdown).toContain('data-pagefind-meta');
    expect(explorer.indexOf('module.options')).toBeLessThan(explorer.indexOf('module.init'));
    expect(explorer).toContain('import.meta.env.BASE_URL');
  });
});
