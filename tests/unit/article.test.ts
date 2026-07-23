import { describe, expect, it } from 'vitest';

describe('article heading tree', () => {
  it('nests h3 and h4 headings below the nearest shallower heading', async () => {
    const module = await import('../../src/utils/article') as Record<string, unknown>;
    const buildTree = module.buildHeadingTree;

    expect(buildTree).toBeTypeOf('function');
    if (typeof buildTree !== 'function') return;

    const headings = [
      { depth: 2, slug: 'setup', text: '准备' },
      { depth: 3, slug: 'install', text: '安装' },
      { depth: 4, slug: 'verify', text: '验证' },
      { depth: 2, slug: 'next', text: '下一步' },
    ];
    const tree = (buildTree as (value: typeof headings) => unknown)(headings);

    expect(tree).toEqual([
      {
        depth: 2,
        slug: 'setup',
        text: '准备',
        children: [
          {
            depth: 3,
            slug: 'install',
            text: '安装',
            children: [
              { depth: 4, slug: 'verify', text: '验证', children: [] },
            ],
          },
        ],
      },
      { depth: 2, slug: 'next', text: '下一步', children: [] },
    ]);
  });

  it('drops the document h1 and promotes an orphan deeper heading safely', async () => {
    const module = await import('../../src/utils/article') as Record<string, unknown>;
    const buildTree = module.buildHeadingTree;

    expect(buildTree).toBeTypeOf('function');
    if (typeof buildTree !== 'function') return;

    const tree = (buildTree as (value: Array<{ depth: number; slug: string; text: string }>) => unknown)([
      { depth: 1, slug: 'title', text: '标题' },
      { depth: 3, slug: 'orphan', text: '独立小节' },
    ]);

    expect(tree).toEqual([
      { depth: 3, slug: 'orphan', text: '独立小节', children: [] },
    ]);
  });
});
