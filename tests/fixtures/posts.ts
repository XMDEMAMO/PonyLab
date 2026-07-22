import type { PostRecord } from '../../src/types/content';

export const FIXTURE_PAGE_SIZE = 2;

export const postFixtures = [
  {
    id: 'notes/pinned-newer',
    data: {
      title: '较新的置顶文章',
      description: '排序测试',
      pubDate: new Date('2026-06-10T00:00:00+08:00'),
      category: '随笔',
      tags: ['Astro'],
      draft: false,
      pinned: true,
    },
  },
  {
    id: 'notes/pinned-older',
    data: {
      title: '较早的置顶文章',
      description: '排序测试',
      pubDate: new Date('2026-01-10T00:00:00+08:00'),
      category: '随笔',
      tags: ['Astro'],
      draft: false,
      pinned: true,
    },
  },
  {
    id: 'astro/same-date-alpha',
    data: {
      title: '同日文章 Alpha',
      description: '稳定排序测试',
      pubDate: new Date('2026-05-01T00:00:00+08:00'),
      category: '技术',
      tags: ['Astro'],
      draft: false,
      pinned: false,
    },
  },
  {
    id: 'astro/same-date-beta',
    data: {
      title: '同日文章 Beta',
      description: '稳定排序测试',
      pubDate: new Date('2026-05-01T00:00:00+08:00'),
      category: '技术',
      tags: ['TypeScript'],
      draft: false,
      pinned: false,
    },
  },
  {
    id: 'astro/older-post',
    data: {
      title: '较早的普通文章',
      description: '排序测试',
      pubDate: new Date('2025-12-01T00:00:00+08:00'),
      category: '技术',
      tags: ['Astro'],
      draft: false,
      pinned: false,
    },
  },
  {
    id: 'drafts/private-note',
    data: {
      title: '草稿',
      description: '过滤测试',
      pubDate: new Date('2027-01-01T00:00:00+08:00'),
      category: '随笔',
      tags: ['Astro'],
      draft: true,
      pinned: true,
    },
  },
] as const satisfies readonly PostRecord[];
