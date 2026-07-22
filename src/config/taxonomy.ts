export interface TaxonomyEntry {
  displayName: string;
  slug: string;
  description?: string;
}

const TAXONOMY_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function defineTaxonomy<const TEntries extends readonly TaxonomyEntry[]>(
  entries: TEntries,
): TEntries {
  const displayNames = new Set<string>();
  const slugs = new Set<string>();

  for (const entry of entries) {
    if (displayNames.has(entry.displayName)) {
      throw new Error(`Duplicate taxonomy display name: ${entry.displayName}`);
    }

    if (!TAXONOMY_SLUG_PATTERN.test(entry.slug)) {
      throw new Error(
        `Invalid taxonomy slug "${entry.slug}". Use lowercase ASCII kebab-case.`,
      );
    }

    if (slugs.has(entry.slug)) {
      throw new Error(`Duplicate taxonomy slug: ${entry.slug}`);
    }

    displayNames.add(entry.displayName);
    slugs.add(entry.slug);
  }

  return entries;
}

export const categories = defineTaxonomy([
  {
    displayName: '技术',
    slug: 'technology',
    description: '编程、工具与工程实践。',
  },
  {
    displayName: '随笔',
    slug: 'notes',
    description: '学习过程与日常记录。',
  },
  {
    displayName: '项目',
    slug: 'projects',
    description: '项目设计、实现与复盘。',
  },
] as const);

export const tags = defineTaxonomy([
  { displayName: 'Astro', slug: 'astro' },
  { displayName: 'TypeScript', slug: 'typescript' },
  { displayName: '前端开发', slug: 'frontend-development' },
  { displayName: '性能优化', slug: 'performance' },
] as const);

export type CategoryName = (typeof categories)[number]['displayName'];
export type TagName = (typeof tags)[number]['displayName'];

export function getTaxonomyByName<TEntry extends TaxonomyEntry>(
  entries: readonly TEntry[],
  displayName: string,
): TEntry | undefined {
  return entries.find((entry) => entry.displayName === displayName);
}

export function getTaxonomyBySlug<TEntry extends TaxonomyEntry>(
  entries: readonly TEntry[],
  slug: string,
): TEntry | undefined {
  return entries.find((entry) => entry.slug === slug);
}

export function isCategoryName(value: string): value is CategoryName {
  return getTaxonomyByName(categories, value) !== undefined;
}

export function isTagName(value: string): value is TagName {
  return getTaxonomyByName(tags, value) !== undefined;
}
