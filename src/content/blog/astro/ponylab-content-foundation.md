---
title: PonyLab 内容层搭建记录
description: 记录 PonyLab 内容集合、路径契约与验证工具的搭建过程。
pubDate: '2026-07-22'
category: 技术
tags:
  - Astro
  - TypeScript
updatedDate: '2026-07-23'
draft: false
pinned: false
---

PonyLab 使用 Astro Content Collections 管理文章。文章文件的位置直接决定公开 URL，因此内容层首先解决的是数据约束、路径稳定性和构建验证，而不是复杂的编辑后台。

## 为什么使用内容集合

内容集合让 frontmatter 在构建阶段接受严格校验，并为页面组件提供完整的 TypeScript 类型。当前项目同时禁止自定义 `slug`，避免文件路径和元数据出现两套相互冲突的地址来源。

### 路径就是文章地址

这篇文章位于 `astro/ponylab-content-foundation.md`，生成的文章路径是：

```text
/blog/astro/ponylab-content-foundation/
```

构建脚本还会检测 `foo.md` 与 `foo/index.md` 等可能生成相同 URL 的文件组合。

### 严格的 frontmatter

文章使用统一字段保存标题、摘要、发布日期、分类和标签。下面是一个精简示例：

```ts
const article = {
  title: 'PonyLab 内容层搭建记录',
  category: '技术',
  tags: ['Astro', 'TypeScript'],
  draft: false,
};
```

| 字段 | 用途 | 必须 |
| --- | --- | --- |
| `title` | 文章标题 | 是 |
| `pubDate` | 发布时间 | 是 |
| `tags` | 标签列表 | 是 |
| `cover` | 可选封面 | 否 |

## 阅读时间如何计算

中文内容不能只通过空格分词。PonyLab 分别统计 CJK 字符和英文单词，再按照各自阅读速度合并估算：

$$
T = \left\lceil \frac{C}{300} + \frac{W}{200} \right\rceil
$$

其中 $C$ 是中日韩字符数量，$W$ 是 Latin words 的数量。代码块不会计入正文阅读时间。

## 下一步

内容基础稳定以后，博客列表、文章目录、代码复制和全文搜索都可以消费同一个内容集合。这样新增文章只需要创建 Markdown 文件，不需要同时维护路由表。
