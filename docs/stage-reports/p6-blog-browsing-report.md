# P6 博客浏览阶段汇报

## 阶段结论

P6 已按 `docs/development-plan.md` 完成：PonyLab 现在具备不依赖全文索引的博客列表、Tag、分类和归档浏览系统。静态 HTML 是内容基线，原生 TypeScript 只为 `/blog/` 增加筛选、分页、URL 分享和 history 恢复；关闭 JavaScript 时不会伪装成能根据查询参数生成另一份分页 HTML。

工作分支：`codex/p6-blog-browsing`。

## 实际文件

新增：

- `src/utils/blog.ts`
- `src/components/blog/BlogExplorer.astro`
- `src/components/blog/TagFilter.astro`
- `src/components/blog/FilterStatus.astro`
- `src/components/blog/PostList.astro`
- `src/components/blog/Pagination.astro`
- `src/components/blog/EmptyState.astro`
- `src/components/blog/ArchiveList.astro`
- `src/pages/blog/index.astro`
- `src/pages/tags/[tag].astro`
- `src/pages/categories/[category].astro`
- `src/pages/archive.astro`
- `tests/unit/blog.test.ts`
- `tests/unit/p6-contract.test.ts`
- `tests/e2e/blog.spec.ts`
- `docs/stage-reports/p6-blog-browsing-report.md`

修改：

- `.gitignore`
- `src/components/blog/PostCard.astro`
- `README.md`

没有修改依赖、内容 schema、部署配置、素材、工作流，也没有创建 P7 文章详情路由或 P9 搜索组件。

## 对应 P6 目标

### 静态内容基线

- `/blog/` 在构建时读取 Content Collection，过滤草稿后按既有“置顶、日期、ID”规则输出完整文章集合。
- 页面始终提供 `/archive/` 全量入口；Tag 与分类胶囊的普通 `href` 指向独立静态路由，脚本关闭后仍然可导航和分享。
- `getStaticPaths()` 为每个已登记 Tag 和分类生成页面，即使当前计数为 0 也保留稳定入口。
- `/archive/` 按发布日期倒序组织年份、月份和文章；归档明确忽略首页置顶顺序。

### 共享查询与数据规则

- `src/utils/blog.ts` 集中提供已发布文章筛选、Tag/分类计数、组合过滤、分页、URL 参数解析/序列化和归档分组。
- 查询参数只接受 `src/config/taxonomy.ts` 已登记的 slug；未知值会被忽略，页码只接受正整数并钳制到有效范围。
- 正式分页大小为每页 8 篇；单元测试使用 `tests/fixtures/posts.ts` 的每页 2 篇小数据集覆盖边界，不添加假生产文章。
- taxonomy 显示名与 URL slug 始终通过同一配置映射，静态页与客户端筛选不会维护两套规则。

### 渐进增强与 URL 状态

- `BlogExplorer` 用原生 TypeScript扫描静态 `PostCard` 数据属性，不引入 React、Vue、Svelte 或全局状态库。
- Tag、分类或清空操作使用 `pushState`；筛选变化把 page 重置为 1，分页写入 `?page=`，`popstate` 重新解析并恢复当前会话状态。
- URL 序列化顺序固定为 `tag`、`category`、`page`，第 1 页省略 `page`，复制按钮写入当前可分享地址。
- 空结果显示明确状态，已有静态列表仍保留在 DOM 中；JavaScript 只用 `hidden` 控制当前页卡片。
- `?q=` 未在 P6 实现或宣传；正文全文搜索仍严格留在 P9 Pagefind 阶段。

### 组件、响应式与可访问性

- P4 的 `PostCard.astro` 原位增加 `grid/list` 变体、文章数据属性以及 base-aware Tag/分类静态链接，没有创建重复卡片。
- 博客列表桌面端为横向卡片，手机端转为纵向；筛选胶囊允许换行，320px 视口没有横向滚动。
- 筛选状态和分页状态使用 `aria-live`；分页为语义化 `nav`，按钮保留 disabled 与焦点行为；空状态使用明确标题和说明。
- 所有内部链接继续经 `sitePaths` 生成，GitHub Pages `/PonyLab/` 子路径没有硬编码散落到组件。

## 无 JavaScript 策略

