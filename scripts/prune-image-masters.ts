import { readdir, readFile, unlink } from 'node:fs/promises';
import { extname, join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const MASTER_ASSET_PATTERN =
  /^(?:home-hero-scene-(?:light|dark)|default-cover)\.[^.]+\.(?:jpe?g|png)$/i;
const TEXT_OUTPUT_EXTENSIONS = new Set([
  '.css',
  '.html',
  '.js',
  '.json',
  '.mjs',
  '.txt',
  '.xml',
]);

export interface PruneImageMastersResult {
  removed: string[];
}

async function findTextOutputs(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const nestedFiles = await Promise.all(
    entries.map(async (entry) => {
      const entryPath = join(directory, entry.name);

      if (entry.isDirectory()) {
        return findTextOutputs(entryPath);
      }

      return TEXT_OUTPUT_EXTENSIONS.has(extname(entry.name).toLowerCase())
        ? [entryPath]
        : [];
    }),
  );

  return nestedFiles.flat();
}

export async function pruneUnreferencedImageMasters(
  distDirectory = resolve('dist'),
): Promise<PruneImageMastersResult> {
  const assetDirectory = join(distDirectory, '_astro');
  const [assetEntries, textOutputPaths] = await Promise.all([
    readdir(assetDirectory, { withFileTypes: true }),
    findTextOutputs(distDirectory),
  ]);
  const candidates = assetEntries
    .filter((entry) => entry.isFile() && MASTER_ASSET_PATTERN.test(entry.name))
    .map((entry) => entry.name)
    .sort();
  const textOutputs = await Promise.all(
    textOutputPaths.map(async (path) => ({
      path,
      source: await readFile(path, 'utf8'),
    })),
  );

  for (const candidate of candidates) {
    const referencingOutput = textOutputs.find(({ source }) =>
      source.includes(candidate),
    );

    if (referencingOutput) {
      throw new Error(
        `Raster master is still referenced and cannot be pruned: ${candidate} (${referencingOutput.path})`,
      );
    }
  }

  await Promise.all(
    candidates.map((candidate) => unlink(join(assetDirectory, candidate))),
  );

  return { removed: candidates };
}

const isDirectExecution =
  process.argv[1] !== undefined &&
  pathToFileURL(resolve(process.argv[1])).href === import.meta.url;

if (isDirectExecution) {
  const result = await pruneUnreferencedImageMasters();
  console.log(
    `构建产物清理完成：移除 ${result.removed.length} 个未被引用的图片母版。`,
  );
}
