import { readdir, readFile } from 'node:fs/promises';
import { extname, relative, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { isScalar, parseDocument } from 'yaml';

import { isContentDateString } from '../src/utils/content-date';

export type ValidationIssueType =
  | 'CONTENT_ROOT_MISSING'
  | 'INVALID_FRONTMATTER'
  | 'INVALID_DATE'
  | 'INVALID_PATH'
  | 'FORBIDDEN_SLUG'
  | 'ROOT_INDEX'
  | 'URL_CONFLICT';

export interface ContentValidationIssue {
  type: ValidationIssueType;
  originalPath: string;
  generatedUrl: string;
  conflictFile?: string;
  suggestion: string;
  detail?: string;
}

export interface ContentFileRecord {
  absolutePath: string;
  relativePath: string;
  generatedUrl: string;
  validPath: boolean;
}

export interface ContentValidationResult {
  files: ContentFileRecord[];
  issues: ContentValidationIssue[];
}

export interface RunContentPathValidationOptions {
  contentRoot?: string;
  stdout?: (message: string) => void;
  stderr?: (message: string) => void;
}

const PATH_SEGMENT_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const DEFAULT_CONTENT_ROOT = fileURLToPath(
  new URL('../src/content/blog/', import.meta.url),
);

function toPosixPath(pathname: string): string {
  return pathname.replaceAll('\\', '/');
}

function deriveGeneratedUrl(relativePath: string): string {
  const withoutExtension = relativePath.replace(/\.md$/i, '');
  const segments = toPosixPath(withoutExtension).split('/').filter(Boolean);

  if (segments.at(-1)?.toLowerCase() === 'index') {
    segments.pop();
  }

  const encodedSlug = segments
    .map((segment) => encodeURIComponent(segment))
    .join('/');

  return encodedSlug.length > 0 ? `/blog/${encodedSlug}/` : '/blog/';
}

function validateOriginalPath(relativePath: string): boolean {
  const normalized = toPosixPath(relativePath);
  const segments = normalized.split('/');
  const filename = segments.pop();

  if (!filename || extname(filename) !== '.md') {
    return false;
  }

  const basename = filename.slice(0, -3);

  return [...segments, basename].every((segment) =>
    PATH_SEGMENT_PATTERN.test(segment),
  );
}

async function findMarkdownFiles(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const nestedFiles = await Promise.all(
    entries.map(async (entry) => {
        const absolutePath = resolve(directory, entry.name);

        if (entry.isDirectory()) {
          return findMarkdownFiles(absolutePath);
        }

        return entry.isFile() && entry.name.toLowerCase().endsWith('.md')
          ? [absolutePath]
          : [];
      }),
  );

  return nestedFiles.flat().sort((left, right) => left.localeCompare(right, 'en'));
}

function extractFrontmatter(source: string): {
  raw?: string;
  error?: string;
} {
  const normalized = source.replace(/^\uFEFF/, '').replaceAll('\r\n', '\n');

  if (!normalized.startsWith('---\n')) {
    return {};
  }

  const lines = normalized.split('\n');
  const closingIndex = lines.findIndex(
    (line, index) => index > 0 && (line === '---' || line === '...'),
  );

  if (closingIndex < 0) {
    return { error: 'Frontmatter starts with --- but has no closing delimiter.' };
  }

  return { raw: lines.slice(1, closingIndex).join('\n') };
}

function inspectFrontmatter(
  source: string,
): { hasSlug: boolean; invalidDateFields: string[]; error?: string } {
  const extracted = extractFrontmatter(source);

  if (extracted.error) {
    return {
      hasSlug: false,
      invalidDateFields: [],
      error: extracted.error,
    };
  }

  if (extracted.raw === undefined) {
    return { hasSlug: false, invalidDateFields: [] };
  }

  const document = parseDocument(extracted.raw, { uniqueKeys: true });

  if (document.errors.length > 0) {
    return {
      hasSlug: false,
      invalidDateFields: [],
      error: document.errors.map((error) => error.message).join('; '),
    };
  }

  const data = document.toJS() as unknown;

  if (data !== null && (typeof data !== 'object' || Array.isArray(data))) {
    return {
      hasSlug: false,
      invalidDateFields: [],
      error: 'Frontmatter must be a top-level mapping/object.',
    };
  }

  const invalidDateFields = ['pubDate', 'updatedDate'].filter((field) => {
    const node = document.get(field, true);

    if (node === undefined) {
      return false;
    }

    return (
      !isScalar(node) ||
      (node.type !== 'QUOTE_DOUBLE' && node.type !== 'QUOTE_SINGLE') ||
      !isContentDateString(node.value)
    );
  });

  return {
    hasSlug:
      data !== null && Object.prototype.hasOwnProperty.call(data, 'slug'),
    invalidDateFields,
  };
}

export async function validateContentPaths(
  contentRoot = DEFAULT_CONTENT_ROOT,
): Promise<ContentValidationResult> {
  let absoluteFiles: string[];

  try {
    absoluteFiles = await findMarkdownFiles(contentRoot);
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);

    return {
      files: [],
      issues: [
        {
          type: 'CONTENT_ROOT_MISSING',
          originalPath: toPosixPath(contentRoot),
          generatedUrl: '/blog/',
          suggestion: 'Create src/content/blog before running the build.',
          detail,
        },
      ],
    };
  }

  const files = absoluteFiles.map((absolutePath) => {
    const relativePath = toPosixPath(relative(contentRoot, absolutePath));

    return {
      absolutePath,
      relativePath,
      generatedUrl: deriveGeneratedUrl(relativePath),
      validPath: validateOriginalPath(relativePath),
    } satisfies ContentFileRecord;
  });
  const issues: ContentValidationIssue[] = [];

  for (const file of files) {
    if (!file.validPath) {
      issues.push({
        type: 'INVALID_PATH',
        originalPath: file.relativePath,
        generatedUrl: file.generatedUrl,
        suggestion:
          'Rename every directory and Markdown basename to lowercase ASCII kebab-case.',
      });
    }

    if (file.relativePath === 'index.md') {
      issues.push({
        type: 'ROOT_INDEX',
        originalPath: file.relativePath,
        generatedUrl: '/blog/',
        conflictFile: 'src/pages/blog/index.astro',
        suggestion:
          'Move the article into a named kebab-case directory or rename it to a non-index Markdown file.',
      });
    }

    const frontmatter = inspectFrontmatter(
      await readFile(file.absolutePath, 'utf8'),
    );

    if (frontmatter.error) {
      issues.push({
        type: 'INVALID_FRONTMATTER',
        originalPath: file.relativePath,
        generatedUrl: file.generatedUrl,
        suggestion: 'Fix the YAML frontmatter before rebuilding.',
        detail: frontmatter.error,
      });
    } else if (frontmatter.hasSlug) {
      issues.push({
        type: 'FORBIDDEN_SLUG',
        originalPath: file.relativePath,
        generatedUrl: file.generatedUrl,
        suggestion:
          'Remove the top-level slug field; change the ASCII file path only when a URL change is intended.',
      });
    }

    for (const field of frontmatter.invalidDateFields) {
      issues.push({
        type: 'INVALID_DATE',
        originalPath: file.relativePath,
        generatedUrl: file.generatedUrl,
        suggestion:
          'Use a quoted YYYY-MM-DD value or a quoted complete ISO timestamp with an explicit Z/UTC offset.',
        detail: `${field} must remain a quoted, valid ISO date string until schema parsing.`,
      });
    }
  }

  const filesByUrl = new Map<string, ContentFileRecord>();

  for (const file of files.filter((entry) => entry.validPath)) {
    const existing = filesByUrl.get(file.generatedUrl);

    if (existing) {
      issues.push({
        type: 'URL_CONFLICT',
        originalPath: file.relativePath,
        generatedUrl: file.generatedUrl,
        conflictFile: existing.relativePath,
        suggestion:
          'Rename or move one file so every article produces a unique /blog/.../ URL.',
      });
    } else {
      filesByUrl.set(file.generatedUrl, file);
    }
  }

  return {
    files,
    issues: issues.sort((left, right) => {
      const pathDifference = left.originalPath.localeCompare(
        right.originalPath,
        'en',
      );
      return pathDifference !== 0
        ? pathDifference
        : left.type.localeCompare(right.type, 'en');
    }),
  };
}

