import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';

import { pruneUnreferencedImageMasters } from '../../scripts/prune-image-masters';

const temporaryDirectories: string[] = [];

async function createDistFixture(): Promise<string> {
  const distDirectory = await mkdtemp(join(tmpdir(), 'ponylab-dist-'));
  temporaryDirectories.push(distDirectory);
  await mkdir(join(distDirectory, '_astro'));
  return distDirectory;
}

afterEach(async () => {
  await Promise.all(
    temporaryDirectories.splice(0).map((directory) =>
      rm(directory, { recursive: true, force: true }),
    ),
  );
});

describe('pruneUnreferencedImageMasters', () => {
  it('removes only approved unreferenced raster masters', async () => {
    const distDirectory = await createDistFixture();
    const assetDirectory = join(distDirectory, '_astro');
    await Promise.all([
      writeFile(join(distDirectory, 'index.html'), '<img src="/_astro/site-logo.hash.svg">'),
      writeFile(join(assetDirectory, 'home-hero-scene-light.hash.png'), 'master'),
      writeFile(join(assetDirectory, 'home-hero-scene-light.hash_640.webp'), 'derived'),
      writeFile(join(assetDirectory, 'default-cover.hash.jpg'), 'master'),
      writeFile(join(assetDirectory, 'article-cover.hash.jpg'), 'keep'),
      writeFile(join(assetDirectory, 'site-logo.hash.svg'), 'keep'),
    ]);

    const result = await pruneUnreferencedImageMasters(distDirectory);

    expect(result.removed).toEqual([
      'default-cover.hash.jpg',
      'home-hero-scene-light.hash.png',
    ]);
    await expect(readFile(join(assetDirectory, 'article-cover.hash.jpg'), 'utf8')).resolves.toBe(
      'keep',
    );
    await expect(readFile(join(assetDirectory, 'site-logo.hash.svg'), 'utf8')).resolves.toBe('keep');
  });

  it('refuses to remove a master that a built document still references', async () => {
    const distDirectory = await createDistFixture();
    const masterName = 'home-hero-scene-dark.hash.jpg';
    await writeFile(join(distDirectory, 'index.html'), `<img src="/_astro/${masterName}">`);
    await writeFile(join(distDirectory, '_astro', masterName), 'master');

    await expect(pruneUnreferencedImageMasters(distDirectory)).rejects.toThrow(
      /still referenced.*home-hero-scene-dark\.hash\.jpg/i,
    );
  });
});
