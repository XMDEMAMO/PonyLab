import { access, readFile } from 'node:fs/promises';

import { describe, expect, it } from 'vitest';

const projectRoot = new URL('../../', import.meta.url);

async function readProjectFile(pathname: string): Promise<string> {
  return readFile(new URL(pathname, projectRoot), 'utf8');
}

async function projectFileExists(pathname: string): Promise<boolean> {
  try {
    await access(new URL(pathname, projectRoot));
    return true;
  } catch {
    return false;
  }
}

describe('P7 article reading boundary', () => {
  it('creates the article route, layout, components, and article-only prose stylesheet', async () => {
    const files = [
      'src/pages/blog/[...slug].astro',
      'src/layouts/ArticleLayout.astro',
      'src/components/article/ArticleHeader.astro',
      'src/components/article/TableOfContents.astro',
      'src/components/article/MarkdownContent.astro',
      'src/components/article/CodeEnhancements.astro',
      'src/components/article/PostNavigation.astro',
      'src/styles/prose.css',
      'src/utils/article.ts',
    ];

    await expect(Promise.all(files.map(projectFileExists))).resolves.toEqual(
      files.map(() => true),
    );
  });

  it('builds only published content routes with canonical path helpers and Astro render()', async () => {
    const route = await readProjectFile('src/pages/blog/[...slug].astro');

    expect(route).toContain('getStaticPaths');
    expect(route).toContain("getCollection('blog'");
    expect(route).toContain('filterPublishedPosts');
    expect(route).toContain('toArticleSlug');
    expect(route).toContain('render(post)');
    expect(route).toContain('getAdjacentPosts');
  });

  it('uses the unified math pipeline and keeps Expressive Code out of P7', async () => {
    const [packageJsonSource, astroConfig] = await Promise.all([
      readProjectFile('package.json'),
      readProjectFile('astro.config.mjs'),
    ]);
    const packageJson = JSON.parse(packageJsonSource) as {
      dependencies: Record<string, string>;
      devDependencies: Record<string, string>;
    };
    const allDependencies = {
      ...packageJson.dependencies,
      ...packageJson.devDependencies,
    };

    expect(allDependencies).toHaveProperty('@astrojs/markdown-remark');
    expect(allDependencies).toHaveProperty('remark-math');
    expect(allDependencies).toHaveProperty('rehype-katex');
    expect(allDependencies).toHaveProperty('katex');
    expect(allDependencies).not.toHaveProperty('astro-expressive-code');
    expect(astroConfig).toContain('unified');
    expect(astroConfig).toContain('remarkMath');
    expect(astroConfig).toContain('rehypeKatex');
  });

  it('keeps the project handoff and phase report synchronized with P7', async () => {
    const [readme, reportExists] = await Promise.all([
      readProjectFile('README.md'),
      projectFileExists('docs/stage-reports/p7-article-reading-report.md'),
    ]);

    expect(reportExists).toBe(true);
    expect(readme).toContain('P0–P13 已实施');
    expect(readme).toContain('/blog/[...slug]/');
    expect(readme).toContain('KaTeX');
  });
});
