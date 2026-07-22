# PonyLab

PonyLab 是一个使用 Astro 构建的静态个人博客，计划用于技术文章、学习记录、项目展示与个人兴趣。项目按 [`docs/development-plan.md`](docs/development-plan.md) 分阶段实施，当前已完成 P1—P4。

## 当前状态

P4 已建立首页静态结构：

- light/dark 两套完整首页场景图通过 `astro:assets` 生成响应式 AVIF/WebP；
- 标题、终端最终态和普通头像个人名片按自然阅读顺序输出；
- 当前主题只使用一个活动图片实例，滚动不会改变图片的裁切、位置、变换或滤镜；
- 首页文章区最多显示 4 篇非草稿文章，并统计已发布文章数与唯一 Tag 数；
- 基础 `PostCard` 已建立，后续 P6 会在同一组件上扩展博客列表能力；
- 没有 JavaScript 时仍能看到完整的标题、名片、内容区与日间场景降级图。

仓库目前只有一篇用于验证 Content Collection 的开发草稿，因此生产构建会正确显示首页文章空状态。不会为了填满首页而发布假文章或建立无效详情链接。

尚未实施的核心阶段包括 P5 首页滚动增强、P6 博客浏览、P7 文章详情、P8 项目/About、P9 Pagefind、P12 可访问性收尾与 P13 部署准备。ClientRouter/音乐（P10）和右侧滚动控件（P11）仍是可选增强，不阻塞核心 V1。

## 技术基线

- Astro 7 + TypeScript strict
- Astro Content Collections / Content Layer
- 普通 CSS、全局语义 tokens 与 Astro scoped styles
- Vitest 单元测试
- Playwright Chromium 生产构建 E2E
- GitHub Pages 普通项目站，`base=/PonyLab`

项目没有引入 React、Vue、Svelte、Tailwind、全局状态库、ClientRouter 或 Pagefind。后续依赖只在对应阶段按计划评估和加入。

## 部署配置

公开目标地址：

```text
https://xmdemamo.github.io/PonyLab/
```

唯一运行时部署配置位于 `astro.config.mjs`：

```js
site: 'https://xmdemamo.github.io'
base: '/PonyLab'
trailingSlash: 'always'
```

内部页面和 public 资源路径必须由 `import.meta.env.BASE_URL` 或 `src/utils/paths.ts` 生成，不能硬编码 `/PonyLab/`。当前项目站不会生成位置无效的 `/PonyLab/robots.txt`；只有未来能够控制 `XMDEMAMO.github.io` 根站时，才应在主机根目录添加 `/robots.txt` 并引用 PonyLab 的完整 Sitemap 地址。

## 环境要求

- Node.js `>=22.12.0`
- npm，依赖版本以仓库中的 `package-lock.json` 为准

## 安装与验证

```sh
npm ci
npm run validate:content
npm run check
npm run test:unit
npm run build
npm run test:e2e
npm run preview
```

`npm run build` 会通过 `prebuild` 再执行一次真实内容校验，并在 Astro 构建后移除未被页面引用的首页/默认封面母版，只保留实际使用的响应式输出。P9 尚未开始，所以 Pagefind 还未进入 build；到 P9 时它会成为同一 `npm run build` 的固定组成部分。

Windows 本地环境如果遇到 Playwright 托管 `webServer` 在测试结束后等待退出的问题，可先启动 production preview，再使用既有外部预览模式：

```powershell
$env:PONYLAB_E2E_EXTERNAL_PREVIEW='1'
npm run test:e2e
```

具体原因和双终端验证方式见 [`docs/stage-reports/p3-global-shell-report.md`](docs/stage-reports/p3-global-shell-report.md)。CI 仍使用标准 `npm run test:e2e`。

## 开发服务器

仓库约定开发服务器使用 Astro 后台模式：

```sh
npm run astro -- dev --background
```

管理命令：

```sh
npm run astro -- dev status
npm run astro -- dev logs
npm run astro -- dev stop
```

## 内容约定

文章位于 `src/content/blog/`，由 `src/content.config.ts` 和 `src/content/schema.ts` 校验。

- 文件夹和 Markdown 文件名只允许 ASCII 小写 kebab-case；
- frontmatter 顶层禁止 `slug`，文章 URL 只由真实文件路径生成；
- 禁止根级 `src/content/blog/index.md`；
- `foo.md` 与 `foo/index.md` 形成同一 URL，会被构建前校验阻断；
- 日期使用带引号的 `YYYY-MM-DD`，或带明确时区的完整 ISO 字符串；
- 分类与 Tag 必须先登记在 `src/config/taxonomy.ts`；
- 有 `cover` 时必须提供有效的 `coverAlt`；
- `draft: true` 的内容不会出现在首页和正式内容列表。

示例：

```yaml
---
title: 文章标题
description: 一句话摘要
pubDate: '2026-07-23'
category: 技术
tags:
  - Astro
draft: true
pinned: false
---
```

## 配置与素材

可替换站点资料集中在类型化配置中：

- `src/config/site.ts`：站名、描述、作者、头像、Logo、社交链接、导航和页脚；
- `src/config/home.ts`：首页文案、终端文本、文章数量、light/dark 场景焦点、静态裁切与蒙版；
- `src/config/theme.ts`：主题模式、存储 key 和浏览器 theme-color；
- `src/config/taxonomy.ts`：分类与 Tag 显示名到 URL slug 的映射。

当前最低素材档使用以下路径：

```text
src/assets/brand/site-logo.svg
src/assets/brand/author-avatar.jpg
src/assets/home/home-hero-scene-light.png
src/assets/home/home-hero-scene-dark.jpg
src/assets/placeholders/default-cover.jpg
public/favicon.ico
```

`site-logo.svg`、作者资料和默认封面仍可替换。替换素材时应保持既有文件职责、组件接口和布局比例；首页不使用独立透明人物立绘。

## 主要目录

```text
src/
├─ assets/             本地图片源文件，由 astro:assets 优化
├─ components/global/  全局页面外壳组件
├─ components/home/    P4 首页静态组件；P5 再加入滚动控制
├─ components/blog/    首页与后续博客共用的 PostCard
├─ config/             类型化站点、首页、主题与 taxonomy 配置
├─ content/blog/       Markdown 文章
├─ layouts/            共享布局
├─ pages/              Astro 路由入口
├─ styles/             reset、tokens 与全局样式
├─ types/              跨模块数据类型
└─ utils/              路径、内容、日期、阅读时间和首页纯函数
```

## 文档

- [完整开发计划](docs/development-plan.md)
- [P1 工程基础汇报](docs/stage-reports/p1-foundation-report.md)
- [P2 内容基础汇报](docs/stage-reports/p2-content-foundation-report.md)
- [P3 全局外壳汇报](docs/stage-reports/p3-global-shell-report.md)
- [P4 首页静态结构汇报](docs/stage-reports/p4-home-static-report.md)
