# P1 工程基线阶段汇报

## 阶段结论

P1 已完成并通过本地验证，提交 `42cbe6f86e4c1a1923a15bfc2ef3ecbe63b64660` 已经由 PR #1 合并到 `main`（merge commit `e7618d2`）。本阶段只建立工程基线，没有提前创建内容集合、Playwright、Pagefind、ClientRouter、播放器或右侧滚动控件。

## 完成内容

- 冻结 GitHub Pages 项目站配置：`site=https://xmdemamo.github.io`、`base=/PonyLab`、`trailingSlash=always`。
- 建立 `check`、`test:unit`、`build` 三条真实脚本及第一版 GitHub Actions CI。
- 增加 base-aware 页面、资源与绝对 URL 工具。
- 建立类型化站点、语言、时区和主题配置。
- 建立 light/dark 设计 tokens、reset 与全局样式入口。
- 保留现有 ICO favicon 作为权宜资源，并验证构建产物下可访问。
- 增加 Astro 配置、路径、站点配置、样式与阶段边界单元测试。

## 文件范围

主要新增或修改：

- `.github/workflows/ci.yml`
- `astro.config.mjs`
- `package.json`、`package-lock.json`
- `README.md`
- `src/config/site.ts`
- `src/config/theme.ts`
- `src/styles/tokens.css`
- `src/styles/reset.css`
- `src/styles/global.css`
- `src/utils/paths.ts`
- `tests/unit/*.test.ts`
- `vitest.config.ts`

素材、设计计划和首页静态预览文件随 P1 合并进入主线，但没有作为应用页面实现。

## 依赖

- 运行依赖：`astro@7.1.3`
- 开发依赖：`@astrojs/check@0.9.9`、`@types/node@22.20.1`、`vitest@4.1.10`

P1 未引入 Playwright、Pagefind、UI 框架、CSS 框架或全局状态库。

## 验证记录

P1 完成时执行并通过：

- `npm ci`：安装 304 个包。
- `npm run check`：0 errors、0 warnings、0 hints。
- `npm run test:unit`：5 个测试文件、29 个测试全部通过。
- `npm run build`：静态构建成功，生成 1 个页面。
- 生产预览资源检查：`/PonyLab/favicon.ico` 返回 HTTP 200、`image/x-icon`，文件大小 655 bytes。

GitHub 托管 CI 是否成功以对应提交的 Actions 页面为准；以上结论是 P1 完成时的本地复现结果。

## 边界与后续

- P1 没有创建空实现或永远成功的 `validate:content`。
- favicon 的正式 `<head>` 引用与浏览器标签显示留给 P3。
- 内容集合、slug 规则、内容校验和内容纯函数留给 P2。
- P2 及以后阶段继续在 `docs/stage-reports/` 下生成独立阶段汇报。
