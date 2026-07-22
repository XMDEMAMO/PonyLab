# P4 首页静态结构阶段汇报

## 阶段结论

P4 已按 `docs/development-plan.md` 完成：首页使用 light/dark 两张完整场景图，建立标题、终端静态最终态、普通头像个人名片、内容过渡、最新文章区、文章/Tag 统计及可复用的基础 `PostCard`。页面在 JavaScript 关闭时仍保持标题、名片、文章区和统计区的自然阅读顺序；没有提前实现 P5 滚动状态机、Pagefind、ClientRouter、音乐播放器或右侧滚动控件。

工作分支：`codex/p4-home-static`。

## 实际文件

新增：

- `src/config/home.ts`
- `src/utils/home.ts`
- `src/components/home/HomeHeroScene.astro`
- `src/components/home/HeroTitle.astro`
- `src/components/home/TerminalTyping.astro`
- `src/components/home/ProfileCard.astro`
- `src/components/home/HomeSectionTransition.astro`
- `src/components/home/LatestPosts.astro`
- `src/components/home/SiteStats.astro`
- `src/components/blog/PostCard.astro`
- `scripts/prune-image-masters.ts`
- `tests/unit/home.test.ts`
- `tests/unit/build-assets.test.ts`
- `tests/unit/p4-contract.test.ts`
- `tests/e2e/home.spec.ts`
- `docs/stage-reports/p4-home-static-report.md`

修改：

- `src/pages/index.astro`
- `package.json`
- `README.md`

没有删除上一阶段的应用或回归测试；差异复核时发现 `tests/unit/p3-contract.test.ts` 曾被误删，已在提交前按原内容恢复。

## 对应 P4 目标

### 双主题完整场景图

- `HomeHeroScene` 直接消费 `home-hero-scene-light.png` 与 `home-hero-scene-dark.jpg`，没有独立人物图层或人物动画。
- 使用 `astro:assets` 为每个主题生成 640、960、1280、1600、1920、2560 宽度范围内的 AVIF/WebP，并为首屏图片声明宽高、`sizes`、eager load 和 high fetch priority。
- 当前主题只有一个受控图片 DOM 实例；主题切换只替换该实例的响应式源，light/dark 不同时叠放两个大图层。
- 图片始终使用静态 `object-fit: cover`、主题/断点固定 `object-position`、`transform: none` 和 `filter: none`。P4 没有监听滚动，也没有 `requestAnimationFrame`。
- 夜间原图顶部约 8.8%、底部约 8.0% 为构图自带黑带。桌面端通过配置化的上 11%/下 10% 静态溢出裁切去除硬边，移动端使用较轻的上 6%/下 5% 裁切保护脸部构图；裁切值不随滚动变化，日间图保持 0%。
- 根据实际页面反馈，日间静态蒙版强度由 0.52 调低到 0.40，减轻白雾感并保留标题区域的文字对比度；夜间蒙版保持不变。
- 无 JavaScript 时 `<noscript>` 输出优化后的日间完整场景图；页面正文无需脚本即可阅读。

### 首页静态前景

- `HeroTitle` 输出 Pony/Lab 两行主标题、可配置副标题与固定终端最终态。
- `ProfileCard` 使用普通头像及站点作者配置；卡片没有再次放入抠图人物。
- DOM 顺序固定为标题、个人名片、文章/统计内容，为 P5 动画降级和无脚本阅读保留正确顺序。
- `HomeSectionTransition` 只提供静态视觉分隔，不承担滚动进度或状态管理。

### 文章预览、基础卡片与统计

- `selectHomePosts()` 复用既有发布过滤和标准排序，最多返回 `homeConfig.latestPostCount` 指定的 4 篇文章。
- 当前仓库只有一篇 `draft: true` 的 schema 验证文章，因此首页诚实显示空状态，不发布虚构文章，也不生成尚不存在的详情链接。
- `PostCard` 已在 P4 建立基础封面、分类、日期、摘要与 Tag 展示；P6 将扩展同一组件，而不是复制第二套文章卡。
- `SiteStats` 只统计已发布文章数量与唯一 Tag 数；没有为项目数量提前建立 P8 数据层。

### 配置与路径

- 首页可替换文案、终端文字、文章数量、两主题 alt、桌面/移动焦点和静态蒙版集中在类型化 `src/config/home.ts`。
- 首页到 `/about/`、`/blog/` 和文章详情的链接继续使用既有 base-aware path helper，兼容 GitHub Pages `/PonyLab/` 子路径。
- README 已同步 P1—P4 状态、命令、部署、内容约束、配置/素材路径、阶段边界和当前空状态。

## 响应式与视觉复核

在生产构建上逐一检查了以下 light/dark 组合：

- 1440×900 宽屏桌面；
- 1024×768 普通桌面/平板横向；
- 390×844 与 360×800 手机；
- 844×390 低高度横屏。

共 10 个视图均满足 `scrollWidth === clientWidth`，没有页面级横向溢出。桌面标题与名片分别占据构图留白；1024px 日间图采用固定左侧焦点避免文字压住人物面部；手机端分别使用 light `48% 54%` 与 dark `43% 46%` 的静态焦点，终端缩窄以保留主体面部。低高度横屏使用 42rem 自然滚动降级，不强行把所有内容压进一屏。

这些调整都只改变固定 CSS 布局值；没有通过滚动移动、缩放、模糊、调暗或动态裁切背景。

用户在 2048×1134 实际页面中指出夜间源图上下黑带边界突兀后，又针对 2048×1134、1024×768 和 390×844 复核静态裁切：两档桌面黑带已完整退出 hero，可见人物脸部、光环、翅膀和花朵，标题/名片不重叠；手机端保留轻量裁切以控制主体放大幅度。浏览器控制台无 error 或 warning。

