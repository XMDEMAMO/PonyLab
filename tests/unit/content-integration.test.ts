import { readFile } from 'node:fs/promises';

import { parseFrontmatter } from 'astro/markdown';
import { z } from 'astro/zod';
import { describe, expect, it } from 'vitest';

import { createBlogSchema } from '../../src/content/schema';

const schema = createBlogSchema(() => z.custom<ImageMetadata>(() => true));

describe('Astro frontmatter integration', () => {
  it('preserves a date-only value until the schema converts Hong Kong midnight', async () => {
    const source = await readFile(
      new URL(
        '../../src/content/blog/astro/ponylab-content-foundation.md',
        import.meta.url,
      ),
      'utf8',
    );
    const { frontmatter } = parseFrontmatter(source);

    expect(typeof frontmatter.pubDate).toBe('string');
    expect(schema.parse(frontmatter).pubDate.toISOString()).toBe(
      '2026-07-21T16:00:00.000Z',
    );
  });
});