- `/blog/` 的服务端 HTML 包含完整非草稿列表；`Pagination` 初始隐藏，只有脚本成功运行后才按每页 8 篇显示。
- Tag 与分类使用独立静态页保证无脚本可浏览，而不是依赖 `?tag=` 恢复状态。
- `?page=`、组合筛选、复制和 history 都只属于渐进增强。关闭 JavaScript 后，即使地址带 `?page=2&tag=astro`，页面仍显示同一份完整 HTML，而不会声称查询参数已恢复分页。
- 当前仓库只有一篇开发草稿，真实生产页面因此诚实显示空状态；E2E 通过测试期 DOM/HTML 夹具验证 10 篇文章的增强与无脚本边界，没有写入假生产文章。

## 测试策略

- 单元测试覆盖组合 taxonomy 筛选、完整计数、先筛选后分页、越界页钳制、URL 白名单与稳定序列化，以及忽略置顶的年月归档顺序。
- 契约测试确认 P6 的组件、路由、工具、README 和阶段报告存在，并确认 Pagefind、SearchField 与文章详情路由没有提前出现。
- Playwright 使用 10 篇测试期文章覆盖每页 8 篇分页、直接 URL 恢复、组合筛选、空结果、清空、复制链接、浏览器前进/后退、长 Tag 和 320px 防溢出。
- 无 JavaScript E2E 在响应 HTML 中注入测试夹具，验证带查询参数时仍显示全部 10 篇、归档入口可见、客户端分页与复制控件不启动。
- 静态路由 E2E 逐一检查 Tag、分类和归档地址返回 200 并显示主标题。

## 依赖调整

本阶段没有安装、升级或移除依赖，`package.json` 与 `package-lock.json` 不变。P6 继续使用 Astro、TypeScript、Vitest、Playwright 和普通 CSS；Pagefind 仍留在 P9，ClientRouter/音乐仍留在 P10，右侧滚动控件仍留在 P11。

## 验证结果

1. `npm run validate:content`：通过，检查 1 个 Markdown 文件。
2. `npm run check`：通过，76 个文件，0 errors、0 warnings、0 hints。
3. `npm run test:unit`：通过，19 个测试文件、122 个测试。
4. `npm run build`：通过，生成首页、博客、归档、3 个分类和 4 个 Tag，共 10 个静态页面；图片管线维持 25 个响应式输出并移除 3 个未引用母版。
5. `npm run test:e2e`：通过，37 个 Chromium 测试；其中 P6 新增 5 个生产预览测试。
6. 人工视觉复核：桌面 light 博客页、桌面 dark 归档页与 Pixel 5 light 博客页均无横向溢出，信息层级、空状态和胶囊换行正常。
7. `git diff --check`：提交前执行，无 whitespace error。

## 实际状态与计划差异

- 当前没有已发布文章，无法用真实生产内容触发分页。遵守“不发布假文章”的既有决策后，E2E 仅在浏览器测试生命周期注入夹具；生产 Content Collection 保持不变。
- 当前 Windows Chromium 在个别 E2E 运行中会把 GPU 初始化诊断写入根目录 `debug.log`；该文件不影响用例或产品，已加入 `.gitignore`，不会污染阶段提交。
- P6 不需要新封面素材：文章存在真实封面时由 `astro:assets` 输出，缺失时继续复用既有默认封面。计划中的 `src/assets/covers/posts/` 可等真实文章封面出现时再创建。
- Pagefind 尚未进入构建，`?q=` 不参与当前客户端逻辑；这与 P9 的冻结边界一致。

## 阶段边界

- 未创建 `src/pages/blog/[...slug].astro`、文章正文、TOC、代码复制或数学公式，P7 未提前开始。
- 未创建项目/About 数据层，P8 未提前开始。
- 未安装或配置 Pagefind，P9 未提前开始。
- 未启用 ClientRouter、音乐播放器或右侧滚动控件，P10/P11 仍为可选增强。
- 未修改 `site=https://xmdemamo.github.io`、`base=/PonyLab`、`trailingSlash=always`、双首页场景图或三阶段滚动语义。

P6 完成后，核心执行路径的下一阶段为 P7 文章详情；在本分支合并并由用户确认前不开始 P7。
