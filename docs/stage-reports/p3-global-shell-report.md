# P3 全局页面外壳阶段汇报

## 阶段结论

P3 已按 `docs/development-plan.md` 实施：共享 `BaseLayout`、`zh-CN` 文档语言、基础 SEO/head、base-aware ICO、首帧前主题恢复、桌面与移动导航、原生 dialog、静态全局背景、页头、页脚和最小页面承载结构均已建立。Chromium Playwright 测试和 CI 阻断门槛已经接入；没有提前实现 P4 首页、Pagefind、ClientRouter、音乐播放器、右侧滚动控件或其他后续功能。

工作分支：`codex/p3-global-shell`。

## 实际文件

新增：

- `src/layouts/BaseLayout.astro`
- `src/components/global/GlobalBackground.astro`
- `src/components/global/MobileNavigation.astro`
- `src/components/global/PageHeader.astro`
- `src/components/global/SiteFooter.astro`
- `src/components/global/SiteHeader.astro`
- `src/components/global/ThemeController.astro`
- `src/utils/navigation.ts`
- `playwright.config.ts`
- `tests/e2e/mobile-navigation.spec.ts`
- `tests/e2e/shell.spec.ts`
- `tests/e2e/theme.spec.ts`
- `tests/unit/navigation.test.ts`
- `tests/unit/p3-contract.test.ts`
- `docs/stage-reports/p3-global-shell-report.md`

修改：

- `.github/workflows/ci.yml`
- `.gitignore`
- `package.json`
- `package-lock.json`
- `src/pages/index.astro`
- `src/styles/global.css`
- `src/styles/tokens.css`

移除：

- `public/favicon.svg`：移除 Astro Minimal 的模板图标，只保留当前权宜 ICO。
- `tests/unit/p2-contract.test.ts`：其中“不得存在 Playwright/E2E”的断言只适用于 P2，进入 P3 后由 `p3-contract.test.ts` 接替阶段边界测试；P2 的内容、路径、schema、日期和阅读时间回归测试全部保留。

## 对应 P3 目标

### 共享布局与 head

- `BaseLayout` 统一组装 head、header、main、footer、静态背景及具名 overlay 插槽；没有创建计划禁止的 `GlobalOverlay.astro`。
- 输出 `<html lang="zh-CN">`、description、canonical、theme-color、generator 和标题。
- favicon 使用 `sitePaths.asset('favicon.ico')`，产物为 `/PonyLab/favicon.ico`，并明确声明 `type="image/x-icon"`。
- canonical 由当前 pathname 与冻结的 `Astro.site` 生成，首页产物为 `https://xmdemamo.github.io/PonyLab/`。
- 首页目前只是承载 P3 页面壳的最小静态内容；P4 将在同一 `BaseLayout` 上替换为正式首页结构。

### 主题首帧与控制器

- head 内联最小初始化脚本在样式和 body 前读取 `ponylab-theme`，支持 `light`、`dark`、`system`。
- system 模式使用 `prefers-color-scheme` 解析首帧主题；同步 `data-theme-mode`、`data-theme` 和 `meta[name="theme-color"]`。
- `ThemeController` 使用原生 TypeScript，支持键盘按钮、模式循环、localStorage 持久化、系统主题变化和跨标签页 storage 事件。
- 没有引入前端框架、hydration 运行时、全局状态库或 ClientRouter。

### 导航、dialog 与无 JavaScript 降级

- 所有站内链接通过统一 path helper 生成，适配 `/PonyLab/` base 和全站尾斜杠。
- `isNavigationActive()` 支持嵌套路由，同时避免把 `/blogroll/` 错判为 `/blog/`。
- 桌面导航使用语义化 `<nav>`；当前入口输出 `aria-current="page"`。
- 移动导航使用原生 `<dialog>`，覆盖打开、关闭按钮、Escape、背景点击、焦点进入/回收、`aria-expanded` 和根元素滚动锁。
- dialog 发送既定的 `ponylab:modal-open` 事件，为未来可选面板保留互斥入口，但没有预建泛化 overlay manager。
- JavaScript 关闭时，窄屏显示 `<noscript>` 静态导航，主要内容保持可读。

