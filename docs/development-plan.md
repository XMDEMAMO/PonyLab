# PonyLab 个人博客开发计划（修订版）

> 状态：阶段 0 决策已冻结；本轮定向修订完成后仍等待用户最终确认，未进入阶段 1。
>
> 本文是后续开发的主要执行依据。实施时按阶段逐项验证，不机械复制参考仓库，也不一次性引入完整框架。

## 0. 执行摘要与本次修订

PonyLab 将是一个以技术文章、学习记录、项目和个人兴趣为核心的静态个人博客。视觉上参考 Yuimi-chaya 的柔和、半透明与二次元手账氛围，并采用两套相关但明确不同的主题视觉：日间使用明亮冷雾场景与浅色 UI，夜间使用已选冷灰蓝城市插画与深色 UI；两套都以冰青、低饱和蓝紫和少量暖色为共同语言。功能上参考 Mizuki 的内容组织、目录、阅读时间、搜索、主题与播放器，但组件、CSS、数据模型和交互均在当前 Astro 项目中重新实现。

本计划把交付范围拆成两层：

| 层级 | 内容 | 发布门槛 |
|---|---|---|
| 核心 V1 | 可部署静态站、首页三阶段滚动、博客/Tag/分类/归档、Pagefind 正文搜索、嵌套文章、项目、个人页、日夜主题、响应式、可访问性、SEO/RSS/Sitemap/404 | 必须完成并通过自动化检查；P5、P9 不可跳过 |
| 增强项 | ClientRouter + 跨页连续音乐、单侧右滚动进度控件、多套强调色、复杂全局浮层管理系统 | 有独立启用门槛和降级路径，不阻塞核心 V1 |

已确定采用 **ClientRouter 路线 A**：核心 V1 不启用 ClientRouter，也不承诺跨页连续音乐；P3—P9 使用普通 Astro 页面导航；P10 才允许进行 ClientRouter + Audio 原型，失败不影响核心发布。首页三阶段滚动和 Pagefind 正文搜索分别在 P5、P9 完成，均属于首次正式发布门槛。

| 功能 | 最终范围 | 阶段/说明 |
|---|---|---|
| 首页三阶段滚动 | 核心 V1 | P5；允许按设备降低动画强度，不允许删除三阶段语义 |
| Pagefind 正文搜索 | 核心 V1 | P9；统一 `npm run build` 必须同时生成 Astro 产物与 Pagefind 索引，再用 production preview 验收；失败保留元数据浏览 |
| 返回顶部 | 核心 V1 | P12 收尾并与浮动元素错开 |
| ClientRouter + 跨页连续音乐 | 增强 | P10 路线 A 原型通过后才启用 |
| 右侧滚动进度控件 | 增强 | P11；只允许一个，原生 scrollbar 保留 |
| 多套强调色 | 增强 | 核心仅 light/dark；完成后另评估 |
| 泛化全局浮层系统 | 不预建 | 真实重复场景出现且测试证明后再抽象 |

本次根据审查意见完成的主要修订：

- 将 P5 首页三阶段滚动与 P9 Pagefind 正文搜索正式纳入核心发布路径。
- 冻结 ClientRouter 路线 A；音乐和单侧右滚动控件继续作为 P10/P11 增强项。
- 让 `astro.config.mjs` 成为 site/base/trailingSlash 唯一事实源，删除第二份部署配置设计。
- 为 `/blog/[...slug]` 增加真实文件路径扫描、URL 冲突错误和 build/CI 前置校验。
- 从 P3 首个 E2E 起让 Playwright 在 CI 中实际运行，并在 P12 扩展 Firefox。
- 背景只保留静态媒体与 CSS 氛围，不建设持续动态装饰系统；左侧背景线没有交互语义。
- 素材来源责任统一由用户管理，开发侧不重复逐项审查。
- 新增可直接准备的图片/音乐素材清单、五张规格表及三档明确数量。
- 首页主视觉采用两张完整横向场景图：当前 JPG 为夜间版，另准备一张日间版。当前主题的阶段一和阶段二复用同一图像实例且图像视觉状态完全静止；只有主题切换可以更换图片，滚动只切换标题、终端和个人名片等 HTML 内容层。
- 最终冻结 GitHub Pages 项目站配置，P2 以 strict schema + 原始 frontmatter 扫描禁止自定义 slug 和根级 `blog/index.md`。
- 校正 P1—P9 的阶段职责：P4 提前创建基础 `PostCard`，真实 `validate:content` 从 P2 开始，Pagefind 从 P9 起成为统一 `npm run build` 的组成部分。
- P13 增加 GitHub Pages 官方 `deploy.yml`，移除无效子路径 robots 交付；补齐 `zh-CN`、日期/时区、CJK 阅读时间、无 JS 分页降级与非像素级首页静止测试契约。

## 1. 当前项目分析

### 1.1 文件、配置、依赖和 Git

当前基线是 Astro Minimal：

```text
D:/Astro/PonyLab/
├─ .git/
├─ .vscode/
│  ├─ extensions.json
│  └─ launch.json
├─ public/
│  ├─ favicon.ico
│  └─ favicon.svg
├─ src/pages/index.astro
├─ .gitignore
├─ AGENTS.md
├─ CLAUDE.md
├─ README.md
├─ astro.config.mjs
├─ package-lock.json
├─ package.json
└─ tsconfig.json
```

- Astro 为 `7.1.3`（声明 `^7.1.3`），Node 要求 `>=22.12.0`。
- `astro.config.mjs` 当前为默认静态输出和空 `defineConfig({})`；TypeScript 继承 `astro/tsconfigs/strict`。
- 唯一直接运行时依赖是 Astro；没有 UI/CSS 框架、搜索、RSS、Sitemap、图标、数学公式或测试依赖。
- Git 已初始化，当前分支 `main` 跟踪 `origin/main`。当前计划文件位于未跟踪的 `docs/`；本轮不触碰应用文件。
- 既有基线构建曾通过；正式实施开始时仍需重新运行 `npm ci`、`astro check` 和 build，不能把旧结果当作最终证据。

### 1.2 保留、替换和明显问题

保留 `.gitignore`、`.vscode/*`、strict `tsconfig.json`、npm lockfile、`AGENTS.md` 与 `CLAUDE.md`；渐进修改 `astro.config.mjs`。`src/pages/index.astro` 和 Minimal `README.md` 最终需要替换。当前 `public/favicon.ico` 可作为权宜方案继续使用；实测文件为 32×32、655 B，足以满足基础浏览器标签图标，但不是长期高清源。P1 只验证构建后 `/PonyLab/favicon.ico` 返回 200；P3 建立 `BaseLayout` 后才写入正式 head 引用、清理模板 SVG 引用并验收浏览器标签显示。未来获得授权 SVG 或高分辨率方形源图后再替换，不阻塞核心 V1。

当前问题包括：只有一个模板页；语言、标题和描述仍是模板值；没有共享布局、设计 tokens、内容集合、数据边界、需求路由、SEO、主题初始化和自动化测试。当前没有值得迁移的业务代码，因此应从此基线重组，而不是复制任一参考仓库。

## 2. 需求理解与范围

### 2.1 定位和视觉语言

网站服务于技术文章、学习记录、项目展示和轻量个人介绍。首页负责建立记忆点，内容页负责阅读效率。整体采用雾感冷灰蓝背景、冰青光晕、低饱和蓝紫层次与半透明卡片；少量淡黄呼应完整场景图中的花朵，红色不扩展为全站按钮/焦点色。夜间模式不是纯黑，而是深蓝灰与冷青灰体系。除本轮已经指定的完整首页场景图外，参考项目中的漫画、封面、音乐和截图文案都只作构图参考，不直接作为正式素材。网站媒体由用户提供并管理来源，开发者按本计划规格接入和优化。

### 2.2 页面与全局需求

- 首页阶段一：`HomeHeroScene` 按当前 light/dark 主题选择对应完整场景图并铺满主视觉区域，图上叠加 PonyLab 主标题、副标题和终端文字。图片保持静止，不拆出或单独渲染人物。
- 首页阶段二：继续显示与阶段一完全相同的当前主题场景图和静态可读性蒙版；图片的位置、大小、裁切、亮度、饱和度、模糊、滤镜和缩放均不因滚动改变。标题与终端可淡出并轻微上移，使用普通头像的个人名片从下方或侧下方进入；动画只作用于 HTML 内容层。
- 首页阶段三：整个主视觉区域作为一个区域退出，经冷青—蓝紫过渡装饰进入内容区，展示 4 篇文章、简要统计和完整博客入口。阶段三允许主视觉整体离场，但不得回溯改变阶段一与阶段二的图片状态。
- 博客页：PageHeader、Tag/分类入口、筛选状态、文章卡片、分页、清空与空状态；核心 V1 包含 Pagefind 正文关键词搜索。
- 文章页：元信息、阅读时间、Markdown、代码高亮/复制、数学公式、桌面 TOC、移动 TOC、上一篇/下一篇和返回入口。
- 项目页：筛选、响应式网格、状态/技术栈/外链；核心 V1 不建项目详情页。
- 个人页：简介、社交链接、当前状态和作品/角色/游戏等爱好展柜，不做冗长履历和技能百分比。
- 全局：导航、内容/首页两种背景模式、日夜主题、返回顶部、简洁页脚；背景只使用静态层和 CSS 光晕，不制作持续动态装饰系统；音乐和右侧滚动控件按增强范围实施。
- 移动端：内容和触控优先，当前主题的完整场景图使用固定 `object-fit: cover` 和主题/断点化 `object-position`；三阶段语义保留但动画距离缩短，菜单为自包含 dialog；播放器若实施则变为底部面板。

### 2.3 不明确或可能提高复杂度的事项

部署不存在待确认项：当前平台为 GitHub Pages，仓库按普通项目站处理；冻结配置为 `site=https://xmdemamo.github.io`、`base=/PonyLab`、`trailingSlash=always`，公开首页为 `https://xmdemamo.github.io/PonyLab/`。只有仓库改名、改为用户主页仓库或启用自定义域名时，才重新评估这组配置。

尚待通过实施实测或后续内容输入确定的事项只有：

1. 移动端三段首页的动画幅度和滚动距离；语义顺序、同图复用和核心范围已固定。只有实测无法合理裁切时，才从同一原图派生移动裁切版。
2. 多强调色切换是否在核心站完成后另行增加。
3. 最终站点资料、社交链接和实际媒体文件；规格与数量已在第 11 节固定。

滚动控件数量、背景动效边界、日夜媒体套数和 ClientRouter 首发路线已确定：只做一个可选右侧控件；左侧不可交互；背景不采用持续动态装饰系统；首页日夜各用一张完整场景图，其他内容媒体默认复用；采用路线 A。

## 3. 页面、路由与导航

### 3.1 部署和路径基线

阶段 0 已完成部署决策。真实 remote 为 `https://github.com/XMDEMAMO/PonyLab`：仓库名 `PonyLab` 不等于用户主页仓库名 `XMDEMAMO.github.io`，因此按 GitHub Pages 普通项目站部署，而非用户主页根站。当前冻结值为：

| 配置 | 冻结值 | 依据 |
|---|---|---|
| 部署平台 | GitHub Pages | 用户决策 |
| `site` | `https://xmdemamo.github.io` | remote 所属用户为 `XMDEMAMO` |
| `base` | `/PonyLab` | 普通项目仓库名为 `PonyLab`；源配置不带末尾斜杠 |
| `trailingSlash` | `always` | 用户选择全站统一尾斜杠 |
| 公开首页 | `https://xmdemamo.github.io/PonyLab/` | `site + base` |

