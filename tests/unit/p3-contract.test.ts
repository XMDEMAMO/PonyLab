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

describe('P3 command and dependency boundary', () => {
  it('adds Chromium Playwright without future-stage dependencies', async () => {
    const packageJson = JSON.parse(await readProjectFile('package.json')) as {
      scripts: Record<string, string>;
      devDependencies: Record<string, string>;
    };

    expect(packageJson.scripts['test:e2e']).toBe('playwright test');
    expect(packageJson.devDependencies).toHaveProperty('@playwright/test');
    expect(packageJson.scripts).not.toHaveProperty('build:search');
    expect(packageJson.devDependencies).not.toHaveProperty('pagefind');
  });

  it('runs the production build before Chromium E2E in CI', async () => {
    const workflow = await readProjectFile('.github/workflows/ci.yml');

    expect(workflow).toContain('npx playwright install --with-deps chromium');
    expect(workflow).toContain('npm run test:e2e');
    expect(workflow.indexOf('npm run build')).toBeLessThan(
      workflow.indexOf('npm run test:e2e'),
    );
    expect(workflow).toContain('playwright-report');
    expect(workflow).toContain('test-results');
    expect(workflow).not.toContain('firefox');
    expect(workflow).not.toContain('pagefind');
  });
});

describe('P3 global shell boundary', () => {
  it('creates the approved global layout components only', async () => {
    const expectedFiles = [
      'src/layouts/BaseLayout.astro',
      'src/components/global/GlobalBackground.astro',
      'src/components/global/MobileNavigation.astro',
      'src/components/global/PageHeader.astro',
      'src/components/global/SiteFooter.astro',
      'src/components/global/SiteHeader.astro',
      'src/components/global/ThemeController.astro',
      'playwright.config.ts',
    ];

    await expect(
      Promise.all(expectedFiles.map(projectFileExists)),
    ).resolves.toEqual(expectedFiles.map(() => true));

    expect(await projectFileExists('src/components/global/GlobalOverlay.astro')).toBe(
      false,
    );
  });

  it('replaces the template page and removes the template SVG favicon', async () => {
    const indexPage = await readProjectFile('src/pages/index.astro');

    expect(indexPage).toContain('BaseLayout');
    expect(indexPage).not.toContain('<html lang="en">');
    expect(indexPage).not.toContain('/favicon.svg');
    expect(await projectFileExists('public/favicon.svg')).toBe(false);
  });

  it('does not introduce ClientRouter or later-stage global features', async () => {
    const sourceFiles = [
      'src/layouts/BaseLayout.astro',
      'src/components/global/SiteHeader.astro',
      'src/components/global/MobileNavigation.astro',
    ];
    const source = (
      await Promise.all(sourceFiles.map((pathname) => readProjectFile(pathname)))
    ).join('\n');

    expect(source).not.toContain('ClientRouter');
    expect(source).not.toContain('GlobalMusicPlayer');
    expect(source).not.toContain('ScrollProgressControl');
  });
});
