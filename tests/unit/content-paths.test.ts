import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

import { afterEach, describe, expect, it } from 'vitest';

import {
  formatValidationIssue,
  runContentPathValidation,
  validateContentPaths,
} from '../../scripts/validate-content-paths';

const temporaryDirectories: string[] = [];
const validFrontmatter = `---
title: 中文标题
description: 路径校验测试
pubDate: '2026-07-22'
category: 技术
tags:
  - Astro
---
正文
`;

async function createFixture(files: Record<string, string>): Promise<string> {
  const root = await mkdtemp(join(tmpdir(), 'ponylab-content-'));
  temporaryDirectories.push(root);

  await Promise.all(
    Object.entries(files).map(async ([relativePath, contents]) => {
      const target = join(root, ...relativePath.split('/'));
      await mkdir(dirname(target), { recursive: true });
      await writeFile(target, contents, 'utf8');
    }),
  );

  return root;
}

afterEach(async () => {
  await Promise.all(
    temporaryDirectories.splice(0).map((directory) =>
      rm(directory, { recursive: true, force: true }),
    ),
  );
});

describe('validateContentPaths', () => {
  it('accepts Chinese titles with ASCII paths and legal nested index files', async () => {
    const root = await createFixture({
      'hello-world.md': validFrontmatter,
      'astro/content-collections/index.md': validFrontmatter,
    });

    const result = await validateContentPaths(root);

    expect(result.files).toHaveLength(2);
    expect(result.issues).toEqual([]);
  });

  it.each([
    '中文.md',
    'UpperCase.md',
    'with space.md',
    'under_score.md',
    'double--dash.md',
    'draft(1).md',
    '.draft.md',
    '.hidden/post.md',
  ])('rejects an invalid original path: %s', async (relativePath) => {
    const root = await createFixture({ [relativePath]: validFrontmatter });

    const result = await validateContentPaths(root);

    expect(result.issues.some((issue) => issue.type === 'INVALID_PATH')).toBe(true);
  });

  it('rejects a top-level slug even when the remaining frontmatter is valid', async () => {
    const root = await createFixture({
      'hello-world.md': validFrontmatter.replace(
        'title: 中文标题',
        'title: 中文标题\n"slug": forbidden',
      ),
    });

    const result = await validateContentPaths(root);

    expect(result.issues.some((issue) => issue.type === 'FORBIDDEN_SLUG')).toBe(
      true,
    );
  });

  it.each([
    ['2026-07-22T10:00:00', 'pubDate'],
    ['2026-02-30', 'pubDate'],
    ['2026-02-30T12:00:00+08:00', 'pubDate'],
    ['not-a-date', 'updatedDate'],
  ])('rejects an invalid raw %s value in %s', async (value, field) => {
    const frontmatter = `${validFrontmatter.replace(
      "pubDate: '2026-07-22'",
      field === 'pubDate'
        ? `pubDate: '${value}'`
        : `pubDate: '2026-07-22'\nupdatedDate: '${value}'`,
    )}`;
    const root = await createFixture({ 'hello-world.md': frontmatter });

    const result = await validateContentPaths(root);
    const issue = result.issues.find((entry) => entry.type === 'INVALID_DATE');

    expect(issue?.detail).toContain(field);
  });

  it('rejects unquoted dates so Astro cannot pre-convert their semantics', async () => {
    const root = await createFixture({
      'hello-world.md': validFrontmatter.replace(
        "pubDate: '2026-07-22'",
        'pubDate: 2026-07-22',
      ),
    });

    const result = await validateContentPaths(root);
    const issue = result.issues.find((entry) => entry.type === 'INVALID_DATE');

    expect(issue?.detail).toContain('pubDate');
    expect(issue?.suggestion).toContain('quoted');
  });

  it('rejects a root index file as a conflict with the blog list route', async () => {
    const root = await createFixture({ 'index.md': validFrontmatter });

    const result = await validateContentPaths(root);
    const issue = result.issues.find((entry) => entry.type === 'ROOT_INDEX');

    expect(issue).toMatchObject({
      generatedUrl: '/blog/',
      conflictFile: 'src/pages/blog/index.astro',
    });
  });

  it('rejects foo.md and foo/index.md because they generate the same URL', async () => {
    const root = await createFixture({
      'foo.md': validFrontmatter,
      'foo/index.md': validFrontmatter,
    });

    const result = await validateContentPaths(root);
    const issue = result.issues.find((entry) => entry.type === 'URL_CONFLICT');

    expect(issue).toBeDefined();
    expect(issue?.generatedUrl).toBe('/blog/foo/');
    expect([issue?.originalPath, issue?.conflictFile].sort()).toEqual([
      'foo.md',
      'foo/index.md',
    ]);
  });

  it('formats every issue with the required five diagnostics', async () => {
    const root = await createFixture({ 'Bad Name.md': validFrontmatter });
    const result = await validateContentPaths(root);
    const message = formatValidationIssue(result.issues[0]!);

    expect(message).toContain('问题类型：');
    expect(message).toContain('原始文件路径：');
    expect(message).toContain('生成 URL：');
    expect(message).toContain('冲突文件：不适用');
    expect(message).toContain('修正建议：');
  });

  it('returns a non-zero command status and writes diagnostics on failure', async () => {
    const root = await createFixture({ 'Bad Name.md': validFrontmatter });
    const stdout: string[] = [];
    const stderr: string[] = [];

    const exitCode = await runContentPathValidation({
      contentRoot: root,
      stdout: (message) => stdout.push(message),
      stderr: (message) => stderr.push(message),
    });

    expect(exitCode).toBe(1);
    expect(stdout).toEqual([]);
    expect(stderr.join('\n')).toContain('INVALID_PATH');
  });

  it('sets a real non-zero process exit code when the CLI validates a bad fixture', async () => {
    const root = await createFixture({ 'Bad Name.md': validFrontmatter });
    const projectRoot = fileURLToPath(new URL('../../', import.meta.url));
    const scriptPath = fileURLToPath(
      new URL('../../scripts/validate-content-paths.ts', import.meta.url),
    );
    const result = spawnSync(
      process.execPath,
      ['--import', 'tsx', scriptPath, '--content-root', root],
      {
        cwd: projectRoot,
        encoding: 'utf8',
      },
    );

    expect(result.status).toBe(1);
    expect(result.stderr).toContain('INVALID_PATH');
    expect(result.stderr).toContain('原始文件路径：Bad Name.md');
  });
});
