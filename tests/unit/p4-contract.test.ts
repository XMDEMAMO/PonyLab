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

describe('P4 homepage boundary', () => {
  it('creates the approved static homepage components and shared base card', async () => {
    const expectedFiles = [
      'src/config/home.ts',
      'src/components/home/HomeHeroScene.astro',
      'src/components/home/HeroTitle.astro',
      'src/components/home/TerminalTyping.astro',
      'src/components/home/ProfileCard.astro',
      'src/components/home/HomeSectionTransition.astro',
      'src/components/home/LatestPosts.astro',
      'src/components/home/SiteStats.astro',
      'src/components/blog/PostCard.astro',
      'src/utils/home.ts',
    ];

    await expect(
      Promise.all(expectedFiles.map(projectFileExists)),
    ).resolves.toEqual(expectedFiles.map(() => true));
  });

  it('keeps optional enhancements out of the core implementation', async () => {
    const packageJson = JSON.parse(await readProjectFile('package.json')) as {
      scripts: Record<string, string>;
      dependencies: Record<string, string>;
      devDependencies: Record<string, string>;
    };
    const sourceFiles = [
      'src/pages/index.astro',
      'src/layouts/BaseLayout.astro',
      'src/components/global/SiteHeader.astro',
      'src/components/home/HomeHeroScene.astro',
      'src/components/home/HeroTitle.astro',
      'src/components/home/TerminalTyping.astro',
      'src/components/home/ProfileCard.astro',
      'src/components/home/HomeSectionTransition.astro',
      'src/components/home/LatestPosts.astro',
      'src/components/home/SiteStats.astro',
    ];
    const source = (
      await Promise.all(sourceFiles.map((pathname) => readProjectFile(pathname)))
    ).join('\n');

    expect(source).not.toContain('ClientRouter');
    expect(source).not.toContain('GlobalMusicPlayer');
    expect(source).not.toContain('ScrollProgressControl');
    expect(packageJson.scripts).not.toHaveProperty('build:search');
    expect(packageJson.dependencies).not.toHaveProperty('pagefind');
    expect(packageJson.devDependencies).not.toHaveProperty('pagefind');
  });

  it('uses the two complete scene assets without a required character layer', async () => {
    const homeConfig = await readProjectFile('src/config/home.ts');
    const heroScene = await readProjectFile(
      'src/components/home/HomeHeroScene.astro',
    );

    expect(homeConfig).toContain('home-hero-scene-light.png');
    expect(homeConfig).toContain('home-hero-scene-dark.jpg');
    expect(homeConfig).toContain('latestPostCount: 4');
    expect(homeConfig).not.toMatch(/\bcharacter\b/i);
    expect(heroScene).toContain("from 'astro:assets'");
    expect(heroScene).not.toMatch(/\bcharacter\b/i);
  });
});

describe('P4 documentation boundary', () => {
  it('keeps the README synchronized with the implemented phase and commands', async () => {
    const readme = await readProjectFile('README.md');

    expect(readme).toContain('P4');
    expect(readme).toContain('npm run validate:content');
    expect(readme).toContain('npm run test:e2e');
    expect(readme).toContain('/PonyLab/');
    expect(readme).toContain('src/assets/home/home-hero-scene-light.png');
    expect(readme).toContain('src/assets/home/home-hero-scene-dark.jpg');
    expect(readme).not.toContain('P1 说明');
  });

  it('prunes unreferenced raster masters from the final build entrypoint', async () => {
    const packageJson = JSON.parse(await readProjectFile('package.json')) as {
      scripts: Record<string, string>;
    };

    expect(packageJson.scripts.build).toContain('astro build');
    expect(packageJson.scripts.build).toContain('prune-image-masters.ts');
  });
});