## 构建产物优化

首次检查 `dist/_astro` 时发现 Astro 在生成响应式图片之外，仍会保留被 import 的原始母版：夜间约 12.8 MB、日间约 7.5 MB，另有约 3.4 MB 的默认封面原图。页面没有引用这些文件，但直接部署会违背“母版不原样发布”。

为此新增 `scripts/prune-image-masters.ts` 并接入统一 `npm run build`：

- 只匹配首页两张母版与默认封面的 Astro 哈希原格式文件；
- 在删除前递归扫描构建出的 HTML/CSS/JS/JSON/XML 等文本，若文件仍被引用则立即让构建失败；
- 不删除文章封面、SVG、AVIF、WebP 或其他未知资源；
- 单元测试验证白名单范围和“仍被引用时拒绝删除”。

最终构建移除 3 个未引用母版，首页最大响应式输出约 306 KiB；源母版仍完整保留在 `src/assets`，只是不进入最终部署产物。P9 接入 Pagefind 时仍必须沿用同一个 `npm run build` 入口。

## 测试与审查记录

- 先新增 P4 配置、文章筛选/统计、组件边界与 README 契约测试；第一次运行按预期因实现尚不存在而失败，随后实现使其转绿。
- E2E 覆盖标题→名片→内容顺序、首页空状态、light/dark 单图片实例、实际滚动前后的 `currentSrc`/相对布局盒/`object-position`/transform/filter、同一 DOM 上主题换源、10 组桌面/平板/手机/低高度 light/dark 布局，以及无 JavaScript 场景降级。
- 视觉检查不使用逐像素完全一致作为 CI 门槛；自动化以 DOM、computed style 和资源身份为主，截图只用于人工辅助。
- 最终差异检查恢复了误删的 P3 契约测试，P1—P3 回归覆盖没有因进入 P4 而减少。
- 构建产物检查暴露母版原样发布问题后，以额外红灯测试驱动清理脚本，并再次验证 production preview。
- 只读代码审查无 Critical，指出无脚本场景被透明占位挤出、滚动/视口矩阵覆盖不足和最终构建后需重跑 E2E 三项 Important。托管图片现默认 `hidden` 且只在脚本换源后解除，无脚本 fallback 与 hero 交集有浏览器断言；矩阵扩为 10 组，最终清理后产物已重跑全部 E2E。审查指出的生成日志和未使用 import 也已清理。

## 依赖调整

本阶段没有安装、升级或移除依赖，`package-lock.json` 不变。继续使用现有 Astro、TypeScript、Vitest、Playwright 与 `tsx`；没有加入 Pagefind、前端/CSS 框架、ClientRouter、全局状态库或动画库。

`npm audit` 的网络请求在当前受控执行环境中被策略拒绝，因此本阶段没有新的在线审计结果；P4 的锁文件和依赖集合均未变化。该项不是 P4 完成门槛，CI/Dependabot 的远端状态仍以 GitHub 为准。

## 最终验证结果

1. `npm ci`：通过，安装 308 个锁定包。首次运行因遗留 Astro preview 占用 Rolldown 原生模块而得到 `EPERM`；核实并只结束 PonyLab 预览进程后重试通过。
2. `npm run validate:content`：通过，检查 1 个 Markdown 文件。
3. `npm run check`：通过，0 errors、0 warnings、0 hints。
4. `npm run test:unit`：通过，15 个测试文件、105 个测试；覆盖既有 P1—P3 与新增 P4 回归。
5. `npm run build`：通过；先执行真实内容校验，再生成 1 个静态页面和响应式首页图片，最后安全移除 3 个未引用母版。
6. production preview + `PONYLAB_E2E_EXTERNAL_PREVIEW=1` + `npm run test:e2e`：23 个 Chromium 测试全部通过；本次运行位于最终母版清理构建之后。
7. `dist/favicon.ico`：存在，655 B；GitHub Pages base 下既有 favicon 行为未回退。
8. `git diff --check`：作为提交前门槛执行，无 whitespace error。

## 实际状态与计划差异

- 计划写“首页展示 4 篇文章”，但仓库当前没有可发布文章。实现保留“最多 4 篇”的真实数据路径并显示明确空状态，没有为了截图制造假内容；正式文章加入后会自动进入同一布局。
- Astro 7 的本地图片导入会把原格式文件作为构建资产发出，即使最终 HTML 只引用优化格式。计划要求母版不原样发布，因此在 P4 增加了窄范围、引用感知的构建后清理步骤；这没有改变应用架构、素材接口或部署入口。
- README 原先只反映较早阶段，本轮按用户要求同步为当前 P4 状态。

## 阶段边界

- 未创建 `HomeScrollScene.astro`，未实现 P5 sticky 三阶段、CSS progress、单 rAF 或标题/名片滚动切换。
- 未改变背景图片的滚动状态；阶段一/二的同主题场景仍将复用当前同一图片实例。
- 未创建博客列表/Tag/分类/归档路由、文章详情、项目/About 数据层或搜索索引。
- 未引入 Pagefind、ClientRouter、音乐播放器、右侧滚动控件或新 UI 依赖。
- 未修改冻结的 `site`、`base`、`trailingSlash`、P5/P9 核心范围或 P10/P11 可选定位。

P4 的静态首页、真实数据空状态、双主题响应式场景、构建产物约束和本地自动化验收均已完成。合并并确认 CI 后即可进入 P5；本阶段没有自行开始 P5。
