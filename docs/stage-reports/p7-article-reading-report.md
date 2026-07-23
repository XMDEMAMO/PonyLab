# P7 文章详情、目录、代码与数学阶段汇报

## 阶段结论

P7 已在 P2 内容契约和 P6 博客浏览层上完成嵌套文章阅读链路：非草稿 Markdown 可按真实目录生成静态详情页，文章具备统一头部、中文日期与中英混合阅读时间、桌面/移动目录、代码高亮与复制、表格、数学公式、前后篇及 taxonomy 导航。正文和公式样式仅进入文章布局，关闭 JavaScript 后正文内容仍完整可读。

本轮同时按用户确认修正了 P5 阶段二动效：从连续滚动显隐改为有阈值、可回弹的一次性编排，并将个人名片升级为“圆形头像升起左移 → 冷色终端窗展开 → 内容逐行打字”。首页场景图片不参与任何滚动变换。

工作分支：`codex/p7-article-reading`。

## 实际文件

P7 新增：

- `src/pages/blog/[...slug].astro`
- `src/layouts/ArticleLayout.astro`
- `src/components/article/ArticleHeader.astro`
- `src/components/article/TableOfContents.astro`
- `src/components/article/TocList.astro`
- `src/components/article/MarkdownContent.astro`
- `src/components/article/CodeEnhancements.astro`
- `src/components/article/PostNavigation.astro`
- `src/styles/prose.css`
- `src/utils/article.ts`
- `tests/unit/article.test.ts`
- `tests/unit/p7-contract.test.ts`
- `tests/e2e/article.spec.ts`
- `docs/stage-reports/p7-article-reading-report.md`

P7 修改：

- `astro.config.mjs`
- `package.json`
- `package-lock.json`
- `src/content/blog/astro/ponylab-content-foundation.md`
- `README.md`
- `docs/development-plan.md`

P5 修正涉及：

- `src/components/home/HomeScrollScene.astro`
- `src/components/home/ProfileCard.astro`
- `src/pages/index.astro`
- `src/utils/home-scroll.ts`
- `tests/unit/home-scroll.test.ts`
- `tests/unit/p5-motion-contract.test.ts`
- `tests/e2e/home-scroll.spec.ts`
- `tests/e2e/home.spec.ts`
- `docs/stage-reports/p5-home-scroll-report.md`

## P7 实现

### 静态路由与内容一致性

- `[...slug].astro` 通过 `getStaticPaths()` 只为非草稿文章生成路径，并复用 `toArticleSlug()`，因此详情 URL 与 P2 路径校验、P6 卡片链接保持一致。
- 页面使用 Astro `render(post)` 获取正文组件与 headings，再把 heading 转为支持 h2/h3/h4 的嵌套目录树。
- 上一篇/下一篇复用内容层的稳定排序；不存在的 slug 由静态服务器返回项目 404。

### 阅读体验

- `ArticleHeader` 输出面包屑、标题、摘要、发布/更新日期、阅读时间、分类、Tag 和可选封面。
- 日期继续统一为 `zh-CN` 与 `Asia/Hong_Kong`，阅读时间同时统计 CJK 字符和英文单词，代码块不计入正文。
- 桌面只渲染右侧 sticky 目录；小屏只渲染可折叠目录。目录锚点无需 JavaScript即可使用，脚本只渐进增强当前章节标记。
- `prose.css` 处理标题锚点偏移、段落、列表、引用、代码、宽表格、图片、公式、打印和深浅主题。

### 代码与数学

- 代码高亮继续使用 Astro 内置 Shiki，配置 light/dark 双主题；没有为单一功能引入 Expressive Code。
- 代码复制按钮由客户端脚本渐进创建，支持键盘焦点、成功/失败状态；Clipboard API 不可用时明确显示失败，无 JavaScript 时保留原始代码块。
- 数学链路使用 `@astrojs/markdown-remark` 的统一处理器组合 `remark-math` 与 `rehype-katex`，KaTeX CSS 只由 `ArticleLayout` 引入。

