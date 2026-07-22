import { z } from 'astro/zod';
import { describe, expect, it } from 'vitest';

import { createBlogSchema } from '../../src/content/schema';

const schema = createBlogSchema(() => z.custom<ImageMetadata>(() => true));

const validFrontmatter = {
  title: '中文标题可以使用',
  description: '用于测试严格文章 schema。',
  pubDate: '2026-07-22',
  category: '技术',
  tags: ['Astro', 'TypeScript'],
};

describe('blog content schema', () => {
  it('parses valid data and applies boolean defaults', () => {
    const result = schema.parse(validFrontmatter);

    expect(result.pubDate).toBeInstanceOf(Date);
    expect(result.draft).toBe(false);
    expect(result.pinned).toBe(false);
  });

  it('rejects frontmatter slug and all unknown top-level fields', () => {
    expect(
      schema.safeParse({ ...validFrontmatter, slug: 'custom-slug' }).success,
    ).toBe(false);
    expect(schema.safeParse({ ...validFrontmatter, surprise: true }).success).toBe(
      false,
    );
  });

  it('requires coverAlt whenever a cover is present', () => {
    expect(schema.safeParse({ ...validFrontmatter, cover: {} }).success).toBe(false);
    expect(
      schema.safeParse({ ...validFrontmatter, cover: {}, coverAlt: '文章封面' })
        .success,
    ).toBe(true);
  });

  it('rejects unknown categories, tags, and ambiguous dates', () => {
    expect(
      schema.safeParse({ ...validFrontmatter, category: '未配置分类' }).success,
    ).toBe(false);
    expect(
      schema.safeParse({ ...validFrontmatter, tags: ['未配置标签'] }).success,
    ).toBe(false);
    expect(
      schema.safeParse({ ...validFrontmatter, pubDate: '2026-07-22T10:00:00' })
        .success,
    ).toBe(false);
    expect(
      schema.safeParse({
        ...validFrontmatter,
        pubDate: '2026-02-30T12:00:00+08:00',
      }).success,
    ).toBe(false);
    expect(
      schema.safeParse({ ...validFrontmatter, pubDate: new Date() }).success,
    ).toBe(false);
  });
});