Astro 官方配置规则规定：`base: '/PonyLab'` 配合 `trailingSlash: 'always'` 后，运行时 `import.meta.env.BASE_URL` 会规范化为 `/PonyLab/`。因此公开 URL 有尾斜杠，但 `astro.config.mjs` 的 `base` 源值按官方示例写成无尾斜杠形式，避免手工拼接产生双斜杠。依据：[Astro Configuration Reference](https://docs.astro.build/en/reference/configuration-reference/#base)。

实施值只写入 `astro.config.mjs`，它是三项配置的唯一事实源。只有仓库改名、remote 改为 `XMDEMAMO/XMDEMAMO.github.io` 用户主页仓库或启用自定义域名时，才根据新的 remote/域名证据重新评估 `site`、`base` 和公开 URL；不能预先假定一定改为根路径。部署说明可以写入 README，但不得创建第二份运行时配置。

`src/utils/paths.ts` 只消费 `import.meta.env.BASE_URL`、`import.meta.env.SITE`、Astro 页面中的 `Astro.site` 和标准 `URL` API，统一生成内部页面、文章、Tag/分类、`public` 资源、Pagefind、音频、canonical、RSS/Sitemap 绝对地址；不得再次硬编码 `site`、`base` 或 `trailingSlash`。

### 3.2 路由表

| 路由 | 职责 | 跳转关系 |
|---|---|---|
| `/` | 三阶段首页；内容区显示 4 篇，置顶优先、其余按发布日期倒序 | 主导航、文章详情、`/blog` |
| `/blog` | 完整文章集合；核心 V1 支持 Tag/分类、分页和 Pagefind 正文搜索 | 文章、Tag、分类、归档 |
| `/blog/[...slug]` | 支持多段 slug 的静态文章详情 | Tag/分类、前后篇、博客 |
| `/tags/[tag]` | 单 Tag 可分享静态结果页，复用文章列表，不复制搜索 UI | 文章、`/blog?tag=...` |
| `/categories/[category]` | 单分类静态结果页 | 文章、博客 |
| `/archive` | 年倒序、年内按月/日期组织全部非草稿文章 | 文章、Tag/分类 |
| `/projects` | 项目筛选与网格；V1 无项目详情路由 | GitHub/在线演示 |
| `/about` | 简介、状态、爱好展柜 | 社交站点、项目、博客 |
| `/rss.xml` | 非草稿文章摘要 feed | head/footer 发现链接 |
| `/404` | 轻量错误页 | 首页、博客 |

Sitemap 由集成构建，不单建页面。独立 Tag/分类页保留无 JS、分享和 SEO 场景；博客内筛选用于探索，二者共享同一查询函数、排序和卡片。`/blog/` 的静态 HTML 默认输出全部非草稿文章并提供明显的 `/archive/` 全部文章入口；JavaScript 启用后才在该完整数据集上应用每页 8 篇的客户端分页、`?page=`、`?q=`、组合筛选和 history 状态。静态 GitHub Pages 不会因查询参数生成另一份 HTML，因此禁用 JavaScript 时不得声称能恢复 `?page=2` 或 `?q=...` 的指定结果；Tag/分类浏览和分享由独立静态路由保障。全文查询留到阶段 9。

### 3.3 嵌套文章与 slug 唯一规则

文章允许按主题分目录，例如 `src/content/blog/astro/content-collections/index.md`，路由文件统一为 `src/pages/blog/[...slug].astro`。禁止 frontmatter 自定义 `slug`，Content Collection schema 使用严格对象校验，未知顶层字段不能被静默接受。所有消费者都调用唯一的 `toArticleSlug(entry.id)`，但 `entry.id` 不能替代对原始文件路径和原始 frontmatter 的检查。

P2 创建 `scripts/validate-content-paths.ts`，直接扫描 `src/content/blog` 的真实相对目录、Markdown 文件名和原始 frontmatter，独立于 Content Collection loader 运行。任何文章 frontmatter 顶层出现 `slug` 字段都立即失败；`src/content/blog/index.md` 也必须失败，因为折叠后可能形成空 slug 并与 `/blog/` 列表路由冲突，该错误把 `src/pages/blog/index.astro` 标为冲突路由来源。P2 才新增 `npm run validate:content`，同时把它接入 `prebuild` 和 CI；不得在 P1 创建空实现、占位实现或永远成功的同名脚本。错误消息包含问题类型、原始文件路径、生成 URL、冲突文件（单文件违规时明确为“无/不适用”）和可执行修正建议。

- 真实目录段和 Markdown 文件基名只允许 ASCII 小写 kebab-case：`[a-z0-9]+(?:-[a-z0-9]+)*`。禁止中文、空格、大写、下划线、连续连字符、括号和特殊符号。中文可用于 `title`，不从标题自动生成 URL。
- 根级 `src/content/blog/index.md` 明确禁止；目录内的 `index.md` 只有在其父目录能生成非空且合法 slug 时才允许。
- `foo.md` 与 `foo/index.md` 会得到相同 URL，必须作为冲突报错；全量 slug 在构建前检查唯一性。
- Tag/分类使用显式的“显示名 → URL slug”类型化映射；支持中文显示名，但不在浏览器端临时 slugify，并检查映射值唯一。
- 已发布文章路径视为稳定接口。重命名/移动前先记录旧 URL；能配置重定向的平台必须添加永久重定向，纯静态且无重定向能力时原则上不改路径，否则明确记录断链风险。

## 4. 目录结构

阶段标记与第 12 节完全一致；未到对应阶段不提前创建空抽象。

```text
D:/Astro/PonyLab/
├─ docs/development-plan.md
├─ public/
│  ├─ favicon.ico                         [P1，当前临时方案]
│  └─ audio/                              [P10，可选]
├─ src/
│  ├─ assets/
│  │  ├─ brand/ og/                       [P3/P13]
│  │  ├─ home/
│  │  │  ├─ home-hero-scene-light.png     [P4，核心日间首页场景图]
│  │  │  ├─ home-hero-scene-dark.jpg      [P4，核心夜间首页场景图]
│  │  │  ├─ home-hero-scene-light-mobile.png [P4，可选；同源移动裁切]
│  │  │  └─ home-hero-scene-dark-mobile.jpg  [P4，可选；同源移动裁切]
│  │  ├─ placeholders/                    [P1/P4，开发期临时复用]
│  │  ├─ covers/posts/                    [P6]
│  │  ├─ projects/                        [P8]
│  │  ├─ hobbies/                         [P8]
│  │  └─ music/                           [P10，可选]
│  ├─ components/
│  │  ├─ global/                          [P3]
│  │  │  ├─ SiteHeader.astro
│  │  │  ├─ MobileNavigation.astro
│  │  │  ├─ GlobalBackground.astro
│  │  │  ├─ ThemeController.astro
│  │  │  ├─ SiteFooter.astro
│  │  │  ├─ PageHeader.astro
│  │  │  ├─ GlobalMusicPlayer.astro       [P10，可选]
│  │  │  ├─ ScrollProgressControl.astro   [P11，可选]
│  │  │  └─ BackToTop.astro               [P12，核心]
│  │  ├─ home/                            [P4/P5]
│  │  ├─ blog/                            [P4/P6/P9]
│  │  │  └─ PostCard.astro                [P4 基础；P6 扩展；P9 复用]
│  │  ├─ article/                         [P7]
│  │  ├─ projects/                        [P8]
│  │  └─ about/                           [P8]
│  ├─ config/
│  │  ├─ site.ts                          [P1/P3]
│  │  ├─ home.ts                          [P4]
│  │  ├─ taxonomy.ts                      [P2]
│  │  └─ theme.ts                         [P1]
│  ├─ content/blog/                       [P2，支持嵌套目录]
│  ├─ data/
│  │  ├─ projects.ts hobbies.ts           [P8]
│  │  └─ playlist.ts                      [P10，可选]
│  ├─ layouts/
│  │  ├─ BaseLayout.astro                 [P3]
│  │  └─ ArticleLayout.astro              [P7]
│  ├─ pages/
│  │  ├─ index.astro                      [P4]
│  │  ├─ blog/index.astro                 [P6]
│  │  ├─ blog/[...slug].astro             [P7]
│  │  ├─ tags/[tag].astro                 [P6]
│  │  ├─ categories/[category].astro      [P6]
│  │  ├─ archive.astro                    [P6]
│  │  ├─ projects.astro about.astro       [P8]
│  │  ├─ rss.xml.ts                       [P13]
│  │  └─ 404.astro                        [P13]
│  ├─ styles/
│  │  ├─ tokens.css reset.css global.css  [P1/P3]
│  │  └─ prose.css                        [P7]
│  ├─ types/                              [按 P2/P8/P10 创建]
│  └─ utils/
│     ├─ paths.ts                         [P1]
│     ├─ posts.ts reading-time.ts         [P2]
│     ├─ search.ts                        [P9]
│     └─ client-lifecycle.ts              [P10，仅启用 ClientRouter 时]
├─ tests/
│  ├─ fixtures/posts.ts                   [P2]
│  ├─ unit/                               [P1/P2/P9]
│  └─ e2e/                                [P3 起渐进增加]
├─ scripts/
│  └─ validate-content-paths.ts           [P2]
├─ playwright.config.ts                   [P3]
├─ vitest.config.ts                       [P1]
└─ .github/workflows/
   ├─ ci.yml                              [P1；P2/P3/P9 渐进扩展]
   └─ deploy.yml                          [P13]
```

不创建 `GlobalOverlay.astro`。移动导航优先使用原生 `<dialog>` 并自行管理焦点/关闭；可选播放器的底部面板也自行管理。两者只通过一个 `ponylab:modal-open` 自定义事件通知其他面板关闭。至少出现两个确实重复、已由测试证明的控制器后，才考虑提取共享弹层逻辑；菜单和播放器不得同时成为全屏模态层。

## 5. 组件设计

“客户端”指需要少量原生 TypeScript，不代表引入 UI 框架。

### 5.1 全局组件

| 组件 | 职责与输入 | 客户端/复用 | 桌面与移动、冲突边界 |
|---|---|---|---|
| `BaseLayout` | `title`、description、canonical、背景模式、页面 class；组装 head/header/main/footer；从 `site.ts` 输出 `<html lang="zh-CN">` | 全页复用；head 主题初始化为内联最小脚本 | 提供 skip link、主内容 id、浮层插槽；核心 V1 不含 ClientRouter |
| `SiteHeader` | 导航项、当前路径、站点标识 | 菜单/主题按钮交互；全局 | 桌面横排；移动触发 dialog；不能遮住锚点标题 |
| `MobileNavigation` | 导航项和当前路径 | 原生 dialog；Escape、焦点回收、背景锁滚动 | 只在窄屏启用；通过单一事件与播放器互斥 |
| `GlobalBackground` | `home/content` 模式、渐变光晕、静态线条/纹理 | 无 | 不创建持续动态装饰 DOM/脚本；装饰 `aria-hidden`、`pointer-events:none` |
| `ThemeController` | light/dark/system 状态 | 客户端、全局复用 | 按钮可键盘操作；更新 `data-theme` 和 `theme-color` |
| `PageHeader` | 标题、副标题、面包屑/计数 | 静态、跨列表页复用 | 手机缩小留白，避免与 sticky header 重叠 |
| `SiteFooter` | 作者、年份、少量链接 | 静态、全局 | 不与播放器底板重叠 |
| `GlobalMusicPlayer` | 播放列表与用户提供音源 | P10 可选；唯一持久 Audio | 桌面迷你态/浮窗，移动底部面板；不自动播放 |
| `ScrollProgressControl` | 文档滚动范围和当前位置 | P11 可选 | 仅右侧；与 TOC/播放器/系统边缘手势错开 |
| `BackToTop` | 阈值与浮动偏移 | 少量客户端 JS | 移动端置于播放器上方，短页隐藏 |

### 5.2 首页组件

| 组件 | 职责/输入 | 客户端 | 响应式与冲突 |
|---|---|---|---|
| `HomeScrollScene` | 组织三阶段语义并输出 CSS progress；阶段一显示标题，阶段二让标题/终端退出并让名片进入，阶段三让整个主视觉区域离场 | P5 核心 V1 | 手机缩短 sticky 区；reduced motion 改自然流；不得修改 `HomeHeroScene` 图片的 transform、position、filter、blur、brightness、saturation、scale 或裁切 |
| `HomeHeroScene` | 接收 light/dark 两套完整场景图、各自 alt、桌面/移动 `object-position` 和静态蒙版强度；用 `astro:assets` 输出响应式资源，当前主题只显示一个场景层 | 主题源切换需要与 `ThemeController` 协作 | `object-fit: cover`；同一主题的阶段一和阶段二之间图片状态完全一致；不接收独立人物资源，不包含人物动画；静态蒙版不捕获点击 |
| `HeroTitle` | 主副标题、eyebrow | 无 | 桌面落在场景左侧可读区，允许覆盖少量左翼但避开脸部/花朵；手机不压住脸和主要轮廓 |
| `TerminalTyping` | 文本数组、速度、停顿 | 可选客户端 | reduced motion 直接显示完整文本；稳定容器宽度防抖动 |
| `ProfileCard` | 普通作者头像、简介、状态、入口；不得再次使用从主视觉拆出的半身图 | P5 只做状态动画 | 桌面优先进入右侧空白区，手机按主体位置调整或进入正常流；不得通过移动背景来给卡片腾位 |
| `HomeSectionTransition` | 横向过渡装饰 | 无/仅 CSS | 不形成横向滚动条 |
| `LatestPosts` | 排序后的 4 篇文章 | 无 | 复用 P4 创建的基础 `PostCard`，移动单列；P6/P9 只扩展和复用同一组件，不创建第二份文章卡 |
| `SiteStats` | P4 只接收已存在的文章数和 Tag 数；P8 项目数据建立后再追加项目数 | 无 | 不引入在线计数服务，也不为 P4 的一个数字提前创建项目数据层 |

### 5.3 博客与文章组件

| 组件组 | 职责和数据 | 客户端/复用 | 布局边界 |
|---|---|---|---|
| `BlogExplorer`、`SearchField` | 统一 URL 状态；核心 P9 查询 Pagefind | P9 客户端；无查询时保持静态元数据流程 | 搜索框不能成为页面唯一入口；dev 明示降级 |
| `TagFilter`、`FilterStatus` | Tag 列表/计数、当前条件、清空 | 少量客户端；Tag 页共享映射 | 胶囊允许换行，不能横向溢出 |
| `PostCard`、`PostList` | P4 的 `PostCard` 先负责首页和基础文章摘要；P6 增加博客列表所需变体并由 `PostList` 组织；P9 继续复用 | 静态复用首页/Blog/Tag/分类 | 桌面横卡或网格，手机纵向；固定封面比例；不得因阶段扩展复制组件 |
| `Pagination`、`EmptyState` | 当前页、总页、增强态 URL、无结果提示 | `?page=`/`?q=`/组合筛选仅在 JS 可用时渐进增强 | 过滤改变后重置第 1 页；可键盘访问；无 JS 的 `/blog/` 不声称恢复查询分页状态 |
| `ArticleHeader`、`ReadingMeta` | 标题、摘要、日期、分类、Tag、分钟数 | 静态 | 长标题与多 Tag 必须换行 |
| `TableOfContents` | heading 树、当前锚点 | IntersectionObserver；桌面/移动复用数据 | 桌面 sticky；移动折叠；不能盖住播放器 |
| `MarkdownContent` | 渲染后的正文 | 静态 | 控制正文宽度、表格/代码横向滚动 |
| `CodeEnhancements` | 代码复制反馈 | 少量客户端 | 保留可选择文本和明显焦点 |
| `PostNavigation`、`ArticleReturn` | 前后篇、返回博客/相关入口 | 静态 | 使用统一文章排序和 base-aware URL |

### 5.4 项目与个人页组件

- `ProjectFilter` 接收类型与项目数组，有轻量客户端筛选；`ProjectGrid`/`ProjectCard` 静态复用。桌面 3/2 列、移动 1 列；卡片用固定封面比例和可配置 `object-position`。
- `AboutProfile`、`CurrentStatus` 读取站点和状态配置，静态渲染；`HobbyShowcase`/`HobbyCard` 读取分类化爱好数据。平板两列、手机一列，图片必须有语义 alt；爱好卡与项目卡共享 tokens，但不强行共享领域组件。

## 6. 数据与配置设计

| 数据 | 位置 | 关键字段/规则 |
|---|---|---|
| 站点信息 | `src/config/site.ts` | name、description、author、avatar、logo、socials、navigation、footer、`language: 'zh-CN'`、`timeZone: 'Asia/Hong_Kong'`；TypeScript + `satisfies` |
| 部署 | `astro.config.mjs`（唯一事实源） | site、base、trailingSlash；`paths.ts` 只读取环境值，不复制配置 |
| 首页 | `src/config/home.ts` | title、subtitle、typingLines、latestPostCount=4、`heroScenes.light`、`heroScenes.dark`；每套含 src、alt、desktopObjectPosition、mobileObjectPosition、maskStrength。核心配置不包含独立人物字段；各主题的可选移动裁切版只有实测失败后才增补 |
| 主题 | `src/config/theme.ts` + `tokens.css` | mode storage key、theme-color；真实颜色在 CSS 变量中 |
| 分类/Tag | `src/config/taxonomy.ts` | displayName、slug、可选 description；映射唯一且构建验证 |
| 文章 | Content Collection | 见下方 schema；内容和同目录素材可共置 |
| 项目 | `src/data/projects.ts` | name、description、cover、coverAlt、status、type、stack、github、demo、featured、objectPosition? |
| 爱好 | `src/data/hobbies.ts` | type、name、image、imageAlt、summary、objectPosition? |
| 音乐 | `src/data/playlist.ts`（P10） | title、artist、cover、coverAlt、src、duration?、licenseNote；时长以媒体 metadata 为准 |

阶段 0 已将网站名冻结为 `PonyLab`。`site.ts` 同时冻结默认语言 `zh-CN` 和显示时区 `Asia/Hong_Kong`；`BaseLayout`、日期工具、Pagefind 与格式化函数都消费该配置，不在组件中各写一份 locale。作者名、简介、社交链接和首页文案在 P1/P4 通过上述类型化配置提供；未知值使用明确的开发占位文案（例如“作者名称待填写”），不得散落硬编码在页面组件中。后续替换只修改配置，不改变组件 Props。

文章集合采用 Content Layer/Content Collections，schema 至少包含：

```ts
title: string
description: string
pubDate: Date
updatedDate?: Date
category: string
tags: string[]
cover?: ImageMetadata
coverAlt?: string
draft: boolean
pinned?: boolean
```

规则：schema 使用严格对象校验且不提供自定义 `slug`，未知 frontmatter 字段（尤其顶层 `slug`）必须报错；独立扫描脚本还要直接读取原始 frontmatter，在 Content Collection 解析前阻断 `slug` 和根级 `blog/index.md`。有 cover 必须有 coverAlt；生产构建过滤 draft；Tag/分类必须存在于配置映射；日期、生成 URL 冲突和外链格式需检查。文章正文、heading 与图片属于 Content Collection；站点/首页/主题用 TypeScript 配置；固定的小型展示列表使用 TypeScript 数据，不为它们引入数据库或 CMS。

日期与阅读时间统一规则如下：文章日期只接受 ISO `YYYY-MM-DD`，或带明确时区偏移的完整 ISO 时间；日期型值按 `Asia/Hong_Kong` 的日历日期解释，时间型值保留真实时刻并统一用 `Intl.DateTimeFormat('zh-CN', { timeZone: 'Asia/Hong_Kong' })` 显示，禁止依赖构建机器本地时区。`reading-time.ts` 分别统计 Unicode CJK 字符和英文/拉丁单词，再按各自阅读速度合并为分钟数并向上取整、最少 1 分钟，不能只按空格分词；unit tests 必须覆盖纯中文、纯英文、中英混排、标点/代码段与不同时区构建结果。

## 7. 设计系统

阶段 1 就定义可覆盖所有核心组件的 light/dark token 集，不等到后期补夜间模式。两套主题不是给同一画面简单套滤镜，而是分别使用完整场景图和 UI 语义变量；共同维持“冷雾实验室”身份：冰青与冷灰蓝为骨架，低饱和紫用于层次，暖黄只作少量高价值强调。

- 日间锚点：明亮雾蓝背景 `#E7F0F2`、高层背景 `#F5F9FA`、正文 `#22313A`、弱文本 `#607580`、钢青主色 `#6F93A5`、低饱和蓝紫 `#8E91B5`、暖黄 `#D8B84A`。卡片以高透浅色玻璃和冷灰边界为主，不把夜间场景强行提亮。实际组件只通过语义变量使用这些颜色。
- 夜间锚点：深蓝灰背景 `#111A21`、高层背景 `#182630`、正文 `#E5EEF1`、弱文本 `#A6B7BF`、冰青主色 `#8DB7C8`、柔蓝紫 `#AAA6CF`；暖黄保持低面积。避免纯黑大底和高饱和霓虹。
- 变量：`--color-bg`、`--color-bg-elevated`、`--color-surface`、`--color-surface-strong`、`--color-text`、`--color-text-muted`、`--color-accent`、`--color-accent-secondary`、`--color-accent-warm`、`--color-border`、`--color-focus`、`--color-overlay`。危险/错误状态仍使用独立语义色，不能把插画红眼扩散成导航、CTA 或焦点主色。
- 圆角：`--radius-sm/md/lg/pill`；正文控件、普通卡、主视觉卡、胶囊四级足够。
- 阴影：`--shadow-sm/card/floating`；夜间降低大面积亮光，保留边界。
- 尺寸：内容最大宽 `--page-max: 1200px` 左右、正文 `--prose-max: 72ch`；页面 gutter 用 `clamp()`，不在组件重复 magic number。
- 字体：正文 `1rem` 左右、行高 `1.7`；标题用 `clamp()`；优先系统/可合法自托管字体，避免阻塞远程字体。
- 动画：快速反馈约 140–180ms，卡片/面板约 220–320ms，首页叙事由滚动进度控制；统一 `--ease-standard` 和 `--ease-emphasized`。
- 断点以布局失效为依据，基线可从 480/768/1024/1280px 开始，实施时用内容验证而非设备名称硬套。

卡片 hover 仅使用 transform、边框/阴影和轻微光晕，不导致邻居重排；触屏不依赖 hover。焦点环不得只用颜色极淡的发光。全局 `prefers-reduced-motion` 关闭平滑滚动、打字循环、大位移和非必要过渡；首页背景本来就不参与视差。

## 8. 技术方案与依赖

### 8.1 基础方案

- Astro + TypeScript strict：静态生成、文件路由、组件和少量 islands 足以覆盖核心站点。
- Astro Content Collections：schema、图片引用和构建期文章查询统一，不自建内容数据库。
- 样式：全局 tokens/reset/layout + Astro scoped CSS；不引入 Tailwind。跨组件状态样式使用语义 data 属性。
- Markdown 为核心；V1 不启用 MDX，除非真实文章证明必须嵌入交互组件。
- 图片：本地图片优先 `astro:assets`，生成 AVIF/WebP 及尺寸；首屏关键图明确尺寸/预加载策略，其余懒加载。
- 图标：优先少量内联 SVG 或 Astro 图标集；不为少数图标引入大型整包。
- 代码：先评估 Astro/Shiki 能力；若需要成熟标题栏、复制与主题体验再加 Expressive Code。
- 数学：remark-math + rehype-katex，仅文章链路加载 KaTeX CSS。
- RSS/Sitemap：`@astrojs/rss` 与 `@astrojs/sitemap`，解决标准输出而非自行拼 XML。
- robots：当前站点位于主机子路径 `/PonyLab/`，因此不生成项目内 `public/robots.txt`；它只能落在 `/PonyLab/robots.txt`，不能替代主机根目录 `/robots.txt`。核心 V1 默认公开页面允许抓取，Sitemap 继续输出可公开访问的完整绝对地址。README 记录：只有未来能够控制 `XMDEMAMO.github.io` 根站仓库时，才在根站添加 `/robots.txt` 并引用 PonyLab 的完整 Sitemap URL。

### 8.2 Pagefind 精确流程（阶段 9）

Pagefind 只索引文章正文区域；导航、页脚、TOC、播放器和重复卡片标记为不索引。`BaseLayout` 的 `lang="zh-CN"` 是中文索引分组和加载的语言依据，P9 必须确认生成的是可由中文页面正确加载的索引。

Pagefind 不是部署前手工附加命令。P9 将脚本组织为等价于 `build:astro = astro build`、`build:search = pagefind --site dist`、`build = npm run build:astro && npm run build:search` 的统一流程（也可直接使用 `astro build && pagefind --site dist`）；无论内部如何拆分，正式 `npm run build` 成功结束时必须同时完成 Astro 构建和 Pagefind 索引，并存在 `dist/pagefind/`。CI、Playwright production preview 和 GitHub Pages deploy 全部调用这一个正式入口，不得使用绕过索引的替代构建命令。

浏览器端 Pagefind bundle 地址由 `import.meta.env.BASE_URL` 或 `paths.ts` 在初始化前生成；当前项目站应请求 `/PonyLab/pagefind/pagefind.js`。bundle 路径必须在动态导入或 Pagefind UI 初始化之前传入，不能先初始化再修改。production E2E 必须同时断言 `dist/pagefind/` 存在、该静态资源请求返回成功、中文查询能命中目标正文。

1. `q` 为空：不调用 Pagefind；使用本地文章元数据，按 `pinned` 优先、再 `pubDate` 倒序，然后应用 Tag/分类与分页。
2. `q` 非空：使用 Pagefind 相关性顺序；通过 Pagefind filter 或索引 meta 约束 Tag/分类。
3. 将 Pagefind URL/meta 映射回本地文章记录，以获得统一封面、日期和卡片字段；映射只补数据，**不得重新按日期排序而破坏相关性**。
4. 对最终结果分页。任何查询或 Tag/分类变化都把 page 重置为 1；合法状态写入 `?q=&tag=&category=&page=`，输入用 replaceState 节流，明确提交/翻页用 pushState，`popstate` 必须在客户端会话内可恢复。这些查询参数属于渐进增强；无 JavaScript 时 `/blog/` 仍显示完整文章列表和 `/archive/` 入口，但不解释或恢复查询参数状态。
5. dev 环境没有生产索引时，搜索区明确显示“正文搜索需 build + preview”，可提供标题/摘要/Tag 的轻量预览，但不得伪装成 Pagefind 等价结果；正式验收只用生产构建。

测试覆盖中文词、空格和特殊字符、无结果、索引加载失败、未知 URL/meta、组合筛选、翻页和前进/后退。Pagefind 加载失败时，错误状态只关闭正文搜索，博客列表、Tag、分类、归档和本地元数据浏览继续可用。分页用 `tests/fixtures/posts.ts` 的 mock 数组与较小 `pageSize=2` 测边界，不添加无意义生产文章。

### 8.3 ClientRouter 与连续音乐（阶段 10，可选，路线 A）

当前唯一有效实施路线是路线 A：P3—P9 使用普通 Astro 页面导航；P10 先做一个 Audio、普通页面、嵌套文章、播放中前进/后退、刷新、唯一 `<audio>`、Chromium/Firefox 的最小原型。原型通过后，才允许在 `BaseLayout` 启用 ClientRouter、把既有客户端脚本迁移到生命周期约定并实现播放器；失败则不启用 ClientRouter，核心 V1 不受影响。

路线 B 只保留为决策历史：若未来要求音乐首发，必须回到 P0、先验证原型并重新修订 P3—P10；在当前计划中不得直接执行路线 B，也不能让两条路线同时有效。

启用后的生命周期约定：页面初始化挂在 `astro:page-load`；全局持久组件用 custom element/模块单例守卫；页面级 listener 使用 `AbortController`，Observer、定时器和订阅在 `astro:before-swap` 或 `disconnectedCallback` 清理；禁止重复注册。使用 Astro 内置 route announcement；各页有准确 `title` 和一个主 `h1`，不默认强制聚焦 `h1`。播放器永不自动 `play()`；首次播放来自用户手势；刷新后恢复状态但保持暂停；音频使用 `preload="metadata"` 或 `none`。

### 8.4 自定义滚动进度（阶段 11，可选）

浏览器原生滚动条始终保留。只实现一个右侧交互控件，观察对象为窗口，范围基于 `document.documentElement.scrollHeight - window.innerHeight`。左侧若为构图需要，只能属于 `GlobalBackground` 的装饰：不可拖动、不可点击、不可聚焦、`pointer-events:none`、`aria-hidden="true"`，且没有滚动控制语义。

默认把右侧组件定义为“滚动进度 + 页面跳转快捷控件”，避免伪装成完整系统 scrollbar。若采用 `role="scrollbar"`，必须实现 `aria-controls`、可访问名称、`aria-valuemin/max/now`、Arrow/PageUp/PageDown/Home/End、轨道点击、拖动和 pointer capture；否则使用更符合实际功能的 progress、slider 或按钮组合语义。手机、平板、触屏/粗指针、窄屏、页面过短及 400% zoom 下隐藏；窗口 resize、字体/图片加载和内容展开后重新计算。

### 8.5 建议依赖与暂缓依赖

| 依赖 | 时机 | 价值与成本判断 |
|---|---|---|
| `vitest` | P1 | 纯函数与边界测试；开发依赖，收益明确 |
| `@playwright/test` | P3（首个 E2E 时） | dialog、主题、URL、嵌套路由、Pagefind 和可选 ClientRouter 回归；CI 安装浏览器/系统依赖并实际执行 |
| `@astrojs/check` | P1 | Astro/TS 模板检查，基础门槛 |
| `remark-math` + `rehype-katex`/`katex` | P7 | 真实数学公式需求；仅文章链路 |
| `astro-expressive-code` | P7 评估后 | 复杂代码块体验；若 Shiki + 小脚本满足则不加 |
| `pagefind` | P9（核心） | 构建后静态全文检索；不需要服务端，但增加索引和 production E2E 流程 |
| `@astrojs/rss`、`@astrojs/sitemap` | P13 | 官方/标准能力，维护成本低 |

暂不加入 Svelte、Swup、React/Vue、Tailwind、GSAP、全局状态库、MDX、服务端 adapter、大型图标包。它们或与 Astro 能力重复，或只为小功能增加 hydration/架构成本。ClientRouter 是 Astro 能力，不是新包，但仍有显著生命周期成本。

## 9. 响应式设计

| 范围 | 主要布局 |
|---|---|
| 宽屏桌面（约 ≥1280） | 1200px 左右内容容器；当前主题完整场景图铺满主视觉。夜间图按已确认位置保留人物、光环、主要翅膀、手和花朵；日间图按自身主体设置焦点，但保持左侧标题和右侧名片安全区；文章正文 + 右侧 sticky TOC；项目 3 列 |
| 普通桌面（约 1024–1279） | 各主题场景继续 `cover`，只允许换成该主题/断点预先确定的静态 `object-position`；标题/名片缩窄并避开关键主体；TOC 变窄；项目 2–3 列 |
| 平板（约 768–1023） | 导航视内容宽度切换；各主题场景允许裁掉更多左右背景但优先保住关键主体；减少标题/名片位移；TOC 进入折叠面板；项目/爱好 2 列；文章卡可转纵向 |
| 手机（<768） | dialog 菜单；核心 V1 优先复用各主题桌面场景图并设置独立静态焦点，允许裁掉非关键背景；标题与名片分别使用移动布局，低高度设备改自然流；其他卡片单列、TOC 折叠。只有对应主题实测无法合理裁切时才从其原图导出移动裁切版 |

额外以 `(hover:hover)`、`(pointer:fine)`、`(prefers-reduced-motion)`、视口高度和内容高度决定增强效果，不能只凭宽度。封面统一 aspect-ratio + `object-fit` + 可配置焦点；任意页面在 320px 宽和 400% zoom 下不产生页面级横向滚动。

## 10. 可访问性、性能和自动化验收

### 10.1 可访问性

- 使用 `header/nav/main/article/aside/footer`、正确标题层级、一个主 `h1`、skip link 和可描述链接。
- 所有按钮、dialog、筛选、TOC、复制、播放器和滚动控件支持键盘；焦点环可见；Escape 关闭 dialog 并归还触发按钮。
- 原生元素优先；ARIA 只补充语义。装饰图为空 alt 或 aria-hidden，内容图使用具体 alt；封面 alt 不重复文章标题的无效信息。
- light/dark 均检查正文、弱文本、边框、焦点与按钮状态对比度。
- reduced motion 下不播放打字循环、弹跳或大位移动画；标题、个人名片和文章内容按自然阅读顺序完整可见，平滑滚动改为即时。无 JavaScript 时使用相同语义顺序，不把任何核心内容藏在脚本初始状态中。
- ClientRouter 若启用，优先内置路由播报和正确文档标题，不无条件强制焦点跳转。

### 10.2 性能

- 静态 HTML 优先，仅交互组件加载原生 JS；不为纯展示组件 hydration。
- 本地图片通过 Astro 优化为 AVIF/WebP 和响应式尺寸，非首屏懒加载。夜间源图 `74017219_p0.jpg` 实测为 10000×5012、24-bit RGB JPEG、约 12.24 MiB；P4 导入目标为 `src/assets/home/home-hero-scene-dark.jpg`。日间实图为 8866×4961 的 PNG，放在同目录的 `home-hero-scene-light.png`。两者都只作为母版输入，不原样发布或强行放大小图；首屏明确宽高或 `aspect-ratio`，活动主题图按需要预加载，避免 CLS。
- 当前主题的阶段一和阶段二复用同一个图片实例，不因滚动重复加载，也不创建“背景大图 + 人物大图”两个图层。图片本身不参与滚动 transform，且其 position、crop、filter、blur、brightness、saturation 和 scale 保持不变；滚动时只动画标题、终端、名片以及阶段三的主视觉区域容器。主题切换只更换 light/dark 场景源与 UI tokens，并保持当前滚动阶段；活动主题图作为 LCP 优先加载，非活动主题图不与其抢首屏带宽，可在空闲时预取或首次切换时加载。避免两个全尺寸场景同时作为高优先级资源。
- 字体优先系统栈或自托管子集，使用 `font-display: swap`，预加载仅首屏必需字重。
- 音频不自动加载整文件/整列表；Pagefind 只在搜索交互需要时动态导入。

### 10.3 测试和 CI

Vitest 覆盖：draft 过滤、pinned/date 排序、`zh-CN` + `Asia/Hong_Kong` 日期解析/显示、跨构建时区不偏移、CJK/英文/混排阅读时间、Tag/分类映射、由规范路径生成 slug、合法的目录内 `index.md` 折叠、嵌套 URL、冲突 URL、前后篇、Pagefind URL/meta 映射、相关性保留、组合筛选和分页边界。`validate-content-paths.ts` 另以脚本级 fixtures/退出码测试真实路径字符、frontmatter 顶层 `slug`、禁止的根级 `src/content/blog/index.md`、`foo.md` 与 `foo/index.md` 冲突及错误消息五要素，不能只测 `entry.id` 或只依赖 schema。

Playwright 覆盖：移动菜单 dialog/Escape/焦点回收、主题初始值/切换/刷新、`<html lang="zh-CN">`、favicon head 引用与实际请求、筛选 URL 与前进后退、无 JS 完整文章列表/归档入口、嵌套文章直达、TOC 锚点，以及 P9 的 Pagefind bundle/中文搜索。首页滚动测试在 light/dark 两主题下断言阶段一和阶段二使用同一个图片 DOM 实例、`currentSrc`/bounding box/`object-position` 不变，computed `transform`、`filter`、`scale`、`brightness`、`saturation`、`blur` 不变且没有重复大图请求；只有标题、终端、名片与阶段三主视觉容器的前景状态允许变化。截图对比仅作带合理容差的辅助证据，不作为逐像素一致的主要 CI 门槛。若启用 ClientRouter，再覆盖监听器不重复、route announcement/焦点回归；若启用音乐，再覆盖唯一 Audio、跨页不中断、刷新暂停恢复和面板互斥。

CI 按阶段渐进建立，不能提前放置永远成功的脚本：P1 为 `npm ci` → `npm run check` → `npm run test:unit` → `npm run build`；P2 创建真实 `validate:content` 后，把它接入 `prebuild` 和 CI，使 build 必经内容校验；P3 安装 Playwright Chromium，并在同一生产 build 产物上执行 `npm run test:e2e`；P9 将 Pagefind 索引纳入统一 `npm run build`，构建结束必须存在 `dist/pagefind/`；P12 再把 Firefox及其系统依赖加入矩阵。最终 CI 为 `npm ci` → `npm run validate:content` → `npm run check` → `npm run test:unit` → `npm run build` → `npm run test:e2e`，其中显式 validate 便于更早输出错误，`prebuild` 仍保证任何直接 build 都不能绕过校验。`test:e2e` 的 `webServer` 只 preview 该统一构建产物；GitHub Pages deploy 也使用同一 `npm run build`。失败时上传 screenshot、trace；录像只在失败时保留。若 P10 启用 ClientRouter/音乐，Chromium 与 Firefox 都是合并门槛。

## 11. 素材准备清单

> 网站使用的图片、音乐、字体和其他媒体由用户负责提供，并默认已经确认可以用于该个人网站；开发者只负责按照素材规格接入、优化和展示，不负责逐项审核素材权利状态。

边界：不从参考仓库或参考截图复制正式素材；Codex 不擅自联网下载正式素材；缺少时使用仓库内本地占位图/占位音频；替换素材不得改变已经确定的组件接口、宽高比和布局。首页主视觉明确准备 light/dark 两张完整场景图；文章、项目、爱好、头像和音乐封面仍默认日夜复用，不为所有媒体复制第二套。

此前分离出的透明人物文件仅可保留为本地的未来可选增强候选：它不进入核心首页、核心素材数量、P4/P5 前置条件或完成标准，也不在本计划中承诺使用。只有未来出现真实设计需要且素材已完整修补后，才另行评估；当前不得要求重新抠图、补全或寻找全身版本。

固定首发核算假设：6 篇文章（首页展示其中 4 篇）、其中 3 篇重要文章有独立封面；4 个项目；作品/角色/游戏 3 类爱好、每类 3 项；音乐增强按 5 首核算，另给 3 首轻量方案。正文截图、图表、流程图随文章内容增长，不计固定清单。

### 11.1 表 1：图片素材总览

| 编号 | 素材名称 | 数量 | 必须/可选 | 页面 / 组件 | 格式 | 比例 / 推荐尺寸 | 透明 | 体积建议 | 日夜复用 | 桌面/移动 | 建议路径 | 缺失降级 |
|---|---|---:|---|---|---|---|---|---|---|---|---|---|
| B1 | 网站 Logo | 1 | 必须 | 全站 / `SiteHeader`、`SiteFooter` | SVG | 横版约 3:1；矢量 | 是 | ≤30 KB | 是 | 是 | `src/assets/brand/site-logo.svg` | 临时文字 Logo |
| B2 | favicon 文件 | 1 | 必须；当前已有 | 浏览器标签图标 | ICO（权宜）；未来可换 SVG/高分辨率方图 | 当前 32×32；检查 16/32px | 是 | 当前 655 B | 是 | 是 | `public/favicon.ico` | 直接使用现有 ICO；清晰度不足不阻塞开发，正式视觉收尾时再换源 |
| B3 | 作者头像 | 1 | 必须 | 首页、About / `ProfileCard`、`AboutProfile` | JPG/PNG | 1:1；800×800 | 可否 | ≤250 KB | 是 | 是 | `src/assets/brand/author-avatar.jpg` | 首字母/CSS 占位 |
| B4 | 默认 OG 图 | 1 | 必须 | 全站分享 metadata | JPG/PNG | 1200×630 | 否 | ≤350 KB | 是 | 是 | `src/assets/og/default-og.jpg` | 由首页背景临时裁切 |
| H1 | 夜间首页完整场景图（已提供） | 1 | 必须 | 首页 / `HomeHeroScene` | JPG；Astro 输出 AVIF/WebP | 当前 10000×5012，约 2:1；以原图实际尺寸为准 | 否 | 母版约 12.24 MiB，不原样发布；各断点输出按实测预算 | 夜间专用 | 桌面/移动优先共用 | `src/assets/home/home-hero-scene-dark.jpg` | 已按目标名称放置；P4 正式验收使用该图 |
| H2 | 日间首页完整场景图 | 1 | 必须 | 首页 / `HomeHeroScene` | 当前为 PNG；Astro 输出 AVIF/WebP | 实图 8866×4961；不强行放大 | 否为主 | 母版不原样发布；各断点输出按实测预算 | 日间专用 | 桌面/移动优先共用 | `src/assets/home/home-hero-scene-light.png` | 实图已到位；P4 需验收桌面与手机静态裁切 |
| H3 | 夜间移动裁切派生版 | 0～1 | 可选降级 | 首页移动 / `HomeHeroScene` | JPG；Astro 输出 AVIF/WebP | 从 H1 导出，尺寸按目标竖屏裁切确定 | 否 | 输出目标 ≤500 KB | 夜间专用 | 仅移动 | `src/assets/home/home-hero-scene-dark-mobile.jpg` | 默认不需要；先调整 H1 的静态 `object-position` |
| H4 | 日间移动裁切派生版 | 0～1 | 可选降级 | 首页移动 / `HomeHeroScene` | PNG/JPG；Astro 输出 AVIF/WebP | 从 H2 导出，尺寸按目标竖屏裁切确定 | 否为主 | 输出目标 ≤500 KB | 日间专用 | 仅移动 | `src/assets/home/home-hero-scene-light-mobile.png` | 默认不需要；先调整 H2 的静态 `object-position` |
| H5 | 纸张纹理/静态贴纸 | 0～2 | 可选 | 首页/背景组件 | PNG/JPG | 纹理可平铺；贴纸按构图 | 按需 | 每张 ≤150 KB | 默认复用 | 是 | `src/assets/home/home-paper-texture.jpg` 等 | CSS 纹理、线条、光晕 |
| C1 | 默认文章封面 | 1 | 必须 | 列表卡/无封面文章 | JPG/PNG | 16:9；1600×900 | 否 | ≤250 KB | 是 | 是 | `src/assets/covers/posts/default-post-cover.jpg` | CSS 标题卡 |
| C2 | 重要文章独立封面 | 3 | 推荐可选 | 首页/博客 / `PostCard` | JPG/PNG | 16:9；≥1600×900 | 否 | 每张 ≤250 KB | 是 | 是 | `src/assets/covers/posts/<post-slug>.jpg` | C1 或 CSS 标题卡 |
| P1 | 项目封面 | 4 | 必须 | Projects / `ProjectCard` | JPG/PNG | 16:10；≥1600×1000 | 否 | 每张 ≤300 KB | 是 | 是 | `src/assets/projects/project-<name>.jpg` | 通用项目占位；不另要 Logo/截图 |
| A1 | 爱好图片 | 9 | 必须 | About / `HobbyCard` | JPG/PNG | 4:3；≥1200×900 | 否为主 | 每张 ≤250 KB | 是 | 是 | `src/assets/hobbies/hobby-<type>-<name>.jpg` | 分类色块 + 文字；允许统一占位 |
| M1 | 音乐封面 | 5 | 增强可选 | 播放器 / `GlobalMusicPlayer` | JPG/PNG/WebP 源 | 1:1；1000×1000 | 否 | 每张 ≤200 KB | 是 | 是 | `src/assets/music/track-<slug>-cover.jpg` | 统一音乐占位封面 |

核心 V1 推荐档共 **23 个独立图片文件**：20 个基线必须文件 + 3 个重要文章推荐封面。H3、H4、H5 是额外可选派生/装饰项，不计入 23；若两张移动裁切版与两张装饰图全部增加则为 27。B2 暂由现有 ICO 满足，因此它仍计为 1 个已有图片文件，但不增加当前需要寻找的新素材；未来 SVG/高清方图替换 ICO 时仍是“一换一”，总数不变。

### 11.2 表 2：首页素材详细规格

| 素材 | 构图安全区 | 桌面裁切 | 手机裁切 | 格式 | 日夜策略 | 是否单独版本 |
|---|---|---|---|---|---|---|
| 夜间完整场景图 | 沿用已确认桌面构图：标题使用左侧可读区，名片使用右侧城市/天空空白区，不遮住脸部、光环中心和花朵 | `object-fit: cover`；1440×900 已实测，左右背景略裁；为常用桌面断点固定 `object-position` | 优先复用同图，焦点为脸、上半身、光环中心和花朵；允许裁掉部分翅膀和城市背景 | 当前为 10000×5012 JPG、sRGB、无 Alpha；Astro 输出响应式 AVIF/WebP | 夜间专用；使用深色 UI 与静态蒙版 | 默认 1 张 |
| 日间完整场景图 | 优先选择明亮冷色、非纯白曝亮的完整插画；需要左侧标题安全区和右侧名片安全区，关键主体不得同时占满两侧。无需与夜间人物相同，但整体视觉重量应接近 | `object-fit: cover`；在 1440×900、1024×768 检查主体、标题和名片；每主题可有独立 `object-position` | 优先复用同图，在 390×844、360×800 检查主体与 UI；禁止滚动时重算裁切 | JPG/PNG、sRGB；Astro 输出响应式 AVIF/WebP | 日间专用；使用浅色 UI 与静态蒙版 | 默认 1 张 |
| 主题移动裁切派生版 | 只有对应主题在目标竖屏实测无法合理裁切时才从该主题原图导出 | 不使用 | 每张独立确定安全区；不得换成不相关场景或拆分人物 | JPG/PNG；Astro 输出响应式 AVIF/WebP | 各自主题专用 | 每主题可选 0～1，不计入当前必须寻找数量 |
| 纸张纹理 | 无关键主体，可平铺且接缝不可见 | cover/tile | 同一张低对比复用 | JPG/PNG | 共用 | 可选 0～1 |
| 静态贴纸/前景边框 | 不覆盖标题、人物面部、按钮和文章入口 | 定位在边缘 10% 区域 | 可隐藏或换位 | PNG/Alpha WebP | 共用 | 可选 0～1 |

已检查用户提供的 `D:/壁纸/74017219_p0.jpg`：10000×5012、约 2:1、24-bit RGB JPEG、约 12.24 MiB，无透明通道；人物、光环、翅膀、花朵和城市背景已合成。它现定义为夜间版，P4 接入路径为 `src/assets/home/home-hero-scene-dark.jpg`；原始壁纸目录不作为运行时路径。原图上下存在构图内的黑色留边，实施时与整体裁切一并实测，不擅自重绘主体。

桌面层级固定为“当前主题完整场景图 → 当前主题静态文字可读性蒙版 → 标题/终端/个人名片 → 阶段三过渡”。同一主题的场景图和蒙版在阶段一、阶段二使用同一实例与同一视觉状态；主题切换可更换 light/dark 场景与 tokens，但滚动不能触发换图或滤镜变化。P5 只移动标题、终端、名片等 HTML 层；阶段三才允许整个主视觉区域作为容器离场。

移动端分别优先复用 light/dark 桌面场景图，通过固定 `object-fit: cover` 和各主题独立的断点化 `object-position` 保留关键主体。只有 390×844、360×800 和低高度横屏实测仍无法保证主体与前景 UI 的合理关系时，才从对应主题原图导出 H3/H4；不拆分人物。

首页不要求动画图片；渐变光晕、细线、虚线、胶囊、卡片底色、阴影、圆点和简单几何图形均用 CSS，不计素材。低高度/低性能移动设备减少 sticky 距离、模糊和图层；不能删除“标题 → 个人名片 → 文章内容”。JavaScript 失败时，三段内容仍按自然流可见。

### 11.3 表 3：内容与展示素材

| 类别 | 第一版假设与公式 | 数量 | 比例 / 最小尺寸 | 主体安全区与复用 |
|---|---|---:|---|---|
| Logo | 网站 Logo = 1 | 1 | SVG；横版约 3:1 | 导航/页脚复用；不把复杂插画强转 SVG |
| favicon | 浏览器图标 = 1 | 1 | 当前 ICO 32×32；检查 16/32px | 现有 `public/favicon.ico` 作为权宜方案独立管理；未来可一换一升级为 SVG/高清方图，不要求 PWA 图标组 |
| 头像 | 作者头像 = 1 | 1 | 1:1；800×800 | 脸部位于中央 70%；首页与 About 复用；当前状态卡不配图 |
| 默认 OG | 默认 OG = 1 | 1 | 1200×630 | 四周 10%、中心标题区留安全边；Twitter/X 直接复用；建议独立排版而非页面截图 |
| 默认文章封面 | 全局默认 = 1 | 1 | 16:9；1600×900 | 四周 10% 无关键主体，供所有无封面文章复用 |
| 独立文章封面 | 选择提供封面的文章数量 × 1 = 3 × 1 | 3 | 16:9；≥1600×900 | 首发 6 篇中 3 篇重要文章使用；其余用默认封面或 CSS 标题卡；独立文章 OG 非强制 |
| 项目封面 | 项目数量 × 1 = 4 × 1 | 4 | 16:10；≥1600×1000 | 主体在中央 80%；`object-position` 可调；无详情页，不要求项目 Logo 或额外截图 |
| 爱好图片 | 爱好条目数量 × 1 = 3 类 × 3 项 × 1 | 9 | 4:3；≥1200×900 | 人物/横图统一放入 4:3 卡片，逐项配置 `object-position`；最低档为 3×2=6 张 |

表 3 小计为 **21 张**：品牌/作者/OG 4 张 + 内容展示 17 张。再加表 1 的首页 light/dark 完整场景图 2 张，即得到核心推荐档 23 张；重要文章封面 3 张属于推荐项，扣除后基线必须项为 20 张。

文章封面不是 schema 强制字段。代码类文章无图时使用 CSS 标题/分类图形，不拉伸低分辨率图片。正文照片建议长边 1600～2400px JPG，截图/透明图用 PNG，图表优先 SVG；都写明确宽高和 alt。正文图片与每篇独立 OG 图不计固定数量，只有真实内容需要时增加。

默认 OG 图建议单独准备 1200×630 成品，四周保留约 120px、上下约 63px 安全区；固定站名可固化在图内，文章标题不固化，由 metadata 文本提供。当前不建设动态 OG 图片生成管线。现有 32×32 ICO 不适合放大生成 Apple Touch Icon，因此权宜阶段不伪造 180×180 图标；获得 SVG 或至少 180×180 的方形源图后再导出 Apple Touch Icon。该派生产物不算独立源素材。核心 V1 无 PWA，不准备 PWA 图标组。

### 11.4 格式、优化与命名规范

- 照片/复杂背景母版可为高质量 PNG、JPG、PSD、Clip Studio 等可编辑文件；仓库接入 JPG/PNG 等 Astro 可处理源文件，使用 sRGB，禁止把 CMYK 或 8K 母版原样发布。Astro 输出 AVIF/WebP 响应式版本。
- 夜间场景图以实际 10000×5012 JPG 母版为准；日间场景图优先约 16:9～2:1、宽 ≥2560px，但不为满足规格强行放大小图。Astro 分别生成响应式 AVIF/WebP；首屏只把活动主题图设为高优先级，不发布母版原文件。可选移动裁切版只能从各自主题原图派生。
- 文章封面 16:9（1600×900）、项目 16:10（1600×1000）、爱好 4:3（1200×900）、音乐 1:1（800×800 或 1000×1000）；不放大过小原图，主体离边缘 ≥10%，数据允许 `object-position`。
- SVG 仅用于 Logo/简单图标；移除脚本、外链、编辑器 metadata、隐藏图层，检查 16px/32px 可辨识度。复杂插画保持栅格图。
- 默认不使用 GIF，也不要求动画素材。必须动画时，简单效果优先 CSS；视频型循环优先无声 MP4/WebM，短小透明动画才评估 Animated WebP。首页不得加载大型 GIF。

推荐目录：

```text
src/assets/brand/
src/assets/home/
src/assets/placeholders/
src/assets/covers/posts/
src/assets/projects/
src/assets/hobbies/
src/assets/og/
src/assets/music/
public/audio/
```

文件名统一 ASCII 小写 kebab-case，不用中文、空格、括号、无意义编号或 `final-new`。版本后缀只用 `-desktop`、`-mobile`、`-light`、`-dark`、`-cover`、`-thumbnail`。首页两张主题图明确使用 `home-hero-scene-light.png`、`home-hero-scene-dark.jpg`；移动派生版追加 `-mobile`。其他日夜复用媒体不生成无必要的主题后缀。

### 11.5 表 4：音乐素材

音乐是 P10 增强项，核心 V1 不要求。技术原型用 1～2 首；轻量正式版 3 首；完整增强档按 5 首核算，不一开始准备几十首。

| 素材类型 | 每首数量 | 5 首总数 | 格式 / 码率或尺寸 | 单个体积 | 总体积预算 | 使用位置 | 命名示例 | 核心 V1 必需 |
|---|---:|---:|---|---|---|---|---|---|
| 音频 | 1 | 5 | MP3；128–192 kbps，建议 160 kbps；44.1/48 kHz；立体声 | 约 3–8 MB | 15–40 MB，目标约 20–35 MB | `GlobalMusicPlayer` | `public/audio/night-study.mp3` | 否 |
| 方形封面 | 1 | 5 | JPG/PNG/WebP 源；1:1；800～1000px | ≤200 KB | ≤1 MB | 迷你播放器/列表/移动面板 | `src/assets/music/track-night-study-cover.jpg` | 否 |
| 元数据 | 1 组 | 5 组 | title、artist、album?、order、sourceNote?、licenseNote? | 文本 | 可忽略 | `playlist.ts` | slug `night-study` | 否 |

第一版每首只维护一个高兼容 MP3，不做多编码 fallback；AAC/M4A 可作为单一替代源，Opus/OGG 只在后续体积压力明确时增加，避免 3～5 首就维护两套编码。不上传 FLAC、超高码率或完整大型音乐库。响度建议统一到接近的主观音量（可参考约 -14 LUFS integrated、true peak ≤ -1 dBTP），不强制裁成短版；只有过长或非循环友好的源才另做网页剪辑版。数量扩大后可评估对象存储，不属于当前 V1。

音乐封面不需要透明背景，主体位于中央 80%，避免移动端圆角/方形裁切切到脸部或文字。每首资料不要求歌词、LRC 或逐字歌词；歌词只作为远期能力，不计当前文件数。音频与封面命名使用 ASCII 小写 kebab-case，不使用中文、空格、括号或 `song1-final-new`。

### 11.6 表 5：数量汇总

| 档位 | 独立图片文件 | 音频文件 | 组成与复用 | 容量/降级 |
|---|---:|---:|---|---|
| 最低开发占位档 | **5** | **0** | 新增准备项为 Logo 1 + 头像 1 + 日间首页场景图 1 + 夜间首页场景图 1 + 通用封面 1；现有 `public/favicon.ico` 直接复用，不列入仍需准备的 5 项 | 足以验证双主题首屏、标题/名片落位与全部卡片结构；不需要独立人物素材或新 favicon |
| 核心 V1 推荐档 | **23** | **0** | Logo 1 + favicon 文件 1 + 头像 1 + OG 1 + 首页场景图 2 + 默认文章封面 1 + 重要文章封面 3 + 项目封面 4 + 爱好图片 9 | 20 个基线必须文件 + 3 个推荐文章封面；除首页外媒体日夜复用；优化后预算以实际输出为准 |
| 完整增强档（5 首） | **28** | **5** | 核心 23 + 音乐封面 5；每首 1 图 + 1 音频 | 音频 15～40 MB，目标总媒体体积在 P13 以构建产物实测 |

最低开发占位档的五个文件使用以下精确位置：

```text
src/assets/brand/site-logo.svg
src/assets/brand/author-avatar.jpg
src/assets/home/home-hero-scene-light.png
src/assets/home/home-hero-scene-dark.jpg
src/assets/placeholders/default-cover.jpg
```

夜间完整场景图已放为 `home-hero-scene-dark.jpg`，日间完整场景图已放为 `home-hero-scene-light.png`。两张图分别服务对应主题的桌面/移动首屏，夜间图可继续临时兼作默认 OG；`default-cover.jpg` 临时服务文章、项目和爱好卡片。正式素材替换不得改写组件接口。

3 首轻量音乐方案为 **26 个图片文件 + 3 个音频文件**。核心推荐档的 23 张中，20 张为按推荐页面数据量的基线必须项，3 张为重要文章推荐封面；两张可选移动场景裁切版和 0～2 张纹理/贴纸不计入 23，全部加入时核心图片上限为 27。

> 核心 V1 推荐准备 **23 个独立图片文件**；计算为品牌/作者/OG 4 + 首页 light/dark 场景图 2 + 内容展示 17（默认文章封面 1、重要文章封面 3、项目封面 4、爱好图片 9）= 23。启用 5 首音乐后，再增加 **5 张方形封面和 5 个音频文件**，总计 28 个图片文件与 5 个音频文件。移动裁切版属于可选派生产物，不计入当前必须寻找数量。

## 12. 实施阶段（0—13）

### 阶段 0：部署、路径、文章路由与增强架构决策

- **状态：** 已完成并于 2026-07-21 冻结。
- **目标：** 锁定 `site/base/trailingSlash`、根/子路径、`[...slug]`、素材基线和唯一 ClientRouter 路线。
- **文件：** 本计划决策记录；README 部署说明随 P1 的实际配置一起更新；不创建第二份运行时部署配置文件。
- **工作：** 已依据真实 remote 冻结 GitHub Pages 项目站、`site=https://xmdemamo.github.io`、源配置 `base=/PonyLab`、有效 `BASE_URL=/PonyLab/`、`trailingSlash=always`；固定原始路径/slug；素材基线修订为最低 5 图档，其中首页要求 light/dark 各 1 张完整场景图；冻结路线 A；P5/P9 为核心，P10/P11 为增强。
- **验证：** `git remote -v` 显示 `XMDEMAMO/PonyLab`，不是用户主页仓库；公开首页推导为 `https://xmdemamo.github.io/PonyLab/`。根路径仍作为路径函数测试 fixture，不是当前部署路线。
- **前置：** 已由用户确认。
- **风险：** remote 改名、改为用户主页仓库或配置自定义域名后，当前 base/site 需要重新冻结并验证。
- **完成标准：** 部署/URL、素材档、核心/增强范围和路线 A 已形成唯一决策；P1 可据此实施。未来若改选路线 B，必须回到 P0 原型并立即重写 P3—P10。

### 阶段 1：工程检查、CI 与 light/dark tokens

- **目标：** 建立可持续验证的工程基线和完整双主题语义变量。
- **文件：** `package*.json`、`astro.config.mjs`、`public/favicon.ico`、`src/utils/paths.ts`、`src/styles/{tokens,reset,global}.css`、`src/config/{site,theme}.ts`、Vitest 配置、`.github/workflows/ci.yml`、README。
- **工作：** `astro.config.mjs` 唯一保存 site/base/trailingSlash；只加入真实可执行的 `check`、`test:unit`、`build` 脚本和 Vitest，不创建 `validate:content` 的空实现、占位实现或永远成功实现；实现 base-aware path helpers；在 `site.ts` 定义 `language='zh-CN'` 与 `timeZone='Asia/Hong_Kong'`；按第 7 节定义完整 light/dark tokens；建立无 E2E 的第一版 CI，P2 再接真实内容验证，P3 再接 Playwright。保留现有 ICO 作为权宜资源，但不在尚未存在的 `BaseLayout` 中提前承诺 head 行为，也不从 32×32 ICO 放大生成 Apple Touch Icon。
- **验证：** `npm ci`、`npm run check`、`npm run test:unit`、`npm run build`；根路径、本地、`/PonyLab/`、trailing slash、public 图片/音频、未来 Pagefind、canonical/RSS URL 的路径函数测试；build + preview 下只验证 `/PonyLab/favicon.ico` 可请求并返回 200，不在 P1 验收 `<head>` 或浏览器标签显示；两主题无缺失变量。
- **前置：** P0。
- **风险：** 未拿到素材便过度调色；仅定语义和必要初值。
- **完成标准：** 干净安装可复现；部署配置只有一个事实源；P1 的 check/test:unit/build 均为真实命令且 CI 通过；不存在占位 `validate:content`；ICO 构建资源请求成功；两套主题变量覆盖核心组件状态。

### 阶段 2：内容集合、slug、纯函数与测试数据

- **目标：** 先稳定内容/URL/排序数据层。
- **文件：** `src/content.config.ts`、`src/content/blog/**`、`scripts/validate-content-paths.ts`、`src/config/taxonomy.ts`、`src/utils/{posts,reading-time}.ts`、types、fixtures 和 unit/script tests、`package*.json`、`.github/workflows/ci.yml`。
- **工作：** Content Collection schema 使用严格对象校验并拒绝未知顶层字段；不定义 `slug`。验证脚本扫描真实路径并解析每个 Markdown 的原始 frontmatter，顶层出现 `slug` 或存在根级 `src/content/blog/index.md` 时立即非零退出；执行 URL 全量唯一检查，保留 `foo.md`/`foo/index.md` 冲突。实现 draft/pinned/date、Tag/分类映射、CJK + 英文阅读时间、前后篇和嵌套 URL；此阶段才创建真实 `validate:content`，接入 `prebuild` 与 CI，边界量只用 fixture。
- **验证：** 脚本 fixtures 覆盖原始路径中的中文/大写/空格/下划线/括号/连续连字符、frontmatter 顶层 `slug`、根级 `blog/index.md`、`foo.md` 与 `foo/index.md` 冲突及非零退出；每条错误检查问题类型、原始文件路径、生成 URL、冲突文件或“不适用”、修正建议。unit 另覆盖中文标题 + ASCII 路径、合法目录内 `index.md`、草稿、相同日期、`zh-CN` 日期与 `Asia/Hong_Kong` 时区、跨 TZ 不偏移、纯中文/纯英文/混排阅读时间和 pageSize=2。
- **前置：** P0/P1。
- **风险：** loader 规范化掩盖非法原始路径；扫描磁盘而非只检查 `entry.id`。
- **完成标准：** `npm run validate:content` 独立可用、CI 执行且 `prebuild` 保证 build 必经；strict schema 与原始 frontmatter 扫描都会拒绝顶层 `slug`；根级 `blog/index.md` 和所有 URL 冲突均阻断构建；所有文章消费者调用共享 URL API。

### 阶段 3：BaseLayout、导航、主题初始化与全局背景

- **目标：** 建立共享页面外壳并在首帧前恢复主题。
- **文件：** `BaseLayout.astro`、全局组件、模板 favicon SVG 引用/文件清理、`playwright.config.ts`、首批 e2e tests、`package*.json`、CI workflow。
- **工作：** SEO head 基础、`<html lang="zh-CN">`、base-aware `/favicon.ico` link、主题脚本、skip link、导航/dialog、当前路由、静态背景；移除模板 SVG 的正式 head 引用，不做持续动态装饰系统、不用 GlobalOverlay、不启用 ClientRouter；安装 Playwright，配置 `webServer` 运行统一 build 后 preview，并把 Chromium E2E 加入 CI。
- **验证：** CI 实际执行 `test:e2e`；断言 `html[lang="zh-CN"]`、head 的 favicon URL 与浏览器请求 `/PonyLab/favicon.ico` 成功并显示标签图标；覆盖主题刷新、菜单键盘/Escape/焦点、根/子路径链接、320px/400% zoom；失败保存 screenshot/trace。
- **前置：** P1/P2。
- **风险：** dialog scroll lock 与 header；用组件自管理和回归测试。
- **完成标准：** 任意静态页面可套用布局，语言、favicon 和双主题首帧正确；首个 Playwright 用例在 CI 中失败即阻断。

### 阶段 4：首页静态结构

- **目标：** 不依赖复杂滚动先完成三段内容结构和视觉构图。
- **文件：** `src/pages/index.astro`、`src/config/home.ts`、首页组件、基础 `src/components/blog/PostCard.astro` 和第 11 节素材/占位文件。
- **工作：** 将当前完整 JPG 作为 `home-hero-scene-dark.jpg`，接入日间 `home-hero-scene-light.png`；`HomeHeroScene` 通过 `astro:assets` 输出两套响应式资源，并按主题显示对应场景、`object-position` 与静态蒙版。完成 hero、终端静态最终态、普通头像名片、过渡、4 篇文章，以及只基于现有文章数据的文章数/Tag 数统计；创建只负责首页和基础摘要展示的 `PostCard`。项目数量等 P8 项目数据层建立后再接入，不能为 P4 的统计数字提前创建完整项目数据层。同一主题的阶段一、阶段二共用同一场景图 DOM 实例；自然流降级先完整。
- **验证：** 无 JS/reduced motion 仍按标题→名片→内容阅读；light/dark 都在 1440×900、1024×768、390×844、360×800、低高度横屏检查主体安全区、标题/名片遮挡、横向溢出、alt 与 CLS。结构测试确认每个活动主题只使用一个场景图片 DOM 实例，并记录 `currentSrc`、bounding box、`object-position` 和 computed transform/filter 等基线；主题切换后图片、UI、`theme-color` 同步且无错误主题闪烁。截图只辅助构图验收并使用合理容差，不以逐像素完全相同作为 CI 门槛。
- **前置：** P2/P3；正式素材未到可先用最低占位档。
- **风险：** 两张完整横向插画的主体位置和留白可能不同，导致同一 HTML 布局只适配一张；选择日间图时优先满足相近视觉重量与左右安全区，再用每主题独立 `object-position`/蒙版解决，不为每主题复制整套组件。
- **完成标准：** 首页在无动画条件下形成相关但明确不同的日/夜构图；夜间达到已确认预览方向，日间达到独立实图验收；每个主题内部只有一个场景图实例服务阶段一/二，主题切换同步且组件不依赖独立人物资源；基础 `PostCard` 已供首页复用，统计不依赖尚未建立的项目数据。

### 阶段 5：首页滚动增强

- **目标：** 在静态语义之上实现三阶段滚动叙事。
- **文件：** `HomeScrollScene.astro`、`TerminalTyping.astro` 与首页样式/脚本、e2e reduced-motion 测试。
- **工作：** sticky + CSS 变量进度、单 rAF、transform/opacity；阶段一控制标题/终端，阶段二让它们淡出并轻微上移、让名片从下方或侧下方进入，阶段三让整个主视觉区域离场。禁止修改 `HomeHeroScene` 图片的 transform、position、filter、blur、brightness、saturation、scale 或裁切；手机缩短，低高度/低性能设备减少或取消 sticky 长滚动，reduced motion/无 JS 使用自然流。
- **验证：** 三阶段顺序；light/dark 分别断言阶段切换前后引用同一个图片 DOM 实例、`currentSrc` 不变、bounding box 不变、`object-position` 不变，computed `transform`、`filter`、`scale`、`brightness`、`saturation`、`blur` 均不变，且当前主题大图没有新增网络请求；只允许标题、终端、名片和阶段三主视觉容器的前景状态变化。在阶段一和阶段二分别切换主题，确认只因用户主题动作更换资源且保持当前滚动阶段。截图对比只作合理容差的辅助；另覆盖 60/120Hz、低端设备、低高度、resize、JS 禁用、reduced motion、无横向溢出。
- **前置：** P4。
- **风险：** 完整主视觉输出过大、HTML 浮层动画或大面积 backdrop blur 掉帧；使用响应式图片、单图层和单 rAF，先削减模糊、装饰、距离和 sticky 时长，不牺牲同图静止约束或三阶段顺序。
- **完成标准：** P5 属于核心 V1；三阶段滚动或其明确设备降级均通过验收，light/dark 的同一 DOM/资源/布局/样式不变量与无重复大图请求都有自动化证据。性能不足时可减前景装饰、距离和 sticky 时长，但不能删掉三阶段语义、让背景参与视差/模糊/缩放，或把 P5 跳过。

### 阶段 6：博客列表、Tag、分类与归档

- **目标：** 在无 Pagefind 时完成可用的内容浏览系统。
- **文件：** P4 已创建的 `PostCard.astro`、其余 blog components、`/blog`、`/tags/[tag]`、`/categories/[category]`、`/archive`、URL 状态 tests。
- **工作：** 在同一个基础 `PostCard` 上扩展博客列表变体，不复制卡片；实现元数据筛选、共享排序、Tag/分类计数、归档、客户端分页和空状态。`/blog/` 静态 HTML 保留完整非草稿文章列表及明显 `/archive/` 入口；`?page=`、`?q=`、组合筛选与 history 状态仅作为 JavaScript 渐进增强，Tag/分类继续由独立静态路由保证可浏览和分享。
- **验证：** 禁用 JS 时 `/blog/` 可浏览全部文章或进入明显的 `/archive/` 全量入口，Tag/分类静态页可直达；明确验证查询参数不会被宣传为无 JS 可恢复状态。Chromium E2E 覆盖增强态筛选/分页/清空/复制 URL/前进后退、长标签和无结果。
- **前置：** P2/P3/P4（复用基础 `PostCard`）。
- **风险：** 客户端筛选与静态页结果不一致；共享纯函数和 fixtures。
- **完成标准：** 完整文章集合在无 JS 时可发现、Tag/分类可分享；启用 JS 后可筛选和分页，不依赖全文索引，也不声称静态服务器会按 query 生成分页 HTML。

### 阶段 7：文章详情、TOC、代码与数学

- **目标：** 完成嵌套文章阅读体验。
- **文件：** `ArticleLayout.astro`、`blog/[...slug].astro`、article components、`prose.css`、Markdown/数学/代码配置。
- **工作：** getStaticPaths、按 `zh-CN`/`Asia/Hong_Kong` 输出日期、兼顾 CJK 字符和英文单词的阅读时间、heading 树、桌面/移动 TOC、复制、公式、前后篇和 taxonomy 链接；按真实需要决定 Expressive Code。
- **验证：** Chromium E2E 覆盖多层嵌套直达、TOC；人工/组件测试覆盖中文长标题、日期显示、纯中文/英文/混排阅读时间、代码/表格/公式、键盘、打印/窄屏和 404 slug；unit 已证明不受构建机器时区影响。
- **前置：** P2/P3/P6。
- **风险：** 插件 CSS 污染/体积；仅文章加载。
- **完成标准：** 所有非草稿文章可稳定构建和阅读，URL/前后篇一致。

### 阶段 8：项目页与个人页

- **目标：** 完成两类展示内容，不扩展项目详情架构。
- **文件：** `/projects`、`/about`、对应 components/data/types/assets。
- **工作：** 项目筛选/网格/外链、简介/状态/爱好；固定图比和焦点；安全 `rel`。`projects.ts` 建立后才把项目数量接入首页既有 `SiteStats`，不重写 P4 的文章/Tag 统计接口。
- **验证：** 空/多项目、多比例素材、1/2/3 列、键盘筛选、alt 和外链。
- **前置：** P3/P4、第 11 节数据假设；正式素材未到可用占位档。
- **风险：** 数据/素材延迟；保持组件接口与比例，用占位替换而不缩减展柜结构。
- **完成标准：** 两页内容完整、响应式稳定且数据可维护；首页统计在不提前创建项目层的前提下增量显示项目数量。

### 阶段 9：Pagefind 正文搜索（核心 V1）

- **目标：** 在既有博客上增加正文全文搜索，不改变无查询排序。
- **文件：** search components、`src/utils/search.ts`、Pagefind 配置/脚本、`package*.json`、CI、unit/e2e tests、README。
- **工作：** 把 Pagefind 索引固定接入统一 `npm run build`：Astro build 完成后执行 `pagefind --site dist`，成功结束时必须存在 `dist/pagefind/`。依据 `html[lang="zh-CN"]` 生成/加载中文索引；在初始化前通过 `import.meta.env.BASE_URL` 或统一路径工具设置 bundle 地址，当前项目站为 `/PonyLab/pagefind/pagefind.js`。实现正文索引范围、动态加载、filter/meta、URL 映射、保留相关性、最终分页、dev 降级与错误状态；CI、Playwright preview 和后续 deploy 禁止使用另一条构建命令。
- **验证：** CI 执行统一 production build 后检查 `dist/pagefind/`；Playwright preview 断言 `/PonyLab/pagefind/pagefind.js` 请求成功，并覆盖中文/特殊字符/无结果/加载失败/组合筛选/前进后退；unit 测 base-aware bundle 路径、初始化顺序、未知映射和相关性。
- **前置：** P6/P7。
- **风险：** dev/build 行为差异、索引未被正式 build 调用、语言分组或子路径 bundle 地址错误；只以统一生产产物验收，初始化前先固定 bundle 路径。
- **完成标准：** P9 属于核心 V1；`npm run build` 单一入口同时产出 Astro 站点和 `dist/pagefind/`，CI/preview/deploy 共用该入口；中文索引、`/PonyLab/pagefind/pagefind.js`、搜索结果、相关性、索引范围和失败降级均通过，不能以开发环境轻量搜索或手工索引命令替代。

### 阶段 10：可选音乐 + ClientRouter

- **目标：** 按已冻结路线 A，先验证再决定是否实现连续播放。
- **文件：** `BaseLayout`（首次启用 ClientRouter）、`GlobalMusicPlayer.astro`、playlist/music types、audio、client lifecycle utility、增强 e2e tests。
- **工作：** 先原型后集成；唯一持久 Audio、用户手势、播放/seek/volume/曲目、状态恢复、桌面浮窗/移动 sheet；全面迁移已有客户端脚本到生命周期约定。
- **验证：** Chromium/Firefox 跨首页/博客/嵌套文章、前进后退、唯一 Audio/listener、刷新暂停恢复、404 音源、菜单互斥、safe-area。
- **前置：** 核心 P3–P9；1～2 首本地占位音频即可做原型。
- **风险：** autoplay、生命周期重复和浏览器差异；原型失败则不启用 ClientRouter，也不重构核心页面脚本。
- **完成标准：** 连续性和唯一实例有自动化证据；否则保持核心 V1 普通导航。

### 阶段 11：可选右侧滚动进度控件

- **目标：** 增加不替代原生滚动的辅助控件。
- **文件：** `ScrollProgressControl.astro`、全局浮动 tokens、e2e tests。
- **工作：** 只做右侧控件、窗口/documentElement 计算、resize/content 更新、指针/键盘/ARIA；左侧背景线不可交互；不替代原生 scrollbar。
- **验证：** 短页/长文、100%/400% zoom、mouse/keyboard/touch emulation、TOC/播放器展开、ClientRouter 页面切换（若启用）。
- **前置：** P3/P7；播放器若启用则 P10。
- **风险：** 系统边缘手势和重复语义；默认隐藏而非强行适配。
- **完成标准：** 原生 scrollbar 始终可用，控件不遮内容且所有启用输入方式可操作。

### 阶段 12：响应式、可访问性与交互回归

- **目标：** 对完整核心页面做跨组件收尾，不以局部 magic number 修补。
- **文件：** 全局/组件 CSS、Playwright suites、必要 QA 文档。
- **工作：** 创建核心 `BackToTop.astro`；断点、touch/hover、safe-area、焦点、dialog 互斥、reduced motion、颜色对比、320px/400% zoom、固定元素偏移；Firefox 加入核心 E2E。
- **验证：** 键盘全站；Chrome/Firefox/Edge 基础回归；390×844、768×1024、1024×768、1440×900；自动化 a11y/Lighthouse 辅助人工检查。
- **前置：** 核心 P3–P9；实际启用的 P10/P11 也必须纳入。
- **风险：** 晚期浮动元素冲突；统一 `--floating-*` tokens，但不引入泛化 overlay manager。
- **完成标准：** P5/P9 的降级与浏览器回归通过；Chromium/Firefox 核心 E2E、回顶、桌面/移动和可访问性均无阻断缺陷。

### 阶段 13：RSS、Sitemap、SEO、404、性能与部署

- **目标：** 生成可部署、可发现、性能合格的静态产物。
- **文件：** rss、404、Astro config、BaseLayout head、图片/字体、README、CI/build scripts、`.github/workflows/deploy.yml`；不创建项目子路径下无效的 `public/robots.txt`。
- **工作：** 完成 canonical/OG、RSS、Sitemap、404、图片格式/尺寸、字体、草稿排除、依赖清单和部署 base 验证。新增独立 `deploy.yml`：push 到 `main` 后触发，使用 GitHub Pages 官方 `configure-pages`、`upload-pages-artifact`、`deploy-pages` Actions 流程，权限至少为 `contents: read`、`pages: write`、`id-token: write`；质量/构建 job 先安装依赖，执行真实 validate、check、unit、统一 `npm run build` 与必要的 production E2E，只有成功后才上传该次 `dist` 并部署。仓库 Pages Source 配置为 GitHub Actions。`ci.yml` 与 `deploy.yml` 职责分离但使用同一个 `npm run build`，deploy 不得维护另一条构建路径或绕过发布门槛。默认公开页面允许抓取；Sitemap 输出完整绝对地址。README 说明：只有未来能控制 `XMDEMAMO.github.io` 根站仓库时，才在根站添加 `/robots.txt` 并引用 PonyLab 的完整 Sitemap URL。
- **验证：** 完整 CI（含 validate、check、unit、统一 build、Chromium/Firefox E2E）；确认 `npm run build` 已生成 `dist/pagefind/`，preview 与 deploy 都加载 `/PonyLab/pagefind/pagefind.js`；验证 `/PonyLab/`、trailing slash、public 图片/音频、RSS/Sitemap/canonical 绝对地址、404、断链、草稿、Lighthouse、构建体积。对 deploy workflow 做权限、main 触发、质量 job 依赖、`dist` 上传及 Pages 环境 URL 检查；不要求也不测试 `/PonyLab/robots.txt`。
- **前置：** P0—P9、P12、最终内容；部署 URL 已在 P0 冻结，增强 P10/P11 只验证实际启用者。
- **风险：** Pages Source 未设为 GitHub Actions、deploy 使用不同构建命令、权限不足、质量检查与部署脱节、图片/音频过大或 canonical 错误；以同一构建命令、显式 job 依赖和部署后 smoke test 限制。
- **完成标准：** push 到 `main` 只会在 validate/check/unit/统一 build/必要 E2E 全部成功后部署同一次 `dist`；GitHub Pages 项目站、Pagefind、RSS/Sitemap/404 均可访问且不伪造子路径 robots 控制；核心 V1 可部署，增强项失败不得拖垮核心产物。

### 阶段依赖图

```text
P0 → P1 → P2 → P3 → P4 → P5 → P6 → P7 → P8 → P9 → P12 → P13
                              └────────→ P10（增强：ClientRouter + 音乐）
                    P3 + P7 (+ P10 若启用) → P11（增强：右侧进度）
P10/P11 若启用，必须在 P12/P13 纳入回归与发布验收
```

核心发布路径固定为 `P0 → P1 → P2 → P3 → P4 → P5 → P6 → P7 → P8 → P9 → P12 → P13`。P5/P9 必须完成；P10/P11 不阻塞核心 V1。P5 可按设备降级动画强度，但不能降级为完全没有三阶段表达。

## 13. 风险、来源边界与降级

| 风险 | 主方案 | 降级/边界 |
|---|---|---|
| Yuimi-chaya 无明确许可证 | 只参考构图、氛围和交互概念；PonyLab 重写组件/CSS/素材 | 不复制源码、CSS、漫画、人物、Logo、文案、音乐 |
| Mizuki 许可链 | 已见 Apache-2.0 及源自 Fuwari 的 MIT 声明；若复制具体代码须追踪文件来源并保留适用声明 | 默认只参考功能行为并重实现 |
| 正式媒体来源 | 用户提供并自行管理；开发者不逐项审核权利材料 | 不从参考仓库/截图复制，Codex 不擅自下载；缺失用本地占位 |
| 完整横向插画在手机竖屏裁掉构图 | 先为目标断点设置固定 `object-position`，优先保留脸、光环中心和花朵 | 仍不合格时从同一原图导出移动裁切版；不重新要求独立人物素材 |
| 标题或名片遮挡脸部、光环或花朵 | 桌面/移动分别设置 HTML 前景布局，卡片优先进入画面空白区 | 减少卡片宽度、调整进入方向或改自然流；不得通过移动或缩放背景解决 |
| 复杂背景导致文字对比度不足 | 使用固定渐变蒙版、文字阴影和半透明卡片，并在 light/dark 下检查对比度 | 蒙版可按主题使用预先确定的静态值，但阶段一与阶段二必须一致；不随滚动动态改变背景亮度 |
| 日间图与夜间图构图差异过大 | 选图时同时验证左侧标题区、右侧名片区和主体视觉重量；允许每主题独立 `object-position` 与蒙版 | 不复制两套 Hero 组件；不合格的日间图继续更换，不能靠大幅移动 HTML 或动态背景补救 |
| 主题切换重复下载或闪错图 | 初始主题脚本在首帧前确定模式；活动主题图优先，非活动图空闲预取或首次切换加载 | 慢网下保持旧图直到新图解码完成，再短交叉淡化；切换不重置滚动阶段 |
| 首页复杂滚动性能 | sticky + 前景 HTML 的 transform/opacity + 单 rAF；背景始终静止 | 减少前景装饰、位移距离和 sticky 时长；低高度、移动、reduced motion 使用自然流，但三阶段语义不删除，也不引入背景视差/缩放/模糊 |
| 滚动控件可用性 | 只做可选右侧控件，保留原生 scrollbar | 左侧仅静态背景线；触屏/平板/窄屏/短页/高倍缩放隐藏 |
| 音频自动播放限制 | 只由用户手势开始，刷新后暂停恢复 | 原型失败则延后整个播放器 |
| Astro 普通跳转中断音乐 | 可选 ClientRouter + persist 通过 spike 后实现 | 核心 V1 接受中断且不声称连续；不靠 localStorage 伪装连续 |
| ClientRouter 生命周期 | 统一 page-load/before-swap、单例守卫、AbortController 与 e2e | 重复监听或跨浏览器失败则关闭增强 |
| Pagefind dev/build/部署差异 | P9 把 Astro build + Pagefind 索引合并进唯一 `npm run build`，CI/preview/deploy 共用；初始化前生成 base-aware bundle 路径 | 必须存在 `dist/pagefind/` 且 `/PonyLab/pagefind/pagefind.js` 请求成功；索引失败仍保留元数据浏览，不能显示假正文结果或手工漏跑索引 |
| GitHub Pages workflow 漂移 | `ci.yml` 与 `deploy.yml` 分工但调用同一个 `npm run build`；deploy job 显式依赖质量/构建成功并上传该次 `dist` | Pages Source 必须为 GitHub Actions；权限或 smoke test 失败即不发布，不用另一条“仅部署”构建命令绕过门槛 |
| 子路径 robots 位置无效 | 项目不生成 `/PonyLab/robots.txt`，默认公开页允许抓取，Sitemap 使用完整绝对 URL | 未来仅在可控制 `XMDEMAMO.github.io` 根站时创建主机根 `/robots.txt` 并引用 PonyLab Sitemap |
| 日夜媒体表现 | 首页 light/dark 各用一张完整场景图与对应 UI tokens；其他媒体默认复用 | 两张实图均已到位；P4 必须分别验收桌面/移动裁切、文字对比度与名片避让，不能以动态移动背景补救构图 |
| 封面比例不一 | 固定 aspect-ratio、`object-position`、占位图 | 发布前逐图裁切预览，不允许自然高度撑乱列表 |
| 临时 ICO 清晰度有限 | 当前 32×32 `public/favicon.ico` 只服务浏览器标签，并在 16/32px 检查可辨识度 | 不放大制作 Apple Touch Icon；未来取得 SVG 或 ≥180×180 方形源图后一换一替换，不阻塞 P1/核心 V1 |
| 多强调色价值不足 | 核心只 light/dark，token 预留 accent | 全站完成且能仅改少量变量后再评估 UI |

## 14. 后续任务的 Codex / Claude Code 边界

适合在用户知情、工具安全审查允许且任务边界明确时交给 Claude Code：列目录和路径核对；搜索依赖/类名使用；批量检查 frontmatter 缺字段、重复 Tag、缺 alt；整理 check/build/Pagefind 日志；运行 formatter；统计图片尺寸/体积；在接口已定后生成低风险 fixture 或机械重命名。每次只给一个任务，不与 Codex 同时修改同一文件，结果由 Codex 复核。

必须由 Codex 完成：最终架构和范围取舍、部署/slug 契约、视觉方案、组件边界、依赖选型、参考代码复用边界、ClientRouter 生命周期、连续音乐、Pagefind 排序/状态语义、响应式与可访问性验收、需求冲突处理、最终代码审查和阶段完成判断。

## 15. 阶段 0 确认结果与后续输入

阶段 0 已无阻塞架构决策：GitHub Pages 普通项目站、`site=https://xmdemamo.github.io`、`base=/PonyLab`、`trailingSlash=always`、`PonyLab` 站名、类型化占位配置、最低 5 图档、路线 A，以及 P5/P9 核心范围均已确认。公开首页固定为 `https://xmdemamo.github.io/PonyLab/`，只有仓库改名、改为用户主页仓库或启用自定义域名时才重新评估。夜间首页场景已通过 1440×900 独立预览；日间场景也已按目标路径放置并通过源文件规格检查，桌面/移动实际裁切留到 P4 在真实页面中验收。进入 P1 不需要等待全部 23 张正式图片，但本轮结束仍等待用户对修订版的最终确认。

作者名、简介、社交链接、首页正式文案和正式素材属于后续可替换输入；到位后只更新配置/资产引用，不改变组件接口和布局。P10 音乐与 P11 右侧控件在核心 V1 完成后再单独决定。

以下已由工程方案明确，无需再次确认：首页展示 4 篇、首发内容按 6 篇核算；博客客户端增强态默认每页 8 篇（测试 pageSize=2），无 JS 显示完整列表或明显归档入口；保留独立 Tag/分类页；核心 V1 不建项目详情；P5/P9 属核心；只允许一个可选右侧进度控件；背景仅使用静态媒体/CSS 装饰；首页日夜分别使用完整场景图，其他媒体默认复用；首发仅 light/dark；ClientRouter 采用路线 A。

## 附录 A：已阅读与核查范围

### 设计文档

- `D:/PonyLab/PonyLab设计文档.docx`：已解析全部 15 个章节、表格、结构说明和 16 张内嵌图片。
- 已逐图核对首页三阶段及删改标注、首页文章区、博客桌面/筛选/移动卡、文章页、项目页、个人/爱好页、两种导航和播放器迷你/完整态。
- 当时环境无法完成 Word 整页 PNG 渲染，已按文档处理流程的降级路径检查正文/表格结构与原始内嵌图片；这项限制不等于未读图片。

### 本轮首页场景素材与预览

- `D:/壁纸/74017219_p0.jpg`：已读取并核对为 10000×5012、约 2:1、24-bit RGB JPEG、约 12.24 MiB；人物、光环、翅膀、花朵和城市背景均已合成，无 Alpha 通道。
- `docs/home-hero-desktop-preview.html` 及 1440×900 阶段一/阶段二截图：已用于确认桌面 `cover` 裁切、标题与名片落位。用户已确认采用该构图方向；预览不是应用代码，也不是正式组件实现。

### 当前项目

- `package.json`、`package-lock.json`、`astro.config.mjs`、`tsconfig.json`、`.gitignore`。
- `src/pages/index.astro`、`README.md`、`AGENTS.md`、`CLAUDE.md`、`.vscode/*`、public favicon 清单。
- Git status、tracked files、分支/remote/initial commit、`npm ls --depth=0` 和基线 build 结果。

### Yuimi-chaya（`E:/GitHub/Yuimi-chaya.github.io`）

- 检查了 `src`、package/lock、Astro config、public 资源、Git remote 和许可证声明。
- 重点读过首页、BaseLayout、ArticleLayout、博客列表/动态文章、content config、site 工具和全局样式相关断点。
- 结论：视觉与音乐/滚动逻辑真实存在，但页面和全局 CSS 高度集中；其轨道主要是进度动画而非完整可访问拖动控件；本地仓库未见许可证文件，因此不能复制。

### Mizuki（`E:/GitHub/Mizuki`）

- 检查了 package、Astro/Pagefind/Svelte 配置、路由、内容配置、主网格、搜索、桌面/移动 TOC、主题、音乐 store/player、卡片、项目/归档、RSS、阅读时间、KaTeX/代码配置和响应式样式。
- 检查了 Apache-2.0 `LICENSE`、`LICENSE.MIT`、README 来源说明和 Git remote。
- 结论：功能思路成熟，但依赖 Svelte、Swup、Tailwind 和较大组件/脚本体系；PonyLab 只抽取需求契约并重实现。

### MyBlogDemo 与文档

- **本地克隆不存在，但 GitHub 仓库地址已获得；可在线检查或在获准后克隆。当前仅能确认地址可用，尚未把该仓库源码计入“已阅读源码”。** 后续引用其实现前必须先实际读取相关源码和许可证，不能只看 README。
- 已核对 Astro 官方 routing、components、Content Collections、styles、View Transitions、RSS、Sitemap 文档和 Pagefind 的索引/dev 差异说明。正式实现相关阶段还需按 `AGENTS.md` 再核对当前版本官方指南。

## 附录 B：交付前计划一致性检查

- 文章动态路由只允许出现 `[...slug].astro`；不得再使用单段动态路由文件作为实现目标。
- P2 的 strict schema 与原始 frontmatter 扫描必须共同禁止顶层 `slug`；根级 `src/content/blog/index.md`、`foo.md`/`foo/index.md` 冲突都必须在 build 前失败。
- ClientRouter 的唯一有效路线是 A，默认首次只可能在 P10 原型后出现；路线 B 仅为决策历史，不是并行实施说明。
- light/dark tokens 在 P1，首帧主题初始化在 P3；后续主题工作只剩按钮、面板/第三方样式和对比度回归。
- P1 只有 check/test:unit/build；真实 `validate:content` 从 P2 开始并进入 prebuild/CI；favicon 资源 200 在 P1，正式 head/浏览器标签验收在 P3。
- P4 创建基础 `PostCard` 且统计仅含文章/Tag；P6 扩展同一组件，P8 建立项目数据后再增量接入项目数。
- P9 无查询排序与有查询相关性排序不得混用；统一 `npm run build` 必须生成 `dist/pagefind/`，CI/preview/deploy 使用同一入口并验证 `/PonyLab/pagefind/pagefind.js`。
- `/blog/` 无 JS 输出完整列表或明显归档入口；`?page=`、`?q=` 和组合 history 状态只属于渐进增强，Tag/分类依靠独立静态路由。
- 网站默认 `zh-CN`，显示时区为 `Asia/Hong_Kong`；日期格式化与 CJK/英文阅读时间有 unit/P7 验收，Pagefind 使用正确中文语言标记。
- P13 使用独立 `deploy.yml` 和 GitHub Pages 官方 Actions，只有质量/统一 build/E2E 成功才上传同一次 `dist`；项目不生成无效的 `/PonyLab/robots.txt`，Sitemap 仍输出完整绝对 URL。
- P5/P9 是核心发布门槛；P10/P11 是可选增强；P12/P13 纳入全部核心功能和实际启用的增强功能。
- 每个主题内部，首页阶段一与阶段二必须复用 `HomeHeroScene` 的同一完整场景图 DOM 实例；主要测试断言 `currentSrc`、布局盒、`object-position`、transform/filter 等 computed style 与网络请求不变，截图只作容差辅助。滚动只切换 HTML 前景内容；只有用户/系统主题变化可以在 light/dark 完整场景图之间切换，任何由滚动触发的背景换图、动态裁切、视差、缩放或滤镜变化都不属于核心实现。
- 每阶段文件、前置依赖、验证方式、风险和完成标准必须随实现范围变更同步更新本计划。

## 附录 C：末尾汇总

- **已阅读：** 完整设计文档及 16 张内嵌图；当前项目的全部源码/配置/依赖清单和 Git 状态；Yuimi-chaya 与 Mizuki 的相关实际源码、配置、依赖、Git/许可文件；Astro 与 Pagefind 相关官方文档。MyBlogDemo 本地克隆不存在但 GitHub 地址已获得，源码尚未计入已阅读范围。
- **仍待后续替换：** 作者资料、社交链接、首页正式文案、占位 Logo/默认封面及其他正式内容素材；light/dark 两张首页完整场景图均已到位，P4 只需完成真实页面裁切与可读性验收。现有 32×32 ICO 可在未来取得 SVG/高清方图后替换。GitHub Pages 项目站、`site/base/trailingSlash`、核心范围、双主题场景方案、ClientRouter 路线、滚动控件数量和素材档均已冻结。
- **推荐新增：** P1 的 `@astrojs/check`、Vitest；P3 的 Playwright；P7 的数学公式依赖并评估 Expressive Code；核心 P9 的 Pagefind；P13 的 RSS 与 Sitemap 集成。
- **暂不建议：** Svelte、Swup、React/Vue、Tailwind、GSAP、全局状态库、MDX、SSR adapter、大型图标包；也不为播放器单独引入大型状态框架。
- **适合 Claude Code：** 目录/引用扫描、frontmatter/alt/重复项批查、日志整理、formatter、素材尺寸统计、已定接口后的 fixtures 与机械修改；全部由 Codex 复核。
- **必须由 Codex：** 架构、视觉、路由/数据契约、依赖与参考代码边界、ClientRouter/音乐/Pagefind 状态模型、可访问性、最终审查和阶段验收。
- **阶段 0 结果：** GitHub Pages `/PonyLab/`、`always` 尾斜杠、路线 A、最低 5 图档和 light/dark 双首页场景方案均已冻结；核心推荐档为 23 张图片。定向修订已完成，当前仍停留在计划阶段；收到用户最终确认后即可进入 P1。
