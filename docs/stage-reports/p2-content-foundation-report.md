# P2 内容基础阶段汇报

## 阶段结论

P2 已按 `docs/development-plan.md` 完成：内容集合、文章路径契约、原始 frontmatter 校验、分类/Tag 映射、日期与阅读时间、文章排序/前后篇及测试数据均已建立。真实 `validate:content` 已进入 `prebuild` 和 CI；没有提前引入或实现 P3 及后续页面、Playwright、Pagefind、ClientRouter、播放器或右侧滚动控件。

工作分支：`codex/p2-content-foundation`。

## 实际文件

新增：

- `src/content.config.ts`
- `src/content/schema.ts`
- `src/content/blog/astro/ponylab-content-foundation.md`
- `src/config/taxonomy.ts`
- `src/types/content.ts`
- `src/utils/content-date.ts`
- `src/utils/posts.ts`
- `src/utils/reading-time.ts`
- `scripts/validate-content-paths.ts`
- `tests/fixtures/posts.ts`
- `tests/unit/content-integration.test.ts`
- `tests/unit/content-paths.test.ts`
- `tests/unit/content-schema.test.ts`
- `tests/unit/p2-contract.test.ts`
- `tests/unit/posts.test.ts`
- `tests/unit/reading-time.test.ts`
- `tests/unit/taxonomy.test.ts`
- `docs/stage-reports/p1-foundation-report.md`
- `docs/stage-reports/p2-content-foundation-report.md`

修改：

- `package.json`
- `package-lock.json`
- `.github/workflows/ci.yml`

移除：

- `tests/unit/p1-contract.test.ts`：其“不得存在 validate:content”断言只适用于 P1，进入 P2 后由 `p2-contract.test.ts` 接替工程边界测试。

## 对应 P2 目标

### Content Collection

- 使用 Astro 7 Content Layer API：`defineCollection()` + `glob({ base: './src/content/blog', pattern: '**/*.md' })`。
- schema 使用 `z.strictObject()`，未知顶层字段和 `slug` 都会失败。
- 字段覆盖 title、description、pubDate、updatedDate、category、tags、cover、coverAlt、draft、pinned。
- `draft`、`pinned` 默认 `false`；存在 cover 时强制 coverAlt。
- 分类与 Tag 必须来自类型化 taxonomy 配置。
- 增加一篇嵌套路径的开发期草稿，只用于验证内容模型，不会作为已发布文章输出。

### 路径、slug 与构建阻断

- 扫描磁盘中的真实 Markdown 路径，不依赖 loader 规范化后的 `entry.id`。
- 目录段和文件基名只允许 ASCII 小写 kebab-case。
- 中文、大写、空格、下划线、括号、连续连字符及点号开头路径会失败。
- frontmatter 顶层出现 `slug` 会失败。
- 根级 `src/content/blog/index.md` 会失败，并标记与 `src/pages/blog/index.astro` 冲突。
- `foo.md` 与 `foo/index.md` 生成相同 `/blog/foo/` 时会失败。
- 每条错误包含问题类型、原始路径、生成 URL、冲突文件/不适用和可执行修正建议。
- `npm run validate:content` 是真实 CLI；失败返回非零退出码。
- `prebuild` 强制每次 `npm run build` 先执行内容校验；CI 还会显式提前执行一次，以便尽早输出诊断。

### 日期、排序与阅读时间

- 日期只接受 `YYYY-MM-DD` 或带 `Z`/明确偏移的完整 ISO 时间。
- 严格检查真实日历日期、时分秒和 UTC offset，不接受 2 月 30 日、非闰年 2 月 29 日、24 时或无时区时间。
- Markdown 中 `pubDate`/`updatedDate` 必须写成带引号的 YAML 字符串。这是为了防止 Astro 的 YAML 解析器在 schema 前把日期转为 `Date` 并丢失原始时区语义。
- 日期型值按 `Asia/Hong_Kong` 午夜解析；显示统一使用 `zh-CN` 和 `Asia/Hong_Kong`，不依赖构建机器时区。
- 实际 Astro frontmatter 集成测试确认 `2026-07-22` 解析为 `2026-07-21T16:00:00.000Z`。
- 文章工具实现 draft 过滤、pinned 优先、日期倒序、同日稳定排序、前后篇及唯一共享的嵌套文章 URL API。
- 阅读时间分别统计 Unicode CJK 字符与英文/拉丁单词，忽略行内代码和 fenced code，合并速度后向上取整且最少 1 分钟。