### 静态背景、页头与页脚

- `GlobalBackground` 只包含固定渐变、网格和 CSS 光晕；装饰层为 `aria-hidden`、`pointer-events:none`，没有持续动画或客户端脚本。
- `PageHeader` 提供标题、副标题、eyebrow、计数及面包屑插槽，供后续列表页复用。
- `SiteFooter` 只渲染已有配置；当前 `null` 占位社交链接不会生成无效锚点。
- 浅色主题的次要文字由 `#607580` 调整为 `#586d78`，相对页面底色的计算对比度约为 4.68:1；默认文本链接改用已满足对比度的 focus 色。

### 可访问性与响应式

- skip link 默认完全移出视口，键盘聚焦后进入，并把焦点落到 `#main-content`。
- 修复了组合选择器把 skip link 的 `position: fixed` 覆盖为 `relative` 的问题，并加入位置回归断言。
- 全局保留 `:focus-visible`、reduced-motion、锚点 sticky-header 偏移和 320px 最小布局边界。
- E2E 以 1280÷4＝320 CSS px 明确模拟 400% 的有效重排视口，验证移动菜单出现、主要内容可见且没有页面级横向溢出。

### Playwright 与 CI

- 新增 `test:e2e`，只配置 Chromium；Firefox 按计划留到 P12。
- Playwright 的 `webServer` 预览已经由统一 `npm run build` 生成的 `dist`，base URL 固定为 `http://127.0.0.1:4321/PonyLab/`。
- CI 在 `npm ci` 后只安装 Chromium，依次执行 validate、check、unit、build、E2E；E2E 失败会阻断 workflow。
- CI 上传 `playwright-report/`，失败时额外上传 `test-results/` 中的 screenshot 和 trace。
- E2E 覆盖语言、title/description/canonical、ICO link 与页面上下文实际请求、skip link、base-aware 导航、320px/有效 400% reflow、system 首帧主题、主题刷新持久化、移动 dialog、Escape/焦点回收、桌面断点及无 JavaScript 导航。

## 依赖调整

新增开发依赖：

- `@playwright/test@1.61.1`：P3 Chromium 端到端测试运行器；仅用于开发和 CI，不进入浏览器生产 bundle。

本地仅安装 Playwright 的 Chromium 运行时（playwright chromium v1228），没有安装 Firefox/WebKit。`npm ci` 最终安装 308 个包、审计 309 个包，结果为 0 vulnerabilities。没有加入 Pagefind、前端/CSS 框架、ClientRouter、状态库、播放器依赖或后续阶段工具。

## 实施与审查记录

- 从已合并 P2 的 `origin/main`（merge commit `02b81a2`）创建 P3 分支。
- 先增加 P3 工程契约、导航单元测试和浏览器 E2E；首个红灯准确对应尚不存在的组件、Playwright、CI 和导航工具。
- 首次 `astro check` 发现占位社交链接被常量类型窄化为 `never`；在 `SocialLink` 接口边界上完成类型守卫后修复。
- 主题持久化测试最初在每次 reload 前把 localStorage 重写为 light；修正测试初始化条件后，真实 dark 持久化通过。
- Chromium 安装首次因超时留下两个安装子进程和空 `__dirlock`；核对精确 PID 和空目录后清理，再次安装成功。
- 只读代码审查无 Critical，提出 favicon 浏览器请求和 400% reflow 两项 Important 覆盖缺口；两项均补充并通过。
- 新增 skip-link 初始位置断言后发现真实的选择器特异性缺陷；修复后未聚焦状态完全离屏，键盘路径继续通过。
- 复审确认上述两项 Important 已解决；唯一剩余意见是记录 Windows 外部预览方法，本报告已补齐。

## Windows 本地 Playwright 说明

