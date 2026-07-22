import { readFile } from 'node:fs/promises';

import { describe, expect, it } from 'vitest';

const projectRoot = new URL('../../', import.meta.url);

async function readProjectFile(pathname: string): Promise<string> {
  return readFile(new URL(pathname, projectRoot), 'utf8');
}

describe('P2 command boundary', () => {
  it('exposes the real content validation command before every build', async () => {
    const packageJson = JSON.parse(await readProjectFile('package.json')) as {
      scripts: Record<string, string>;
      devDependencies: Record<string, string>;
    };

    expect(packageJson.scripts['validate:content']).toBe(
      'tsx scripts/validate-content-paths.ts',
    );
    expect(packageJson.scripts.prebuild).toBe('npm run validate:content');
    expect(packageJson.scripts.check).toBe('astro check');
    expect(packageJson.scripts['test:unit']).toBe('vitest run');
    expect(packageJson.scripts.build).toBe('astro build');
    expect(packageJson.scripts).not.toHaveProperty('test:e2e');
    expect(Object.keys(packageJson.devDependencies).sort()).toEqual([
      '@astrojs/check',
      '@types/node',
      'tsx',
      'vitest',
      'yaml',
    ]);
  });

  it('runs content validation explicitly in CI without future-stage tools', async () => {
    const workflow = await readProjectFile('.github/workflows/ci.yml');

    for (const command of [
      'npm ci',
      'npm run validate:content',
      'npm run check',
      'npm run test:unit',
      'npm run build',
    ]) {
      expect(workflow).toContain(command);
    }

    expect(workflow.indexOf('npm run validate:content')).toBeLessThan(
      workflow.indexOf('npm run check'),
    );
    expect(workflow).not.toContain('playwright');
    expect(workflow).not.toContain('pagefind');
  });
});