## P5 动效修正

- 小段滚轮输入先累计方向和距离；未达到阈值时只显示头像轻微探出，停止输入后回弹到阶段一。
- 达到阈值后锁定一次编排：标题/首屏终端快速退出，头像从中下方升起到中央并左移，连接线出现，终端名片展开，命令、作者名和资料按时序打字显示。
- 反向滚轮达到阈值后播放收回状态；键盘 PageDown/ArrowDown/Space 和 PageUp/ArrowUp 提供等价提交路径。
- reduced motion、低高度和受限设备继续使用完整自然阅读流；场景图 DOM、资源、裁切和滤镜不随阶段改变。

## 依赖调整

新增运行依赖：

- `@astrojs/markdown-remark`：使用 Astro 官方 Markdown 统一处理器接口组合插件。
- `remark-math`：识别 Markdown 行内与块级数学语法。
- `rehype-katex`：把数学语法转换为静态 KaTeX HTML/MathML。
- `katex`：提供渲染实现及文章页公式样式。

没有加入 Expressive Code、MDX、前端框架、动画库、ClientRouter、Pagefind、播放器或全局状态库。

## 验证范围

- unit：heading 层级树、P7 文件与依赖边界、P5 滚轮阈值/方向/回弹状态，以及既有内容、日期、阅读时间和博客纯函数。
- E2E：真实嵌套文章直达、`zh-CN`、日期/阅读时间、桌面与手机目录、锚点、表格、KaTeX、键盘复制、390px 防溢出、无 JavaScript 与未知 slug 404。
- 首页回归：light/dark、桌面/手机、阈值回弹、完整阶段提交、背景 DOM/样式/资源不变量、reduced motion 与无 JavaScript。
- 人工视觉检查：1440×900 和 390×844 生产预览；桌面仅一份右侧目录，手机仅一份折叠目录，正文无横向溢出。

最终命令与精确数量记录在本报告“最终验证结果”中。

## 最终验证结果

1. `npm run check`：通过，89 个文件，0 errors、0 warnings、0 hints。
2. `npm run test:unit`：通过，22 个测试文件、132 个测试。
3. `npm run build`：通过；`prebuild` 校验 1 个 Markdown 文件，Astro 生成 11 个静态页面（包含 `/blog/astro/ponylab-content-foundation/`），处理 29 个响应式图片输出并移除 2 个未引用母版。
4. `npm run test:e2e`：通过，43 个 Chromium production-preview 测试，包含 5 个文章专项测试和完整 P1—P7 回归。
5. 专项串行回归：文章、博客 fixture 与首页共 25 个测试通过，用于复核真实已发布文章加入后的测试隔离。
6. 人工视觉检查：1440×900 与 390×844 的 production preview 均通过；桌面只显示右侧 sticky 目录，手机只显示折叠目录，公式、代码、表格和长路径无横向溢出。
7. `git diff --check`：提交前执行，无 whitespace error。

第一次完整 E2E 暴露了阶段推进后的测试假设：P6 fixture 过去依赖仓库没有已发布文章，P7 发布真实验证文章后导致数量多 1；首页旧断言也仍期待空状态。修正方式是让 P6 fixture 明确替换/隐藏真实内容，并把首页断言更新为真实文章与统计值，没有通过改回草稿来规避 P7 验收。打印测试的双响应式目录断言也改为检查“可见数量为 0”，避免严格单元素选择器误报。修正后完整 43 项通过。

## 阶段边界

- 未创建项目或 About 数据层，P8 未提前开始。
- 未加入 Pagefind 或修改正式 build 为搜索索引构建，P9 未提前开始。
- 未加入 ClientRouter、音乐播放器或右侧滚动控件；P10/P11 仍为可选增强。
- 未改变 GitHub Pages `site`、`base`、`trailingSlash`、内容 slug 契约或首页 light/dark 双场景图片方案。

P7 完成后，核心执行路径的下一阶段是 P8 项目页与个人页；在本分支合并并确认前不开始 P8。