当前执行环境为 Windows 11 `10.0.22631`、Node.js `24.15.0`。在本机使用 Playwright 的 managed `webServer` 时，所有用例已经显示执行完毕，但 runner 会停在清理阶段而不退出；禁用 reporter、video、trace、服务复用，并分别改用 Astro/Vite preview 后现象不变。相同测试在受控外部 preview 下 5～6 秒内正常返回退出码 0。该模式与 Playwright 官方仓库记录的 Windows `10.0.22631` 清理挂起问题一致：[microsoft/playwright#38101](https://github.com/microsoft/playwright/issues/38101)。

默认配置仍保留计划要求的 managed `webServer`，CI 的 Ubuntu runner 不使用本机 Windows 清理路径。受影响的 Windows 开发环境可用两个终端运行：

终端 A：

```powershell
npm run build
npm run preview -- --host 127.0.0.1 --port 4321
```

终端 B：

```powershell
$env:PONYLAB_E2E_EXTERNAL_PREVIEW = '1'
npm run test:e2e
Remove-Item Env:PONYLAB_E2E_EXTERNAL_PREVIEW
```

`PONYLAB_E2E_EXTERNAL_PREVIEW=1` 只关闭 Playwright 自己的 webServer 管理，测试、base URL、Chromium、reporter 和断言完全相同。GitHub 托管 CI 的实际结果仍需在分支推送后以 Actions run 为准。

## 最终验证结果

按全新依赖环境执行：

1. `npm ci`：安装 308 个包，审计 309 个包，0 vulnerabilities。
2. `npm run validate:content`：通过，检查 1 个 Markdown 文件。
3. `npm run check`：通过，0 errors、0 warnings、0 hints。
4. `npm run test:unit`：通过，12 个测试文件、94 个测试。
5. `npm run build`：通过；`prebuild` 再次执行并通过内容校验，生成 1 个静态页面；`dist/favicon.ico` 存在。
6. 外部 production preview + `PONYLAB_E2E_EXTERNAL_PREVIEW=1` + 完整 Playwright：通过，退出码 0。
7. `npm run test:e2e -- --list`：确认 3 个文件、8 个 Chromium 测试。
8. `git diff --check`：完成提交前再次执行，要求无 whitespace error。

以上为本地验证。默认 managed webServer 在当前 Windows 构建上的退出迟滞已如实记录；CI workflow 仍使用正式 `npm run test:e2e` 并在 Ubuntu 上管理 preview。

## 实际状态与计划差异

- `src/pages/index.astro` 在计划目录树中标为 P4，但 P3 的“任意静态页面可套用布局”需要一个实际承载页面。本阶段只建立最小 P3 状态页，没有创建 P4 组件、素材引用、首页三阶段结构或滚动行为；P4 将替换其主体内容。
- 新增 `src/utils/navigation.ts` 只封装 P3 当前路由判断，避免组件内重复处理 base 与嵌套路由；没有建立大型路由抽象。
- `playwright.config.ts` 增加 `PONYLAB_E2E_EXTERNAL_PREVIEW` 逃生开关，只处理已复现的 Windows 测试进程清理问题，不改变 CI 默认路径。
- 当前本地 Node.js 为 24.15.0；项目约束仍为 `>=22.12.0`，CI 继续使用计划冻结的 22.12.0。

## 阶段边界

- 未创建 P4 首页组件、`home.ts`、`PostCard` 或首页滚动逻辑。
- 未引入 Pagefind、ClientRouter、音乐播放器、右侧滚动控件、BackToTop 或泛化 overlay manager。
- 未创建额外页面路由、内容数据层、RSS、Sitemap、部署 workflow 或后续阶段依赖。
- 未修改 GitHub Pages `site/base/trailingSlash`、双场景图、P5/P9 核心范围或 P10/P11 可选定位。

P3 的应用功能、单元测试、生产构建和 Chromium 行为验收均已完成；托管 CI 状态需在分支推送后确认。合并并确认 CI 后即可进入 P4，本阶段没有自行开始 P4。
