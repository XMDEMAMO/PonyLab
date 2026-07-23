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

describe('P6 blog browsing boundary', () => {
  it('creates the approved pages, components, and shared pure utility', async () => {
    const expectedFiles = [
      'src/utils/blog.ts',
      'src/components/blog/BlogExplorer.astro',
      'src/components/blog/TagFilter.astro',
      'src/components/blog/FilterStatus.astro',
      'src/components/blog/PostList.astro',
      'src/components/blog/Pagination.astro',
      'src/components/blog/EmptyState.astro',
      'src/components/blog/ArchiveList.astro',
      'src/pages/blog/index.astro',
      'src/pages/tags/[tag].astro',
      'src/pages/categories/[category].astro',
      'src/pages/archive.astro',
      'docs/stage-reports/p6-blog-browsing-report.md',
    ];

    await expect(
      Promise.all(expectedFiles.map(projectFileExists)),
    ).resolves.toEqual(expectedFiles.map(() => true));
  });

  it('integrates later phases without duplicating the P6 blog components', async () => {
    const packageJson = JSON.parse(await readProjectFile('package.json')) as {
      scripts: Record<string, string>;
      dependencies: Record<string, string>;
      devDependencies: Record<string, string>;
    };

    expect(packageJson.scripts).toHaveProperty('build:search');
    expect(packageJson.devDependencies).toHaveProperty('pagefind');
    expect(await projectFileExists('src/components/blog/SearchField.astro')).toBe(
      true,
    );
    expect(await projectFileExists('src/components/global/GlobalMusicPlayer.astro')).toBe(
      true,
    );
    expect(await projectFileExists('src/components/global/ScrollProgressControl.astro')).toBe(
      true,
    );
  });

  it('keeps the project handoff documentation synchronized', async () => {
    const readme = await readProjectFile('README.md');

    expect(readme).toContain('P0–P13 已实施');
    expect(readme).toContain('/blog/');
  });
});
