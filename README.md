# PonyLab

PonyLab 是一个使用 Astro 构建的静态个人博客，包含首页三阶段滚动、文章与分类浏览、中文全文搜索、项目展示、个人页面、主题切换和可选全局音乐等功能。主要实施依据是 [`docs/development-plan.md`](docs/development-plan.md)。

## 当前状态

P0–P13 已实施，当前发布范围包括：

- `/`：light/dark 双场景首页、三阶段滚动、终端打字、个人名片、最新文章和统计；
- `/blog/`：Pagefind 中文正文搜索、Tag/分类筛选、客户端分页和可分享 URL 状态；
- `/blog/[...slug]/`：嵌套文章、阅读时间、目录、代码复制、数学公式和前后篇；
- `/tags/[tag]/`、`/categories/[category]/`、`/archive/`：可直达的静态浏览入口；
- `/projects/`、`/about/`：项目和个人兴趣展示；
- `/rss.xml`、`/sitemap-index.xml`、`/404.html`：发布与发现入口；
- Astro ClientRouter、唯一持久 `<audio>` 播放器、右侧辅助阅读进度和返回顶部；
- Chromium 与 Firefox 的 production preview E2E；
- GitHub Pages 官方 Actions 部署工作流。

作者资料、社交链接、首页文案、Logo、默认封面和音乐都保留为类型化或固定路径的可替换输入，不需要修改组件接口。

## 技术基线

- Astro 7、TypeScript strict、Astro Content Collections；
- 普通 CSS、全局设计 tokens 和 Astro scoped styles；
- Astro Markdown/Shiki、KaTeX 数学公式；
- Pagefind 静态中文全文索引；
- Vitest、Playwright Chromium/Firefox；
- `@astrojs/rss`、`@astrojs/sitemap`；
- GitHub Pages 普通项目站：`base=/PonyLab`。

项目没有引入 React、Vue、Svelte、Tailwind、Swup、GSAP 或全局状态库。

## 部署配置

公开目标地址：

```text
https://xmdemamo.github.io/PonyLab/
```

冻结配置位于 `astro.config.mjs`：

```js
site: 'https://xmdemamo.github.io'
base: '/PonyLab'
trailingSlash: 'always'
```

内部页面和 public 资源路径由 `import.meta.env.BASE_URL` 或 `src/utils/paths.ts` 生成，不能在组件中硬编码 `/PonyLab/`。

项目站内的 `/PonyLab/robots.txt` 不是主机根 robots 文件，因此本仓库不会生成它。默认公开页面允许抓取；只有未来能控制 `XMDEMAMO.github.io` 根站仓库时，才应在根站 `/robots.txt` 中引用完整 Sitemap 地址：

```text
https://xmdemamo.github.io/PonyLab/sitemap-index.xml
```

GitHub 仓库 Settings → Pages → Source 必须设为 **GitHub Actions**。推送到 `main` 后，`.github/workflows/deploy.yml` 会先执行完整质量门槛，再上传 `dist` 并部署。

## 安装、开发与验证

要求 Node.js `>=22.12.0`。

```sh
npm ci
npm run validate:content
npm run check
npm run test:unit
npm run build
npm run test:e2e
npm run preview
```

`npm run build` 是唯一正式构建入口：它先执行真实内容校验和 Astro 静态构建，再清理未引用图片母版，最后生成 Pagefind 索引。成功后必须存在 `dist/pagefind/`。

开发服务器按仓库约定使用后台模式：

```sh
npm run astro -- dev --background
npm run astro -- dev status
npm run astro -- dev logs
npm run astro -- dev stop
```

开发服务器上的博客搜索只提供标题、摘要和标签预览；正文搜索必须通过 `npm run build` 后的 production preview 验证。

## 内容约定

文章位于 `src/content/blog/`：

- 文件夹和 Markdown 文件名只允许 ASCII 小写 kebab-case；
- URL 只由真实文件路径生成，frontmatter 顶层禁止 `slug`；
- 禁止根级 `src/content/blog/index.md`；
- `foo.md` 与 `foo/index.md` 的 URL 冲突会在构建前被阻断；
- 日期使用带引号的 `YYYY-MM-DD`，或带明确时区的完整 ISO 字符串；
- 分类和 Tag 必须先登记在 `src/config/taxonomy.ts`；
- 有 `cover` 时必须提供有效 `coverAlt`；
- `draft: true` 不会进入正式列表、RSS 或 Sitemap 文章入口。

## 可替换配置与素材

- `src/config/site.ts`：站名、作者、头像、社交链接、导航和页脚；
- `src/config/home.ts`：首页文案、终端会话和 light/dark 场景参数；
- `src/config/theme.ts`：主题模式和浏览器 theme-color；
- `src/config/taxonomy.ts`：分类与 Tag；
- `src/config/about.ts`：About 文案；
- `src/data/projects.ts`、`src/data/hobbies.ts`：项目和兴趣；
- `src/data/playlist.ts`：音乐播放列表；
- `public/audio/`：本地音频。当前两首 WAV 是仓库自行生成的轻量开发占位音，可直接替换。

最低图片素材路径：

```text
src/assets/brand/site-logo.svg
src/assets/brand/author-avatar.jpg
src/assets/home/home-hero-scene-light.png
src/assets/home/home-hero-scene-dark.jpg
src/assets/placeholders/default-cover.jpg
public/favicon.ico
```

首页不使用独立透明人物立绘；阶段一和阶段二复用当前主题的同一张完整场景图，滚动只改变 HTML 前景内容。

## 主要目录

```text
src/components/       全局、首页、博客、文章、项目和 About 组件
src/config/           类型化站点与页面配置
src/content/blog/     Markdown 文章
src/data/             项目、兴趣和播放列表数据
src/layouts/          全局与文章布局
src/pages/            静态页面、动态文章、RSS 和 404
src/styles/           tokens、全局和正文样式
src/types/            跨模块数据类型
src/utils/            路径、内容、搜索、生命周期等工具
scripts/              内容验证、E2E runner、图片清理和占位音频生成
tests/                Vitest 与 Playwright 测试
.github/workflows/    CI 与 GitHub Pages 部署
```

## 文档

- [完整开发计划](docs/development-plan.md)
- [已有阶段汇报目录](docs/stage-reports/)
