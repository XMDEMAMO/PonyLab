import { describe, expect, it } from 'vitest';

import {
  categories,
  defineTaxonomy,
  getTaxonomyByName,
  getTaxonomyBySlug,
  tags,
} from '../../src/config/taxonomy';

describe('taxonomy configuration', () => {
  it('maps Chinese display names to explicit ASCII slugs', () => {
    expect(getTaxonomyByName(categories, '技术')).toMatchObject({
      displayName: '技术',
      slug: 'technology',
    });
    expect(getTaxonomyBySlug(tags, 'typescript')?.displayName).toBe('TypeScript');
  });

  it('uses unique, lowercase kebab-case slugs', () => {
    for (const entries of [categories, tags]) {
      expect(new Set(entries.map((entry) => entry.slug)).size).toBe(entries.length);
      for (const entry of entries) {
        expect(entry.slug).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
      }
    }
  });

  it('rejects duplicate names and slugs at configuration time', () => {
    expect(() =>
      defineTaxonomy([
        { displayName: '甲', slug: 'same' },
        { displayName: '乙', slug: 'same' },
      ]),
    ).toThrow(/duplicate taxonomy slug/i);

    expect(() =>
      defineTaxonomy([
        { displayName: '重复', slug: 'one' },
        { displayName: '重复', slug: 'two' },
      ]),
    ).toThrow(/duplicate taxonomy display name/i);
  });
});