export function formatValidationIssue(issue: ContentValidationIssue): string {
  return [
    `问题类型：${issue.type}`,
    `原始文件路径：${issue.originalPath}`,
    `生成 URL：${issue.generatedUrl}`,
    `冲突文件：${issue.conflictFile ?? '不适用'}`,
    `修正建议：${issue.suggestion}`,
    issue.detail ? `详细信息：${issue.detail}` : undefined,
  ]
    .filter((line): line is string => line !== undefined)
    .join('\n');
}

export async function runContentPathValidation({
  contentRoot = DEFAULT_CONTENT_ROOT,
  stdout = console.log,
  stderr = console.error,
}: RunContentPathValidationOptions = {}): Promise<number> {
  const result = await validateContentPaths(contentRoot);

  if (result.issues.length > 0) {
    stderr(
      `内容路径校验失败（${result.issues.length} 个问题）：\n\n${result.issues
        .map(formatValidationIssue)
        .join('\n\n')}`,
    );
    return 1;
  }

  stdout(`内容路径校验通过：检查 ${result.files.length} 个 Markdown 文件。`);
  return 0;
}

const executedFile = process.argv[1]
  ? pathToFileURL(resolve(process.argv[1])).href
  : undefined;

if (executedFile === import.meta.url) {
  const contentRootIndex = process.argv.indexOf('--content-root');
  const contentRoot =
    contentRootIndex >= 0 ? process.argv[contentRootIndex + 1] : undefined;

  if (contentRootIndex >= 0 && !contentRoot) {
    console.error('Missing path after --content-root.');
    process.exitCode = 2;
  } else {
    process.exitCode = await runContentPathValidation({ contentRoot });
  }
}
