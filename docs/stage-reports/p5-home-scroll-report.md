# P5 首页三阶段滚动阶段汇报

## 阶段结论

P5 已按 `docs/development-plan.md` 完成：首页在不改变完整场景图视觉状态的前提下，建立“标题/终端 → 个人名片 → 主视觉离场并进入文章区”三阶段滚动。light/dark 都复用 P4 的单一活动图片 DOM；滚动只驱动 HTML 前景层和主视觉容器，未引入独立人物、动画库、ClientRouter、Pagefind、播放器或右侧滚动控件。

工作分支：`codex/p5-home-scroll`。

## 实际文件

新增：

- `src/components/home/HomeScrollScene.astro`
- `src/utils/home-scroll.ts`
- `tests/unit/home-scroll.test.ts`
- `tests/unit/p5-contract.test.ts`
- `tests/e2e/home-scroll.spec.ts`
- `scripts/run-e2e.ts`
- `docs/stage-reports/p5-home-scroll-report.md`

修改：

- `src/pages/index.astro`
- `tests/e2e/home.spec.ts`
- `tests/unit/p3-contract.test.ts`
- `tests/unit/p4-contract.test.ts`
- `playwright.config.ts`
- `package.json`
- `README.md`

没有修改依赖、内容 schema、部署配置、素材文件或 P6 及以后阶段的应用功能。

## 对应 P5 目标

### 三阶段进度与前景状态

- `src/utils/home-scroll.ts` 将 sticky 容器的实际几何映射为 `0—1` 进度，集中计算阶段、标题退出、名片进入和第三阶段离场值。
- 阶段一保留标题与终端；阶段二让标题/终端淡出并轻微上移，同时让个人名片进入；阶段三让主视觉容器开始离场，并在 sticky 区域释放后自然上移，与文章过渡区直接衔接。
- 滚动监听为 passive，只通过一个 `requestAnimationFrame` 合并更新；没有逐事件同步写样式，也没有引入第三方动画依赖。
- 名片不可见时设置 `inert` 与 `aria-hidden="true"`，避免键盘焦点进入透明内容；进入阶段二后恢复可访问性。

### 背景不变量

- `HomeScrollScene` 不查询或写入 `[data-home-hero-image]`，图片仍由 `HomeHeroScene` 独立管理。
- 阶段一与阶段二使用同一个图片 DOM 实例，`currentSrc`、相对 bounding box、`object-position`、`transform`、`filter`、`scale`、`brightness`、`saturation` 与 `blur` 均保持不变。
- 同一主题从阶段一滚到阶段二不会产生新的场景图网络请求；主题切换只在用户操作时更换该实例的图片源，并保留当前滚动阶段。
- 第三阶段只处理主视觉容器。视觉验收发现完全淡出发生得早于文章区入场会形成空白屏，因此最终保留场景可读性直到 sticky 区释放，再由容器自然离场；背景图片本身依旧没有 transform 或 filter 动画。

### 响应式与降级

- 桌面端使用较长 sticky 叙事区，手机端缩短滚动距离但保留同样的三个阶段。
- 390×844 下，日间名片进入上方留白区，夜间名片进入下方区域，分别避开两张构图中的人物面部；这只调整 HTML 名片位置，不移动背景。
- `prefers-reduced-motion: reduce`、低高度横屏以及 `hardwareConcurrency <= 2` 或 `deviceMemory <= 2` 的受限设备使用自然流，不启用长 sticky 或大位移动画。
- 自然流与无 JavaScript 路径继续按 DOM 顺序展示标题、名片、文章与统计，核心内容不依赖脚本才可见。

## 测试策略

- 单元测试覆盖几何进度钳制、三阶段顺序、60/120Hz 采样一致性和设备降级决策。
- 契约测试确认 P5 文件边界、单 rAF、滚动控制器不接触图片、P10/P11/P9 功能未提前进入，以及 README/阶段报告同步。
- Playwright 在 light/dark 下分别断言阶段一与阶段二使用同一图片实例和资源、图片布局/样式不变量及无重复大图请求。
- E2E 同时覆盖第三阶段与内容区衔接、阶段二主题切换、390×844 三阶段与无横向溢出、运行时 resize 模式重算、低高度横屏、受限设备和 reduced motion 自然阅读顺序。
- 截图只用于桌面/手机、light/dark 的人工构图检查；CI 主门槛是 DOM、computed style、布局盒与资源请求断言，不使用逐像素完全相等。

