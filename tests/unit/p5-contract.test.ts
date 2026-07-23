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

describe('P5 homepage scroll boundary', () => {
  it('adds the scroll scene and pure progress model without later-phase features', async () => {
    await expect(
      Promise.all([
        projectFileExists('src/components/home/HomeScrollScene.astro'),
        projectFileExists('src/utils/home-scroll.ts'),
      ]),
    ).resolves.toEqual([true, true]);

    const packageJson = JSON.parse(await readProjectFile('package.json')) as {
      dependencies: Record<string, string>;
      devDependencies: Record<string, string>;
    };
    const homepage = await readProjectFile('src/pages/index.astro');

    expect(homepage).toContain('HomeScrollScene');
    expect(homepage).not.toContain('ClientRouter');
    expect(homepage).not.toContain('GlobalMusicPlayer');
    expect(homepage).not.toContain('ScrollProgressControl');
    expect(packageJson.dependencies).not.toHaveProperty('pagefind');
    expect(packageJson.devDependencies).not.toHaveProperty('pagefind');
  });

  it('uses one requestAnimationFrame scheduler and never targets the scene image', async () => {
    const scrollScene = await readProjectFile(
      'src/components/home/HomeScrollScene.astro',
    );

    expect(scrollScene.match(/requestAnimationFrame/g)).toHaveLength(1);
    expect(scrollScene).toContain('--home-scroll-progress');
    expect(scrollScene).toContain('data-home-scroll-stage');
    expect(scrollScene).not.toContain('data-home-hero-image');
    expect(scrollScene).not.toMatch(/\.style\.(transform|filter|scale)/);
  });

  it('uses a direct-child preview runner so the standard E2E command exits on Windows', async () => {
    const [packageJsonSource, runnerExists] = await Promise.all([
      readProjectFile('package.json'),
      projectFileExists('scripts/run-e2e.ts'),
    ]);
    const packageJson = JSON.parse(packageJsonSource) as {
      scripts: Record<string, string>;
    };

    expect(runnerExists).toBe(true);
    expect(packageJson.scripts['test:e2e']).toBe('tsx scripts/run-e2e.ts');
  });

  it('keeps the README and phase report synchronized with P5', async () => {
    const [readme, reportExists] = await Promise.all([
      readProjectFile('README.md'),
      projectFileExists('docs/stage-reports/p5-home-scroll-report.md'),
    ]);

    expect(reportExists).toBe(true);
    expect(readme).toContain('此前完成的 P5 首页三阶段滚动');
    expect(readme).toContain('HomeScrollScene');
    expect(readme).toContain('p5-home-scroll-report.md');
  });
});

describe('homepage terminal configuration flow', () => {
  it('passes the typed terminal configuration through the title component', async () => {
    const [heroTitle, homepage, terminalTyping] = await Promise.all([
      readProjectFile('src/components/home/HeroTitle.astro'),
      readProjectFile('src/pages/index.astro'),
      readProjectFile('src/components/home/TerminalTyping.astro'),
    ]);

    expect(heroTitle).toContain("import type { TerminalTypingConfig } from '../../config/home'");
    expect(heroTitle).toContain('terminal: TerminalTypingConfig;');
    expect(heroTitle).toContain('<TerminalTyping config={terminal} />');
    expect(heroTitle).not.toContain('typingLines');
    expect(homepage).toContain('terminal={homeConfig.terminal}');
    expect(homepage).not.toContain('typingLines={homeConfig.typingLines}');
    expect(terminalTyping).toContain("import type { TerminalTypingConfig } from '../../config/home'");
    expect(terminalTyping).toContain('config: TerminalTypingConfig;');
    expect(terminalTyping).toContain('const session = config.sessions[0];');
    expect(terminalTyping).toContain('{session.command}');
    expect(terminalTyping).toContain('{session.output}');
    expect(terminalTyping).not.toContain('lines.map');
  });
});
