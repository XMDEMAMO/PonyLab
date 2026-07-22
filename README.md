# PonyLab

PonyLab 是使用 Astro 构建的静态个人博客，内容包括技术文章、学习记录、项目与个人兴趣。当前仓库正在按照 [`docs/development-plan.md`](docs/development-plan.md) 分阶段开发。

## 当前阶段

P1 建立工程检查、GitHub Actions CI、GitHub Pages 子路径配置、类型化站点/主题配置、路径工具和 light/dark 设计变量。内容集合、页面布局、搜索与交互属于后续阶段。

## 部署基线

当前仓库是 GitHub Pages 普通项目站，公开地址为：

```text
https://xmdemamo.github.io/PonyLab/
```

Astro 的唯一运行时部署配置位于 `astro.config.mjs`：

```js
site: 'https://xmdemamo.github.io'
base: '/PonyLab'
trailingSlash: 'always'
```

内部链接与静态资源地址必须通过 `import.meta.env.BASE_URL` 或 `src/utils/paths.ts` 生成，不能再次硬编码部署子路径。

## 环境要求

- Node.js `>=22.12.0`
- npm（使用仓库中的 `package-lock.json`）

## 命令

```sh
npm ci
npm run check
npm run test:unit
npm run build
npm run preview
```

需要启动开发服务器时，遵守仓库约定使用后台模式：

```sh
npm run astro -- dev --background
```

可使用 `npm run astro -- dev status`、`npm run astro -- dev logs` 和 `npm run astro -- dev stop` 管理后台服务器。

## P1 说明

- 网站默认语言为 `zh-CN`，显示时区为 `Asia/Hong_Kong`。
- `public/favicon.ico` 是当前 32×32 权宜图标；P1 只验证构建产物可访问，正式 head 引用与浏览器标签验收在 P3。
- CI 只执行 P1 已存在的 check、unit test 和 build，不提前加入后续阶段的校验或浏览器测试。
- light/dark 颜色、间距、圆角、阴影、排版和动效基础变量位于 `src/styles/tokens.css`。