### 测试覆盖

- 合法嵌套 `index.md`、中文标题 + ASCII 路径、共享 base-aware URL。
- 非法真实路径、隐藏 Markdown、禁止 slug、根级 index、URL 冲突。
- 错误五要素、导出 runner 返回码与真实 CLI 子进程退出码。
- strict schema、未知字段、coverAlt、未知 taxonomy、日期格式。
- 日期型/时间型解析、跨进程时区显示、非法日历与时间分量。
- draft、pinned、日期、同日稳定排序、前后篇、`pageSize=2` 边界 fixture。
- 纯中文、纯英文、中英混排、标点、行内代码、普通与较长闭合代码围栏。
- P2 脚本、依赖和 CI 边界，且明确不存在 Playwright/Pagefind 命令。

## 依赖调整

新增开发依赖：

- `tsx@4.23.1`：直接执行 `scripts/validate-content-paths.ts`。校验发生在构建期，不进入浏览器 bundle。
- `yaml@2.9.0`：解析原始 YAML frontmatter，并读取顶层键和 scalar 样式；用于阻断 `slug`、模糊日期和解析错误。此前它只是间接依赖，P2 将实际使用声明为直接开发依赖。

未加入 Playwright、Pagefind、前端框架、CSS 框架、状态库或其他后续阶段依赖。`npm audit` 结果为 0 vulnerabilities。

## 实施与审查记录

- 从已合并 P1 的 `origin/main`（merge commit `e7618d2`）创建 P2 分支。
- 先添加失败测试；首个红灯为缺少 P2 模块和命令，符合预期。
- 初版实现后，Vitest 直接导入 Astro 虚拟模块 `astro:content` 失败。根因是测试边界错误；将纯 schema 工厂移入普通 TypeScript 模块后解决，Astro 注册入口继续使用同一实现。
- 只读代码审查发现日期预解析、溢出日期、隐藏 Markdown 与真实 CLI 入口四个边界缺口；全部增加回归测试并修复。
- 二次只读审查确认无 Critical、Important 或 Minor 遗留，结论为 `Ready to merge: Yes`。

## 验证结果

最终验证按 CI 顺序执行：

1. `npm ci`：从 lockfile 干净安装 305 个包。
2. `npm run validate:content`：通过，检查 1 个 Markdown 文件。
3. `npm run check`：通过，0 errors、0 warnings、0 hints。
4. `npm run test:unit`：通过，11 个测试文件、87 个测试。
5. `npm run build`：通过；`prebuild` 再次执行并通过 `validate:content`，Astro 静态构建完成。
6. `npm audit`：0 vulnerabilities。
7. CI YAML 由 `yaml` 解析成功。
8. `git diff --check origin/main`：通过，无 whitespace error。

以上为本地验证结果。GitHub 托管 CI 需在分支推送后以对应 Actions run 为准。

## 实际状态与计划差异

- 本地 `main` 最初仍停在初始提交；刷新远端后确认 PR #1 已将 P1 合并到 `origin/main`，随后本地 main 快进并从最新主线创建 P2 分支。
- 为避免 Vitest 导入 Astro 虚拟模块，并让原始校验脚本共享无资源依赖的日期规则，P2 在计划列出的主要文件之外细分出 `src/content/schema.ts` 与 `src/utils/content-date.ts`。这是同一 P2 数据层内部的职责拆分，没有改变冻结架构或阶段边界。
- Astro 的实际 YAML 解析行为要求日期 scalar 加引号，计划未写明这一语法细节；P2 将其作为内容校验规则，以确保原计划的香港日期语义可兑现。
- 当前执行环境为 Node.js 24.15.0；项目和 CI 仍按计划要求 Node.js `>=22.12.0` / CI `22.12.0`。

## 阶段边界

- 未创建页面、布局或 UI 组件。
- 未启动开发服务器。
- 未引入 Playwright、Pagefind、ClientRouter、音乐播放器或右侧滚动控件。
- 未修改部署基线、首页三阶段语义、双场景图、P10/P11 可选增强定位或其他冻结决策。

P2 满足完成标准，可以在用户确认/合并后进入 P3；本阶段没有自行开始 P3。
