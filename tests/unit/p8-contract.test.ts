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

describe('P8 projects and about boundary', () => {
  it('creates only the approved P8 data, components, routes, utility, and report', async () => {
    const files = [
      'src/types/showcase.ts',
      'src/utils/projects.ts',
      'src/data/projects.ts',
      'src/data/hobbies.ts',
      'src/config/about.ts',
      'src/components/projects/ProjectFilter.astro',
      'src/components/projects/ProjectGrid.astro',
      'src/components/projects/ProjectCard.astro',
      'src/components/about/AboutProfile.astro',
      'src/components/about/CurrentStatus.astro',
      'src/components/about/HobbyShowcase.astro',
      'src/components/about/HobbyCard.astro',
      'src/pages/projects.astro',
      'src/pages/about.astro',
      'docs/stage-reports/p8-projects-about-report.md',
    ];

    await expect(Promise.all(files.map(projectFileExists))).resolves.toEqual(
      files.map(() => true),
    );
  });

  it('keeps four project records and three groups of three hobby records in typed data', async () => {
    const [projects, hobbies] = await Promise.all([
      readProjectFile('src/data/projects.ts'),
      readProjectFile('src/data/hobbies.ts'),
    ]);

    expect(projects).toContain('satisfies readonly ProjectRecord[]');
    expect(projects.match(/slug:/gu)).toHaveLength(4);
    expect(hobbies).toContain('satisfies readonly HobbyRecord[]');
    expect(hobbies.match(/slug:/gu)).toHaveLength(9);
  });

  it('connects the P8 project count to the existing home stats without a parallel stats component', async () => {
    const [homePage, siteStats] = await Promise.all([
      readProjectFile('src/pages/index.astro'),
      readProjectFile('src/components/home/SiteStats.astro'),
    ]);

    expect(homePage).toContain("from '../data/projects'");
    expect(homePage).toContain('projectCount={projects.length}');
    expect(siteStats).toContain('projectCount: number');
    expect(siteStats).toContain('projectLabel: string');
    expect(await projectFileExists('src/components/home/ProjectStats.astro')).toBe(false);
  });

  it('advances the project handoff and links the P8 report', async () => {
    const readme = await readProjectFile('README.md');

    expect(readme).toContain('P0–P13 已实施');
    expect(readme).toContain('/projects/');
    expect(readme).toContain('/about/');
  });

  it('keeps an empty project collection understandable without JavaScript', async () => {
    const projectGrid = await readProjectFile('src/components/projects/ProjectGrid.astro');

    expect(projectGrid).toContain('projects.length === 0');
    expect(projectGrid).toContain('data-project-empty');
  });

  it('contains the later Pagefind, music, and scroll phases after P8 completion', async () => {
    const packageJson = JSON.parse(await readProjectFile('package.json')) as {
      scripts: Record<string, string>;
      dependencies: Record<string, string>;
      devDependencies: Record<string, string>;
    };

    expect(packageJson.scripts).toHaveProperty('build:search');
    expect(packageJson.devDependencies).toHaveProperty('pagefind');
    expect(await projectFileExists('src/components/global/GlobalMusicPlayer.astro')).toBe(true);
    expect(await projectFileExists('src/components/global/ScrollProgressControl.astro')).toBe(true);
  });
});
