# PonyLab

PonyLab 是一个使用 Astro 构建的静态个人博客，计划用于技术文章、学习记录、项目展示与个人兴趣。项目按 [`docs/development-plan.md`](docs/development-plan.md) 分阶段实施，当前已完成 P1—P8。

## 当前状态

P8 项目与个人展示页已经完成：

- `/projects/` 使用类型化数据输出 4 条项目记录，提供项目类型计数、三/二/一列响应式网格和渐进增强筛选；关闭 JavaScript 时仍显示全部项目；
- 精选 PonyLab 项目复用同一项目卡组件，在宽屏跨两列展示；项目外链、状态、技术栈和占位标记均由数据驱动，没有创建项目详情路由；
- `/about/` 包含作者身份卡、当前状态终端，以及作品、角色和游戏三组爱好展柜，每组 3 项；作者基础资料继续复用站点配置；
- 首页既有 `SiteStats` 已在项目数据建立后接入项目数量，当前统计文章、Tag 和项目三项；
- 当前项目与爱好图片使用最低开发占位档的通用封面，并以 16:10、4:3 固定容器验证正式接口；后续替换数据与素材不需要改动页面布局；
- P8 没有增加依赖、Pagefind、ClientRouter、音乐播放器、右侧滚动控件或前端框架。

P7 嵌套文章阅读体验已经完成：

- `/blog/[...slug]/` 根据内容文件路径静态生成多层文章 URL，并与 P2 的路径验证、P6 的文章卡和相邻文章排序共用同一套内容工具；
- 文章页包含面包屑、发布日期/更新日期、CJK + 英文阅读时间、分类/Tag 链接、桌面 sticky 目录、手机折叠目录和上一篇/下一篇；
- Markdown 正文支持 Astro 内置 Shiki 双主题代码高亮、渐进增强的键盘可用复制按钮、响应式表格，以及通过 `remark-math`、`rehype-katex` 和 KaTeX 输出的数学公式；
- 正文样式和 KaTeX CSS 只在文章布局加载；无 JavaScript 时文章、目录锚点、代码、表格和公式仍完整可读；
- 当前内容层开发记录已作为首篇非草稿文章发布，用于同时验证嵌套路由、目录、代码、表格和公式。

P6 博客浏览继续保持以下约束：

- `/blog/` 输出完整的非草稿文章集合和明显的归档入口，JavaScript 只渐进增强 Tag、分类和每页 8 篇的客户端分页；
- `/tags/[tag]/`、`/categories/[category]/` 与 `/archive/` 均为可直达、可分享的静态路由，关闭 JavaScript 仍可浏览；
- URL 状态使用稳定的 `?tag=&category=&page=`，筛选会重置到第一页，并支持清空、复制链接以及浏览器前进/后退恢复；
- 标签、分类计数、筛选、分页和年月归档共用 `src/utils/blog.ts` 的纯函数，归档按 `zh-CN` 与 `Asia/Hong_Kong` 日期规则排列，不受置顶顺序影响；
- P4 的同一份 `PostCard` 增加列表变体和静态 taxonomy 链接，没有复制第二套卡片；
- 响应式筛选胶囊、横卡转纵卡、空状态和 320px 防溢出已完成；P6 没有引入 Pagefind、框架岛或新依赖。

此前完成的 P5 首页三阶段滚动继续保持以下约束：

