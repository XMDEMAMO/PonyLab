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
  it('keeps the P3 E2E entrypoint while later phases extend the build', async () => {
    const packageJson = JSON.parse(await readProjectFile('package.json')) as {
      scripts: Record<string, string>;
      devDependencies: Record<string, string>;
    };

    expect(packageJson.scripts['test:e2e']).toBe('tsx scripts/run-e2e.ts');
    expect(packageJson.devDependencies).toHaveProperty('@playwright/test');
    expect(packageJson.scripts).toHaveProperty('build:search');
    expect(packageJson.devDependencies).toHaveProperty('pagefind');
  });

  it('runs the production build before Chromium E2E in CI', async () => {
    const workflow = await readProjectFile('.github/workflows/ci.yml');

    expect(workflow).toContain('npx playwright install --with-deps chromium firefox');
    expect(workflow).toContain('npm run test:e2e');
    expect(workflow.indexOf('npm run build')).toBeLessThan(
      workflow.indexOf('npm run test:e2e'),
    );
    expect(workflow).toContain('playwright-report');
    expect(workflow).toContain('test-results');
    expect(workflow).toContain('firefox');
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

  it('keeps later global features centralized in the shared layout', async () => {
    const sourceFiles = [
      'src/layouts/BaseLayout.astro',
      'src/components/global/SiteHeader.astro',
      'src/components/global/MobileNavigation.astro',
    ];
    const source = (
      await Promise.all(sourceFiles.map((pathname) => readProjectFile(pathname)))
    ).join('\n');

    expect(source.match(/ClientRouter/g)).toHaveLength(2);
    expect(source.match(/GlobalMusicPlayer/g)).toHaveLength(3);
    expect(source.match(/ScrollProgressControl/g)).toHaveLength(3);
  });
});
