import { readFile } from 'node:fs/promises';

import { describe, expect, it } from 'vitest';

const projectRoot = new URL('../../', import.meta.url);

async function readProjectFile(pathname: string): Promise<string> {
  return readFile(new URL(pathname, projectRoot), 'utf8');
}

describe('P1 command boundary', () => {
  it('exposes only the real P1 verification scripts', async () => {
    const packageJson = JSON.parse(await readProjectFile('package.json')) as {
      scripts: Record<string, string>;
      devDependencies: Record<string, string>;
    };

    expect(packageJson.scripts.check).toBe('astro check');
    expect(packageJson.scripts['test:unit']).toBe('vitest run');
    expect(packageJson.scripts.build).toBe('astro build');
    expect(packageJson.scripts).not.toHaveProperty('validate:content');
    expect(packageJson.scripts).not.toHaveProperty('test:e2e');
    expect(Object.keys(packageJson.devDependencies).sort()).toEqual([
      '@astrojs/check',
      '@types/node',
      'vitest',
    ]);
    expect(packageJson.devDependencies['@types/node']).toMatch(/^\^22\./);
  });

  it('runs the same P1 commands in CI without future-stage placeholders', async () => {
    const workflow = await readProjectFile('.github/workflows/ci.yml');

    for (const command of [
      'npm ci',
      'npm run check',
      'npm run test:unit',
      'npm run build',
    ]) {
      expect(workflow).toContain(command);
    }

    expect(workflow).toContain('actions/checkout@v7');
    expect(workflow).toContain('actions/setup-node@v6');
    expect(workflow).not.toContain('validate:content');
    expect(workflow).not.toContain('playwright');
    expect(workflow).not.toContain('pagefind');
  });

  it('documents the frozen project URL and P1 command set', async () => {
    const readme = await readProjectFile('README.md');

    expect(readme).toContain('https://xmdemamo.github.io/PonyLab/');
    expect(readme).toContain("base: '/PonyLab'");
    expect(readme).toContain("trailingSlash: 'always'");
    expect(readme).toContain('npm run check');
    expect(readme).toContain('npm run test:unit');
    expect(readme).toContain('npm run build');
    expect(readme).not.toContain('validate:content');
  });
});