- light/dark 两套完整首页场景图通过 `astro:assets` 生成响应式 AVIF/WebP；
- `HomeScrollScene` 使用单个 `requestAnimationFrame` 调度器和有阈值的滚轮意图状态机；未完成的滚轮输入会让头像轻微探出后回弹，达到阈值才一次提交阶段切换；
- 阶段一显示标题和终端；进入阶段二时标题先快速退出，圆形头像从中下方升起并左移，随后冷色终端名片展开并逐行打字；阶段三让完整主视觉随 sticky 区域结束而离场并衔接文章区；
- 当前主题只使用一个活动图片实例；阶段一与阶段二不会改变图片的裁切、位置、变换、亮度、饱和度、模糊或滤镜，也不会重复请求大图；
- reduced motion、低高度横屏和受限设备使用自然流，标题、名片与内容在无 JavaScript 时仍按完整阅读顺序显示；
- 手机端保留三阶段语义，并按 light/dark 构图分别把名片放在不会遮住主体面部的区域；
- 首页文章区最多显示 4 篇非草稿文章，并统计已发布文章数与唯一 Tag 数；
- 基础 `PostCard` 已由 P6 原位扩展为首页网格与博客列表共用组件。

仓库目前有一篇用于验证 Content Collection 和文章阅读链路的已发布开发记录；首页与博客会链接到它的真实嵌套详情路由。不会为了填满首页而发布假文章。

尚未实施的核心阶段包括 P9 Pagefind、P12 可访问性收尾与 P13 部署准备。ClientRouter/音乐（P10）和右侧滚动控件（P11）仍是可选增强，不阻塞核心 V1。

## 技术基线

- Astro 7 + TypeScript strict
- Astro Content Collections / Content Layer
- Astro Markdown + Shiki、remark-math、rehype-katex、KaTeX
- 普通 CSS、全局语义 tokens 与 Astro scoped styles
- Vitest 单元测试
- Playwright Chromium 生产构建 E2E
- GitHub Pages 普通项目站，`base=/PonyLab`

项目没有引入 React、Vue、Svelte、Tailwind、全局状态库、ClientRouter、Pagefind 或 Expressive Code。后续依赖只在对应阶段按计划评估和加入。

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

Playwright 直接调用 Astro CLI 启动 production preview，避免 Windows 上通过 npm 子进程托管服务器时退出等待。需要复用已启动的 production preview 时，可使用外部预览模式：

```powershell
$env:PONYLAB_E2E_EXTERNAL_PREVIEW='1'
npm run test:e2e
```

默认本地与 CI 都直接运行标准 `npm run test:e2e`；外部模式仅用于调试，不是正式验证的必需步骤。

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
- `src/config/about.ts`：About 页文案、身份字段与当前状态；
- `src/data/projects.ts`：项目记录、状态和类型元数据；
- `src/data/hobbies.ts`：作品、角色和游戏爱好展柜数据。

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
├─ components/home/    P4 静态首页与 P5 三阶段滚动控制
├─ components/blog/    共用文章卡、筛选、分页、空状态与归档组件
├─ components/article/ 文章头部、目录、代码增强与前后篇组件
├─ components/projects/项目筛选、网格与卡片
├─ components/about/   作者资料、当前状态与爱好展柜
├─ config/             类型化站点、首页、主题、About 与 taxonomy 配置
├─ content/blog/       Markdown 文章
├─ data/               项目与爱好等非文章展示数据
├─ layouts/            全局布局与文章阅读布局
├─ pages/              首页、博客、文章、分类、归档、项目与 About 等路由入口
├─ styles/             reset、tokens、全局样式与文章正文样式
├─ types/              跨模块数据类型
└─ utils/              路径、内容、日期、阅读时间、首页和博客纯函数
```

## 文档

- [完整开发计划](docs/development-plan.md)
- [P1 工程基础汇报](docs/stage-reports/p1-foundation-report.md)
- [P2 内容基础汇报](docs/stage-reports/p2-content-foundation-report.md)
- [P3 全局外壳汇报](docs/stage-reports/p3-global-shell-report.md)
- [P4 首页静态结构汇报](docs/stage-reports/p4-home-static-report.md)
- [P5 首页滚动增强汇报](docs/stage-reports/p5-home-scroll-report.md)
- [P6 博客浏览汇报](docs/stage-reports/p6-blog-browsing-report.md)
- [P7 文章阅读汇报](docs/stage-reports/p7-article-reading-report.md)
- [P8 项目与个人页汇报](docs/stage-reports/p8-projects-about-report.md)
