import { readFile, readdir } from 'node:fs/promises';

import { describe, expect, it } from 'vitest';

const stylesDirectory = new URL('../../src/styles/', import.meta.url);
const sourceDirectory = new URL('../../src/', import.meta.url);

async function readStyleSheet(name: string): Promise<string> {
  return readFile(new URL(name, stylesDirectory), 'utf8');
}

async function readStyleSources(directory: URL): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const sources = await Promise.all(entries.map(async (entry) => {
    const entryUrl = new URL(entry.name + (entry.isDirectory() ? '/' : ''), directory);
    if (entry.isDirectory()) return readStyleSources(entryUrl);
    if (!entry.name.endsWith('.astro') && !entry.name.endsWith('.css')) return [];
    return [await readFile(entryUrl, 'utf8')];
  }));

  return sources.flat();
}

describe('design tokens', () => {
  it('defines every semantic color for both light and dark themes', async () => {
    const tokens = await readStyleSheet('tokens.css');
    const semanticColors = [
      '--color-bg',
      '--color-bg-elevated',
      '--color-surface',
      '--color-surface-strong',
      '--color-text',
      '--color-text-muted',
      '--color-accent',
      '--color-accent-secondary',
      '--color-accent-warm',
      '--color-border',
      '--color-focus',
      '--color-overlay',
    ];

    expect(tokens).toContain(':root');
    expect(tokens).toMatch(/\[data-theme=['"]dark['"]\]/);

    for (const token of semanticColors) {
      expect(tokens.match(new RegExp(`${token}:`, 'g'))).toHaveLength(2);
    }
  });

  it('defines the shared spacing, shape, typography, and motion scales', async () => {
    const tokens = await readStyleSheet('tokens.css');

    for (const token of [
      '--page-max',
      '--prose-max',
      '--page-gutter',
      '--radius-sm',
      '--radius-md',
      '--radius-lg',
      '--radius-pill',
      '--shadow-sm',
      '--shadow-card',
      '--shadow-floating',
      '--duration-fast',
      '--duration-normal',
      '--ease-standard',
      '--ease-emphasized',
      '--font-sans',
      '--font-mono',
    ]) {
      expect(tokens).toContain(`${token}:`);
    }
  });

  it('defines every global design token referenced by component styles', async () => {
    const [tokens, sources] = await Promise.all([
      readStyleSheet('tokens.css'),
      readStyleSources(sourceDirectory),
    ]);
    const definedTokens = new Set(
      [...tokens.matchAll(/(--[a-z0-9-]+)\s*:/g)].map((match) => match[1]),
    );
    const globalToken = /^--(?:color|shadow|space|radius|duration|ease|font|page|prose|site|focus|line-height)(?:-|$)/;
    const referencedTokens = new Set(
      sources.flatMap((source) =>
        [...source.matchAll(/var\((--[a-z0-9-]+)/g)]
          .map((match) => match[1])
          .filter((token) => globalToken.test(token)),
      ),
    );

    expect([...referencedTokens].filter((token) => !definedTokens.has(token))).toEqual([]);
  });
});

describe('global CSS foundation', () => {
  it('provides a small reset with media-safe defaults', async () => {
    const reset = await readStyleSheet('reset.css');

    expect(reset).toContain('box-sizing: border-box');
    expect(reset).toContain('max-width: 100%');
    expect(reset).toContain('font: inherit');
    expect(reset).toContain('prefers-reduced-motion: reduce');
  });

  it('imports the foundation and exposes accessible global primitives', async () => {
    const global = await readStyleSheet('global.css');

    expect(global).toContain("@import './tokens.css'");
    expect(global).toContain("@import './reset.css'");
    expect(global).toContain(':focus-visible');
    expect(global).toContain('.visually-hidden');
    expect(global).toContain('var(--color-bg)');
    expect(global).toContain('var(--color-text)');
  });
});