## Playwright Windows 退出修正

基线 `npm run test:e2e` 的 23 项断言本身全部通过，但 Windows 上 Playwright 回收 managed `webServer` 时会停在进程树清理；把命令从 npm preview 收窄为直接调用 Astro CLI 后，用例仍通过，但当前系统上的 Playwright `taskkill` 清理路径仍会挂起。

P5 因此新增无第三方依赖的 `scripts/run-e2e.ts`，并让正式 `npm run test:e2e` 统一经过该入口：脚本以无 shell 的直接子进程启动本地 Astro CLI，确认 `/PonyLab/` 返回成功后运行相同的 Playwright CLI，最后直接回收它自己持有的 preview 子进程。Playwright 配置仍以同一个 production base URL 和测试集运行，不会复用开发服务器。

底层 preview 命令仍是：

```text
node ./node_modules/astro/bin/astro.mjs preview --host 127.0.0.1 --port 4321
```

该调整不改变 production preview、base URL 或 CI 的正式命令；既有 `PONYLAB_E2E_EXTERNAL_PREVIEW=1` 调试模式继续保留。修正后标准单用例命令与完整 32 项命令都能在当前 Windows 环境返回明确退出码 0。

## 依赖调整

本阶段没有安装、升级或移除依赖，`package-lock.json` 不变。`package.json` 只把 `test:e2e` 从直接调用 Playwright 改为调用同仓库的 preview 生命周期脚本；继续使用现有 Astro、TypeScript、Vitest、Playwright 与 `tsx`。没有加入动画库、UI/CSS 框架、Pagefind、ClientRouter 或全局状态库。

## 验证结果

1. `npm run validate:content`：通过，检查 1 个 Markdown 文件。
2. `npm run check`：通过，61 个文件，0 errors、0 warnings、0 hints。
3. `npm run test:unit`：通过，17 个测试文件、113 个测试。
4. `npm run build`：通过；先执行真实内容校验，再构建 1 个静态页面和 25 个响应式图片输出，最后移除 3 个未引用母版。
5. `npm run test:e2e`：通过，32 个 Chromium 测试；标准命令自行启动并回收 production preview，退出码 0。
6. 浏览器人工复核：1440×900 与 390×844 的 light/dark 三阶段均完成；第三阶段与内容区无空白断层，移动端无横向溢出，控制台 0 error、0 warning。
7. `git diff --check`：提交前执行，无 whitespace error。

## 实际状态与计划差异

- P5 基线发现的 Playwright Windows 退出问题并非断言失败；直接 Astro CLI 仍会卡在 Playwright 自身的 Windows `taskkill` 清理。最终用仓库内的直接子进程 runner 保留同一 `npm run test:e2e`、同一 Playwright 配置和同一 CI 入口，并让当前 Windows 与 CI 都走一致的可退出生命周期。
- 人工检查第三阶段时发现旧曲线会在内容区进入前把容器透明度降为零，形成大面积空白。修正后第三阶段仍从计划位置开始，但主视觉保持足够可见，直到 sticky 区自然释放并与文章过渡区接合。
- 为同时保护两张移动构图的主体面部，阶段二名片采用日间上方、夜间下方的静态布局。图片焦点、裁切和视觉状态均未改变。

## 阶段边界

- 未创建博客列表、Tag/分类筛选、分页或归档页面，P6 未提前开始。
- 未创建文章详情/TOC、项目/About 数据层或 Pagefind 索引。
- 未加入 ClientRouter、全局音乐播放器、右侧滚动控件或跨页状态。
- 未修改 `site=https://xmdemamo.github.io`、`base=/PonyLab`、`trailingSlash=always`、双场景图或 P10/P11 可选增强定位。

P5 完成后，核心执行路径的下一阶段为 P6 博客列表、筛选与无 JavaScript 浏览降级；在本分支合并并确认 CI 前不开始 P6。
